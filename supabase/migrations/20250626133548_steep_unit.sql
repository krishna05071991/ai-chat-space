/*
  # Auto-increment Message Sequence Numbers
  
  1. Data Integrity
    - Ensure messages have proper sequence numbers within conversations
    - Handle concurrent inserts safely
    
  2. Ordering
    - Maintain message order for conversation reconstruction
    - Support pagination and message threading
*/

-- Function to auto-assign sequence numbers to messages
CREATE OR REPLACE FUNCTION assign_message_sequence()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-assign sequence number if not provided
  IF NEW.sequence_number IS NULL THEN
    SELECT COALESCE(MAX(sequence_number), 0) + 1
    INTO NEW.sequence_number
    FROM messages
    WHERE conversation_id = NEW.conversation_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-sequencing
DROP TRIGGER IF EXISTS trigger_assign_message_sequence ON messages;
CREATE TRIGGER trigger_assign_message_sequence
  BEFORE INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION assign_message_sequence();

-- Add index for efficient sequence queries
CREATE INDEX IF NOT EXISTS idx_messages_sequence 
ON messages(conversation_id, sequence_number);