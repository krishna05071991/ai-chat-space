// Mobile-first message input component with responsive design
import React, { useState, useRef, useEffect } from 'react'
import { Send, Square, AlertTriangle, Crown } from 'lucide-react'
import { AIModel, UsageStats } from '../../types/chat'

interface MessageInputProps {
  onSendMessage: (content: string) => void
  selectedModel?: AIModel
  disabled?: boolean
  isStreaming?: boolean
  usageStats?: UsageStats | null
}

export function MessageInput({ 
  onSendMessage, 
  selectedModel,
  disabled = false, 
  isStreaming = false,
  usageStats 
}: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [warningShown, setWarningShown] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea with mobile-optimized max height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      const scrollHeight = textareaRef.current.scrollHeight
      // Mobile: max 120px, Desktop: max 160px
      const maxHeight = window.innerWidth < 640 ? 120 : 160
      textareaRef.current.style.height = Math.min(scrollHeight, maxHeight) + 'px'
    }
  }, [message])

  // Reset warning when message changes
  useEffect(() => {
    if (message.trim() === '') {
      setWarningShown(false)
    }
  }, [message])

  // Check usage limits and warnings
  const getUsageWarning = () => {
    if (!usageStats) return null

    // Check daily message limit (free tier)
    if (usageStats.tier.daily_messages > 0) {
      const remaining = usageStats.tier.daily_messages - usageStats.messages_sent_today
      
      if (remaining <= 0) {
        return {
          type: 'critical',
          message: 'Daily message limit reached. Upgrade to Basic for unlimited messages!',
          canSend: false
        }
      } else if (remaining <= 2) {
        return {
          type: 'warning',
          message: `${remaining} message${remaining !== 1 ? 's' : ''} remaining today. Upgrade for unlimited access.`,
          canSend: true
        }
      }
    }

    // Check monthly token limit
    const tokenPercentage = Math.round((usageStats.tokens_used_month / usageStats.tier.monthly_tokens) * 100)
    
    if (tokenPercentage >= 95) {
      return {
        type: 'critical',
        message: 'Monthly token limit almost reached. Upgrade to continue chatting!',
        canSend: false
      }
    } else if (tokenPercentage >= 90) {
      return {
        type: 'warning',
        message: `${tokenPercentage}% of monthly tokens used. Consider upgrading for more capacity.`,
        canSend: true
      }
    }

    return null
  }

  // Check if model is allowed for current tier
  const isModelAllowed = () => {
    if (!usageStats || !selectedModel) return true
    return usageStats.tier.allowed_models.includes(selectedModel.id)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedMessage = message.trim()
    
    if (!trimmedMessage || disabled || isStreaming) {
      return
    }

    const warning = getUsageWarning()
    
    // Show warning for first time if not critical
    if (warning && warning.type === 'warning' && !warningShown) {
      setWarningShown(true)
      return
    }

    // Block if critical or model not allowed
    if (warning && !warning.canSend) {
      return
    }

    if (!isModelAllowed()) {
      return
    }

    onSendMessage(trimmedMessage)
    setMessage('')
    setWarningShown(false)
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const getPlaceholder = () => {
    if (isStreaming) return 'AI is responding...'
    if (disabled) return 'Loading...'
    
    const warning = getUsageWarning()
    if (warning && !warning.canSend) {
      return warning.type === 'critical' && usageStats?.tier.daily_messages 
        ? 'Daily limit reached - upgrade for unlimited messages'
        : 'Monthly limit reached - upgrade to continue'
    }
    
    if (!isModelAllowed() && selectedModel) {
      return `${selectedModel.displayName} requires upgrade`
    }
    
    return 'Message chat.space...'
  }

  const warning = getUsageWarning()
  const modelAllowed = isModelAllowed()
  const canSend = message.trim() && !disabled && !isStreaming && modelAllowed && 
                  (!warning || warning.canSend || warningShown)

  // Determine input state styling
  const getInputStateClasses = () => {
    if (!modelAllowed) {
      return 'border-amber-300 bg-amber-50/50'
    }
    if (warning && !warning.canSend) {
      return 'border-red-300 bg-red-50/50'
    }
    if (warning && warning.type === 'warning' && !warningShown) {
      return 'border-amber-300 bg-amber-50/50'
    }
    return 'border-gray-200 focus-within:border-purple-300'
  }

  return (
    <div className="space-y-4">
      {/* Mobile-optimized usage warning banner */}
      {((warning && warning.type === 'warning' && !warningShown) || !modelAllowed) && (
        <div className="p-4 rounded-2xl bg-amber-50/60 backdrop-blur-sm border border-amber-200/50 shadow-sm">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-amber-800 font-medium">
                {!modelAllowed && selectedModel
                  ? `${selectedModel.displayName} requires a higher plan`
                  : warning?.message
                }
              </p>
              {!modelAllowed && (
                <button className="text-sm text-amber-700 hover:text-amber-800 font-medium mt-2 flex items-center rounded-2xl px-3 py-2 hover:bg-amber-100/50 transition-colors">
                  <Crown className="w-3 h-3 mr-1" />
                  <span>View upgrade options</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile-optimized critical usage warning */}
      {warning && !warning.canSend && (
        <div className="p-4 rounded-2xl bg-red-50/60 backdrop-blur-sm border border-red-200/50 shadow-sm">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-red-800 font-medium mb-2">
                {warning.message}
              </p>
              <button className="inline-flex items-center text-sm bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-2xl hover:from-purple-600 hover:to-purple-700 transition-all font-medium shadow-lg hover:shadow-xl">
                <Crown className="w-3 h-3 mr-1" />
                <span>Upgrade Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile-optimized message input container */}
      <div className={`relative bg-white/70 backdrop-blur-md rounded-3xl shadow-lg hover:shadow-xl transition-all duration-200 focus-within:shadow-xl focus-within:ring-2 focus-within:ring-purple-500/30 border-2 ${getInputStateClasses()}`}>
        <form onSubmit={handleSubmit} className="flex items-end">
          <div className="flex-1 p-4 lg:p-5">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={getPlaceholder()}
              disabled={disabled || (warning && !warning.canSend) || !modelAllowed}
              className="w-full resize-none border-none outline-none text-[#222427] placeholder-[#8A8377] bg-transparent min-h-[24px] max-h-[120px] lg:max-h-[160px] leading-relaxed text-sm lg:text-base disabled:opacity-75 font-light"
              rows={1}
              maxLength={4000}
            />
          </div>

          {/* Send button */}
          <div className="p-4 lg:p-5">
            <button
              type="submit"
              disabled={!canSend && !isStreaming}
              className={`
                w-10 h-10 lg:w-12 lg:h-12 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl
                ${isStreaming 
                  ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white' 
                  : canSend
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white hover:scale-105'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              {isStreaming ? (
                <Square className="w-4 h-4 lg:w-5 lg:h-5" />
              ) : (
                <Send className="w-4 h-4 lg:w-5 lg:h-5" />
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Mobile-optimized footer text with usage info */}
      <div className="text-center mt-4 text-xs text-[#8A8377] px-2">
        <div className="flex flex-col lg:flex-row items-center justify-center space-y-1 lg:space-y-0 lg:space-x-2">
          <span>chat.space can make mistakes</span>
          {usageStats && usageStats.tier.daily_messages > 0 && (
            <span className="flex items-center">
              <span className="hidden lg:inline">•</span>
              <span className="ml-1 lg:ml-2">{usageStats.messages_sent_today}/{usageStats.tier.daily_messages} messages today</span>
            </span>
          )}
          {usageStats && (
            <span className="flex items-center">
              <span className="hidden lg:inline">•</span>
              <span className="ml-1 lg:ml-2">{Math.round((usageStats.tokens_used_month / usageStats.tier.monthly_tokens) * 100)}% monthly usage</span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}