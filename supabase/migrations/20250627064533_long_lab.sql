/*
  # Fix RLS policies for archiving functionality

  1. RLS Policy Updates
    - Ensure UPDATE policy works with archiving
    - Fix SELECT policy for archived conversations
    - Clean up policy conflicts

  2. Database Consistency
    - Ensure is_archived column is properly set up
    - Add proper indexes for performance
*/

-- Ensure is_archived column exists and has proper default
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false;

-- Update any existing NULL values to false for consistency
UPDATE conversations 
SET is_archived = false 
WHERE is_archived IS NULL;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can delete own conversations" ON conversations;

-- Recreate policies with proper archiving support

-- SELECT policy: Only show non-archived conversations to users
CREATE POLICY "Users can view own conversations" ON conversations
FOR SELECT TO authenticated
USING (
  auth.uid() = user_id 
  AND (is_archived = false OR is_archived IS NULL)
);

-- INSERT policy: Users can create conversations
CREATE POLICY "Users can create own conversations" ON conversations
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE policy: Users can update their own conversations (including archiving)
CREATE POLICY "Users can update own conversations" ON conversations
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE policy: Users can delete their own conversations (if needed)
CREATE POLICY "Users can delete own conversations" ON conversations
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Add index for archived conversations if not exists
CREATE INDEX IF NOT EXISTS idx_conversations_user_archived 
ON conversations(user_id, is_archived, updated_at DESC);