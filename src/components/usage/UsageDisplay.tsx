// Enhanced usage display component with real-time stats from pricing system
import React from 'react'
import { Zap, TrendingUp, Calendar, MessageSquare } from 'lucide-react'
import { UsageStats } from '../../types/chat'

/**
 * Format anniversary-based reset time for display
 */
function formatResetTime(resetTime?: string): string {
  if (!resetTime) return 'Soon'
  
  const resetDate = new Date(resetTime)
  const now = new Date()
  const diffMs = resetDate.getTime() - now.getTime()
  
  if (diffMs < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diffMs / (60 * 60 * 1000))
    const minutes = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000))
    return `in ${hours}h ${minutes}m`
  } else {
    return `on ${resetDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })}`
  }
}

interface UsageDisplayProps {
  usageStats: UsageStats
  className?: string
}

export function UsageDisplay({ usageStats, className = '' }: UsageDisplayProps) {
  if (!usageStats) return null
  
  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) return (tokens / 1000000).toFixed(1) + 'M'
    if (tokens >= 1000) return (tokens / 1000).toFixed(1) + 'K'
    return tokens.toString()
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-500'
    if (percentage >= 70) return 'text-amber-500'
    return 'text-green-500'
  }

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 70) return 'bg-amber-500'
    return 'bg-green-500'
  }

  const getUsageColorLegacy = () => {
    const percentage = (usageStats.tokens_used_month / usageStats.tier.monthly_tokens) * 100
    if (percentage >= 90) return 'text-red-500'
    if (percentage >= 70) return 'text-amber-500'
    return 'text-purple-500'
  }

  const getProgressBarColorLegacy = () => {
    const percentage = (usageStats.tokens_used_month / usageStats.tier.monthly_tokens) * 100
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 70) return 'bg-amber-500'
    return 'bg-purple-500'
  }

  const monthlyTokenPercentage = (usageStats.tokens_used_month / usageStats.tier.monthly_tokens) * 100
  const dailyMessagePercentage = usageStats.tier.daily_messages > 0 ? 
    (usageStats.messages_sent_today / usageStats.tier.daily_messages) * 100 : 0

  return (
    <div className={`canvas-card ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="h2 flex items-center">
          <TrendingUp className="w-4 h-4 mr-2" />
          Usage Statistics
        </h3>
        <span className={`body-text font-medium ${getUsageColorLegacy()}`}>
          {usageStats.tier.tier.replace('_', ' ').toUpperCase()} Plan
        </span>
      </div>

      {/* Token Usage */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Zap className="w-3 h-3 text-gray-500" />
            <span className="body-text text-[#8A8377]">Monthly Tokens</span>
          </div>
          <span className="body-text font-medium text-[#222427]">
            {formatTokens(usageStats.tokens_used_month)} / {formatTokens(usageStats.tier.monthly_tokens)}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-500 ease-out ${getProgressBarColor(monthlyTokenPercentage)}`}
            style={{ width: `${Math.min(monthlyTokenPercentage, 100)}%` }}
          />
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="tiny-text">
            {Math.round(monthlyTokenPercentage)}% used
          </span>
          <span className="tiny-text">
            Today: {formatTokens(usageStats.tokens_used_today)}
          </span>
        </div>
      </div>

      {/* Daily Messages (if applicable) */}
      {usageStats.tier.daily_messages > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-3 h-3 text-gray-500" />
              <span className="body-text text-[#8A8377]">Daily Messages</span>
            </div>
            <span className="body-text font-medium text-[#222427]">
              {usageStats.messages_sent_today} / {usageStats.tier.daily_messages}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-500 ease-out ${getProgressBarColor(dailyMessagePercentage)}`}
              style={{ width: `${Math.min(dailyMessagePercentage, 100)}%` }}
            />
          </div>
          <div className="mt-1">
            <span className={`tiny-text font-medium ${getUsageColor(dailyMessagePercentage)}`}>
              {Math.round(dailyMessagePercentage)}% of daily limit used
            </span>
          </div>
        </div>
      )}

      {/* Reset Information */}
      <div className="tiny-text space-y-2">
        {/* Monthly Reset Info */}
        <div className="flex items-center space-x-2">
          <Calendar className="w-3 h-3" />
          <span>Monthly limit resets {formatResetTime(usageStats.monthly_reset_time)}</span>
        </div>
        
        {/* Daily Reset Info (for free tier) */}
        {usageStats.tier.daily_messages > 0 && (
          <div className="flex items-center space-x-2">
            <Calendar className="w-3 h-3" />
            <span>Daily limit resets {formatResetTime(usageStats.daily_reset_time)}</span>
          </div>
        )}
        
        {/* Usage Warnings */}
        {usageStats.warnings.length > 0 && (
          <div className="pt-2 border-t border-gray-200/50">
            <span className={`font-medium ${getUsageColorLegacy()}`}>
              ⚠️ {usageStats.warnings[usageStats.warnings.length - 1]}% usage warning
            </span>
          </div>
        )}
      </div>
    </div>
  )
}