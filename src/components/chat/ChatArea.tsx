// Enhanced chat area component with Chat Models branding and clean header
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
import { useUserProfile } from '../../hooks/useUserProfile'
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
  const { profile, displayName } = useUserProfile()
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
      <div className="text-center max-w-2xl w-full">
        {/* Mobile-optimized heading */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-6 sm:mb-8">
          {profile?.full_name 
            ? `Hi ${displayName.split(' ')[0]}! ` 
            : 'What can I help with?'
          }
        </h1>
        
        {/* Simplified model display */}
        <div className="mb-8 sm:mb-12">
          <div className="flex items-center justify-center space-x-2 sm:space-x-3 mb-3 sm:mb-4 px-2">
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
          <p className="text-gray-600 text-lg sm:text-xl leading-relaxed">
            Hi there! Ready to help with any questions or tasks.
          </p>
        </div>
        
        {/* Minimal current plan display */}
        {usageStats && (
          <div className="text-center text-sm text-gray-500 mb-6">
            <span className="capitalize">{usageStats.tier.tier.replace('_', ' ')} Plan</span>
            <span className="mx-2">•</span>
            <span>{Math.round((usageStats.tokens_used_month / usageStats.tier.monthly_tokens) * 100)}% used</span>
          </div>
        )}
      </div>
    </div>
  )

  const hasMessages = conversation?.messages && conversation.messages.length > 0
  const hasStreamingMessage = streamingState.isStreaming && streamingState.currentMessage.length > 0

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
      {/* Clean header with Chat Models branding - FIXED ALIGNMENT */}
      <div className="relative z-20 flex-shrink-0 pt-safe">
        <div className="flex items-center justify-center py-6 px-4 min-h-[80px]">
          {/* Mobile: Only centered logo, Desktop: Full header */}
          <div className="lg:hidden flex items-center justify-center">
            <Logo size="md" compact={true} />
          </div>
          
          {/* Desktop header */}
          <div className="hidden lg:flex items-center justify-between w-full max-w-6xl">
            <div className="flex items-center">
              <ModelSelector 
                selectedModel={selectedModel}
                onModelChange={onModelChange}
                onUpgradePrompt={onUpgradePrompt}
                compact={true}
              />
            </div>
            
            <div className="flex items-center space-x-4 text-xs text-gray-500 font-medium">
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
          
          {/* Mobile model selector - FIXED: Better aligned with header center */}
          <div className="lg:hidden fixed top-6 right-4 z-30 pt-safe" style={{ paddingRight: 'max(env(safe-area-inset-right), 0.5rem)' }}>
            <ModelSelector 
              selectedModel={selectedModel}
              onModelChange={onModelChange}
              onUpgradePrompt={onUpgradePrompt}
              compact={true}
            />
          </div>
        </div>
      </div>
      
      {/* Notifications without extra spacing */}
      <div className="relative z-30 flex-shrink-0">
        {error && (
          <div className="px-4 pb-2">
            <ErrorBanner
              message={error}
              onDismiss={onClearError || (() => {})}
            />
          </div>
        )}

        {usageStats && (
          <div className="px-4 pb-2">
            <UsageWarningBanner
              usageStats={usageStats}
              onUpgrade={() => onUpgradePrompt?.('basic')}
            />
          </div>
        )}

        {selectedModel && usageStats && !usageStats.tier.allowed_models.includes(selectedModel.id) && (
          <div className="px-4 pb-2">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-400 p-4 rounded-r-xl">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Crown className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-amber-800 mb-1">
                    Premium Model Access Required
                  </h3>
                  <p className="text-sm text-amber-700 mb-3">
                    <strong>{selectedModel.displayName}</strong> requires a higher plan.
                  </p>
                  <button
                    onClick={() => onUpgradePrompt?.(
                      selectedModel.tier === 'premium' ? 'super_pro' : 
                      selectedModel.tier === 'flagship' ? 'pro' : 'basic'
                    )}
                    className="inline-flex items-center bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-medium px-3 py-2 rounded-xl transition-all duration-200 group shadow-lg"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    View Upgrade Options
                    <ArrowRight className="ml-2 h-3 w-3 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer - Desktop only */}
      <div className="hidden lg:block fixed bottom-4 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full px-4 py-2 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">
            powered by <span className="text-purple-600 font-poppins">chat models</span>
          </p>
        </div>
      </div>
      {/* Messages area with proper bottom spacing for sticky input */}
      <div className="flex-1 flex flex-col min-h-0 relative z-10 overflow-hidden">
        {!hasMessages && !hasStreamingMessage ? renderEmptyState() : (
          <div className="flex-1 overflow-y-auto px-4 py-4 pb-32">
            <div className="max-w-4xl mx-auto space-y-6">
              {conversation?.messages?.map((message, index) => (
                <MessageBubble 
                  key={message.id} 
                  message={message} 
                />
              )) || []}
              
              {streamingState.isStreaming && streamingState.currentMessage && (
                <StreamingMessage
                  content={streamingState.currentMessage}
                  model={selectedModel}
                  onCancel={onCancelGeneration}
                  error={error}
                />
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* Sticky message input at bottom */}
        <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-gradient-to-t from-white via-white to-transparent p-4 pt-8 z-50">
          <div className="max-w-4xl mx-auto">
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
    return `Resets in ${hours}h ${minutes}m`
  } else {
    // More than 24 hours - show date
    return `on ${resetDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })}`
  }
}