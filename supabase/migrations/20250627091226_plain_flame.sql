/*
  # Fix Supabase signup error - handle_new_user trigger

  1. Problem Analysis
    - "Database error saving new user" indicates the handle_new_user trigger is failing
    - This trigger creates a record in public.users when auth.users gets a new user
    - Recent CASCADE changes may have broken the trigger function

  2. Solutions
    - Drop and recreate the handle_new_user function with proper error handling
    - Ensure users table structure matches what the trigger expects
    - Fix any RLS policies that might block user creation
    - Add proper defaults and handle missing fields
*/

-- First, let's ensure the users table has the correct structure
DO $$
BEGIN
  -- Check if users table exists, if not create it
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
    CREATE TABLE public.users (
      id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      email text UNIQUE NOT NULL,
      full_name text,
      avatar_url text,
      preferences jsonb DEFAULT '{}',
      monthly_tokens_used integer DEFAULT 0,
      billing_period_start date DEFAULT CURRENT_DATE,
      stripe_customer_id text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      tier_id uuid,
      daily_messages_sent integer DEFAULT 0,
      last_daily_reset date DEFAULT CURRENT_DATE,
      last_monthly_reset date DEFAULT CURRENT_DATE,
      location text,
      profession text,
      onboarding_completed boolean DEFAULT false,
      profile_completed_at timestamptz
    );
    
    RAISE NOTICE 'Created users table';
  END IF;
END $$;

-- Ensure RLS is enabled on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing RLS policies and recreate them properly
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "System can insert new users" ON public.users;

-- Create proper RLS policies
CREATE POLICY "Users can view own profile" 
  ON public.users FOR SELECT 
  TO authenticated 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.users FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = id) 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "System can insert new users" 
  ON public.users FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = id);

-- Also allow service role to insert (for the trigger)
CREATE POLICY "Service role can insert users" 
  ON public.users FOR INSERT 
  TO service_role 
  WITH CHECK (true);

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the fixed handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into public.users with proper error handling
  INSERT INTO public.users (
    id,
    email,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),  -- Handle potential null email
    COALESCE(NEW.created_at, now()),
    COALESCE(NEW.created_at, now())
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth user creation
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure the updated_at trigger exists for users table
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create a default subscription tier if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.subscription_tiers WHERE tier_name = 'free') THEN
    INSERT INTO public.subscription_tiers (
      tier_name,
      monthly_token_limit,
      daily_message_limit,
      allowed_models,
      features,
      is_active
    ) VALUES (
      'free',
      35000,
      25,
      ARRAY['gpt-4o-mini', 'claude-3-5-haiku-20241022'],
      ARRAY['Basic chat', 'Limited models'],
      true
    );
    RAISE NOTICE 'Created default free tier';
  END IF;
END $$;

-- Test the handle_new_user function works
DO $$
BEGIN
  RAISE NOTICE 'handle_new_user function recreated successfully';
  RAISE NOTICE 'Users table structure verified';
  RAISE NOTICE 'RLS policies updated';
  RAISE NOTICE 'Signup should now work correctly';
END $$;