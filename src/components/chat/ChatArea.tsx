// Enhanced chat area component with mobile-first responsive design
import React, { useEffect, useRef } from 'react'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'
import { StreamingMessage } from './StreamingMessage'
import { ErrorBanner } from './ErrorBanner'
import { ModelSelector } from './ModelSelector'
import { AIModel, StreamingState, getProviderIcon } from '../../types/chat'
import { Sparkles, MessageSquare, Crown, ArrowRight, Clock } from 'lucide-react'
import { Logo } from '../common/Logo'

import { useUsageStats } from '../../hooks/useUsageStats'
import { UsageWarningBanner } from '../usage/UsageWarningBanner'

interface SimpleConversation {
  id: string
  title: string
  messages: Array<{
    id: string
    role: 'user' | 'assistant'
    content: string
    model_used?: string | null
    created_at: string
  }>
  created_at: string
  updated_at: string
}

interface ChatAreaProps {
  conversation: SimpleConversation | null
  selectedModel: AIModel
  onModelChange: (model: AIModel) => void
  onUpgradePrompt?: (requiredTier: string) => void
  onSendMessage: (content: string) => void
  streamingState: StreamingState
  onCancelGeneration: () => void
  error: string | null
  onClearError?: () => void
  onRenameConversation?: (id: string, newTitle: string) => void
  onDeleteConversation?: (id: string) => void
  onExportConversation?: (id: string) => void
}

export function ChatArea({
  conversation, 
  selectedModel, 
  onModelChange,
  onUpgradePrompt,
  onSendMessage,
  streamingState,
  onCancelGeneration,
  error,
  onClearError,
}: ChatAreaProps) {
  const { usageStats } = useUsageStats()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Enhanced auto-scroll for real-time streaming
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [conversation?.messages, streamingState.currentMessage])

  const isLatest2025Model = selectedModel.id.includes('4.1') || selectedModel.id.includes('o3') || selectedModel.id.includes('o4')

  const renderEmptyState = () => (
    <div className="flex-1 flex items-center justify-center p-4 min-h-0">
      <div className="text-center max-w-full w-full">
        {/* Mobile-optimized heading */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-3 sm:mb-4 px-2">
          What can I help with?
        </h1>
        
        {/* Mobile-optimized model display */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-center space-x-2 sm:space-x-3 mb-2 sm:mb-3 px-2">
            <span className="text-lg sm:text-xl md:text-2xl">{getProviderIcon(selectedModel.provider)}</span>
            <span className="text-base sm:text-lg md:text-xl font-medium text-gray-700 truncate max-w-[200px] sm:max-w-none">
              {selectedModel.displayName}
            </span>
            {isLatest2025Model && (
              <div className="flex items-center space-x-1 bg-purple-100 px-2 py-1 rounded-full flex-shrink-0">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
                <span className="text-xs sm:text-sm font-medium text-purple-600">2025</span>
              </div>
            )}
          </div>
          <p className="text-gray-600 text-sm sm:text-base md:text-lg leading-relaxed px-4 sm:px-2">
            I'm powered by {selectedModel.provider === 'anthropic' ? 'Anthropic Claude' : 'OpenAI'}, ready to assist you with any questions or tasks. 
            You'll see responses appear in real-time as I generate them.
          </p>
        </div>
        
        {/* Mobile-optimized feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8 text-sm px-2">
          <div className="bg-white/70 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200/60 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-medium mb-2">💡 Creative Tasks</h3>
            <p className="text-xs sm:text-sm">Writing, brainstorming, storytelling, and creative problem-solving</p>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200/60 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-medium mb-2">📊 Analysis & Research</h3>
            <p className="text-xs sm:text-sm">Data analysis, research assistance, and detailed explanations</p>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200/60 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-medium mb-2">💻 Coding & Tech</h3>
            <p className="text-xs sm:text-sm">Programming help, debugging, code reviews, and technical guidance</p>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200/60 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-medium mb-2">🎯 Reasoning</h3>
            <p className="text-xs sm:text-sm">Complex problem-solving, logical analysis, and step-by-step thinking</p>
          </div>
        </div>
        
        {/* Mobile-optimized current plan display */}
        {usageStats && (
          <div className="bg-white/70 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-200/60 shadow-sm mb-4 sm:mb-6 space-y-2 sm:space-y-3 mx-2">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">Current Plan:</span>
                <span className="font-medium text-purple-600 capitalize">
                  {usageStats.tier.tier.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <div className="text-gray-500 text-xs sm:text-sm">
                {Math.round((usageStats.tokens_used_month / usageStats.tier.monthly_tokens) * 100)}% used
              </div>
            </div>
            
            {/* Mobile-optimized reset time information */}
            <div className="text-xs text-gray-500 border-t border-gray-200 pt-2 space-y-1">
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">Monthly limit resets {formatResetTime(usageStats.monthly_reset_time)}</span>
              </div>
              {usageStats.tier.daily_messages > 0 && (
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">Daily limit resets {formatResetTime(usageStats.daily_reset_time)}</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Mobile-optimized footer */}
        <div className="flex items-center justify-center space-x-2 text-xs sm:text-sm text-gray-500 px-4">
          <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500 flex-shrink-0" />
          <span className="text-center">Real-time streaming • Multi-provider AI • Production ready</span>
        </div>
      </div>
    </div>
  )

  const hasMessages = conversation?.messages && conversation.messages.length > 0
  const hasStreamingMessage = streamingState.isStreaming && streamingState.currentMessage.length > 0

  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-br from-white via-purple-50/15 to-white overflow-hidden">
      {/* Mobile-optimized header with proper spacing */}
      <div className="relative z-20 flex-shrink-0">
        <div className="flex items-center justify-between py-3 px-3 sm:py-4 sm:px-4 md:px-6 min-h-[56px] sm:min-h-[60px]">
          {/* Mobile-optimized brand section */}
          <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 min-w-0 flex-1">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
              {/* Responsive icon */}
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
                <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />
              </div>
              {/* Hide text on small mobile, show on larger screens */}
              <h1 className="hidden sm:block text-lg md:text-xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent truncate">
                chat.space
              </h1>
            </div>
            
            <div className="w-px h-4 sm:h-6 bg-gray-300 flex-shrink-0"></div>
            
            {/* Mobile-optimized model selector */}
            <div className="flex items-center space-x-1 sm:space-x-2 min-w-0 flex-1">
              <span className="text-xs sm:text-sm text-gray-600 font-medium hidden sm:inline">Using:</span>
              <ModelSelector 
                selectedModel={selectedModel}
                onModelChange={onModelChange}
                onUpgradePrompt={onUpgradePrompt}
                compact={true}
              />
            </div>
          </div>

          {/* Mobile-optimized stats section */}
          <div className="hidden md:flex items-center space-x-4 text-xs text-gray-500 font-medium">
            {conversation && (
              <span>{conversation.messages?.length || 0} message{(conversation.messages?.length || 0) !== 1 ? 's' : ''}</span>
            )}
            {usageStats && (
              <div className="flex items-center space-x-1">
                <span>•</span>
                <span className="capitalize">{usageStats.tier.tier.replace('_', ' ')} Plan</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile-optimized notifications */}
      <div className="relative z-30 flex-shrink-0">
        {/* Error Banner */}
        {error && (
          <div className="px-3 sm:px-4 pt-2">
            <div className="rounded-xl overflow-hidden shadow-lg">
              <ErrorBanner
                message={error}
                onDismiss={onClearError || (() => {})}
              />
            </div>
          </div>
        )}

        {/* Usage Warning Banner */}
        {usageStats && (
          <div className="px-3 sm:px-4 pt-2">
            <div className="rounded-xl overflow-hidden shadow-lg">
              <UsageWarningBanner
                usageStats={usageStats}
                onUpgrade={() => onUpgradePrompt?.('basic')}
              />
            </div>
          </div>
        )}

        {/* Model Restriction Banner */}
        {selectedModel && usageStats && !usageStats.tier.allowed_models.includes(selectedModel.id) && (
          <div className="px-3 sm:px-4 pt-2">
            <div className="rounded-xl overflow-hidden shadow-lg">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-400 p-3 sm:p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-amber-800 mb-1 text-sm sm:text-base">
                      Premium Model Access Required
                    </h3>
                    <p className="text-xs sm:text-sm text-amber-700 mb-2 sm:mb-3">
                      <strong>{selectedModel.displayName}</strong> requires a higher plan. 
                      {selectedModel.tier === 'premium' ? ' Upgrade to Super Pro' : 
                       selectedModel.tier === 'flagship' ? ' Upgrade to Pro' : 
                       ' Upgrade to Basic'} to access this model.
                    </p>
                    <button
                      onClick={() => onUpgradePrompt?.(
                        selectedModel.tier === 'premium' ? 'super_pro' : 
                        selectedModel.tier === 'flagship' ? 'pro' : 'basic'
                      )}
                      className="inline-flex items-center bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs sm:text-sm font-medium px-3 py-2 rounded-lg transition-all duration-200 group shadow-lg"
                    >
                      <Crown className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      View Upgrade Options
                      <ArrowRight className="ml-2 h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile-optimized messages area */}
      <div className="flex-1 flex flex-col min-h-0 relative z-10 overflow-hidden">
        {!hasMessages && !hasStreamingMessage ? renderEmptyState() : (
          <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 sm:py-4">
            <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
              {/* Render all existing messages */}
              {conversation?.messages?.map((message, index) => (
                <MessageBubble 
                  key={message.id} 
                  message={message} 
                />
              )) || []}
              
              {/* Streaming message (if active) */}
              {streamingState.isStreaming && streamingState.currentMessage && (
                <StreamingMessage
                  content={streamingState.currentMessage}
                  model={selectedModel}
                  onCancel={onCancelGeneration}
                  error={error}
                />
              )}
              
              {/* Scroll anchor for auto-scroll */}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* Mobile-optimized message input */}
        <div className="flex-shrink-0 max-w-4xl mx-auto w-full px-3 sm:px-4 pb-3 sm:pb-4">
          <MessageInput 
            onSendMessage={onSendMessage}
            selectedModel={selectedModel}
            disabled={false}
            isStreaming={streamingState.isStreaming}
            usageStats={usageStats}
          />
        </div>
      </div>
    </div>
  )
}

// Helper function to format reset time
function formatResetTime(resetTime?: string): string {
  if (!resetTime) return 'soon'
  
  const resetDate = new Date(resetTime)
  const now = new Date()
  const diffMs = resetDate.getTime() - now.getTime()
  
  if (diffMs < 24 * 60 * 60 * 1000) {
    // Less than 24 hours - show relative time
    const hours = Math.floor(diffMs / (60 * 60 * 1000))
    const minutes = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000))
    return `in ${hours}h ${minutes}m`
  } else {
    // More than 24 hours - show date
    return `on ${resetDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })}`
  }
}