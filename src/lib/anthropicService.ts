// Anthropic Claude API service - Routes through Supabase Edge Functions for security
import { supabase } from './supabase'
import { AIModel, Message, StreamingCallbacks, TokenUsage, AnthropicTokenCount } from '../types/chat'

interface AnthropicMessage {
  role: 'user' | 'assistant'
  content: string
}

class AnthropicService {
  private currentController: AbortController | null = null

  /**
   * Count tokens for a message array using Edge Function proxy
   */
  async countTokens(messages: Message[], model: AIModel): Promise<AnthropicTokenCount> {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      throw new Error('Authentication required for token counting')
    }

    try {
      const anthropicMessages: AnthropicMessage[] = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      const payload = {
        model: model.id,
        messages: anthropicMessages,
        count_tokens: true // Special flag for token counting
      }

      console.log('🔢 Counting tokens via Edge Function:', {
        model: model.id,
        messageCount: messages.length
      })

      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: payload
      })

      if (error) {
        throw new Error(`Token counting failed: ${error.message}`)
      }

      if (data?.error) {
        throw new Error(data.message || 'Token counting failed')
      }

      return {
        input_tokens: data.input_tokens || 0
      }

    } catch (error) {
      console.error('❌ Token counting error:', error)
      
      // Fallback to estimation
      const totalText = messages.map(m => m.content).join(' ')
      const estimatedTokens = Math.ceil(totalText.length / 4)
      
      return {
        input_tokens: estimatedTokens
      }
    }
  }

  /**
   * Send message with streaming response through Edge Function
   */
  async sendStreamingMessage(
    messages: Message[],
    model: AIModel,
    callbacks: StreamingCallbacks,
    signal?: AbortSignal
  ): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      callbacks.onError('Authentication required. Please sign in.')
      return
    }

    // Create abort controller for this request
    this.currentController = new AbortController()
    
    // Listen for external abort signal
    if (signal) {
      signal.addEventListener('abort', () => {
        if (this.currentController) {
          this.currentController.abort()
        }
      })
    }

    console.log('🤖 Starting Anthropic streaming via Edge Function:', {
      model: model.id,
      messageCount: messages.length
    })

    try {
      // Prepare the payload for Edge Function
      const messagePayload = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      const payload = {
        model: model.id,
        messages: messagePayload,
        stream: true, // Enable streaming
        max_tokens: Math.min(model.maxTokens, 4000),
        temperature: 0.7
      }

      console.log('📤 Anthropic payload for Edge Function:', {
        model: payload.model,
        messageCount: payload.messages.length,
        maxTokens: payload.max_tokens,
        isStreaming: payload.stream
      })

      // Use direct fetch for streaming to get better control over the response
      const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-completion`
      
      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: this.currentController.signal,
      })

      if (!response.ok) {
        let errorText = ''
        try {
          errorText = await response.text()
          const errorData = JSON.parse(errorText)
          
          // Handle specific API errors with user-friendly messages
          if (errorData.error === 'MODEL_NOT_ALLOWED') {
            callbacks.onError(`${model.displayName} is not available on your current plan. Please upgrade or select a different model.`)
          } else if (errorData.error === 'MONTHLY_TOKEN_LIMIT_EXCEEDED') {
            callbacks.onError(`Monthly token limit exceeded. Please upgrade your plan or try again next month.`)
          } else if (errorData.error === 'DAILY_MESSAGE_LIMIT_EXCEEDED') {
            callbacks.onError(`Daily message limit reached. Please upgrade to Basic for unlimited messages.`)
          } else if (errorData.error === 'ANTHROPIC_API_NOT_CONFIGURED') {
            callbacks.onError(`Claude models are temporarily unavailable. Please try an OpenAI model.`)
          } else {
            callbacks.onError(errorData.message || `Request failed: ${response.status}`)
          }
        } catch (parseError) {
          // Fallback for non-JSON error responses
          if (response.status === 401) {
            callbacks.onError('Authentication expired. Please sign in again.')
          } else if (response.status === 429) {
            callbacks.onError('Rate limit exceeded. Please try again in a moment.')
          } else if (response.status === 400) {
            callbacks.onError('Invalid request. Please try again.')
          } else {
            callbacks.onError(`Request failed: ${response.status} ${response.statusText}`)
          }
        }
        return
      }

      // Check if response is actually streaming
      const contentType = response.headers.get('content-type')
      console.log('📥 Edge Function response content type:', contentType)

      if (!contentType?.includes('text/event-stream') && !contentType?.includes('text/plain')) {
        // Fall back to regular JSON response
        try {
          const data = await response.json()
          if (data.error) {
            // Handle Edge Function errors
            if (data.error === 'ANTHROPIC_RESPONSE_PARSE_ERROR') {
              callbacks.onError('Claude response format error. Please try again.')
            } else {
              callbacks.onError(data.message || 'Unknown error occurred with Claude')
            }
            return
          }
          
          // CORRECTED: Handle both OpenAI-formatted and direct Anthropic responses
          const content = data.choices?.[0]?.message?.content || ''
          if (!content) {
            callbacks.onError('Empty response from Claude. Please try again.')
            return
          }
          
          const usage = data.usage ? {
            prompt_tokens: data.usage.prompt_tokens || 0,
            completion_tokens: data.usage.completion_tokens || 0,
            total_tokens: data.usage.total_tokens || 0
          } : undefined
          callbacks.onComplete(content, usage)
          return
        } catch (jsonError) {
          callbacks.onError('Failed to parse Claude response. Please try again.')
          return
        }
      }

      // Process streaming response
      const reader = response.body?.getReader()
      if (!reader) {
        callbacks.onError('Failed to get response reader')
        return
      }

      const decoder = new TextDecoder()
      let fullContent = ''
      let buffer = ''
      let usage: TokenUsage | undefined

      try {
        while (true) {
          const { done, value } = await reader.read()
          
          if (done) {
            console.log('🏁 Anthropic streaming completed via Edge Function')
            break
          }

          // Decode the chunk and add to buffer
          buffer += decoder.decode(value, { stream: true })
          
          // Process complete lines from buffer
          const lines = buffer.split('\n')
          buffer = lines.pop() || '' // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.trim() === '') continue

            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim()
              
              if (data === '[DONE]') {
                console.log('✅ Anthropic stream finished with [DONE]')
                callbacks.onComplete(fullContent, usage)
                return
              }

              try {
                const parsed = JSON.parse(data)
                
                // Handle error in stream
                if (parsed.error) {
                  console.error('❌ Anthropic stream error:', parsed)
                  callbacks.onError(parsed.message || 'Claude streaming error. Please try again.')
                  return
                }

                // Extract content delta and usage (Edge Function converts Anthropic format to OpenAI format)
                const delta = parsed.choices?.[0]?.delta?.content
                if (delta) {
                  fullContent += delta
                  callbacks.onToken(delta)
                }

                // Capture final usage stats
                if (parsed.usage) {
                  usage = {
                    prompt_tokens: parsed.usage.prompt_tokens || 0,
                    completion_tokens: parsed.usage.completion_tokens || 0,
                    total_tokens: parsed.usage.total_tokens || 0
                  }
                  console.log('📊 Anthropic usage stats received:', usage)
                }
              } catch (parseError) {
                console.warn('⚠️ Failed to parse Claude streaming data:', data.substring(0, 100))
                // Continue processing other lines
              }
            }
          }
        }

        // If we reach here without [DONE], still complete
        console.log('🏁 Anthropic stream ended without [DONE] marker')
        
        // Estimate usage if not provided
        if (!usage && fullContent.length > 0) {
          const estimatedInputTokens = Math.ceil(payload.messages.reduce((sum, msg) => sum + msg.content.length, 0) / 4)
          const estimatedOutputTokens = Math.ceil(fullContent.length / 4)
          usage = {
            prompt_tokens: estimatedInputTokens,
            completion_tokens: estimatedOutputTokens,
            total_tokens: estimatedInputTokens + estimatedOutputTokens
          }
        }
        
        callbacks.onComplete(fullContent, usage)

      } catch (readError) {
        if (readError.name === 'AbortError') {
          console.log('🚫 Anthropic streaming request was aborted')
          return // Don't call onError for user-initiated cancellation
        }
        console.error('❌ Error reading Claude stream:', readError)
        callbacks.onError('Error reading Claude response. Please try again.')
      } finally {
        reader.releaseLock()
      }

    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('🚫 Anthropic streaming request was aborted')
        return // Don't call onError for user-initiated cancellation
      }
      
      console.error('💥 Anthropic service error:', error)
      
      if (error instanceof Error) {
        if (error.message.includes('fetch') || error.message.includes('NetworkError')) {
          callbacks.onError('Network error connecting to Claude. Please check your connection.')
        } else {
          callbacks.onError(`Claude error: ${error.message}`)
        }
      } else {
        callbacks.onError('Unexpected error with Claude. Please try again.')
      }
    } finally {
      this.currentController = null
    }
  }

  /**
   * Cancel current streaming request
   */
  cancelStreaming(): void {
    if (this.currentController) {
      console.log('🚫 Cancelling Anthropic streaming request')
      this.currentController.abort()
      this.currentController = null
    }
  }

  /**
   * Check if streaming is currently active
   */
  isStreaming(): boolean {
    return this.currentController !== null
  }
}

export const anthropicService = new AnthropicService()