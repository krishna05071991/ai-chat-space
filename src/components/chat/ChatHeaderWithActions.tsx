// Enhanced chat header with conversation management actions
import React, { useState } from 'react'
import { MoreHorizontal, Zap, Edit3, Trash2, Download } from 'lucide-react'
import { Conversation, AIModel } from '../../types/chat'
import { ModelSelector } from './ModelSelector'

interface ChatHeaderWithActionsProps {
  conversation: Conversation | null
  selectedModel: AIModel
  onModelChange: (model: AIModel) => void
  onRenameConversation?: (id: string, newTitle: string) => void
  onDeleteConversation?: (id: string) => void
  onExportConversation?: (id: string) => void
}

export function ChatHeaderWithActions({ 
  conversation, 
  selectedModel, 
  onModelChange,
  onRenameConversation,
  onDeleteConversation,
  onExportConversation
}: ChatHeaderWithActionsProps) {
  const [showActions, setShowActions] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [newTitle, setNewTitle] = useState(conversation?.title || '')

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

  const handleRename = () => {
    if (conversation && newTitle.trim() && onRenameConversation) {
      onRenameConversation(conversation.id, newTitle.trim())
    }
    setIsRenaming(false)
    setShowActions(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleRename()
    } else if (e.key === 'Escape') {
      setIsRenaming(false)
      setNewTitle(conversation?.title || '')
    }
  }

  return (
    <div className="border-b border-gray-200 bg-white/90 backdrop-blur-sm p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          {isRenaming && conversation ? (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleRename}
                className="text-lg font-semibold bg-white border border-purple-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                autoFocus
                maxLength={100}
              />
            </div>
          ) : (
            <h2 className="text-lg font-semibold text-gray-800 truncate">
              {conversation?.title || 'New Conversation'}
            </h2>
          )}
          
          {conversation && !isRenaming && (
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
          
          {conversation && (
            <div className="relative">
              <button 
                onClick={() => setShowActions(!showActions)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MoreHorizontal className="w-5 h-5 text-gray-600" />
              </button>

              {showActions && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowActions(false)}
                  />
                  <div className="absolute top-full right-0 mt-2 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden min-w-[160px]">
                    {onRenameConversation && (
                      <button
                        onClick={() => {
                          setIsRenaming(true)
                          setNewTitle(conversation.title)
                          setShowActions(false)
                        }}
                        className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Rename</span>
                      </button>
                    )}

                    {onExportConversation && (
                      <button
                        onClick={() => {
                          onExportConversation(conversation.id)
                          setShowActions(false)
                        }}
                        className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        <span>Export</span>
                      </button>
                    )}

                    {onDeleteConversation && (
                      <div className="border-t border-gray-100">
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this conversation?')) {
                              onDeleteConversation(conversation.id)
                            }
                            setShowActions(false)
                          }}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}