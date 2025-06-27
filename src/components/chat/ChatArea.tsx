import React, { useEffect, useRef } from 'react'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'
import { StreamingMessage } from './StreamingMessage'
import { ErrorBanner } from './ErrorBanner'
import { ModelSelector } from './ModelSelector'
import { AIModel, StreamingState, getProviderIcon } from '../../types/chat'
import { Sparkles, Crown, ArrowRight, Clock, Zap } from 'lucide-react'
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
    <div className="flex-1 flex items-center justify-center canvas-section lg:px-8">
      <div className="text-center max-w-4xl w-full space-canvas">
        {/* Premium page title */}
        <h1 className="h1 text-center text-3xl lg:text-4xl mb-6">
          What can I help with?
        </h1>
        
        {/* Model info section */}
        <div className="canvas-card mb-6">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <span className="text-2xl">{getProviderIcon(selectedModel.provider)}</span>
            <span className="h2 truncate">
              {selectedModel.displayName}
            </span>
            {isLatest2025Model && (
              <div className="flex items-center space-x-1 bg-purple-100/50 px-3 py-1 rounded-2xl flex-shrink-0">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span className="tiny-text font-medium text-purple-600">2025</span>
              </div>
            )}
          </div>
          <p className="body-text leading-relaxed text-center max-w-2xl mx-auto">
            I'm powered by {selectedModel.provider === 'anthropic' ? 'Anthropic Claude' : 'OpenAI'}, ready to assist you with any questions or tasks. 
            You'll see responses appear in real-time as I generate them.
          </p>
        </div>
        
        {/* Capability cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
          <div className="canvas-card hover:shadow-lg transition-all duration-300 cursor-pointer group">
            <div className="text-center">
              <div className="text-2xl mb-3 group-hover:animate-float">💡</div>
              <h3 className="h2 mb-2">Creative Tasks</h3>
              <p className="tiny-text">Writing, brainstorming, storytelling, and creative problem-solving</p>
            </div>
          </div>
          <div className="canvas-card hover:shadow-lg transition-all duration-300 cursor-pointer group">
            <div className="text-center">
              <div className="text-2xl mb-3 group-hover:animate-float">📊</div>
              <h3 className="h2 mb-2">Analysis & Research</h3>
              <p className="tiny-text">Data analysis, research assistance, and detailed explanations</p>
            </div>
          </div>
          <div className="canvas-card hover:shadow-lg transition-all duration-300 cursor-pointer group">
            <div className="text-center">
              <div className="text-2xl mb-3 group-hover:animate-float">💻</div>
              <h3 className="h2 mb-2">Coding & Tech</h3>
              <p className="tiny-text">Programming help, debugging, code reviews, and technical guidance</p>
            </div>
          </div>
          <div className="canvas-card hover:shadow-lg transition-all duration-300 cursor-pointer group">
            <div className="text-center">
              <div className="text-2xl mb-3 group-hover:animate-float">🎯</div>
              <h3 className="h2 mb-2">Reasoning</h3>
              <p className="tiny-text">Complex problem-solving, logical analysis, and step-by-step thinking</p>
            </div>
          </div>
        </div>
        
        {/* Current plan display */}
        {usageStats && (
          <div className="canvas-card max-w-md mx-auto mb-6 space-section">
            <div className="flex items-center justify-between body-text">
              <div className="flex items-center space-x-3">
                <Zap className="w-4 h-4 text-purple-600" />
                <span className="muted-text">Current Plan:</span>
                <span className="font-semibold text-purple-600 capitalize">
                  {usageStats.tier.tier.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <div className="tiny-text">
                {Math.round((usageStats.tokens_used_month / usageStats.tier.monthly_tokens) * 100)}% used
              </div>
            </div>
            
            <div className="tiny-text border-t border-gray-200/50 pt-3 space-y-2">
              <div className="flex items-center space-x-2">
                <Clock className="w-3 h-3 flex-shrink-0" />
                <span>Monthly limit resets {formatResetTime(usageStats.monthly_reset_time)}</span>
              </div>
              {usageStats.tier.daily_messages > 0 && (
                <div className="flex items-center space-x-2">
                  <Clock className="w-3 h-3 flex-shrink-0" />
                  <span>Daily limit resets {formatResetTime(usageStats.daily_reset_time)}</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Footer tagline */}
        <div className="flex items-center justify-center space-x-2 muted-text">
          <Sparkles className="w-4 h-4 text-purple-500 flex-shrink-0" />
          <span>Real-time streaming • Multi-provider AI • Production ready</span>
        </div>
      </div>
    </div>
  )

  const hasMessages = conversation?.messages && conversation.messages.length > 0
  const hasStreamingMessage = streamingState.isStreaming && streamingState.currentMessage.length > 0

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-surface-50">
      {/* Desktop header */}
      <div className="hidden lg:block border-b border-gray-200/30 bg-white/40 backdrop-blur-md">
        <div className="px-canvas py-canvas">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="h1">
                {hasMessages ? (conversation?.title || 'Conversation') : 'New conversation'}
              </h1>
              <div className="flex items-center space-x-2">
                <span className="tiny-text">Using:</span>
              <ModelSelector 
                selectedModel={selectedModel}
                onModelChange={onModelChange}
                onUpgradePrompt={onUpgradePrompt}
                compact={true}
              />
            </div>
            
            <div className="flex items-center space-x-4 tiny-text">
            {conversation && (
              <span>{conversation.messages?.length || 0} message{(conversation.messages?.length || 0) !== 1 ? 's' : ''}</span>
            )}
            {usageStats && (
                <span className="capitalize">{usageStats.tier.tier.replace('_', ' ')} Plan</span>
            )}
          </div>
        </div>
      </div>
      </div>
      
      {/* Notifications */}
      <div className="relative z-30 flex-shrink-0">
        {/* Error Banner */}
        {error && (
          <div className="px-canvas pt-2">
              <ErrorBanner
                message={error}
                onDismiss={onClearError || (() => {})}
              />
            </div>
        )}

        {/* Usage Warning Banner */}
        {usageStats && (
          <div className="px-canvas pt-2">
              <UsageWarningBanner
                usageStats={usageStats}
                onUpgrade={() => onUpgradePrompt?.('basic')}
              />
            </div>
        )}

        {/* Model Restriction Banner */}
        {selectedModel && usageStats && !usageStats.tier.allowed_models.includes(selectedModel.id) && (
          <div className="px-canvas pt-2">
              <div className="bg-gradient-to-r from-amber-50/50 to-orange-50/50 border-l-4 border-amber-400 p-4 rounded-r-2xl backdrop-blur-sm">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 rounded-2xl bg-amber-100/50 flex items-center justify-center flex-shrink-0">
                    <Crown className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="h2 text-amber-800 mb-2">
                      Premium Model Access Required
                    </h3>
                    <p className="body-text text-amber-700 mb-4">
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
                      className="inline-flex items-center bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white body-text font-medium px-4 py-2 rounded-2xl transition-all duration-200 group shadow-lg hover:shadow-xl"
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      View Upgrade Options
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
          </div>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 flex flex-col min-h-0 relative z-10 overflow-hidden">
        {!hasMessages && !hasStreamingMessage ? renderEmptyState() : (
          <div className="flex-1 overflow-y-auto scrollbar-thin px-canvas py-canvas">
            <div className="max-w-4xl mx-auto space-section">
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

        {/* Message input */}
        <div className="flex-shrink-0 max-w-4xl mx-auto w-full px-canvas pb-canvas">
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