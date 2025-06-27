/*
  # Verify and Fix All Table Relationships
  
  1. User Deletion Chain
    - auth.users → public.users (CASCADE)
    - public.users → conversations (CASCADE) 
    - conversations → messages (CASCADE)
    - conversations → conversation_stats (CASCADE)
    - conversations → conversation_context (CASCADE)
    
  2. Additional Relationships
    - users → usage_tracking (CASCADE)
    - users → billing_events (CASCADE)
    - users → projects (CASCADE)
    - projects → project_documents (CASCADE)
*/

-- Ensure conversations table has proper CASCADE DELETE to public.users
DO $$
BEGIN
  -- Check if the foreign key exists with CASCADE
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.referential_constraints rc
    JOIN information_schema.key_column_usage kcu ON rc.constraint_name = kcu.constraint_name
    WHERE rc.delete_rule = 'CASCADE' 
    AND kcu.table_name = 'conversations' 
    AND kcu.column_name = 'user_id'
    AND kcu.referenced_table_name = 'users'
  ) THEN
    -- Drop existing constraint if it exists without CASCADE
    ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_user_id_fkey;
    
    -- Add proper CASCADE constraint
    ALTER TABLE conversations 
    ADD CONSTRAINT conversations_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES public.users(id) 
    ON DELETE CASCADE;
    
    RAISE NOTICE 'Fixed conversations CASCADE DELETE constraint';
  ELSE
    RAISE NOTICE 'conversations already has proper CASCADE DELETE';
  END IF;
END $$;

-- Ensure messages table has proper CASCADE DELETE to conversations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.referential_constraints rc
    JOIN information_schema.key_column_usage kcu ON rc.constraint_name = kcu.constraint_name
    WHERE rc.delete_rule = 'CASCADE' 
    AND kcu.table_name = 'messages' 
    AND kcu.column_name = 'conversation_id'
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

-- Fix other user-related tables
DO $$
BEGIN
  -- Usage tracking
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'usage_tracking') THEN
    ALTER TABLE usage_tracking DROP CONSTRAINT IF EXISTS usage_tracking_user_id_fkey;
    ALTER TABLE usage_tracking 
    ADD CONSTRAINT usage_tracking_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES public.users(id) 
    ON DELETE CASCADE;
    RAISE NOTICE 'Fixed usage_tracking CASCADE DELETE';
  END IF;
  
  -- Billing events
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'billing_events') THEN
    ALTER TABLE billing_events DROP CONSTRAINT IF EXISTS billing_events_user_id_fkey;
    ALTER TABLE billing_events 
    ADD CONSTRAINT billing_events_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES public.users(id) 
    ON DELETE CASCADE;
    RAISE NOTICE 'Fixed billing_events CASCADE DELETE';
  END IF;
  
  -- Projects
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
    ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_user_id_fkey;
    ALTER TABLE projects 
    ADD CONSTRAINT projects_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES public.users(id) 
    ON DELETE CASCADE;
    RAISE NOTICE 'Fixed projects CASCADE DELETE';
  END IF;
  
  -- Project documents (cascade through projects)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_documents') THEN
    ALTER TABLE project_documents DROP CONSTRAINT IF EXISTS project_documents_project_id_fkey;
    ALTER TABLE project_documents 
    ADD CONSTRAINT project_documents_project_id_fkey 
    FOREIGN KEY (project_id) 
    REFERENCES projects(id) 
    ON DELETE CASCADE;
    RAISE NOTICE 'Fixed project_documents CASCADE DELETE';
  END IF;
  
  -- Conversation stats
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversation_stats') THEN
    ALTER TABLE conversation_stats DROP CONSTRAINT IF EXISTS conversation_stats_conversation_id_fkey;
    ALTER TABLE conversation_stats 
    ADD CONSTRAINT conversation_stats_conversation_id_fkey 
    FOREIGN KEY (conversation_id) 
    REFERENCES conversations(id) 
    ON DELETE CASCADE;
    RAISE NOTICE 'Fixed conversation_stats CASCADE DELETE';
  END IF;
  
  -- Conversation context
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversation_context') THEN
    ALTER TABLE conversation_context DROP CONSTRAINT IF EXISTS conversation_context_conversation_id_fkey;
    ALTER TABLE conversation_context 
    ADD CONSTRAINT conversation_context_conversation_id_fkey 
    FOREIGN KEY (conversation_id) 
    REFERENCES conversations(id) 
    ON DELETE CASCADE;
    RAISE NOTICE 'Fixed conversation_context CASCADE DELETE';
  END IF;
END $$;

-- Create comprehensive test function
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
    kcu.table_name::text,
    kcu.column_name::text,
    kcu.referenced_table_name::text,
    (rc.delete_rule = 'CASCADE')::boolean as cascade_delete
  FROM information_schema.referential_constraints rc
  JOIN information_schema.key_column_usage kcu 
    ON rc.constraint_name = kcu.constraint_name
  WHERE kcu.referenced_table_name IN ('users', 'conversations', 'projects')
    AND kcu.table_schema = 'public'
  ORDER BY kcu.table_name, kcu.column_name;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION verify_cascade_delete_chain() TO authenticated;

-- Run verification
DO $$
BEGIN
  RAISE NOTICE 'Cascade delete verification completed. Run: SELECT * FROM verify_cascade_delete_chain(); to see all relationships';
END $$;