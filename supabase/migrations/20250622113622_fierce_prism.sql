/*
  # Fix missing total_tokens column in conversations table
  
  1. Schema Fixes
    - Add total_tokens column to conversations table if it doesn't exist
    - Ensure all required columns and constraints are properly applied
    
  2. Data Integrity
    - Update existing conversations to calculate their token totals
    - Ensure triggers are working correctly
    
  3. Safety
    - Use conditional logic to avoid errors on already-applied changes
    - Preserve existing data
*/

-- Add total_tokens column to conversations table if it doesn't exist
DO $$
BEGIN
  -- Check if total_tokens column exists, if not add it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' 
    AND column_name = 'total_tokens'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE conversations ADD COLUMN total_tokens integer DEFAULT 0;
    
    -- Update existing conversations to calculate their token totals
    UPDATE conversations 
    SET total_tokens = (
      SELECT COALESCE(SUM(m.total_tokens), 0)
      FROM messages m 
      WHERE m.conversation_id = conversations.id
    );
    
    RAISE NOTICE 'Added total_tokens column to conversations table and updated existing data';
  ELSE
    RAISE NOTICE 'total_tokens column already exists in conversations table';
  END IF;
END $$;

-- Ensure the calculate_conversation_tokens function exists and is up to date
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

-- Ensure the update_conversation_tokens function exists and is up to date
CREATE OR REPLACE FUNCTION update_conversation_tokens()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET total_tokens = calculate_conversation_tokens(NEW.conversation_id)
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger to ensure it's working correctly
DROP TRIGGER IF EXISTS trigger_update_conversation_tokens ON messages;
CREATE TRIGGER trigger_update_conversation_tokens
  AFTER INSERT OR UPDATE OF total_tokens ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_tokens();

-- Verify the schema is correct by testing the trigger function
DO $$
DECLARE
  test_result integer;
BEGIN
  -- Test that we can call the token calculation function
  SELECT calculate_conversation_tokens('00000000-0000-0000-0000-000000000000'::uuid) INTO test_result;
  RAISE NOTICE 'Token calculation function is working correctly';
EXCEPTION
  WHEN others THEN
    RAISE EXCEPTION 'Token calculation function failed: %', SQLERRM;
END $$;

-- Update any existing conversations that might have incorrect token totals
UPDATE conversations 
SET total_tokens = calculate_conversation_tokens(id)
WHERE total_tokens IS NULL OR total_tokens = 0;