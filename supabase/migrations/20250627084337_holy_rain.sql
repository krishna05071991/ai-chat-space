/*
  # Fix CASCADE DELETE constraints

  1. Database Changes
    - Ensure all foreign keys have proper CASCADE DELETE behavior
    - Fix conversations -> users relationship
    - Fix messages -> conversations relationship  
    - Fix all other user-related table relationships
    
  2. Security
    - Maintain existing RLS policies
    - Ensure proper constraint validation
    
  3. Verification
    - Add function to verify cascade delete relationships
    - Test all constraint relationships
*/

-- Fix conversations table CASCADE DELETE to users
DO $$
BEGIN
  -- Check if proper CASCADE constraint exists using correct schema columns
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'conversations'
    AND kcu.column_name = 'user_id'
    AND ccu.table_name = 'users'
    AND rc.delete_rule = 'CASCADE'
  ) THEN
    -- Drop existing constraint
    ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_user_id_fkey;
    
    -- Add proper CASCADE constraint
    ALTER TABLE conversations 
    ADD CONSTRAINT conversations_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES users(id) 
    ON DELETE CASCADE;
    
    RAISE NOTICE 'Fixed conversations CASCADE DELETE constraint';
  ELSE
    RAISE NOTICE 'conversations already has proper CASCADE DELETE';
  END IF;
END $$;

-- Fix messages table CASCADE DELETE to conversations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'messages'
    AND kcu.column_name = 'conversation_id'
    AND ccu.table_name = 'conversations'
    AND rc.delete_rule = 'CASCADE'
  ) THEN
    ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_conversation_id_fkey;
    ALTER TABLE messages 
    ADD CONSTRAINT messages_conversation_id_fkey 
    FOREIGN KEY (conversation_id) 
    REFERENCES conversations(id) 
    ON DELETE CASCADE;
    
    RAISE NOTICE 'Fixed messages CASCADE DELETE constraint';
  ELSE
    RAISE NOTICE 'messages already has proper CASCADE DELETE';
  END IF;
END $$;

-- Fix usage_tracking table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'usage_tracking' AND table_schema = 'public') THEN
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
      JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'usage_tracking'
      AND kcu.column_name = 'user_id'
      AND ccu.table_name = 'users'
      AND rc.delete_rule = 'CASCADE'
    ) THEN
      ALTER TABLE usage_tracking DROP CONSTRAINT IF EXISTS usage_tracking_user_id_fkey;
      ALTER TABLE usage_tracking 
      ADD CONSTRAINT usage_tracking_user_id_fkey 
      FOREIGN KEY (user_id) 
      REFERENCES users(id) 
      ON DELETE CASCADE;
      RAISE NOTICE 'Fixed usage_tracking CASCADE DELETE';
    END IF;
  END IF;
END $$;

-- Fix billing_events table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'billing_events' AND table_schema = 'public') THEN
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
      JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'billing_events'
      AND kcu.column_name = 'user_id'
      AND ccu.table_name = 'users'
      AND rc.delete_rule = 'CASCADE'
    ) THEN
      ALTER TABLE billing_events DROP CONSTRAINT IF EXISTS billing_events_user_id_fkey;
      ALTER TABLE billing_events 
      ADD CONSTRAINT billing_events_user_id_fkey 
      FOREIGN KEY (user_id) 
      REFERENCES users(id) 
      ON DELETE CASCADE;
      RAISE NOTICE 'Fixed billing_events CASCADE DELETE';
    END IF;
  END IF;
END $$;

-- Fix projects table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects' AND table_schema = 'public') THEN
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
      JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'projects'
      AND kcu.column_name = 'user_id'
      AND ccu.table_name = 'users'
      AND rc.delete_rule = 'CASCADE'
    ) THEN
      ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_user_id_fkey;
      ALTER TABLE projects 
      ADD CONSTRAINT projects_user_id_fkey 
      FOREIGN KEY (user_id) 
      REFERENCES users(id) 
      ON DELETE CASCADE;
      RAISE NOTICE 'Fixed projects CASCADE DELETE';
    END IF;
  END IF;
END $$;

-- Fix project_documents table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_documents' AND table_schema = 'public') THEN
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
      JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'project_documents'
      AND kcu.column_name = 'project_id'
      AND ccu.table_name = 'projects'
      AND rc.delete_rule = 'CASCADE'
    ) THEN
      ALTER TABLE project_documents DROP CONSTRAINT IF EXISTS project_documents_project_id_fkey;
      ALTER TABLE project_documents 
      ADD CONSTRAINT project_documents_project_id_fkey 
      FOREIGN KEY (project_id) 
      REFERENCES projects(id) 
      ON DELETE CASCADE;
      RAISE NOTICE 'Fixed project_documents CASCADE DELETE';
    END IF;
  END IF;
END $$;

-- Fix conversation_stats table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversation_stats' AND table_schema = 'public') THEN
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
      JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'conversation_stats'
      AND kcu.column_name = 'conversation_id'
      AND ccu.table_name = 'conversations'
      AND rc.delete_rule = 'CASCADE'
    ) THEN
      ALTER TABLE conversation_stats DROP CONSTRAINT IF EXISTS conversation_stats_conversation_id_fkey;
      ALTER TABLE conversation_stats 
      ADD CONSTRAINT conversation_stats_conversation_id_fkey 
      FOREIGN KEY (conversation_id) 
      REFERENCES conversations(id) 
      ON DELETE CASCADE;
      RAISE NOTICE 'Fixed conversation_stats CASCADE DELETE';
    END IF;
  END IF;
END $$;

-- Fix conversation_context table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversation_context' AND table_schema = 'public') THEN
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
      JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'conversation_context'
      AND kcu.column_name = 'conversation_id'
      AND ccu.table_name = 'conversations'
      AND rc.delete_rule = 'CASCADE'
    ) THEN
      ALTER TABLE conversation_context DROP CONSTRAINT IF EXISTS conversation_context_conversation_id_fkey;
      ALTER TABLE conversation_context 
      ADD CONSTRAINT conversation_context_conversation_id_fkey 
      FOREIGN KEY (conversation_id) 
      REFERENCES conversations(id) 
      ON DELETE CASCADE;
      RAISE NOTICE 'Fixed conversation_context CASCADE DELETE';
    END IF;
  END IF;
END $$;

-- Create verification function using correct schema queries
CREATE OR REPLACE FUNCTION verify_cascade_delete_chain()
RETURNS table(
  table_name text,
  column_name text,
  referenced_table text,
  cascade_delete boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tc.table_name::text,
    kcu.column_name::text,
    ccu.table_name::text as referenced_table,
    (rc.delete_rule = 'CASCADE')::boolean as cascade_delete
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage ccu 
    ON tc.constraint_name = ccu.constraint_name
  JOIN information_schema.referential_constraints rc 
    ON tc.constraint_name = rc.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND ccu.table_name IN ('users', 'conversations', 'projects')
  ORDER BY tc.table_name, kcu.column_name;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION verify_cascade_delete_chain() TO authenticated;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'CASCADE DELETE constraint fixes completed. Run: SELECT * FROM verify_cascade_delete_chain(); to verify all relationships';
END $$;