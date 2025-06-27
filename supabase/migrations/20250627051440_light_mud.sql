/*
  # Update Conversation RLS Policy for Archiving

  1. Security Updates
    - Update SELECT policy to filter out archived conversations
    - Ensure users only see non-archived conversations
  
  2. Changes
    - Modify existing RLS policy to include is_archived check
    - Support backward compatibility for NULL values
*/

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;

-- Create new SELECT policy that filters out archived conversations
CREATE POLICY "Users can view own conversations" ON conversations
FOR SELECT TO authenticated
USING (uid() = user_id AND (is_archived = false OR is_archived IS NULL));

-- Ensure the is_archived column has a proper default
ALTER TABLE conversations 
ALTER COLUMN is_archived SET DEFAULT false;

-- Update any existing NULL values to false for consistency
UPDATE conversations 
SET is_archived = false 
WHERE is_archived IS NULL;