// Enhanced message bubble component with provider indicators and 2025 model support
import React from 'react'
import { User, Bot, Clock, Sparkles } from 'lucide-react'
import { getProviderIcon, getProviderColor } from '../../types/chat'
import { marked } from 'marked'

// Configure marked for safe rendering
marked.setOptions({
  breaks: true, // Convert line breaks to <br>
  gfm: true, // GitHub Flavored Markdown
  sanitize: false, // We trust AI-generated content
  smartypants: true // Smart quotes and dashes
})

interface SimpleMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  model_used?: string | null
  created_at: string
}

interface MessageBubbleProps {
  message: SimpleMessage
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const isErrorMessage = message.content.startsWith('❌')

  const formatTime = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } catch {
      return 'now'
    }
  }

  const getModelDisplayName = (modelId?: string | null) => {
    if (!modelId) return 'AI Assistant'
    
    // Handle Claude models
    if (modelId.includes('claude')) {
      if (modelId.includes('3-5-sonnet')) return 'Claude 3.5 Sonnet'
      if (modelId.includes('3-5-haiku')) return 'Claude 3.5 Haiku'
      if (modelId.includes('3-opus')) return 'Claude 3 Opus'
      return 'Claude'
    }
    
    // Handle OpenAI models
    if (modelId.includes('gpt-4o-mini')) return 'GPT-4o Mini'
    if (modelId.includes('gpt-4o')) return 'GPT-4o'
    if (modelId.includes('gpt-4.1-mini')) return 'GPT-4.1 Mini'
    if (modelId.includes('gpt-4.1-nano')) return 'GPT-4.1 Nano'
    if (modelId.includes('gpt-4.1')) return 'GPT-4.1'
    if (modelId.includes('gpt-3.5')) return 'GPT-3.5 Turbo'
    if (modelId.includes('o3-mini')) return 'OpenAI o3-mini'
    if (modelId.includes('o4-mini')) return 'OpenAI o4-mini'
    if (modelId.includes('o3')) return 'OpenAI o3'
    
    return modelId
  }

  const getProviderFromModel = (modelId?: string | null) => {
    if (!modelId) return 'openai'
    return modelId.includes('claude') ? 'anthropic' : 'openai'
  }

  const provider = getProviderFromModel(message.model_used)

  return (
    <div className="group">
      <div className="flex items-start space-x-4">
        {/* Enhanced Avatar */}
        <div className={`
          flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm
          ${isUser 
            ? 'bg-gradient-to-r from-purple-500 to-purple-600' 
            : isErrorMessage 
              ? 'bg-red-100 border border-red-200'
              : provider === 'anthropic'
                ? 'bg-orange-100 border border-orange-200'
                : 'bg-blue-100 border border-blue-200'
          }
        `}>
          {isUser ? (
            <User className="w-4 h-4 text-white" />
          ) : (
            <span className="text-sm">
              {isErrorMessage ? '❌' : getProviderIcon(provider)}
            </span>
          )}
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0">
          {/* Enhanced Model indicator for assistant messages */}
          {!isUser && !isErrorMessage && message.model_used && (
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm font-semibold text-gray-700">
                {getModelDisplayName(message.model_used)}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                provider === 'anthropic' 
                  ? 'bg-orange-100 text-orange-700' 
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {provider === 'anthropic' ? 'Anthropic' : 'OpenAI'}
              </span>
              {/* Add model tier indicator for new models */}
              {message.model_used && (
                message.model_used.includes('4.1') || 
                message.model_used.includes('o3') || 
                message.model_used.includes('o4')
              ) && (
                <div className="flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-purple-500" />
                  <span className="text-xs text-purple-600 font-medium">2025</span>
                </div>
              )}
            </div>
          )}

          {/* Message content */}
          <div className={`message-content leading-relaxed ${isErrorMessage ? 'text-red-800' : ''}`}
            dangerouslySetInnerHTML={{ 
              __html: marked.parse(message.content) 
            }}
          />

          {/* Enhanced timestamp - only show on hover */}
          <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center space-x-3">
              <span className="tiny-text flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{formatTime(message.created_at)}</span>
              </span>
              {!isUser && message.model_used && (
                <span className="tiny-text">
                  • {provider === 'anthropic' ? 'Claude API' : 'OpenAI API'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}