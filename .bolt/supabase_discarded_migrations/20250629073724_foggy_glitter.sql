/*
  # Add Gemini Models to Database

  1. New Models
    - Add Google Gemini models to model_pricing table
    - Add model pricing information for all Gemini variants
    
  2. Tier Updates
    - Update subscription tiers to include Gemini models
    - Free tier gets gemini-2.0-flash
    - Basic tier gets additional Gemini models
    - Pro tier gets all Gemini models including premium ones
    
  3. Security
    - Maintain existing RLS policies
    - No changes to user permissions needed
*/

-- Add Gemini models to model_pricing table
INSERT INTO model_pricing (model_name, input_cost_per_1k_tokens, output_cost_per_1k_tokens, is_active, created_at, updated_at) VALUES
('gemini-2.0-flash', 0.000075, 0.000300, true, now(), now()),
('gemini-1.5-flash', 0.000075, 0.000300, true, now(), now()),
('gemini-1.5-pro', 0.001250, 0.005000, true, now(), now()),
('gemini-2.5-flash', 0.000100, 0.000400, true, now(), now()),
('gemini-2.5-pro', 0.002000, 0.008000, true, now(), now())
ON CONFLICT (model_name) DO UPDATE SET
  input_cost_per_1k_tokens = EXCLUDED.input_cost_per_1k_tokens,
  output_cost_per_1k_tokens = EXCLUDED.output_cost_per_1k_tokens,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Update subscription tiers to include Gemini models

-- Update Free tier (add gemini-2.0-flash)
UPDATE subscription_tiers 
SET allowed_models = array_append(
  CASE 
    WHEN 'gemini-2.0-flash' = ANY(allowed_models) THEN allowed_models
    ELSE allowed_models || ARRAY['gemini-2.0-flash']
  END,
  NULL
)[1:array_length(allowed_models, 1) + CASE WHEN 'gemini-2.0-flash' = ANY(allowed_models) THEN 0 ELSE 1 END],
updated_at = now()
WHERE tier_name = 'free';

-- Update Basic tier (add Gemini models except premium ones)
UPDATE subscription_tiers 
SET allowed_models = allowed_models || ARRAY[
  'gemini-2.0-flash',
  'gemini-1.5-flash', 
  'gemini-1.5-pro',
  'gemini-2.5-flash'
] - allowed_models,
updated_at = now()
WHERE tier_name = 'basic';

-- Update Pro tier (add all Gemini models)
UPDATE subscription_tiers 
SET allowed_models = allowed_models || ARRAY[
  'gemini-2.0-flash',
  'gemini-1.5-flash', 
  'gemini-1.5-pro',
  'gemini-2.5-flash',
  'gemini-2.5-pro'
] - allowed_models,
updated_at = now()
WHERE tier_name = 'pro';

-- Verify the changes
SELECT tier_name, allowed_models 
FROM subscription_tiers 
WHERE tier_name IN ('free', 'basic', 'pro')
ORDER BY 
  CASE tier_name 
    WHEN 'free' THEN 1 
    WHEN 'basic' THEN 2 
    WHEN 'pro' THEN 3 
  END;