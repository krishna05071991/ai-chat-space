// UPDATED: Enhanced warning banner with anniversary-based reset times
import React, { useState } from 'react'
import { AlertTriangle, X, Crown, ArrowRight, Clock, Zap, MessageSquare, Calendar } from 'lucide-react'
import { UsageStats } from '../../types/chat'

/**
 * UPDATED: Format anniversary-based reset time for user display
 */
function formatResetTime(resetTime?: string, billingPeriodStart?: string, isMonthly = false): string {
  if (resetTime) {
    const resetDate = new Date(resetTime)
    const now = new Date()
    const diffMs = resetDate.getTime() - now.getTime()
    
    if (diffMs < 24 * 60 * 60 * 1000) {
      // Less than 24 hours - show relative time
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
      // More than 24 hours - show anniversary date
      if (isMonthly && billingPeriodStart) {
        const billingDay = new Date(billingPeriodStart).getDate()
        return `on the ${billingDay}${getOrdinalSuffix(billingDay)} (your billing anniversary)`
      } else {
        return `on ${resetDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        })}`
      }
    }
  }
  
  // Fallback calculation
  if (isMonthly && billingPeriodStart) {
    const billingDay = new Date(billingPeriodStart).getDate()
    return `on the ${billingDay}${getOrdinalSuffix(billingDay)} (billing anniversary)`
  } else {
    return 'at midnight'
  }
}

function getOrdinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) return 'th'
  switch (day % 10) {
    case 1: return 'st'
    case 2: return 'nd' 
    case 3: return 'rd'
    default: return 'th'
  }
}

interface UsageWarningBannerProps {
  usageStats: UsageStats
  onUpgrade: () => void
  onDismiss?: () => void
}

export function UsageWarningBanner({ usageStats, onUpgrade, onDismiss }: UsageWarningBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  // Calculate usage percentages
  const tokenPercentage = Math.round((usageStats.tokens_used_month / usageStats.tier.monthly_tokens) * 100)
  const messagePercentage = usageStats.tier.daily_messages > 0 
    ? Math.round((usageStats.messages_sent_today / usageStats.tier.daily_messages) * 100)
    : 0

  // UPDATED: Determine warning level and configuration with anniversary-based resets
  const getWarningConfig = () => {
    // Daily message limit warnings (for free tier)
    if (usageStats.tier.daily_messages > 0 && usageStats.messages_sent_today >= usageStats.tier.daily_messages - 2) {
      const remaining = usageStats.tier.daily_messages - usageStats.messages_sent_today
      
      if (remaining <= 0) {
        return {
          level: 'critical',
          bgColor: 'bg-red-50 border-red-200',
          textColor: 'text-red-800',
          iconColor: 'text-red-500',
          title: 'Daily Message Limit Reached',
          message: `You've used all ${usageStats.tier.daily_messages} messages today. Upgrade to Basic for unlimited messages!`,
          action: 'Upgrade to Basic - $6/month',
          showUpgrade: true,
          dismissible: false,
          icon: MessageSquare,
          resetInfo: formatResetTime(usageStats.daily_reset_time)
        }
      } else if (remaining === 1) {
        return {
          level: 'warning',
          bgColor: 'bg-amber-50 border-amber-200',
          textColor: 'text-amber-800',
          iconColor: 'text-amber-500',
          title: '1 Message Remaining Today',
          message: `You have ${remaining} message left today. Upgrade to Basic for unlimited messages!`,
          action: 'Upgrade Now',
          showUpgrade: true,
          dismissible: true,
          icon: MessageSquare,
          resetInfo: formatResetTime(usageStats.daily_reset_time)
        }
      } else {
        return {
          level: 'info',
          bgColor: 'bg-blue-50 border-blue-200',
          textColor: 'text-blue-800',
          iconColor: 'text-blue-500',
          title: 'Almost at Daily Limit',
          message: `You have ${remaining} messages remaining today. Consider upgrading for unlimited access.`,
          action: 'View Plans',
          showUpgrade: true,
          dismissible: true,
          icon: MessageSquare,
          resetInfo: formatResetTime(usageStats.daily_reset_time)
        }
      }
    }

    // Monthly token limit warnings with anniversary-based resets
    if (tokenPercentage >= 95) {
      return {
        level: 'critical',
        bgColor: 'bg-red-50 border-red-200',
        textColor: 'text-red-800',
        iconColor: 'text-red-500',
        title: 'Monthly Token Limit Almost Reached',
        message: `You've used ${tokenPercentage}% of your monthly tokens. Upgrade now to avoid interruption!`,
        action: getUpgradeAction(usageStats.tier.tier),
        showUpgrade: true,
        dismissible: false,
        icon: Zap,
        resetInfo: formatResetTime(usageStats.monthly_reset_time, usageStats.billing_period_start, true)
      }
    } else if (tokenPercentage >= 90) {
      return {
        level: 'warning',
        bgColor: 'bg-amber-50 border-amber-200',
        textColor: 'text-amber-800',
        iconColor: 'text-amber-500',
        title: 'High Token Usage Alert',
        message: `You've used ${tokenPercentage}% of your monthly tokens. Consider upgrading for more capacity.`,
        action: getUpgradeAction(usageStats.tier.tier),
        showUpgrade: true,
        dismissible: true,
        icon: Zap,
        resetInfo: formatResetTime(usageStats.monthly_reset_time, usageStats.billing_period_start, true)
      }
    } else if (tokenPercentage >= 70) {
      return {
        level: 'info',
        bgColor: 'bg-yellow-50 border-yellow-200',
        textColor: 'text-yellow-800',
        iconColor: 'text-yellow-500',
        title: 'Token Usage Milestone',
        message: `You've used ${tokenPercentage}% of your monthly tokens. Keep track of your usage to avoid hitting limits.`,
        action: 'View Usage',
        showUpgrade: false,
        dismissible: true,
        icon: Zap,
        resetInfo: formatResetTime(usageStats.monthly_reset_time, usageStats.billing_period_start, true)
      }
    }

    return null
  }

  const getUpgradeAction = (currentTier: string): string => {
    switch (currentTier) {
      case 'free': return 'Upgrade to Basic - $6/month'
      case 'basic': return 'Upgrade to Pro - $9/month'
      default: return 'Upgrade Plan'
    }
  }

  const getNextTierBenefits = (currentTier: string): string[] => {
    switch (currentTier) {
      case 'free':
        return [
          '1M tokens/month (28x more)',
          'Unlimited daily messages',
          'GPT-4o and advanced models'
        ]
      case 'basic':
        return [
          '1.5M tokens/month (1.5x more)',
          'All models including latest AI',
          'Premium support'
        ]
      default:
        return ['All features', 'Maximum capacity']
    }
  }

  const config = getWarningConfig()
  if (!config) return null

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss?.()
  }

  return (
    <div className={`border-l-4 p-4 rounded-r-xl ${config.bgColor} shadow-lg backdrop-blur-sm relative z-40`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <config.icon className={`w-5 h-5 mt-0.5 ${config.iconColor}`} />
          <div className="flex-1">
            <h3 className={`font-semibold ${config.textColor} mb-1`}>
              {config.title}
            </h3>
            <p className={`text-sm ${config.textColor} mb-3`}>
              {config.message}
            </p>

            {/* UPDATED: Usage Progress with anniversary info */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className={config.textColor}>Current Usage</span>
                <span className={`font-medium ${config.textColor}`}>
                  {usageStats.tier.daily_messages > 0 && config.icon === MessageSquare
                    ? `${usageStats.messages_sent_today}/${usageStats.tier.daily_messages} messages`
                    : `${usageStats.tokens_used_month.toLocaleString()}/${usageStats.tier.monthly_tokens.toLocaleString()} tokens`
                  }
                </span>
              </div>
              <div className="w-full bg-white/50 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    config.level === 'critical' ? 'bg-red-500' :
                    config.level === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                  }`}
                  style={{
                    width: `${Math.min(
                      config.icon === MessageSquare ? messagePercentage : tokenPercentage,
                      100
                    )}%`
                  }}
                />
              </div>
            </div>

            {/* UPDATED: Upgrade Benefits */}
            {config.showUpgrade && (
              <div className="mb-3">
                <p className={`text-xs ${config.textColor} mb-2 font-medium`}>
                  Upgrade benefits:
                </p>
                <ul className="space-y-1">
                  {getNextTierBenefits(usageStats.tier.tier).map((benefit, index) => (
                    <li key={index} className={`text-xs ${config.textColor} flex items-center`}>
                      <span className="w-1 h-1 bg-current rounded-full mr-2" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* UPDATED: Anniversary-based Reset Timer */}
            <div className={`text-xs ${config.textColor} flex items-center mb-3`}>
              <div className="flex items-center space-x-1 mr-4">
                <Clock className="w-3 h-3" />
                <span>
                  {config.icon === MessageSquare
                    ? `Daily limit resets ${config.resetInfo}`
                    : `Monthly limit resets ${config.resetInfo}`
                  }
                </span>
              </div>
              {config.icon === Zap && usageStats.billing_period_start && (
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span className="text-xs">
                    Anniversary billing: {new Date(usageStats.billing_period_start).getDate()}{getOrdinalSuffix(new Date(usageStats.billing_period_start).getDate())} of each month
                  </span>
                </div>
              )}
            </div>

            {/* Action Button */}
            {config.showUpgrade && (
              <button
                onClick={onUpgrade}
                className="inline-flex items-center bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all duration-200 group shadow-lg hover:shadow-xl"
              >
                <Crown className="w-4 h-4 mr-2" />
                {config.action}
                <ArrowRight className="ml-2 h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        </div>
        
        {config.dismissible && (
          <button
            onClick={handleDismiss}
            className={`${config.iconColor} hover:opacity-70 transition-opacity p-1 rounded-xl ml-2`}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}