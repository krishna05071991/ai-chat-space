// Simple streaming message component - CLEAN VERSION
import React, { useEffect, useState } from 'react'
import { Square, AlertCircle, Sparkles } from 'lucide-react'
import { AIModel, getProviderIcon } from '../../types/chat'
import { marked } from 'marked'

// Configure marked for safe rendering
marked.setOptions({
  breaks: true, // Convert line breaks to <br>
  gfm: true, // GitHub Flavored Markdown
  sanitize: false, // We trust AI-generated content
  smartypants: true // Smart quotes and dashes
})

interface StreamingMessageProps {
  content: string
  model: AIModel
  onCancel: () => void
  error?: string | null
}

export function StreamingMessage({ content, model, onCancel, error }: StreamingMessageProps) {
  const [showCursor, setShowCursor] = useState(true)

  // Cursor blinking animation
  useEffect(() => {
    const cursorTimer = setInterval(() => {
      setShowCursor(prev => !prev)
    }, 600)

    return () => clearInterval(cursorTimer)
  }, [])

  const isLatest2025Model = model.id.includes('4.1') || model.id.includes('o3') || model.id.includes('o4')

  return (
    <div className="group">
      <div className="flex items-start space-x-4">
        {/* Avatar */}
        <div className={`
          flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm
          ${error 
            ? 'bg-red-100 border border-red-200' 
            : model.provider === 'anthropic'
              ? 'bg-orange-100 border border-orange-200'
              : 'bg-blue-100 border border-blue-200'
          }
        `}>
          {error ? (
            <AlertCircle className="w-4 h-4 text-red-600" />
          ) : (
            <span className="text-sm">
              {getProviderIcon(model.provider)}
            </span>
          )}
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0">
          {/* Model indicator */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold text-gray-700">
                {model.displayName}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                model.provider === 'anthropic' 
                  ? 'bg-orange-100 text-orange-700' 
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {model.provider === 'anthropic' ? 'Anthropic' : 'OpenAI'}
              </span>
              {isLatest2025Model && (
                <div className="flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-purple-500" />
                  <span className="text-xs text-purple-600 font-medium">2025</span>
                </div>
              )}
            </div>
            
            <button
              onClick={onCancel}
              className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700 transition-all px-3 py-1.5 rounded-md hover:bg-gray-100"
            >
              <Square className="w-3 h-3" />
              <span>Stop</span>
            </button>
          </div>

          {/* Content */}
          <div className="text-gray-800 leading-relaxed">
            {error ? (
              <div className="text-red-800 bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="font-medium">Error</span>
                </div>
                <p className="text-sm">{error}</p>
              </div>
            ) : (
              <div className="relative">
                <div 
                  className="inline"
                  dangerouslySetInnerHTML={{ 
                    __html: marked.parse(content) 
                  }}
                />
                {showCursor && content && (
                  <span className="inline-block w-0.5 h-5 bg-purple-500 ml-1 animate-pulse" />
                )}
                {!content && (
                  <div className="flex items-center space-x-2 text-gray-500">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <span className="text-sm ml-2">Thinking...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}