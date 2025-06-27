/*
  # Fix User Cascade Delete Issue
  
  1. Problem
    - When users are deleted from auth.users, records remain in public.users
    - This creates orphaned data and inconsistency
    
  2. Solution
    - Add proper foreign key constraint with CASCADE DELETE
    - Add trigger to handle user deletion
    - Verify all related tables cascade properly
    
  3. Safety
    - Use conditional logic to avoid errors
    - Preserve existing data integrity
*/

-- First, let's add the missing foreign key constraint to public.users
-- This will ensure that when a user is deleted from auth.users, 
-- the corresponding record in public.users is also deleted

DO $$
BEGIN
  -- Check if the foreign key constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'users_id_fkey' 
    AND table_name = 'users' 
    AND table_schema = 'public'
  ) THEN
    -- Add foreign key constraint with CASCADE DELETE
    ALTER TABLE public.users 
    ADD CONSTRAINT users_id_fkey 
    FOREIGN KEY (id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;
    
    RAISE NOTICE 'Added CASCADE DELETE foreign key constraint to public.users';
  ELSE
    RAISE NOTICE 'Foreign key constraint already exists on public.users';
  END IF;
END $$;

-- Create function to handle user deletion cleanup
CREATE OR REPLACE FUNCTION handle_user_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the deletion for debugging
  RAISE NOTICE 'User deleted from auth.users: %', OLD.id;
  
  -- The CASCADE DELETE constraint should handle this automatically,
  -- but we can add additional cleanup logic here if needed
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for user deletion (optional, since CASCADE should handle it)
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_deletion();

-- Verify that all related tables have proper CASCADE DELETE to public.users
-- (These should already exist based on the schema, but let's verify)

-- Check conversations table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.referential_constraints rc
    JOIN information_schema.key_column_usage kcu ON rc.constraint_name = kcu.constraint_name
    WHERE rc.delete_rule = 'CASCADE' 
    AND kcu.table_name = 'conversations' 
    AND kcu.column_name = 'user_id'
  ) THEN
    RAISE NOTICE 'WARNING: conversations table may not have proper CASCADE DELETE';
  ELSE
    RAISE NOTICE 'conversations table has proper CASCADE DELETE';
  END IF;
END $$;

-- Check messages table (should cascade through conversations)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.referential_constraints rc
    JOIN information_schema.key_column_usage kcu ON rc.constraint_name = kcu.constraint_name
    WHERE rc.delete_rule = 'CASCADE' 
    AND kcu.table_name = 'messages' 
    AND kcu.column_name = 'conversation_id'
  ) THEN
    RAISE NOTICE 'WARNING: messages table may not have proper CASCADE DELETE';
  ELSE
    RAISE NOTICE 'messages table has proper CASCADE DELETE';
  END IF;
END $$;

-- Test the cascade delete functionality (optional, for verification)
-- This function can be called to test if the cascade delete is working
CREATE OR REPLACE FUNCTION test_cascade_delete_setup()
RETURNS text AS $$
DECLARE
  test_result text := '';
BEGIN
  -- Check if foreign key exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'users_id_fkey' 
    AND table_name = 'users' 
    AND table_schema = 'public'
  ) THEN
    test_result := 'PASS: Foreign key constraint exists. ';
  ELSE
    test_result := 'FAIL: Foreign key constraint missing. ';
  END IF;
  
  -- Check if trigger exists
  IF EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'on_auth_user_deleted'
  ) THEN
    test_result := test_result || 'PASS: Deletion trigger exists.';
  ELSE
    test_result := test_result || 'FAIL: Deletion trigger missing.';
  END IF;
  
  RETURN test_result;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION test_cascade_delete_setup() TO authenticated;

-- Final verification message
DO $$
BEGIN
  RAISE NOTICE 'User cascade delete fix completed. Test with: SELECT test_cascade_delete_setup();';
END $$;