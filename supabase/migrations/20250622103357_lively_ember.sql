/*
  # Fix chat.space database schema with proper conditional creation

  1. Tables
    - Check and create tables only if they don't exist
    - Use proper PostgreSQL conditional logic
    
  2. Policies
    - Drop existing policies before recreating (PostgreSQL doesn't support IF NOT EXISTS for policies)
    - Recreate all policies with proper conditions
    
  3. Functions and Triggers
    - Use OR REPLACE for functions
    - Drop and recreate triggers safely
    
  4. Indexes
    - Use IF NOT EXISTS for indexes (supported in PostgreSQL)
*/

-- Create conversations table only if it doesn't exist
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL DEFAULT 'New Conversation',
  model_history text[] DEFAULT '{}',
  total_tokens integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create messages table only if it doesn't exist
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  model_used text,
  input_tokens integer DEFAULT 0,
  output_tokens integer DEFAULT 0,
  total_tokens integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security (idempotent)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
-- (PostgreSQL doesn't support IF NOT EXISTS for policies)

-- Conversations policies
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can delete own conversations" ON conversations;

CREATE POLICY "Users can view own conversations"
  ON conversations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations"
  ON conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON conversations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
  ON conversations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Messages policies
DROP POLICY IF EXISTS "Users can view messages in own conversations" ON messages;
DROP POLICY IF EXISTS "Users can create messages in own conversations" ON messages;
DROP POLICY IF EXISTS "Users can update messages in own conversations" ON messages;
DROP POLICY IF EXISTS "Users can delete messages in own conversations" ON messages;

CREATE POLICY "Users can view messages in own conversations"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in own conversations"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages in own conversations"
  ON messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages in own conversations"
  ON messages
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id = auth.uid()
    )
  );

-- Create indexes with IF NOT EXISTS (supported)
CREATE INDEX IF NOT EXISTS conversations_user_id_idx ON conversations(user_id);
CREATE INDEX IF NOT EXISTS conversations_updated_at_idx ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at);

-- Create or replace functions (idempotent with OR REPLACE)
CREATE OR REPLACE FUNCTION update_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate triggers safely
DROP TRIGGER IF EXISTS trigger_update_conversation_updated_at ON messages;
CREATE TRIGGER trigger_update_conversation_updated_at
  AFTER INSERT OR UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_updated_at();

-- Create or replace token calculation function
CREATE OR REPLACE FUNCTION calculate_conversation_tokens(conversation_uuid uuid)
RETURNS integer AS $$
BEGIN
  RETURN (
    SELECT COALESCE(SUM(total_tokens), 0)
    FROM messages
    WHERE conversation_id = conversation_uuid
  );
END;
$$ LANGUAGE plpgsql;

-- Create or replace token update function
CREATE OR REPLACE FUNCTION update_conversation_tokens()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET total_tokens = calculate_conversation_tokens(NEW.conversation_id)
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate token trigger safely
DROP TRIGGER IF EXISTS trigger_update_conversation_tokens ON messages;
CREATE TRIGGER trigger_update_conversation_tokens
  AFTER INSERT OR UPDATE OF total_tokens ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_tokens();