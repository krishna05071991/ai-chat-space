// Enhanced streaming service with real-time SSE streaming - SIMPLE VERSION
import { supabase } from './supabase'
import { AIModel, Message, StreamingCallbacks, TokenUsage } from '../types/chat'

// Enhanced error types with anniversary-based reset times
export interface UsageLimitError {
  error: string
  errorType: 'DAILY_MESSAGE_LIMIT_EXCEEDED' | 'MONTHLY_LIMIT_EXCEEDED' | 'MODEL_NOT_ALLOWED' | 'AUTHENTICATION_FAILED'
  message: string
  usage?: {
    current: number
    limit: number
    percentage?: number
    resetTime?: string
  }
  userTier?: string
  allowedModels?: string[]
}

class StreamingService {
  private currentController: AbortController | null = null

  /**
   * Send streaming message through Supabase Edge Function with real-time streaming
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

    this.currentController = new AbortController()
    
    if (signal) {
      signal.addEventListener('abort', () => {
        if (this.currentController) {
          this.currentController.abort()
        }
      })
    }

    console.log('🚀 Starting streaming via Edge Function:', {
      model: model.id,
      messageCount: messages.length,
      provider: model.provider
    })

    try {
      const payload = {
        model: model.id,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        stream: true,
        max_tokens: Math.min(model.maxTokens, 4000),
        temperature: 0.7
      }

      // Debug the Edge Function URL
      const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-completion`
      console.log('📡 Edge Function URL:', edgeFunctionUrl)
      console.log('🔑 Session token:', session.access_token?.substring(0, 10) + '...')
      
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
        await this.handleErrorResponse(response, callbacks, model)
        return
      }

      const contentType = response.headers.get('content-type')
      console.log('📥 Response content type:', contentType)
      
      // Handle non-streaming response (fallback)
      if (!contentType?.includes('text/event-stream')) {
        console.error('❌ Expected SSE but got:', contentType)
        const data = await response.json()
        
        if (data.error) {
          this.handleUsageLimitError(data, callbacks, model)
          return
        }
        
        const content = data.choices?.[0]?.message?.content || ''
        const usage = data.usage ? {
          prompt_tokens: data.usage.prompt_tokens || 0,
          completion_tokens: data.usage.completion_tokens || 0,
          total_tokens: data.usage.total_tokens || 0
        } : undefined
        
        callbacks.onComplete(content, usage)
        return
      }

      // Process streaming response
      await this.processStreamingResponse(response, callbacks)

    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('🚫 Streaming request was aborted')
        return
      }
      
      console.error('💥 Streaming service error:', error)
      
      if (error instanceof Error) {
        if (error.message.includes('fetch') || error.message.includes('NetworkError')) {
          callbacks.onError('Network error. Please check your connection and try again.')
        } else if (error.message.includes('Authentication')) {
          callbacks.onError('Authentication expired. Please sign in again.')
        } else {
          callbacks.onError(`Connection error: ${error.message}`)
        }
      } else {
        callbacks.onError('Unexpected error occurred. Please try again.')
      }
    } finally {
      this.currentController = null
    }
  }

  /**
   * Process streaming Server-Sent Events response
   */
  private async processStreamingResponse(response: Response, callbacks: StreamingCallbacks): Promise<void> {
    const reader = response.body?.getReader()
    if (!reader) {
      callbacks.onError('Failed to get response reader')
      return
    }

    const decoder = new TextDecoder()
    let buffer = ''
    let fullContent = ''
    let usage: TokenUsage | undefined

    try {
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.trim() === '') continue

          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            
            if (data === '[DONE]') {
              console.log('✅ Streaming completed')
              callbacks.onComplete(fullContent, usage)
              return
            }

            try {
              const event = JSON.parse(data)
              
              // Handle error in stream
              if (event.error) {
                console.error('❌ Stream error:', event)
                this.handleUsageLimitError(event, callbacks, { displayName: 'AI' } as AIModel)
                return
              }

              // Handle different event types from Edge Function
              switch (event.type) {
                case 'content':
                  if (event.content) {
                    fullContent += event.content
                    callbacks.onToken(event.content)
                  }
                  break

                case 'done':
                  console.log('🏁 Stream completion event')
                  if (event.usage) {
                    usage = {
                      prompt_tokens: event.usage.prompt_tokens || 0,
                      completion_tokens: event.usage.completion_tokens || 0,
                      total_tokens: event.usage.total_tokens || 0
                    }
                  }
                  callbacks.onComplete(event.content || fullContent, usage)
                  return

                case 'error':
                  console.error('❌ Stream error event:', event)
                  this.handleUsageLimitError(event, callbacks, { displayName: 'AI' } as AIModel)
                  return

                default:
                  // Handle OpenAI format streaming (delta content)
                  const delta = event.choices?.[0]?.delta?.content
                  if (delta) {
                    fullContent += delta
                    callbacks.onToken(delta)
                  }

                  // Capture usage from OpenAI format
                  if (event.usage) {
                    usage = {
                      prompt_tokens: event.usage.prompt_tokens || 0,
                      completion_tokens: event.usage.completion_tokens || 0,
                      total_tokens: event.usage.total_tokens || 0
                    }
                  }
                  break
              }
            } catch (parseError) {
              console.warn('⚠️ Failed to parse streaming data:', data.substring(0, 100))
              // Continue processing other lines
            }
          }
        }
      }

      // If we reach here without explicit completion, still complete
      console.log('🏁 Stream ended without explicit completion marker')
      callbacks.onComplete(fullContent, usage)

    } catch (readError) {
      if (readError.name === 'AbortError') {
        console.log('🚫 Stream reading was aborted')
        return
      }
      console.error('❌ Error reading stream:', readError)
      callbacks.onError('Error reading response stream. Please try again.')
    } finally {
      reader.releaseLock()
    }
  }

  /**
   * Handle error response from Edge Function
   */
  private async handleErrorResponse(response: Response, callbacks: StreamingCallbacks, model: AIModel): Promise<void> {
    try {
      const errorData = await response.json()
      this.handleUsageLimitError(errorData, callbacks, model)
    } catch (parseError) {
      // Handle non-JSON error responses
      if (response.status === 401) {
        callbacks.onError('Authentication expired. Please sign in again.')
      } else if (response.status === 429) {
        callbacks.onError('Rate limit exceeded. Please try again in a moment.')
      } else if (response.status === 403) {
        callbacks.onError(`${model.displayName} is not available on your current plan. Please upgrade or select a different model.`)
      } else {
        callbacks.onError(`Request failed: ${response.status} ${response.statusText}`)
      }
    }
  }

  /**
   * Handle specific usage limit errors
   */
  private handleUsageLimitError(errorData: any, callbacks: StreamingCallbacks, model: AIModel): void {
    console.log('⚠️ Usage limit error received:', errorData)

    // Create structured error
    const usageLimitError: UsageLimitError = {
      error: errorData.error || 'Usage limit exceeded',
      errorType: errorData.type || errorData.error || 'UNKNOWN',
      message: errorData.message || 'Unknown error occurred',
      usage: {
        current: errorData.usage?.current || 0,
        limit: errorData.usage?.limit || 0,
        percentage: errorData.usage?.percentage,
        resetTime: errorData.usage?.resetTime
      },
      userTier: errorData.tier,
      allowedModels: errorData.allowedModels
    }

    // Trigger custom event for limit exceeded modal
    window.dispatchEvent(new CustomEvent('usageLimitExceeded', {
      detail: usageLimitError
    }))

    // Also call the regular error callback
    callbacks.onError(this.getErrorMessage(errorData, model))
  }

  /**
   * Get user-friendly error message
   */
  private getErrorMessage(errorData: any, model: AIModel): string {
    switch (errorData.type || errorData.error) {
      case 'DAILY_MESSAGE_LIMIT_EXCEEDED':
        return `Daily message limit reached. Upgrade to Basic for unlimited messages!`
      
      case 'MONTHLY_LIMIT_EXCEEDED':
        return `Monthly token limit exceeded. Upgrade for more tokens!`
      
      case 'MODEL_NOT_ALLOWED':
        return `${model.displayName} requires a higher tier. Please upgrade to access this model.`
      
      case 'AUTHENTICATION_FAILED':
        return 'Authentication expired. Please sign in again.'
      
      default:
        return errorData.message || 'An error occurred. Please try again.'
    }
  }

  /**
   * Check if user can send message (pre-request validation)
   */
  async validateMessageRequest(model: AIModel, messageCount: number): Promise<{ canSend: boolean; warning?: string; error?: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        return { canSend: false, error: 'Authentication required' }
      }

      return { canSend: true }

    } catch (error) {
      return { canSend: false, error: 'Validation failed' }
    }
  }

  /**
   * Cancel current streaming request
   */
  cancelStreaming(): void {
    if (this.currentController) {
      console.log('🚫 Cancelling streaming request')
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

export const streamingService = new StreamingService()