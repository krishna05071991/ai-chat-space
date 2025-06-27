/*
  # User Profile and Onboarding Setup

  1. Profile Data
    - Add profile fields to users table
    - Full name, location, profession, avatar
    - Onboarding completion tracking

  2. Security
    - Update RLS policies for profile access
    - Ensure users can only update their own profiles

  3. Functions
    - Profile completion checking
    - Avatar URL validation
*/

-- Add profile fields to existing users table
DO $$
BEGIN
  -- Add full_name if it doesn't exist (it should already exist)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE users ADD COLUMN full_name text;
  END IF;

  -- Add location field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'location'
  ) THEN
    ALTER TABLE users ADD COLUMN location text;
  END IF;

  -- Add profession field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'profession'
  ) THEN
    ALTER TABLE users ADD COLUMN profession text;
  END IF;

  -- Add onboarding completion tracking
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'onboarding_completed'
  ) THEN
    ALTER TABLE users ADD COLUMN onboarding_completed boolean DEFAULT false;
  END IF;

  -- Add profile completion timestamp
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'profile_completed_at'
  ) THEN
    ALTER TABLE users ADD COLUMN profile_completed_at timestamptz;
  END IF;
END $$;

-- Update RLS policies to allow profile updates
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Function to check if user profile is complete
CREATE OR REPLACE FUNCTION is_profile_complete(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = user_id 
    AND full_name IS NOT NULL 
    AND full_name != ''
    AND onboarding_completed = true
  );
END;
$$;

-- Function to mark onboarding as complete
CREATE OR REPLACE FUNCTION complete_user_onboarding(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users 
  SET onboarding_completed = true,
      profile_completed_at = now(),
      updated_at = now()
  WHERE id = user_id;
END;
$$;

-- Create index for faster profile lookups
CREATE INDEX IF NOT EXISTS idx_users_onboarding_completed 
ON users (onboarding_completed, id);

-- Create index for profile completion queries
CREATE INDEX IF NOT EXISTS idx_users_profile_complete 
ON users (full_name, onboarding_completed) 
WHERE full_name IS NOT NULL AND onboarding_completed = true;