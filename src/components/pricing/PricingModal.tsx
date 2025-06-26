// Mobile-first pricing modal component
import React, { useState } from 'react'
import { X, Check, Crown, Zap, MessageSquare, Users, Clock, FileText } from 'lucide-react'
import { PRICING_TIERS } from '../../types/chat'
import { useUsageStats } from '../../hooks/useUsageStats'

interface PricingModalProps {
  isOpen: boolean
  onClose: () => void
  currentTier?: string
  onSelectPlan: (tier: string) => void
}

export function PricingModal({ isOpen, onClose, currentTier = 'free', onSelectPlan }: PricingModalProps) {
  const { usageStats } = useUsageStats()
  const actualCurrentTier = usageStats?.tier?.tier || currentTier
  const [selectedTier, setSelectedTier] = useState(actualCurrentTier)

  if (!isOpen) return null

  const tiers = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for trying out AI chat',
      features: [
        '35K tokens per month',
        '25 messages per day',
        'Basic models (GPT-4o-mini, Claude Haiku)',
        'Standard support'
      ],
      limitations: [
        'Limited to basic models',
        'Daily message limit',
        'Lower token allowance'
      ],
      popular: false,
      color: 'gray'
    },
    {
      id: 'basic',
      name: 'Basic',
      price: '$6',
      period: 'month',
      description: 'Great for regular AI assistance',
      features: [
        '1M tokens per month',
        'Unlimited messages',
        'Advanced models (GPT-4o, Claude Sonnet)',
        'Priority support'
      ],
      limitations: [],
      popular: true,
      color: 'blue'
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$9',
      period: 'month',
      description: 'Everything you need for advanced AI work',
      features: [
        '1.5M tokens per month',
        'Unlimited messages',
        'All available models',
        'Latest AI models (GPT-4.1, Claude 4)',
        'Premium support'
      ],
      limitations: [],
      popular: false,
      color: 'purple'
    }
  ]

  const getColorClasses = (color: string, isSelected: boolean) => {
    const colors = {
      gray: isSelected ? 'border-gray-400 ring-gray-400' : 'border-gray-200',
      blue: isSelected ? 'border-blue-500 ring-blue-500' : 'border-blue-200',
      purple: isSelected ? 'border-purple-500 ring-purple-500' : 'border-purple-200'
    }
    return colors[color] || colors.gray
  }

  const getUpgradeButtonClasses = (tierId: string) => {
    const gradients = {
      free: 'text-white bg-gradient-to-r from-purple-400 to-purple-500 hover:from-purple-500 hover:to-purple-600 shadow-lg hover:shadow-xl',
      basic: 'text-white bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-lg hover:shadow-xl',
      pro: 'text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg hover:shadow-xl'
    }
    return gradients[tierId] || gradients.basic
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-2xl border border-gray-200 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Choose Your Plan</h2>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">
                Current plan: <span className="font-medium capitalize">{actualCurrentTier}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {tiers.map((tier) => {
              const isSelected = selectedTier === tier.id
              const isCurrent = actualCurrentTier === tier.id
              
              return (
                <div
                  key={tier.id}
                  className={`relative rounded-xl sm:rounded-2xl border-2 p-4 sm:p-6 cursor-pointer transition-all duration-200 hover:shadow-lg flex flex-col h-full ${
                    getColorClasses(tier.color, isSelected)
                  } ${isSelected ? 'ring-2 ring-offset-2' : ''}`}
                  onClick={() => setSelectedTier(tier.id)}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}

                  {isCurrent && (
                    <div className="absolute -top-3 right-3">
                      <span className="bg-green-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                        Current
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-4 sm:mb-6 flex-shrink-0">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">{tier.name}</h3>
                    <div className="mb-2">
                      <span className="text-2xl sm:text-3xl font-bold text-gray-800">{tier.price}</span>
                      {tier.period !== 'forever' && (
                        <span className="text-gray-500 text-sm sm:text-base">/{tier.period}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{tier.description}</p>
                  </div>

                  <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6 flex-1">
                    {tier.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {tier.limitations.length > 0 && (
                    <div className="mb-4 sm:mb-6 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 font-medium mb-2">Limitations:</p>
                      {tier.limitations.map((limitation, index) => (
                        <p key={index} className="text-xs text-gray-500">• {limitation}</p>
                      ))}
                    </div>
                  )}

                  <div className="mt-auto flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectPlan(tier.id)
                      }}
                      disabled={isCurrent}
                      className={`w-full py-2.5 sm:py-3 px-4 rounded-lg sm:rounded-xl font-medium transition-all duration-200 text-sm sm:text-base ${
                        isCurrent 
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                          : getUpgradeButtonClasses(tier.id)
                      }`}
                    >
                      {isCurrent ? 'Current Plan' : tier.id === 'free' ? 'Stay Free' : `Upgrade to ${tier.name}`}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-6 sm:mt-8 text-center text-sm text-gray-600">
            <p>All plans include secure data handling and regular backups.</p>
            <p className="mt-1">Need a custom plan? <span className="text-purple-600 hover:text-purple-700 cursor-pointer">Contact us</span></p>
          </div>
        </div>
      </div>
    </div>
  )
}