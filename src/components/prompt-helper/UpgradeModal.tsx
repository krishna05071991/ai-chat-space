// Upgrade modal for non-Pro users trying to access Prompt Helper Mode
import React from 'react'
import { X, Crown, ArrowRight, Sparkles, Zap, Target, Brain } from 'lucide-react'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  onUpgrade: () => void
}

export function UpgradeModal({ isOpen, onClose, onUpgrade }: UpgradeModalProps) {
  if (!isOpen) return null

  const features = [
    {
      icon: <Sparkles className="w-5 h-5" />,
      title: 'Smart Prompt Engineering',
      description: 'Automatically optimize prompts for maximum AI performance'
    },
    {
      icon: <Target className="w-5 h-5" />,
      title: 'Task-Specific Optimization',
      description: 'Choose from Creative, Coding, Analysis, or General tasks'
    },
    {
      icon: <Brain className="w-5 h-5" />,
      title: 'Intelligent Model Selection',
      description: 'Auto-select the best AI model for each task type'
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: 'Few-Shot Learning',
      description: 'Include your examples to match your exact style'
    }
  ]

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative p-6 pb-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
          
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Smart Prompt Mode
            </h2>
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-100 to-indigo-100 border border-purple-200 rounded-full px-4 py-2">
              <Crown className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">Pro Feature</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          <div className="text-center mb-8">
            <p className="text-gray-600 text-lg leading-relaxed">
              Unlock advanced prompt engineering with intelligent optimization, 
              task-specific models, and style learning capabilities.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid gap-4 mb-8">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center text-white flex-shrink-0">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Highlight */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6 mb-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Upgrade to Pro
              </h3>
              <div className="flex items-center justify-center space-x-2 mb-4">
                <span className="text-3xl font-bold text-purple-600">$9</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="text-sm text-gray-600 space-y-1 max-w-md mx-auto">
                <li>✓ 1.5M tokens per month</li>
                <li>✓ All AI models including latest</li>
                <li>✓ Smart Prompt Mode</li>
                <li>✓ Premium support</li>
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Maybe Later
            </button>
            <button
              onClick={() => {
                onUpgrade()
                onClose()
              }}
              className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium px-6 py-3 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
            >
              <Crown className="w-4 h-4" />
              <span>Upgrade to Pro</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            Cancel anytime. All plans include secure data handling.
          </p>
        </div>
      </div>
    </div>
  )
}