// Fixed Supabase service with comprehensive debugging for Edge Function integration
import { supabase } from './supabase'
import { Message, AIModel } from '../types/chat'

// Simplified response interface matching Edge Function output
export interface ChatResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
  usage?: {
    total_tokens: number
  }
}

class SupabaseService {
  /**
   * Send message to simplified Edge Function with comprehensive debugging
   * @param messages - Conversation history
   * @param model - Selected AI model
   * @returns AI response content
   */
  async sendMessage(
    messages: Message[],
    model: AIModel,
    signal?: AbortSignal
  ): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      throw new Error('Authentication required. Please sign in.')
    }

    // Debug input parameters
    console.log('🔍 Input validation:', {
      messagesType: typeof messages,
      messagesLength: Array.isArray(messages) ? messages.length : 'not array',
      modelType: typeof model,
      modelId: model?.id,
      modelDisplayName: model?.displayName,
      hasSession: !!session,
      sessionUserId: session.user?.id
    })

    // Validate inputs
    if (!Array.isArray(messages)) {
      throw new Error('Messages must be an array')
    }

    if (messages.length === 0) {
      throw new Error('Messages array cannot be empty')
    }

    if (!model || !model.id) {
      throw new Error('Valid model is required')
    }

    console.log('🚀 Calling Edge Function with validated inputs:', {
      model: model.id,
      messageCount: messages.length,
      lastMessage: messages[messages.length - 1]?.content?.substring(0, 50) + '...'
    })

    try {
      // Create the payload with explicit validation
      const messagePayload = messages.map(msg => {
        if (!msg.role || !msg.content) {
          console.error('❌ Invalid message:', msg)
          throw new Error('All messages must have role and content')
        }
        return {
          role: msg.role,
          content: msg.content
        }
      })

      const payload = {
        model: model.id,
        messages: messagePayload
      }

      // Debug the exact payload being sent
      console.log('📤 Exact payload being sent:', {
        model: payload.model,
        messageCount: payload.messages.length,
        firstMessage: payload.messages[0],
        lastMessage: payload.messages[payload.messages.length - 1],
        payloadString: JSON.stringify(payload).substring(0, 200) + '...'
      })

      // Test JSON serialization
      try {
        const testSerialization = JSON.stringify(payload)
        console.log('✅ Payload serialization test passed:', {
          length: testSerialization.length,
          isValid: testSerialization.length > 0
        })
      } catch (serializationError) {
        console.error('❌ Payload serialization failed:', serializationError)
        throw new Error('Failed to serialize request payload')
      }

      // Call Edge Function with explicit body
      console.log('📡 Invoking Edge Function...')
      const { data, error: invokeError } = await supabase.functions.invoke('chat-completion', {
        body: payload
      })

      console.log('📥 Edge Function response received:', {
        hasData: !!data,
        hasError: !!invokeError,
        dataType: typeof data,
        errorMessage: invokeError?.message
      })

      if (invokeError) {
        console.error('❌ Edge Function invoke error:', {
          message: invokeError.message,
          context: invokeError.context,
          details: invokeError.details
        })
        
        // Handle specific invoke errors
        if (invokeError.message?.includes('Function not found')) {
          throw new Error('Chat service unavailable. Please try again later.')
        }
        
        if (invokeError.message?.includes('Authentication')) {
          throw new Error('Session expired. Please sign in again.')
        }
        
        throw new Error(`Chat service error: ${invokeError.message}`)
      }

      if (!data) {
        console.error('❌ No data received from Edge Function')
        throw new Error('No response from chat service')
      }

      // Debug the response structure
      console.log('🔍 Response structure analysis:', {
        hasError: 'error' in data,
        hasChoices: 'choices' in data,
        choicesLength: data.choices?.length,
        hasUsage: 'usage' in data,
        keys: Object.keys(data)
      })

      // Handle error responses from Edge Function
      if (data.error) {
        console.error('❌ Edge Function returned error:', {
          error: data.error,
          message: data.message,
          details: data.details
        })
        
        // Handle specific error types
        if (data.error === 'AUTHENTICATION_FAILED') {
          throw new Error('Session expired. Please sign in again.')
        }
        
        if (data.error === 'MODEL_NOT_ALLOWED') {
          throw new Error(`${model.displayName} is not available. Please select a different model.`)
        }
        
        if (data.error === 'OPENAI_API_ERROR') {
          throw new Error('AI service temporarily unavailable. Please try again.')
        }

        if (data.error === 'INVALID_REQUEST_BODY') {
          throw new Error('Request format error. Please try again.')
        }

        if (data.error === 'MISSING_REQUIRED_FIELDS') {
          throw new Error('Request validation failed. Please try again.')
        }
        
        throw new Error(data.message || 'Failed to get AI response')
      }

      // Extract AI response content with validation
      if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
        console.error('❌ Invalid choices structure:', data.choices)
        throw new Error('Invalid response structure: missing choices')
      }

      const firstChoice = data.choices[0]
      if (!firstChoice || !firstChoice.message) {
        console.error('❌ Invalid choice structure:', firstChoice)
        throw new Error('Invalid response structure: missing message')
      }

      const aiContent = firstChoice.message.content
      if (!aiContent || typeof aiContent !== 'string') {
        console.error('❌ Invalid message content:', firstChoice.message)
        throw new Error('Invalid response: empty or invalid content')
      }

      console.log('✅ AI response validated and extracted:', {
        contentLength: aiContent.length,
        tokensUsed: data.usage?.total_tokens,
        hasUsageStats: !!data.usage_stats
      })

      return aiContent

    } catch (error) {
      console.error('💥 Error in sendMessage:', {
        errorName: error.constructor.name,
        errorMessage: error.message,
        errorStack: error.stack?.split('\n').slice(0, 3)
      })
      
      // Handle network and other errors
      if (error instanceof Error) {
        if (error.message.includes('fetch') || error.message.includes('NetworkError')) {
          throw new Error('Network error. Please check your connection and try again.')
        }
        if (error.message.includes('abort')) {
          throw new Error('Request was cancelled')
        }
      }
      
      throw error
    }
  }

  /**
   * Test Edge Function with minimal payload
   */
  async testEdgeFunction(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      throw new Error('Authentication required for test')
    }

    console.log('🧪 Testing Edge Function with minimal payload...')

    const testPayload = {
      model: "gpt-3.5-turbo",
      messages: [
        { role: "user", content: "Hello test" }
      ]
    }

    console.log('📤 Test payload:', testPayload)

    try {
      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: testPayload
      })

      console.log('📥 Test response:', { hasData: !!data, hasError: !!error })

      if (error) {
        throw new Error(`Test failed: ${error.message}`)
      }

      if (data?.error) {
        throw new Error(`Edge Function error: ${data.message}`)
      }

      const content = data?.choices?.[0]?.message?.content
      if (!content) {
        throw new Error('Test failed: no content received')
      }

      console.log('✅ Test successful:', content.substring(0, 100))
      return content

    } catch (error) {
      console.error('💥 Test failed:', error)
      throw error
    }
  }
}

export const supabaseService = new SupabaseService()