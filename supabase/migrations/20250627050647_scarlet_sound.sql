/*
  # Database Performance Indexes

  1. Performance Indexes
    - Usage tracking queries (user + date combinations)
    - Billing events by user lookup
    - Message queries by conversation and time
    - User tier associations
    - Active subscription tiers only
    - Active model pricing only
    - Message token calculations

  2. Security
    - All indexes respect existing RLS policies
    - No changes to permissions or access control
*/

-- Index for usage tracking queries (user + date)
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_date 
ON usage_tracking(user_id, date);

-- Index for billing events by user
CREATE INDEX IF NOT EXISTS idx_billing_events_user_id 
ON billing_events(user_id);

-- Index for messages by conversation and creation time
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
ON messages(conversation_id, created_at);

-- Index for users by tier
CREATE INDEX IF NOT EXISTS idx_users_tier_id 
ON users(tier_id);

-- Index for active subscription tiers
CREATE INDEX IF NOT EXISTS idx_subscription_tiers_name 
ON subscription_tiers(tier_name) WHERE is_active = true;

-- Index for model pricing lookups
CREATE INDEX IF NOT EXISTS idx_model_pricing_name 
ON model_pricing(model_name) WHERE is_active = true;

-- Index for conversations by user and update time (without time-based filter)
CREATE INDEX IF NOT EXISTS idx_conversations_user_updated 
ON conversations(user_id, updated_at DESC);

-- Index for message token calculations
CREATE INDEX IF NOT EXISTS idx_messages_tokens 
ON messages(conversation_id, total_tokens) 
WHERE total_tokens > 0;