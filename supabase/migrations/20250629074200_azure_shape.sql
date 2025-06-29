/*
  # Update Subscription Tiers with Gemini Models

  1. Tier Updates
    - Free tier: Add gemini-2.0-flash
    - Basic tier: Add gemini-1.5-flash, gemini-1.5-pro, gemini-2.5-flash
    - Pro tier: Add all Gemini models

  2. Implementation
    - Uses safe array operations to avoid syntax errors
    - Checks for existing models before adding
    - Uses DO blocks for conditional logic
*/

-- Helper function to safely add model to allowed_models array
CREATE OR REPLACE FUNCTION safe_add_model(current_models TEXT[], new_model TEXT)
RETURNS TEXT[] AS $$
BEGIN
    -- Check if model already exists in array
    IF new_model = ANY(current_models) THEN
        RETURN current_models;
    ELSE
        RETURN array_append(current_models, new_model);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Update free tier: add gemini-2.0-flash
UPDATE public.subscription_tiers
SET allowed_models = safe_add_model(allowed_models, 'gemini-2.0-flash'),
    updated_at = now()
WHERE tier_name = 'free';

-- Update basic tier: add Gemini models
DO $$
BEGIN
    -- Add gemini-1.5-flash
    UPDATE public.subscription_tiers
    SET allowed_models = safe_add_model(allowed_models, 'gemini-1.5-flash'),
        updated_at = now()
    WHERE tier_name = 'basic';
    
    -- Add gemini-1.5-pro
    UPDATE public.subscription_tiers
    SET allowed_models = safe_add_model(allowed_models, 'gemini-1.5-pro'),
        updated_at = now()
    WHERE tier_name = 'basic';
    
    -- Add gemini-2.5-flash
    UPDATE public.subscription_tiers
    SET allowed_models = safe_add_model(allowed_models, 'gemini-2.5-flash'),
        updated_at = now()
    WHERE tier_name = 'basic';
    
    -- Add gemini-2.0-flash to basic as well
    UPDATE public.subscription_tiers
    SET allowed_models = safe_add_model(allowed_models, 'gemini-2.0-flash'),
        updated_at = now()
    WHERE tier_name = 'basic';
END $$;

-- Update pro tier: add all Gemini models
DO $$
BEGIN
    -- Add gemini-2.5-pro
    UPDATE public.subscription_tiers
    SET allowed_models = safe_add_model(allowed_models, 'gemini-2.5-pro'),
        updated_at = now()
    WHERE tier_name = 'pro';
    
    -- Add gemini-2.5-flash
    UPDATE public.subscription_tiers
    SET allowed_models = safe_add_model(allowed_models, 'gemini-2.5-flash'),
        updated_at = now()
    WHERE tier_name = 'pro';
    
    -- Add gemini-2.0-flash
    UPDATE public.subscription_tiers
    SET allowed_models = safe_add_model(allowed_models, 'gemini-2.0-flash'),
        updated_at = now()
    WHERE tier_name = 'pro';
    
    -- Add gemini-1.5-flash
    UPDATE public.subscription_tiers
    SET allowed_models = safe_add_model(allowed_models, 'gemini-1.5-flash'),
        updated_at = now()
    WHERE tier_name = 'pro';
    
    -- Add gemini-1.5-pro
    UPDATE public.subscription_tiers
    SET allowed_models = safe_add_model(allowed_models, 'gemini-1.5-pro'),
        updated_at = now()
    WHERE tier_name = 'pro';
END $$;

-- Clean up the helper function
DROP FUNCTION safe_add_model(TEXT[], TEXT);