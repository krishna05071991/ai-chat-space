/*
  # Add Gemini Model Pricing

  1. New Model Pricing
    - `gemini-2.0-flash`: Input $0.075, Output $0.30 per 1M tokens
    - `gemini-1.5-flash`: Input $0.075, Output $0.30 per 1M tokens  
    - `gemini-1.5-pro`: Input $1.25, Output $5.00 per 1M tokens
    - `gemini-2.5-flash`: Input $0.10, Output $0.40 per 1M tokens
    - `gemini-2.5-pro`: Input $2.00, Output $8.00 per 1M tokens

  2. Security
    - Updates existing model_pricing table
    - Uses UPSERT to avoid conflicts
*/

-- Add/Update Gemini model pricing in model_pricing table
INSERT INTO public.model_pricing (id, model_name, input_cost_per_1k_tokens, output_cost_per_1k_tokens, is_active, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'gemini-2.0-flash', 0.075, 0.30, TRUE, now(), now()),
    (gen_random_uuid(), 'gemini-1.5-flash', 0.075, 0.30, TRUE, now(), now()),
    (gen_random_uuid(), 'gemini-1.5-pro', 1.25, 5.00, TRUE, now(), now()),
    (gen_random_uuid(), 'gemini-2.5-flash', 0.10, 0.40, TRUE, now(), now()),
    (gen_random_uuid(), 'gemini-2.5-pro', 2.00, 8.00, TRUE, now(), now())
ON CONFLICT (model_name) DO UPDATE SET
    input_cost_per_1k_tokens = EXCLUDED.input_cost_per_1k_tokens,
    output_cost_per_1k_tokens = EXCLUDED.output_cost_per_1k_tokens,
    is_active = EXCLUDED.is_active,
    updated_at = now();