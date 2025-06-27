// UPDATED: Mobile-first limit exceeded modal with anniversary-based reset times
import React from 'react'
import { X, Zap, MessageSquare, Crown, ArrowRight, Clock, Calendar, Users } from 'lucide-react'

/**
 * UPDATED: Format anniversary-based reset time for user display
 */
function formatResetTime(resetTime: string): string {
  const resetDate = new Date(resetTime)
  const now = new Date()
  const diffMs = resetDate.getTime() - now.getTime()
  
  if (diffMs < 24 * 60 * 60 * 1000) {
    // Less than 24 hours - show relative time
    const hours = Math.floor(diffMs / (60 * 60 * 1000))
    const minutes = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000))
    
    if (hours > 0) {
      return `Resets in ${hours}h ${minutes}m`
    } else if (minutes > 0) {
      return `Resets in ${minutes}m`
    } else {
      return 'Resets very soon'
    }
  } else {
    // More than 24 hours - show anniversary date
    const day = resetDate.getDate()
    const ordinalSuffix = getOrdinalSuffix(day)
    return `Resets on the ${day}${ordinalSuffix} (your billing anniversary)`
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

export interface UsageLimitError {
  error: string
  errorType: 'DAILY_MESSAGE_LIMIT_EXCEEDED' | 'MONTHLY_LIMIT_EXCEEDED' | 'MODEL_NOT_ALLOWED' | 'AUTHENTICATION_FAILED'
  message: string
  usage?: {
    current: number
    limit: number
    percentage?: number
    resetTime?: string  // ISO timestamp of exact reset time
  }
  userTier?: string
  allowedModels?: string[]
}

interface LimitExceededModalProps {
  error: UsageLimitError
  onClose: () => void
  onUpgrade: (tier: string) => void
  onTryTomorrow?: () => void
}

export function LimitExceededModal({ error, onClose, onUpgrade, onTryTomorrow }: LimitExceededModalProps) {
  const getModalConfig = () => {
    const { errorType, userTier = 'free', usage } = error

    switch (errorType) {
      case 'DAILY_MESSAGE_LIMIT_EXCEEDED':
        return {
          icon: <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />,
          title: 'Daily Message Limit Reached',
          description: `You've sent ${usage?.current || 0} messages today (limit: ${usage?.limit || 10}). Upgrade to Basic for unlimited daily messages!`,
          currentPlan: userTier,
          recommendedPlan: 'basic',
          benefits: [
            'Unlimited daily messages',
            '1M tokens per month (28x more)',
            'Access to GPT-4o and advanced models',
            'Multi-device sync',
            'Priority support'
          ],
          price: '$6/month',
          resetInfo: formatResetTime(error.usage?.resetTime || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()),
          showTryTomorrow: true,
          urgency: 'medium'
        }

      case 'MONTHLY_LIMIT_EXCEEDED':
        const percentage = usage?.percentage || Math.round(((usage?.current || 0) / (usage?.limit || 1)) * 100)
        const nextTier = userTier === 'free' ? 'basic' : 'pro'
        const tokenMultiplier = userTier === 'free' ? '28x' : '1.5x'
        
        return {
          icon: <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500" />,
          title: 'Monthly Token Limit Exceeded',
          description: `You've used ${usage?.current?.toLocaleString() || 0} of ${usage?.limit?.toLocaleString() || 0} tokens this month (${percentage}%). Upgrade for ${tokenMultiplier} more tokens!`,
          currentPlan: userTier,
          recommendedPlan: nextTier,
          benefits: nextTier === 'basic' ? [
            '1M tokens per month (28x more)',
            'Unlimited daily messages',
            'GPT-4o and advanced models',
            'Multi-device sync'
          ] : [
            '1.5M tokens per month (1.5x more)',
            'All models including latest AI',
            'Priority access',
            'Premium support'
          ],
          price: nextTier === 'basic' ? '$6/month' : '$9/month',
          resetInfo: formatResetTime(error.usage?.resetTime || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()),
          showTryTomorrow: false,
          urgency: 'high'
        }

      case 'MODEL_NOT_ALLOWED':
        return {
          icon: <Crown className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500" />,
          title: 'Premium Model Access Required',
          description: `This model requires Pro tier. Upgrade to access all AI models!`,
          currentPlan: userTier,
          recommendedPlan: 'pro',
          benefits: [
            'Access to ALL premium models',
            '1.5M tokens per month',
            'Latest AI models (GPT-4.1, o3/o4, Claude 4)',
            'Premium support'
          ],
          price: '$9/month',
          resetInfo: 'Immediate access after upgrade',
          showTryTomorrow: false,
          urgency: 'high'
        }

      default:
        return {
          icon: <X className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />,
          title: 'Access Restricted',
          description: error.message || 'Please upgrade your plan to continue.',
          currentPlan: userTier,
          recommendedPlan: 'basic',
          benefits: ['Unlimited access', 'Premium features'],
          price: '$6/month',
          resetInfo: '',
          showTryTomorrow: false,
          urgency: 'medium'
        }
    }
  }

  const config = getModalConfig()

  const getUrgencyColor = () => {
    switch (config.urgency) {
      case 'high': return 'from-red-500 to-red-600'
      case 'medium': return 'from-amber-500 to-amber-600'
      default: return 'from-blue-500 to-blue-600'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-200 w-full max-w-md mx-4">
        <div className="p-4 sm:p-6">
          {/* Mobile-optimized header */}
          <div className="flex items-start justify-between mb-4 sm:mb-6">
            <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
              {config.icon}
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 leading-tight">
                  {config.title}
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  Current plan: <span className="font-medium capitalize">{config.currentPlan}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
            </button>
          </div>

          {/* Mobile-optimized description */}
          <div className="mb-4 sm:mb-6">
            <p className="text-gray-700 leading-relaxed mb-3 sm:mb-4 text-sm sm:text-base">
              {config.description}
            </p>

            {/* UPDATED: Usage statistics with anniversary-based reset times */}
            {error.usage && (
              <div className="bg-gray-50 rounded-xl p-3 sm:p-4 mb-3 sm:mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Current Usage</span>
                  <span className="font-semibold text-gray-800 text-sm">
                    {error.usage.current?.toLocaleString()} / {error.usage.limit?.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: '100%' }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">
                    {error.usage.percentage || 100}% used
                  </span>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">
                      {error.usage?.resetTime 
                        ? formatResetTime(error.usage.resetTime)
                        : config.resetInfo
                      }
                    </span>
                  </div>
                </div>
                
                {/* UPDATED: Anniversary billing information */}
                {error.errorType === 'MONTHLY_LIMIT_EXCEEDED' && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <Calendar className="w-3 h-3 flex-shrink-0" />
                      <span>Anniversary-based billing cycle</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile-optimized upgrade benefits */}
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
            <h3 className="font-semibold text-purple-800 mb-2 sm:mb-3 flex items-center text-sm sm:text-base">
              <Crown className="w-4 h-4 mr-2 flex-shrink-0" />
              Upgrade to {config.recommendedPlan.charAt(0).toUpperCase() + config.recommendedPlan.slice(1).replace('_', ' ')}
            </h3>
            <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-purple-700">
              {config.benefits.map((benefit, index) => (
                <li key={index} className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2 sm:mr-3 flex-shrink-0" />
                  {benefit}
                </li>
              ))}
            </ul>
            <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-purple-200">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-purple-600">Price:</span>
                <span className="font-semibold text-purple-800 text-sm sm:text-base">{config.price}</span>
              </div>
            </div>
          </div>

          {/* Mobile-optimized action buttons */}
          <div className="space-y-3">
            <button
              onClick={() => onUpgrade(config.recommendedPlan)}
              className={`w-full bg-gradient-to-r ${getUrgencyColor()} hover:shadow-lg text-white font-medium py-2.5 sm:py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center group text-sm sm:text-base`}
            >
              <Crown className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">Upgrade to {config.recommendedPlan.charAt(0).toUpperCase() + config.recommendedPlan.slice(1).replace('_', ' ')} - {config.price}</span>
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform flex-shrink-0" />
            </button>

            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm"
              >
                Maybe Later
              </button>

              {config.showTryTomorrow && onTryTomorrow && (
                <button
                  onClick={onTryTomorrow}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium flex items-center justify-center text-sm"
                >
                  <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                  Try Tomorrow
                </button>
              )}
            </div>
          </div>

          {/* Mobile-optimized additional info */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              All plans include secure data handling and can be cancelled anytime
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}