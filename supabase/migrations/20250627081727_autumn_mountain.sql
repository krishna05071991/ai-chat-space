/*
  # Fix cascade delete relationships for user deletion

  1. Problem
    - When users are deleted from auth.users, records in public.users remain
    - Related data (conversations, messages, etc.) also remain orphaned
    
  2. Solution
    - Add proper CASCADE DELETE constraints throughout the chain
    - Ensure auth.users → public.users → conversations → messages all cascade
    
  3. Verification
    - Add function to verify cascade delete chain
    - Test all foreign key relationships
*/

-- Step 1: Fix public.users table to CASCADE DELETE from auth.users
DO $$
BEGIN
  -- Drop existing constraint if it exists
  ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;
  
  -- Add proper CASCADE constraint to auth.users
  ALTER TABLE public.users 
  ADD CONSTRAINT users_id_fkey 
  FOREIGN KEY (id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;
  
  RAISE NOTICE 'Added CASCADE DELETE from auth.users to public.users';
END $$;

-- Step 2: Ensure conversations CASCADE DELETE from public.users
DO $$
BEGIN
  ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_user_id_fkey;
  ALTER TABLE conversations 
  ADD CONSTRAINT conversations_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.users(id) 
  ON DELETE CASCADE;
  
  RAISE NOTICE 'Fixed conversations CASCADE DELETE from public.users';
END $$;

-- Step 3: Ensure messages CASCADE DELETE from conversations
DO $$
BEGIN
  ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_conversation_id_fkey;
  ALTER TABLE messages 
  ADD CONSTRAINT messages_conversation_id_fkey 
  FOREIGN KEY (conversation_id) 
  REFERENCES conversations(id) 
  ON DELETE CASCADE;
  
  RAISE NOTICE 'Fixed messages CASCADE DELETE from conversations';
END $$;

-- Step 4: Fix other user-related tables
DO $$
BEGIN
  -- Usage tracking table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'usage_tracking' AND table_schema = 'public') THEN
    ALTER TABLE usage_tracking DROP CONSTRAINT IF EXISTS usage_tracking_user_id_fkey;
    ALTER TABLE usage_tracking 
    ADD CONSTRAINT usage_tracking_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES public.users(id) 
    ON DELETE CASCADE;
    RAISE NOTICE 'Fixed usage_tracking CASCADE DELETE';
  END IF;
  
  -- Billing events table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'billing_events' AND table_schema = 'public') THEN
    ALTER TABLE billing_events DROP CONSTRAINT IF EXISTS billing_events_user_id_fkey;
    ALTER TABLE billing_events 
    ADD CONSTRAINT billing_events_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES public.users(id) 
    ON DELETE CASCADE;
    RAISE NOTICE 'Fixed billing_events CASCADE DELETE';
  END IF;
  
  -- Projects table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects' AND table_schema = 'public') THEN
    ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_user_id_fkey;
    ALTER TABLE projects 
    ADD CONSTRAINT projects_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES public.users(id) 
    ON DELETE CASCADE;
    RAISE NOTICE 'Fixed projects CASCADE DELETE';
  END IF;
END $$;

-- Step 5: Fix conversation-related tables
DO $$
BEGIN
  -- Project documents (cascade through projects)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_documents' AND table_schema = 'public') THEN
    ALTER TABLE project_documents DROP CONSTRAINT IF EXISTS project_documents_project_id_fkey;
    ALTER TABLE project_documents 
    ADD CONSTRAINT project_documents_project_id_fkey 
    FOREIGN KEY (project_id) 
    REFERENCES projects(id) 
    ON DELETE CASCADE;
    RAISE NOTICE 'Fixed project_documents CASCADE DELETE';
  END IF;
  
  -- Conversation stats
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversation_stats' AND table_schema = 'public') THEN
    ALTER TABLE conversation_stats DROP CONSTRAINT IF EXISTS conversation_stats_conversation_id_fkey;
    ALTER TABLE conversation_stats 
    ADD CONSTRAINT conversation_stats_conversation_id_fkey 
    FOREIGN KEY (conversation_id) 
    REFERENCES conversations(id) 
    ON DELETE CASCADE;
    RAISE NOTICE 'Fixed conversation_stats CASCADE DELETE';
  END IF;
  
  -- Conversation context
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversation_context' AND table_schema = 'public') THEN
    ALTER TABLE conversation_context DROP CONSTRAINT IF EXISTS conversation_context_conversation_id_fkey;
    ALTER TABLE conversation_context 
    ADD CONSTRAINT conversation_context_conversation_id_fkey 
    FOREIGN KEY (conversation_id) 
    REFERENCES conversations(id) 
    ON DELETE CASCADE;
    RAISE NOTICE 'Fixed conversation_context CASCADE DELETE';
  END IF;
END $$;

-- Step 6: Create verification function using correct PostgreSQL syntax
CREATE OR REPLACE FUNCTION verify_cascade_delete_chain()
RETURNS table(
  table_name text,
  column_name text,
  referenced_table text,
  referenced_column text,
  cascade_delete boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tc.table_name::text,
    kcu.column_name::text,
    ccu.table_name::text as referenced_table,
    ccu.column_name::text as referenced_column,
    (rc.delete_rule = 'CASCADE')::boolean as cascade_delete
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
  JOIN information_schema.referential_constraints rc 
    ON tc.constraint_name = rc.constraint_name
    AND tc.table_schema = rc.constraint_schema
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND (ccu.table_name IN ('users', 'conversations', 'projects') 
         OR tc.table_name IN ('users', 'conversations', 'messages', 'usage_tracking', 'billing_events', 'projects', 'project_documents', 'conversation_stats', 'conversation_context'))
  ORDER BY tc.table_name, kcu.column_name;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION verify_cascade_delete_chain() TO authenticated;

-- Step 7: Create simple test function to verify the chain works
CREATE OR REPLACE FUNCTION test_cascade_delete_chain()
RETURNS text AS $$
DECLARE
  result_text text := '';
  cascade_count integer;
BEGIN
  -- Count how many CASCADE delete constraints we have
  SELECT COUNT(*) INTO cascade_count
  FROM information_schema.referential_constraints 
  WHERE delete_rule = 'CASCADE' 
    AND constraint_schema = 'public';
  
  result_text := 'Found ' || cascade_count || ' CASCADE DELETE constraints in public schema. ';
  
  -- Check specific important constraints
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
    WHERE tc.table_name = 'users' 
      AND ccu.table_name = 'users' 
      AND ccu.table_schema = 'auth'
      AND rc.delete_rule = 'CASCADE'
  ) THEN
    result_text := result_text || 'auth.users → public.users CASCADE: ✓ ';
  ELSE
    result_text := result_text || 'auth.users → public.users CASCADE: ✗ ';
  END IF;
  
  RETURN result_text || 'Run SELECT * FROM verify_cascade_delete_chain(); for detailed view.';
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION test_cascade_delete_chain() TO authenticated;

-- Final verification
DO $$
BEGIN
  RAISE NOTICE 'CASCADE DELETE setup completed. Test with: SELECT test_cascade_delete_chain();';
END $$;