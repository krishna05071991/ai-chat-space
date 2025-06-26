/*
  # Performance Optimization Indexes
  
  1. Indexes for Usage Tracking
    - User and date combinations for efficient usage queries
    - Billing events by user for payment history
    
  2. Indexes for Message Operations
    - Conversation and creation time for message ordering
    - Token calculations for usage statistics
    
  3. Indexes for User Management
    - Users by subscription tier for tier-based queries
    - Active subscription tiers for plan lookups
    - Model pricing for cost calculations
    
  4. Indexes for Conversation Management
    - User conversations for efficient listing
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

-- Additional performance indexes for common queries

-- Index for message sequence ordering
CREATE INDEX IF NOT EXISTS idx_messages_sequence 
ON messages(conversation_id, sequence_number);

-- Index for user messages (for daily limits)
CREATE INDEX IF NOT EXISTS idx_messages_user_role_date 
ON messages(created_at, role) 
WHERE role = 'user';

-- Index for conversation stats lookups
CREATE INDEX IF NOT EXISTS idx_conversation_stats_updated 
ON conversation_stats(last_updated DESC);

-- Composite index for usage tracking by date range
CREATE INDEX IF NOT EXISTS idx_usage_tracking_date_user 
ON usage_tracking(date DESC, user_id);

-- Index for billing events by type and date
CREATE INDEX IF NOT EXISTS idx_billing_events_type_date 
ON billing_events(event_type, created_at DESC);