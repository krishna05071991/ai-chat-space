/*
  # Update conversation RLS policy to use archiving logic

  1. Changes
    - Drop existing SELECT policy for conversations
    - Create new SELECT policy that filters out archived conversations
    - Set default value for is_archived column to false
    - Update any existing NULL values to false for consistency

  2. Security
    - Maintains user isolation (users can only see their own conversations)
    - Automatically filters out archived conversations at database level
    - Uses proper auth.uid() function for authentication
*/

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;

-- Create new SELECT policy that filters out archived conversations
CREATE POLICY "Users can view own conversations" ON conversations
FOR SELECT TO authenticated
USING (auth.uid() = user_id AND (is_archived = false OR is_archived IS NULL));

-- Ensure the is_archived column has a proper default
ALTER TABLE conversations 
ALTER COLUMN is_archived SET DEFAULT false;

-- Update any existing NULL values to false for consistency
UPDATE conversations 
SET is_archived = false 
WHERE is_archived IS NULL;