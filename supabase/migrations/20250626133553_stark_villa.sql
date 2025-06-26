/*
  # Auto-update Conversation Statistics
  
  1. Real-time Stats
    - Automatically update conversation statistics when messages are added
    - Track message counts, token usage, and models used
    
  2. Performance
    - Maintain denormalized stats for fast queries
    - Update incrementally for efficiency
*/

-- Function to update conversation statistics
CREATE OR REPLACE FUNCTION update_conversation_stats()
RETURNS TRIGGER AS $$
DECLARE
  model_name text;
BEGIN
  -- Extract model name from message
  model_name := NEW.model_used;
  
  -- Insert or update conversation stats
  INSERT INTO conversation_stats (
    conversation_id,
    total_messages,
    total_tokens,
    models_used,
    last_updated
  )
  VALUES (
    NEW.conversation_id,
    1,
    COALESCE(NEW.total_tokens, 0),
    CASE WHEN model_name IS NOT NULL THEN ARRAY[model_name] ELSE '{}' END,
    now()
  )
  ON CONFLICT (conversation_id) DO UPDATE SET
    total_messages = conversation_stats.total_messages + 1,
    total_tokens = conversation_stats.total_tokens + COALESCE(NEW.total_tokens, 0),
    models_used = CASE 
      WHEN NEW.model_used IS NOT NULL AND NOT (NEW.model_used = ANY(conversation_stats.models_used))
      THEN array_append(conversation_stats.models_used, NEW.model_used)
      ELSE conversation_stats.models_used
    END,
    last_updated = now();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for conversation stats
DROP TRIGGER IF EXISTS update_conversation_stats_trigger ON messages;
CREATE TRIGGER update_conversation_stats_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_stats();