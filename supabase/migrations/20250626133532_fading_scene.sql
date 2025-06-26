/*
  # Enhanced Usage Statistics Function
  
  1. Performance Optimization
    - Create function to efficiently calculate user usage
    - Include anniversary-based billing calculations
    
  2. Features
    - Real-time token and message counting
    - Billing period calculations
    - Reset time predictions
*/

-- Function to calculate comprehensive usage statistics
CREATE OR REPLACE FUNCTION get_user_usage_stats(user_uuid uuid)
RETURNS TABLE (
  daily_messages integer,
  monthly_tokens integer,
  daily_tokens integer,
  billing_period_start date,
  daily_reset_time timestamptz,
  monthly_reset_time timestamptz,
  tier_name text,
  monthly_token_limit integer,
  daily_message_limit integer
) AS $$
DECLARE
  user_created_date date;
  current_date_val date := CURRENT_DATE;
  billing_day integer;
BEGIN
  -- Get user creation date for billing anniversary
  SELECT DATE(created_at) INTO user_created_date
  FROM users 
  WHERE id = user_uuid;
  
  -- Calculate billing day (day of month when user signed up)
  billing_day := EXTRACT(DAY FROM user_created_date);
  
  -- Calculate billing period start (current month's anniversary)
  billing_period_start := DATE(EXTRACT(YEAR FROM current_date_val) || '-' || 
                              EXTRACT(MONTH FROM current_date_val) || '-' || 
                              LEAST(billing_day, EXTRACT(DAY FROM (DATE_TRUNC('MONTH', current_date_val) + INTERVAL '1 MONTH - 1 DAY'))));
  
  -- If we're before the billing day this month, billing period started last month
  IF EXTRACT(DAY FROM current_date_val) < billing_day THEN
    billing_period_start := billing_period_start - INTERVAL '1 MONTH';
  END IF;
  
  -- Calculate reset times
  daily_reset_time := (current_date_val + INTERVAL '1 DAY')::timestamptz;
  monthly_reset_time := (billing_period_start + INTERVAL '1 MONTH')::timestamptz;
  
  -- Get user's conversations for RLS compliance
  WITH user_conversations AS (
    SELECT c.id 
    FROM conversations c 
    WHERE c.user_id = user_uuid
  ),
  daily_stats AS (
    SELECT 
      COUNT(*) FILTER (WHERE m.role = 'user') as msg_count,
      COALESCE(SUM(m.total_tokens), 0) as token_sum
    FROM messages m
    JOIN user_conversations uc ON m.conversation_id = uc.id
    WHERE DATE(m.created_at) = current_date_val
  ),
  monthly_stats AS (
    SELECT COALESCE(SUM(m.total_tokens), 0) as token_sum
    FROM messages m
    JOIN user_conversations uc ON m.conversation_id = uc.id
    WHERE m.created_at >= billing_period_start::timestamptz
  ),
  user_tier AS (
    SELECT 
      COALESCE(st.tier_name, 'free') as tier_name,
      COALESCE(st.monthly_token_limit, 35000) as monthly_token_limit,
      COALESCE(st.daily_message_limit, 25) as daily_message_limit
    FROM users u
    LEFT JOIN subscription_tiers st ON u.tier_id = st.id
    WHERE u.id = user_uuid
  )
  SELECT 
    ds.msg_count::integer,
    ms.token_sum::integer,
    ds.token_sum::integer,
    billing_period_start,
    daily_reset_time,
    monthly_reset_time,
    ut.tier_name,
    ut.monthly_token_limit,
    ut.daily_message_limit
  FROM daily_stats ds, monthly_stats ms, user_tier ut;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_usage_stats(uuid) TO authenticated;