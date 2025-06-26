// TypeScript interfaces for chat.space data structures with enhanced multi-provider integration
export interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  model_used: string | null
  input_tokens?: number
  output_tokens?: number
  total_tokens?: number
  created_at: string
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  total_tokens?: number // Optional since it's computed by database
  created_at: string
  updated_at: string
}

export interface AIModel {
  id: string
  name: string
  displayName: string
  provider: 'openai' | 'anthropic'
  category: 'general' | 'reasoning' | 'coding' | 'simple'
  tier: 'flagship' | 'efficient' | 'latest' | 'premium' | 'nano'
  color: string
  maxTokens: number
  description: string
  pricing?: {
    input: number // per million tokens
    output: number // per million tokens
  }
}

// Latest 2025 AI Models - Comprehensive List
export const ALL_MODELS: AIModel[] = [
  // OpenAI GPT-4o Family (Most Popular)
  {
    id: 'gpt-4o',
    name: 'gpt-4o',
    displayName: 'GPT-4o',
    provider: 'openai',
    category: 'smart-daily',
    tier: 'flagship',
    color: '#3B82F6', // blue-500
    maxTokens: 128000,
    description: 'Most advanced multimodal model',
    pricing: { input: 2.5, output: 10 }
  },
  {
    id: 'gpt-4o-mini',
    name: 'gpt-4o-mini',
    displayName: 'GPT-4o Mini',
    provider: 'openai',
    category: 'budget',
    tier: 'efficient',
    color: '#F59E0B', // amber-500
    maxTokens: 128000,
    description: 'Fast and cost-effective',
    pricing: { input: 0.15, output: 0.6 }
  },

  // OpenAI GPT-4.1 Family (Latest 2025)
  {
    id: 'gpt-4.1',
    name: 'gpt-4.1',
    displayName: 'GPT-4.1',
    provider: 'openai',
    category: 'smart-daily',
    tier: 'latest',
    color: '#10B981', // emerald-500
    maxTokens: 128000,
    description: 'Latest model with improved coding and reasoning',
    pricing: { input: 3, output: 12 }
  },
  {
    id: 'gpt-4.1-mini',
    name: 'gpt-4.1-mini',
    displayName: 'GPT-4.1 Mini',
    provider: 'openai',
    category: 'budget',
    tier: 'efficient',
    color: '#059669', // emerald-600
    maxTokens: 128000,
    description: 'Efficient version of GPT-4.1',
    pricing: { input: 0.5, output: 2 }
  },
  {
    id: 'gpt-4.1-nano',
    name: 'gpt-4.1-nano',
    displayName: 'GPT-4.1 Nano',
    provider: 'openai',
    category: 'budget',
    tier: 'nano',
    color: '#6B7280', // gray-500
    maxTokens: 128000,
    description: 'Ultra-fast micro model',
    pricing: { input: 0.05, output: 0.2 }
  },

  // OpenAI Reasoning Models (o-series)
  {
    id: 'o3',
    name: 'o3',
    displayName: 'OpenAI o3',
    provider: 'openai',
    category: 'reasoning',
    tier: 'premium',
    color: '#7C3AED', // violet-600
    maxTokens: 128000,
    description: 'Advanced reasoning for complex problems',
    pricing: { input: 15, output: 60 }
  },
  {
    id: 'o3-mini',
    name: 'o3-mini',
    displayName: 'OpenAI o3-mini',
    provider: 'openai',
    category: 'reasoning',
    tier: 'efficient',
    color: '#8B5CF6', // violet-500
    maxTokens: 128000,
    description: 'Cost-efficient reasoning model',
    pricing: { input: 1.1, output: 4.4 }
  },
  {
    id: 'o4-mini',
    name: 'o4-mini',
    displayName: 'OpenAI o4-mini',
    provider: 'openai',
    category: 'reasoning',
    tier: 'efficient',
    color: '#A855F7', // violet-400
    maxTokens: 128000,
    description: 'Latest mini reasoning model',
    pricing: { input: 1, output: 4 }
  },


  // Anthropic Claude Models
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'claude-3-5-sonnet-20241022',
    displayName: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    category: 'smart-daily',
    tier: 'flagship',
    color: '#F97316', // orange-500
    maxTokens: 200000,
    description: 'Excellent reasoning and analysis',
    pricing: { input: 3, output: 15 }
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'claude-3-5-haiku-20241022',
    displayName: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    category: 'budget',
    tier: 'efficient',
    color: '#EA580C', // orange-600
    maxTokens: 200000,
    description: 'Fast and efficient',
    pricing: { input: 0.25, output: 1.25 }
  },
  {
    id: 'claude-3-opus-20240229',
    name: 'claude-3-opus-20240229',
    displayName: 'Claude 3 Opus',
    provider: 'anthropic',
    category: 'reasoning',
    tier: 'premium',
    color: '#DC2626', // red-600
    maxTokens: 200000,
    description: 'Most capable for complex tasks',
    pricing: { input: 15, output: 75 }
  },

  // Claude 3.7 Models (2025) - NEWLY ADDED
  {
    id: 'claude-3-7-sonnet-20250219',
    name: 'claude-3-7-sonnet-20250219',
    displayName: 'Claude 3.7 Sonnet',
    provider: 'anthropic',
    category: 'smart-daily',
    tier: 'latest',
    color: '#F97316', // orange-500
    maxTokens: 200000,
    description: 'Enhanced reasoning and analysis',
    pricing: { input: 4, output: 20 }
  },

  // Claude 4 Models (2025) - NEWLY ADDED
  {
    id: 'claude-sonnet-4-20250514',
    name: 'claude-sonnet-4-20250514',
    displayName: 'Claude Sonnet 4',
    provider: 'anthropic',
    category: 'smart-daily',
    tier: 'flagship',
    color: '#EA580C', // orange-600
    maxTokens: 200000,
    description: 'Latest generation Claude model',
    pricing: { input: 5, output: 25 }
  },
  {
    id: 'claude-opus-4-20250514',
    name: 'claude-opus-4-20250514',
    displayName: 'Claude Opus 4',
    provider: 'anthropic',
    category: 'reasoning',
    tier: 'premium',
    color: '#DC2626', // red-600
    maxTokens: 200000,
    description: 'Most advanced Claude model for complex reasoning',
    pricing: { input: 20, output: 100 }
  }
]

// Set GPT-4o Mini as the default model (good balance of cost and capability)
export const DEFAULT_MODEL_ID = 'gpt-4o-mini'

// Legacy exports for backward compatibility
export const OPENAI_MODELS = ALL_MODELS.filter(model => model.provider === 'openai')
export const CLAUDE_MODELS = ALL_MODELS.filter(model => model.provider === 'anthropic')
export const AI_MODELS = ALL_MODELS

// Model category definitions for smart grouping
export const MODEL_CATEGORIES = {
  budget: {
    name: 'Budget-Friendly',
    icon: '💰',
    description: 'Fast & affordable',
    order: 1
  },
  'smart-daily': {
    name: 'Smart Daily',
    icon: '🧠',
    description: 'Versatile for most tasks',
    order: 2
  },
  reasoning: {
    name: 'Reasoning',
    icon: '🔬',
    description: 'Complex problem solving',
    order: 3
  }
} as const

// Helper function to get models by category and provider
export function getModelsByCategory(provider: 'openai' | 'anthropic') {
  const providerModels = ALL_MODELS.filter(model => model.provider === provider)
  
  const categories = Object.keys(MODEL_CATEGORIES).sort((a, b) => 
    MODEL_CATEGORIES[a].order - MODEL_CATEGORIES[b].order
  )
  
  return categories.map(categoryKey => ({
    category: categoryKey,
    categoryInfo: MODEL_CATEGORIES[categoryKey],
    models: providerModels.filter(model => model.category === categoryKey)
  })).filter(group => group.models.length > 0)
}
// Get the default model
export const getDefaultModel = (): AIModel => {
  return ALL_MODELS.find(model => model.id === DEFAULT_MODEL_ID) || ALL_MODELS[0]
}

// Get recommended model based on task type
export const getRecommendedModel = (taskType: string): AIModel => {
  const recommendations = {
    coding: ALL_MODELS.find(m => m.id === 'gpt-4.1-mini'),
    reasoning: ALL_MODELS.find(m => m.id === 'o3-mini'),
    general: ALL_MODELS.find(m => m.id === 'gpt-4o-mini'),
    budget: ALL_MODELS.find(m => m.id === 'gpt-4.1-nano'),
    premium: ALL_MODELS.find(m => m.id === 'claude-3-5-sonnet-20241022')
  }
  
  return recommendations[taskType] || getDefaultModel()
}

export interface SubscriptionTier {
  name: string
  monthlyTokens: number
  dailyMessages: number
  models: string[]
  warnings: number[]
  price?: string
}

export const SUBSCRIPTION_TIERS: Record<string, SubscriptionTier> = {
  free: {
    name: 'Free',
    monthlyTokens: 35000,
    dailyMessages: 25,
    models: ['gpt-4o-mini', 'claude-3-5-haiku-20241022'],
    warnings: [70, 90]
  },
  basic: {
    name: 'Basic',
    monthlyTokens: 1000000,
    dailyMessages: -1,
    models: ['gpt-4o-mini', 'claude-3-5-haiku-20241022', 'gpt-4o', 'gpt-4.1', 'gpt-4.1-mini', 'claude-3-5-sonnet-20241022'],
    warnings: [50, 80, 95],
    price: '$6/month'
  },
  pro: {
    name: 'Pro',
    monthlyTokens: 1500000,
    dailyMessages: -1,
    models: ALL_MODELS.map(m => m.id), // All models
    warnings: [50, 80, 95],
    price: '$9/month'
  }
}

export interface StreamingState {
  isStreaming: boolean
  currentMessage: string
  messageId: string | null
}

// Enhanced streaming callbacks with token usage
export interface StreamingCallbacks {
  onToken: (token: string) => void
  onComplete: (fullContent: string, usage?: TokenUsage) => void
  onError: (error: string) => void
}

export interface TokenUsage {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
}

// Normalized API response format from Edge Function
export interface NormalizedAPIResponse {
  content: string           // The AI response text
  usage: {
    input_tokens: number
    output_tokens: number
    total_tokens: number
  }
  model: string             // Model that was used
  provider: 'openai' | 'anthropic'
  raw_response?: object     // Original API response
}

// User subscription and usage types
export interface UserTier {
  tier: 'free' | 'basic' | 'pro' | 'super_pro'
  monthly_tokens: number
  daily_messages: number
  allowed_models: string[]
  price?: string
}

export interface UsageStats {
  tokens_used_today: number
  tokens_used_month: number
  messages_sent_today: number
  tier: UserTier
  warnings: number[]
  // Anniversary-based reset information
  daily_reset_time?: string  // ISO timestamp for daily reset
  monthly_reset_time?: string  // ISO timestamp for monthly reset (billing anniversary)
  billing_period_start?: string  // ISO timestamp of billing period start
}

export interface APIError {
  message: string
  type: 'network' | 'api' | 'auth' | 'quota' | 'unknown'
  retryable: boolean
}

// Pricing tier definitions
export const PRICING_TIERS: Record<string, UserTier> = {
  free: {
    tier: 'free',
    monthly_tokens: 35000,
    daily_messages: 25,
    allowed_models: ['gpt-4o-mini', 'claude-3-5-haiku-20241022']
  },
  basic: {
    tier: 'basic',
    monthly_tokens: 1000000,
    daily_messages: -1, // unlimited
    allowed_models: [
      'gpt-4o-mini', 
      'claude-3-5-haiku-20241022', 
      'gpt-4o', 
      'gpt-4.1', 
      'gpt-4.1-mini', 
      'claude-3-5-sonnet-20241022',
      'claude-3-7-sonnet-20250219',
      'claude-sonnet-4-20250514'
    ],
    price: '$6/month'
  },
  pro: {
    tier: 'pro',
    monthly_tokens: 1500000,
    daily_messages: -1, // unlimited
    allowed_models: ALL_MODELS.map(m => m.id),
    price: '$9/month'
  }
}

// Token counting interface for Anthropic
export interface AnthropicTokenCount {
  input_tokens: number
}

// Cost calculation utilities
export function calculateCost(model: AIModel, inputTokens: number, outputTokens: number): number {
  if (!model.pricing) return 0
  
  const inputCost = (inputTokens / 1000000) * model.pricing.input
  const outputCost = (outputTokens / 1000000) * model.pricing.output
  
  return inputCost + outputCost
}

export function estimateTokens(text: string): number {
  // Rough estimation: ~4 characters per token for English text
  return Math.ceil(text.length / 4)
}

// Utility functions for UI
export function getProviderColor(provider: string): string {
  switch (provider) {
    case 'openai': return 'text-blue-600'
    case 'anthropic': return 'text-orange-600'
    default: return 'text-gray-600'
  }
}

export function getProviderBadgeColor(provider: string): string {
  switch (provider) {
    case 'openai': return 'bg-blue-100 text-blue-800'
    case 'anthropic': return 'bg-orange-100 text-orange-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export function getCategoryColor(category: string): string {
  switch (category) {
    case 'reasoning': return 'bg-purple-500'
    case 'coding': return 'bg-green-500'
    case 'general': return 'bg-blue-500'
    case 'simple': return 'bg-gray-500'
    default: return 'bg-gray-500'
  }
}

export function getTierBadgeColor(tier: string): string {
  switch (tier) {
    case 'flagship': return 'bg-indigo-100 text-indigo-800'
    case 'latest': return 'bg-emerald-100 text-emerald-800'
    case 'premium': return 'bg-purple-100 text-purple-800'
    case 'efficient': return 'bg-blue-100 text-blue-800'
    case 'nano': return 'bg-gray-100 text-gray-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export function getProviderIcon(provider: string): string {
  return provider === 'anthropic' ? '🤖' : '🧠'
}