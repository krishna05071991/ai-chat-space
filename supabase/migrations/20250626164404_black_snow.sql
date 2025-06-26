/*
  # Performance Optimization Indexes
  
  1. Query Optimization
    - Add indexes for common query patterns
    - Optimize usage tracking queries
    - Speed up conversation loading
    
  2. Composite Indexes
    - Multi-column indexes for complex queries
    - Partial indexes for filtered queries
    
  Note: Removed time-based partial index to avoid immutable function error
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

-- Index for conversations by user and update time (without time-based predicate)
CREATE INDEX IF NOT EXISTS idx_conversations_user_updated 
ON conversations(user_id, updated_at DESC);

-- Index for message token calculations
CREATE INDEX IF NOT EXISTS idx_messages_tokens 
ON messages(conversation_id, total_tokens) 
WHERE total_tokens > 0;