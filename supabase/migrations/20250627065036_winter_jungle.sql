/*
  # Fix conversation loading RLS conflicts

  1. Problem Resolution
    - Remove conflicting query filters that interfere with RLS policies
    - Ensure RLS policies work correctly for conversation loading
    - Fix any remaining archiving issues

  2. RLS Policy Validation
    - Verify SELECT policy correctly filters archived conversations
    - Ensure policy syntax is compatible with Supabase
    - Test policy performance and functionality

  3. Data Consistency
    - Ensure all conversations have proper is_archived values
    - Add performance indexes for conversation queries
    - Validate user access patterns
*/

-- Ensure is_archived column exists and has proper setup
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false;

-- Ensure all existing conversations have is_archived = false
UPDATE conversations 
SET is_archived = false 
WHERE is_archived IS NULL;

-- Make is_archived NOT NULL with default
ALTER TABLE conversations 
ALTER COLUMN is_archived SET NOT NULL,
ALTER COLUMN is_archived SET DEFAULT false;

-- Drop and recreate the SELECT policy to ensure it works correctly
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;

-- Create a simple, clean SELECT policy
CREATE POLICY "Users can view own conversations" ON conversations
FOR SELECT TO authenticated
USING (
  auth.uid() = user_id 
  AND is_archived = false
);

-- Ensure other policies exist and are correct
DROP POLICY IF EXISTS "Users can create own conversations" ON conversations;
CREATE POLICY "Users can create own conversations" ON conversations
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own conversations" ON conversations;
CREATE POLICY "Users can update own conversations" ON conversations
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add optimized index for conversation loading
DROP INDEX IF EXISTS idx_conversations_user_archived;
CREATE INDEX idx_conversations_user_active ON conversations(user_id, updated_at DESC) 
WHERE is_archived = false;

-- Add general index for all conversations by user
CREATE INDEX IF NOT EXISTS idx_conversations_user_all ON conversations(user_id, is_archived, updated_at DESC);