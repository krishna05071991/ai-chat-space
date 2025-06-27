// UPDATED: Enhanced usage display with anniversary-based reset times
import React from 'react'
import { Zap, TrendingUp, Calendar, MessageSquare, Clock } from 'lucide-react'
import { UsageStats } from '../../types/chat'

/**
 * UPDATED: Format anniversary-based reset time for display
 */
function formatResetTime(resetTime?: string): string {
  if (!resetTime) return 'Soon'
  
  const resetDate = new Date(resetTime)
  const now = new Date()
  const diffMs = resetDate.getTime() - now.getTime()
  
  if (diffMs < 24 * 60 * 60 * 1000) {
    // Less than 24 hours - show exact time
    const hours = Math.floor(diffMs / (60 * 60 * 1000))
    const minutes = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000))
    
    if (hours > 0) {
      return `in ${hours}h ${minutes}m`
    } else if (minutes > 0) {
      return `in ${minutes}m`
    } else {
      return 'very soon'
    }
  } else {
    // More than 24 hours - show date
    return `on ${resetDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })}`
  }
}

/**
 * UPDATED: Calculate next reset time based on anniversary billing
 */
function calculateNextResetTime(resetTime?: string, billingPeriodStart?: string, isMonthly = false): string {
  if (resetTime) {
    return formatResetTime(resetTime)
  }
  
  // Fallback calculation
  const now = new Date()
  
  if (isMonthly && billingPeriodStart) {
    const billingStart = new Date(billingPeriodStart)
    const nextReset = new Date(now.getFullYear(), now.getMonth(), billingStart.getDate())
    
    if (nextReset <= now) {
      nextReset.setMonth(nextReset.getMonth() + 1)
    }
    
    return formatResetTime(nextReset.toISOString())
  } else {
    // Daily reset at midnight
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

  const monthlyTokenPercentage = (usageStats.tokens_used_month / usageStats.tier.monthly_tokens) * 100
  const dailyMessagePercentage = usageStats.tier.daily_messages > 0 ? 
    (usageStats.messages_sent_today / usageStats.tier.daily_messages) * 100 : 0

  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow relative z-0 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800 flex items-center">
          <TrendingUp className="w-4 h-4 mr-2" />
          Usage Statistics
        </h3>
        <span className={`text-sm font-medium ${getUsageColor(monthlyTokenPercentage)}`}>
          {usageStats.tier.tier.replace('_', ' ').toUpperCase()} Plan
        </span>
      </div>

      {/* UPDATED: Monthly Token Usage with Anniversary Reset */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Zap className="w-3 h-3 text-gray-500" />
            <span className="text-sm text-gray-600">Monthly Tokens</span>
          </div>
          <span className="text-sm font-medium text-gray-800">
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
          <span className="text-xs text-gray-500">
            {Math.round(monthlyTokenPercentage)}% used
          </span>
          <div className="flex items-center space-x-1">
            <Calendar className="w-3 h-3 text-gray-500" />
            <span className="text-xs text-gray-500">
              Resets {calculateNextResetTime(usageStats.monthly_reset_time, usageStats.billing_period_start, true)}
            </span>
          </div>
        </div>
      </div>

      {/* UPDATED: Daily Messages (if applicable) with Reset Timer */}
      {usageStats.tier.daily_messages > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-3 h-3 text-gray-500" />
              <span className="text-sm text-gray-600">Daily Messages</span>
            </div>
            <span className="text-sm font-medium text-gray-800">
              {usageStats.messages_sent_today} / {usageStats.tier.daily_messages}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-500 ease-out ${getProgressBarColor(dailyMessagePercentage)}`}
              style={{ width: `${Math.min(dailyMessagePercentage, 100)}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className={`text-xs font-medium ${getUsageColor(dailyMessagePercentage)}`}>
              {Math.round(dailyMessagePercentage)}% of daily limit used
            </span>
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3 text-gray-500" />
              <span className="text-xs text-gray-500">
                Resets {calculateNextResetTime(usageStats.daily_reset_time)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* UPDATED: Anniversary-based billing information */}
      <div className="text-xs text-gray-500 space-y-1 pt-2 border-t border-gray-100">
        {/* Billing cycle information */}
        {usageStats.billing_period_start && (
          <div className="flex items-center space-x-1">
            <Calendar className="w-3 h-3" />
            <span>
              Billing anniversary: {new Date(usageStats.billing_period_start).getDate()}{getOrdinalSuffix(new Date(usageStats.billing_period_start).getDate())} of each month
            </span>
          </div>
        )}
        
        {/* Usage warnings */}
        {usageStats.warnings.length > 0 && (
          <div className="pt-1">
            <span className={`font-medium ${getUsageColor(Math.max(...usageStats.warnings))}`}>
              ⚠️ {Math.max(...usageStats.warnings)}% usage warning active
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Helper function to get ordinal suffix (1st, 2nd, 3rd, etc.)
 */
function getOrdinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) {
    return 'th'
  }
  switch (day % 10) {
    case 1: return 'st'
    case 2: return 'nd'
    case 3: return 'rd'
    default: return 'th'
  }
}