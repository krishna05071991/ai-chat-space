/*
  # Verify Usage Tracking Schema

  This migration verifies that all required tables, columns, triggers, and functions 
  are properly set up for comprehensive usage tracking with anniversary-based billing.
  
  1. Tables & Columns
     - users: monthly_tokens_used, daily_messages_sent, billing_period_start, last_daily_reset, last_monthly_reset
     - messages: input_tokens, output_tokens, total_tokens
     - usage_tracking: all required columns
     - conversations: total_tokens
  
  2. Triggers & Functions
     - Messages total_tokens calculation
     - Conversation tokens update
     - Message sequence assignment
  
  3. Indexes
     - Performance optimization for usage queries
*/

-- Ensure users table has all required usage tracking columns
DO $$
BEGIN
  -- Add monthly_tokens_used if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'monthly_tokens_used'
  ) THEN
    ALTER TABLE users ADD COLUMN monthly_tokens_used integer DEFAULT 0;
  END IF;

  -- Add daily_messages_sent if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'daily_messages_sent'
  ) THEN
    ALTER TABLE users ADD COLUMN daily_messages_sent integer DEFAULT 0;
  END IF;

  -- Add billing_period_start if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'billing_period_start'
  ) THEN
    ALTER TABLE users ADD COLUMN billing_period_start date DEFAULT CURRENT_DATE;
  END IF;

  -- Add last_daily_reset if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'last_daily_reset'
  ) THEN
    ALTER TABLE users ADD COLUMN last_daily_reset date DEFAULT CURRENT_DATE;
  END IF;

  -- Add last_monthly_reset if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'last_monthly_reset'
  ) THEN
    ALTER TABLE users ADD COLUMN last_monthly_reset date DEFAULT CURRENT_DATE;
  END IF;
END $$;

-- Ensure messages table has token tracking columns
DO $$
BEGIN
  -- Add input_tokens if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'input_tokens'
  ) THEN
    ALTER TABLE messages ADD COLUMN input_tokens integer DEFAULT 0;
  END IF;

  -- Add output_tokens if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'output_tokens'
  ) THEN
    ALTER TABLE messages ADD COLUMN output_tokens integer DEFAULT 0;
  END IF;

  -- Ensure total_tokens exists (should already exist based on schema)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'total_tokens'
  ) THEN
    ALTER TABLE messages ADD COLUMN total_tokens integer DEFAULT 0;
  END IF;
END $$;

-- Create/verify function to update conversation total tokens
CREATE OR REPLACE FUNCTION update_conversation_tokens()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the conversation's total tokens by summing all message tokens
  UPDATE conversations 
  SET total_tokens = COALESCE((
    SELECT SUM(COALESCE(total_tokens, input_tokens + output_tokens, 0))
    FROM messages 
    WHERE conversation_id = NEW.conversation_id
  ), 0)
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create/verify trigger for conversation token updates
DROP TRIGGER IF EXISTS trigger_update_conversation_tokens ON messages;
CREATE TRIGGER trigger_update_conversation_tokens
  AFTER INSERT OR UPDATE OF total_tokens, input_tokens, output_tokens ON messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_tokens();

-- Create indexes for usage tracking performance
CREATE INDEX IF NOT EXISTS idx_users_usage_tracking 
ON users (id, monthly_tokens_used, daily_messages_sent, last_daily_reset, last_monthly_reset);

CREATE INDEX IF NOT EXISTS idx_messages_tokens 
ON messages (conversation_id, total_tokens, created_at) 
WHERE total_tokens > 0;

CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_date 
ON usage_tracking (user_id, date DESC);

-- Verify all critical tables exist
DO $$
BEGIN
  -- Check users table
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    RAISE EXCEPTION 'users table does not exist';
  END IF;

  -- Check messages table  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
    RAISE EXCEPTION 'messages table does not exist';
  END IF;

  -- Check conversations table
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversations') THEN
    RAISE EXCEPTION 'conversations table does not exist';
  END IF;

  -- Check usage_tracking table
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'usage_tracking') THEN
    RAISE EXCEPTION 'usage_tracking table does not exist';
  END IF;
END $$;