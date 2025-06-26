// Legacy OpenAI utilities - Direct API integration has been moved to Supabase Edge Functions
// This file now only contains utility functions for token estimation

import { Message, AIModel } from '../types/chat'

/**
 * Estimates token count for text input
 * Used for frontend display and initial usage calculations
 * Actual token counting is done server-side in the Edge Function
 */
export function estimateTokens(text: string): number {
  // Rough estimation: ~4 characters per token for English text
  // This is used for UI display only - actual counting happens in Edge Function
  return Math.ceil(text.length / 4)
}

/**
 * @deprecated Use supabaseService.sendMessage() instead
 * Direct OpenAI API integration has been removed for security and usage tracking
 */
export const openaiService = {
  estimateTokens,
  
  // Deprecated methods - kept for backward compatibility but will throw errors
  sendMessage: () => {
    throw new Error('Direct OpenAI integration deprecated. Use supabaseService.sendMessage() instead.')
  },
  
  streamChatCompletion: () => {
    throw new Error('Direct OpenAI streaming deprecated. Use supabaseService.sendMessage() instead.')
  }
}