-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.billing_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  event_type text NOT NULL CHECK (event_type = ANY (ARRAY['charge'::text, 'refund'::text, 'credit'::text, 'limit_exceeded'::text])),
  amount numeric,
  tokens_involved integer,
  stripe_payment_intent_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT billing_events_pkey PRIMARY KEY (id),
  CONSTRAINT billing_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.conversation_context (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid,
  document_ids ARRAY,
  search_results jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT conversation_context_pkey PRIMARY KEY (id),
  CONSTRAINT conversation_context_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id)
);
CREATE TABLE public.conversation_stats (
  conversation_id uuid NOT NULL,
  total_messages integer DEFAULT 0,
  total_tokens integer DEFAULT 0,
  models_used ARRAY DEFAULT '{}'::text[],
  last_updated timestamp with time zone DEFAULT now(),
  CONSTRAINT conversation_stats_pkey PRIMARY KEY (conversation_id),
  CONSTRAINT conversation_stats_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id)
);
CREATE TABLE public.conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  title text NOT NULL,
  model_history jsonb DEFAULT '[]'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  is_archived boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  total_tokens integer DEFAULT 0,
  CONSTRAINT conversations_pkey PRIMARY KEY (id),
  CONSTRAINT conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid,
  role text NOT NULL CHECK (role = ANY (ARRAY['user'::text, 'assistant'::text, 'system'::text])),
  content text NOT NULL,
  model_used text,
  model_parameters jsonb DEFAULT '{}'::jsonb,
  input_tokens integer DEFAULT 0,
  output_tokens integer DEFAULT 0,
  total_tokens integer DEFAULT (input_tokens + output_tokens),
  response_time integer,
  created_at timestamp with time zone DEFAULT now(),
  sequence_number integer NOT NULL,
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id)
);
CREATE TABLE public.model_pricing (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  model_name text NOT NULL UNIQUE,
  input_cost_per_1k_tokens numeric NOT NULL,
  output_cost_per_1k_tokens numeric NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT model_pricing_pkey PRIMARY KEY (id)
);
CREATE TABLE public.project_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid,
  filename text NOT NULL,
  content_hash text,
  vector_embeddings jsonb,
  processed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT project_documents_pkey PRIMARY KEY (id),
  CONSTRAINT project_documents_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  description text,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT projects_pkey PRIMARY KEY (id),
  CONSTRAINT projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.subscription_tiers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tier_name text NOT NULL UNIQUE,
  monthly_token_limit integer NOT NULL,
  daily_message_limit integer DEFAULT '-1'::integer,
  allowed_models ARRAY DEFAULT '{}'::text[],
  features ARRAY DEFAULT '{}'::text[],
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT subscription_tiers_pkey PRIMARY KEY (id)
);
CREATE TABLE public.usage_tracking (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  date date DEFAULT CURRENT_DATE,
  tokens_used integer DEFAULT 0,
  messages_sent integer DEFAULT 0,
  models_used jsonb DEFAULT '{}'::jsonb,
  cost_incurred numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT usage_tracking_pkey PRIMARY KEY (id),
  CONSTRAINT usage_tracking_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  full_name text,
  avatar_url text,
  preferences jsonb DEFAULT '{}'::jsonb,
  monthly_tokens_used integer DEFAULT 0,
  billing_period_start date DEFAULT CURRENT_DATE,
  stripe_customer_id text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  tier_id uuid,
  daily_messages_sent integer DEFAULT 0,
  last_daily_reset date DEFAULT CURRENT_DATE,
  last_monthly_reset date DEFAULT CURRENT_DATE,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_tier_id_fkey FOREIGN KEY (tier_id) REFERENCES public.subscription_tiers(id)
);