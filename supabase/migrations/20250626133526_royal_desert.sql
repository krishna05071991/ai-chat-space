/*
  # Enable Row Level Security on Users Table
  
  1. Security Enhancement
    - Enable RLS on users table
    - Add policies for users to view/update their own data
    
  2. Data Protection
    - Ensure users can only access their own profile data
    - Allow authenticated users to update their own information
*/

-- Enable Row Level Security on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own data
CREATE POLICY "Users can view own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy for users to update their own data
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy for system to insert new users (during signup)
CREATE POLICY "System can insert new users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);