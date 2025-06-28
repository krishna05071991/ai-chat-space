// REDESIGNED: Ultra-clean and minimal usage display component
import React from 'react'
import { UsageStats } from '../../types/chat'

/**
 * Format reset time helper function
 */
function formatResetTime(resetTime?: string): string {
  if (!resetTime) return 'Soon'
  
  const resetDate = new Date(resetTime)
  const now = new Date()
  const diffMs = resetDate.getTime() - now.getTime()
  
  if (diffMs < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diffMs / (60 * 60 * 1000))
    const minutes = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000))
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else if (minutes > 0) {
      return `${minutes}m`
    } else {
      return 'Soon'
    }
  } else {
    return resetDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }
}

/**
 * Calculate next reset time based on anniversary billing
 */
function calculateNextResetTime(resetTime?: string, billingPeriodStart?: string, isMonthly = false): string {
  if (resetTime) {
    return formatResetTime(resetTime)
  }
  
  const now = new Date()
  
  if (isMonthly && billingPeriodStart) {
    const billingStart = new Date(billingPeriodStart)
    const nextReset = new Date(now.getFullYear(), now.getMonth(), billingStart.getDate())
    
    if (nextReset <= now) {
      nextReset.setMonth(nextReset.getMonth() + 1)
    }
    
    return formatResetTime(nextReset.toISOString())
  } else {
    const nextDay = new Date(now)
    nextDay.setDate(nextDay.getDate() + 1)
    nextDay.setHours(0, 0, 0, 0)
    return formatResetTime(nextDay.toISOString())
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

  const getTierLabel = (tier: string) => {
    return tier.replace('_', ' ').toUpperCase()
  }

  const monthlyTokenPercentage = (usageStats.tokens_used_month / usageStats.tier.monthly_tokens) * 100
  const dailyMessagePercentage = usageStats.tier.daily_messages > 0 ? 
    (usageStats.messages_sent_today / usageStats.tier.daily_messages) * 100 : 0

  return (
    <div className={`bg-white/40 backdrop-blur-sm rounded-xl border border-gray-200/30 p-4 ${className}`}>
      {/* CLEAN: Simple header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-800">Usage Stats</h3>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          usageStats.tier.tier === 'pro' 
            ? 'bg-purple-100 text-purple-700'
            : usageStats.tier.tier === 'basic'
            ? 'bg-blue-100 text-blue-700'
            : 'bg-gray-100 text-gray-700'
        }`}>
          {getTierLabel(usageStats.tier.tier)}
        </span>
      </div>

      {/* CLEAN: Monthly tokens - no icons, simple layout */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-600">Monthly Tokens</span>
          <span className="text-xs font-medium text-gray-800">
            {formatTokens(usageStats.tokens_used_month)} / {formatTokens(usageStats.tier.monthly_tokens)}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-1.5 rounded-full transition-all duration-500 ease-out ${getProgressBarColor(monthlyTokenPercentage)}`}
            style={{ width: `${Math.min(monthlyTokenPercentage, 100)}%` }}
          />
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-gray-500">
            {Math.round(monthlyTokenPercentage)}% used
          </span>
          <span className="text-xs text-gray-500">
            Resets {calculateNextResetTime(usageStats.monthly_reset_time, usageStats.billing_period_start, true)}
          </span>
        </div>
      </div>

      {/* CLEAN: Daily messages (if applicable) - simplified */}
      {usageStats.tier.daily_messages > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">Daily Messages</span>
            <span className="text-xs font-medium text-gray-800">
              {usageStats.messages_sent_today} / {usageStats.tier.daily_messages}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ease-out ${getProgressBarColor(dailyMessagePercentage)}`}
              style={{ width: `${Math.min(dailyMessagePercentage, 100)}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-gray-500">
              {Math.round(dailyMessagePercentage)}% used
            </span>
            <span className="text-xs text-gray-500">
              Resets {calculateNextResetTime(usageStats.daily_reset_time)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}