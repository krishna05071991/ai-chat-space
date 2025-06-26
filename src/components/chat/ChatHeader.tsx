// Enhanced chat header component with token usage display
import React from 'react'
import { MoreHorizontal, Zap } from 'lucide-react'
import { Conversation, AIModel } from '../../types/chat'
import { ModelSelector } from './ModelSelector'

interface ChatHeaderProps {
  conversation: Conversation | null
  selectedModel: AIModel
  onModelChange: (model: AIModel) => void
}

export function ChatHeader({ conversation, selectedModel, onModelChange }: ChatHeaderProps) {
  const formatTokens = (tokens?: number) => {
    if (!tokens || tokens === 0) return '0 tokens'
    if (tokens < 1000) return `${tokens} tokens`
    return `${(tokens / 1000).toFixed(1)}k tokens`
  }

  const getTotalTokens = () => {
    if (!conversation) return 0
    return conversation.total_tokens || conversation.messages.reduce((total, msg) => {
      return total + (msg.total_tokens || msg.input_tokens || 0) + (msg.output_tokens || 0)
    }, 0)
  }

  return (
    <div className="border-b border-gray-200 bg-white/90 backdrop-blur-sm p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-gray-800 truncate">
            {conversation?.title || 'New Conversation'}
          </h2>
          {conversation && (
            <div className="flex items-center space-x-4 mt-1">
              <p className="text-sm text-gray-500">
                {conversation.messages.length} message{conversation.messages.length !== 1 ? 's' : ''}
              </p>
              
              {getTotalTokens() > 0 && (
                <div className="flex items-center space-x-1 text-sm text-gray-500">
                  <Zap className="w-3 h-3" />
                  <span>{formatTokens(getTotalTokens())} used</span>
                </div>
              )}

              {conversation.model_history && conversation.model_history.length > 1 && (
                <div className="text-sm text-gray-500">
                  {conversation.model_history.length} models used
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <ModelSelector 
            selectedModel={selectedModel}
            onModelChange={onModelChange}
          />
          
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <MoreHorizontal className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  )
}