// NEW: Full-page Pricing Plans component
import React, { useState } from 'react'
import { ArrowLeft, CreditCard, Check, Crown, Zap, MessageSquare } from 'lucide-react'
import { Logo } from '../common/Logo'
import { useUsageStats } from '../../hooks/useUsageStats'

interface PricingPlansPageProps {
  onBack: () => void
  onSelectPlan: (tier: string) => void
}

export function PricingPlansPage({ onBack, onSelectPlan }: PricingPlansPageProps) {
  const { usageStats } = useUsageStats()
  const currentTier = usageStats?.tier?.tier || 'free'
  const [selectedTier, setSelectedTier] = useState(currentTier)

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
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
      {/* Clean page header */}
      <div className="relative z-20 flex-shrink-0 border-b border-gray-200">
        <div className="flex items-center justify-between py-6 px-4 lg:px-6">
          {/* Back button */}
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Chat</span>
          </button>

          {/* Page title */}
          <div className="flex items-center space-x-3">
            <CreditCard className="w-5 h-5 text-purple-600" />
            <h1 className="text-xl font-semibold text-gray-800">Pricing Plans</h1>
          </div>

          {/* Logo for desktop */}
          <div className="hidden lg:block">
            <Logo size="md" compact />
          </div>
        </div>
      </div>

      {/* Page content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-4 lg:p-8">
          {/* Header section */}
          <div className="text-center mb-8 lg:mb-12">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-4">
              Choose Your Plan
            </h2>
            <p className="text-gray-600 text-lg mb-4">
              Unlock the full power of AI with our flexible pricing
            </p>
            {currentTier && (
              <div className="inline-flex items-center space-x-2 bg-purple-50 border border-purple-200 rounded-full px-4 py-2">
                <span className="text-sm text-purple-700">Current plan:</span>
                <span className="font-semibold text-purple-800 capitalize">{currentTier}</span>
              </div>
            )}
          </div>

          {/* Pricing grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {tiers.map((tier) => {
              const isSelected = selectedTier === tier.id
              const isCurrent = currentTier === tier.id
              
              return (
                <div
                  key={tier.id}
                  className={`relative rounded-xl border-2 p-6 lg:p-8 cursor-pointer transition-all duration-200 hover:shadow-lg flex flex-col h-full ${
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

                  <div className="text-center mb-6 flex-shrink-0">
                    <h3 className="text-xl lg:text-2xl font-bold text-gray-800 mb-2">{tier.name}</h3>
                    <div className="mb-3">
                      <span className="text-3xl lg:text-4xl font-bold text-gray-800">{tier.price}</span>
                      {tier.period !== 'forever' && (
                        <span className="text-gray-500 text-lg">/{tier.period}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{tier.description}</p>
                  </div>

                  <div className="space-y-3 mb-6 flex-1">
                    {tier.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {tier.limitations.length > 0 && (
                    <div className="mb-6 p-3 bg-gray-50 rounded-xl">
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
                      className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 text-sm lg:text-base ${
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

          {/* Footer info */}
          <div className="mt-12 text-center">
            <div className="max-w-2xl mx-auto">
              <p className="text-gray-600 text-sm mb-4">
                All plans include secure data handling, conversation history, and can be cancelled anytime.
              </p>
              <div className="flex items-center justify-center space-x-6 text-xs text-gray-500">
                <span className="flex items-center space-x-1">
                  <Zap className="w-3 h-3" />
                  <span>Token-based pricing</span>
                </span>
                <span className="flex items-center space-x-1">
                  <MessageSquare className="w-3 h-3" />
                  <span>Multi-model access</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Crown className="w-3 h-3" />
                  <span>Premium support</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}