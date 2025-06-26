/*
  # New User Onboarding Function
  
  1. Automatic Setup
    - Create user profile when they sign up
    - Assign default free tier
    - Initialize usage tracking
    
  2. Data Consistency
    - Ensure all new users have proper setup
    - Handle edge cases and errors gracefully
*/

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  free_tier_id uuid;
BEGIN
  -- Get the free tier ID
  SELECT id INTO free_tier_id
  FROM subscription_tiers
  WHERE tier_name = 'free' AND is_active = true
  LIMIT 1;
  
  -- Insert new user record
  INSERT INTO users (
    id,
    email,
    full_name,
    tier_id,
    monthly_tokens_used,
    daily_messages_sent,
    billing_period_start,
    last_daily_reset,
    last_monthly_reset,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    free_tier_id,
    0,
    0,
    CURRENT_DATE,
    CURRENT_DATE,
    CURRENT_DATE,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = NEW.email,
    updated_at = now();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user onboarding
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();