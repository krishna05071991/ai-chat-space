// Mobile-first model selector with responsive design
import React, { useState } from 'react'
import { ChevronDown, Check, Lock, Crown, Sparkles } from 'lucide-react'
import { AIModel, getModelsByCategory, MODEL_CATEGORIES, PRICING_TIERS } from '../../types/chat'
import { useUsageStats } from '../../hooks/useUsageStats'

interface ModelSelectorProps {
  selectedModel: AIModel
  onModelChange: (model: AIModel) => void
  onUpgradePrompt?: (requiredTier: string) => void
  compact?: boolean
}

export function ModelSelector({ selectedModel, onModelChange, onUpgradePrompt, compact = false }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { usageStats } = useUsageStats()

  const currentTier = usageStats?.tier?.tier || 'free'
  const allowedModels = usageStats?.tier?.allowed_models || PRICING_TIERS.free.allowed_models

  const isModelAllowed = (model: AIModel): boolean => {
    return allowedModels.includes(model.id)
  }

  const getRequiredTier = (model: AIModel): string => {
    // Check which tier includes this model
    for (const [tierName, tierData] of Object.entries(PRICING_TIERS)) {
      if (tierData.allowed_models.includes(model.id)) {
        return tierName
      }
    }
    return 'pro' // Default to highest tier
  }

  const getTierBadge = (model: AIModel) => {
    const requiredTier = getRequiredTier(model)
    
    // Implement tier-based label visibility rules
    const shouldShowLabel = () => {
      if (currentTier === 'pro') {
        // Pro users: No labels shown
        return false
      } else if (currentTier === 'basic') {
        // Basic users: Only show "Pro" labels
        return requiredTier === 'pro'
      } else {
        // Free users: Show "Basic" and "Pro" labels
        return requiredTier === 'basic' || requiredTier === 'pro'
      }
    }
    
    if (!shouldShowLabel()) {
      return null
    }
    
    const tierColors = {
      free: 'bg-gray-100 text-gray-700',
      basic: 'bg-blue-100 text-blue-700',
      pro: 'bg-purple-100 text-purple-700'
    }

    const tierLabels = {
      free: 'Free',
      basic: 'Basic',
      pro: 'Pro'
    }

    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tierColors[requiredTier]}`}>
        {tierLabels[requiredTier]}
      </span>
    )
  }

  const handleModelSelect = (model: AIModel) => {
    if (isModelAllowed(model)) {
      onModelChange(model)
      setIsOpen(false)
    } else {
      const requiredTier = getRequiredTier(model)
      onUpgradePrompt?.(requiredTier)
    }
  }

  const is2025Model = (model: AIModel): boolean => {
    return model.id.includes('4.1') || model.id.includes('o3') || model.id.includes('o4') || 
           model.id.includes('3-7') || model.id.includes('4-20250514')
  }

  const renderCategoryGroup = (categoryKey: string, categoryInfo: any, models: AIModel[], provider: 'openai' | 'anthropic') => {
    if (models.length === 0) return null

    const providerColor = provider === 'openai' ? 'text-blue-600' : 'text-orange-600'
    const providerBg = provider === 'openai' ? 'bg-blue-50' : 'bg-orange-50'

    return (
      <div key={`${provider}-${categoryKey}`} className="mb-2 sm:mb-3 last:mb-0">
        {/* Mobile-optimized category header */}
        <div className={`px-3 py-2 ${providerBg} border-b border-gray-100`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm">{categoryInfo.icon}</span>
              <span className="text-xs font-semibold text-gray-800">{categoryInfo.name}</span>
            </div>
            <span className="text-xs text-gray-500 hidden sm:inline truncate max-w-[100px]">{categoryInfo.description}</span>
          </div>
        </div>

        {/* Mobile-optimized models in category */}
        <div className="space-y-0">
          {models.map((model) => {
            const isSelected = selectedModel.id === model.id
            const isAllowed = isModelAllowed(model)
            
            return (
              <button
                key={model.id}
                onClick={() => handleModelSelect(model)}
                className={`w-full flex items-center justify-between px-3 py-2.5 transition-colors text-left relative ${
                  isSelected 
                    ? provider === 'openai' ? 'bg-blue-50' : 'bg-orange-50'
                    : isAllowed ? 'hover:bg-gray-50' : 'hover:bg-gray-25'
                }`}
                disabled={!isAllowed}
                title={!isAllowed ? `Requires ${getTierBadge(model)} tier or higher` : undefined}
              >
                {/* Mobile-optimized lock indicator */}
                {!isAllowed && (
                  <div className="absolute top-2 right-2 pointer-events-none">
                    <Lock className="w-3 h-3 text-amber-500" />
                  </div>
                )}

                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`font-medium text-sm ${isAllowed ? 'text-gray-800' : 'text-gray-700'} truncate`}>
                      {model.displayName}
                    </span>
                    
                    {/* Mobile-optimized 2025 badge */}
                    {is2025Model(model) && (
                      <div className="flex items-center space-x-1 flex-shrink-0">
                        <Sparkles className="w-3 h-3 text-purple-500" />
                        <span className="text-xs text-purple-600 font-medium hidden sm:inline">2025</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs ${isAllowed ? 'text-gray-500' : 'text-gray-600'} truncate hidden sm:inline`}>
                      {model.description}
                    </span>
                    
                    {/* Mobile-optimized tier badge */}
                    {!isAllowed ? (
                      <div className="flex items-center space-x-1 flex-shrink-0">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700 border border-amber-200">
                          Upgrade Required
                        </span>
                        {getTierBadge(model) && getTierBadge(model)}
                      </div>
                    ) : (
                      getTierBadge(model) && (
                        <div className="flex-shrink-0">
                          {getTierBadge(model)}
                        </div>
                      )
                    )}
                  </div>
                </div>
                
                {isSelected && <Check className={`w-4 h-4 ${providerColor} flex-shrink-0`} />}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center space-x-2 glass border rounded-2xl px-3 py-2 hover:bg-white/80 transition-all duration-200 body-text font-medium min-w-0 max-w-[140px] lg:max-w-none lg:min-w-[160px] ${
            !isModelAllowed(selectedModel) 
              ? 'border-amber-300 hover:border-amber-400 text-amber-700 bg-amber-50/50' 
              : 'border-gray-200 hover:border-gray-300 text-gray-700'
          }`}
        >
          <span className="truncate">{selectedModel.displayName}</span>
          {!isModelAllowed(selectedModel) && <Lock className="w-3 h-3 text-amber-600 animate-pulse flex-shrink-0" />}
          <ChevronDown className={`w-4 h-4 text-[#8A8377] transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-[99998]" 
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute top-full mt-2 left-0 right-0 mx-2 lg:left-0 lg:right-auto lg:mx-0 glass border border-gray-200/50 rounded-2xl shadow-2xl z-[99999] overflow-hidden min-w-[280px] lg:min-w-[320px] max-w-[calc(100vw-1rem)] lg:max-w-none max-h-[60vh] lg:max-h-[500px] overflow-y-auto">
              
              {/* OpenAI models section */}
              <div className="border-b border-gray-200">
                <div className="px-4 py-3 bg-blue-50/30 border-b border-gray-200/50">
                  <span className="body-text font-semibold text-blue-800">OpenAI Models</span>
                </div>
                {getModelsByCategory('openai').map(({ category, categoryInfo, models }) =>
                  renderCategoryGroup(category, categoryInfo, models, 'openai')
                )}
              </div>

              {/* Anthropic models section */}
              <div>
                <div className="px-4 py-3 bg-orange-50/30 border-b border-gray-200/50">
                  <span className="body-text font-semibold text-orange-800">Anthropic Claude</span>
                </div>
                {getModelsByCategory('anthropic').map(({ category, categoryInfo, models }) =>
                  renderCategoryGroup(category, categoryInfo, models, 'anthropic')
                )}
              </div>

              {/* Upgrade prompt */}
              {currentTier === 'free' && (
                <div className="border-t border-gray-200/50 p-4 bg-gradient-to-r from-purple-50/30 to-purple-100/30">
                  <div className="text-center">
                    <Crown className="w-6 h-6 text-purple-600 mx-auto mb-3" />
                    <p className="body-text font-medium text-purple-800 mb-2">
                      Unlock Premium Models
                    </p>
                    <p className="tiny-text text-purple-600 mb-4 hidden lg:block">
                      Upgrade to access GPT-4o, Claude 3.5 Sonnet, and more
                    </p>
                    <button
                      onClick={() => onUpgradePrompt?.('basic')}
                      className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white body-text font-medium py-3 px-4 rounded-2xl hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
                    >
                      View Plans
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    )
  }

  // Full model selector implementation would go here
  // For now, return the compact version as it's the most commonly used
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 sm:space-x-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl px-3 sm:px-4 py-2 sm:py-3 hover:bg-white hover:border-gray-300 transition-all duration-200 group min-w-[240px] sm:min-w-[280px]"
      >
        <div className="text-left flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-800 text-sm truncate">
              {selectedModel.displayName}
            </span>
            {!isModelAllowed(selectedModel) && <Lock className="w-4 h-4 text-amber-500 flex-shrink-0" />}
            {is2025Model(selectedModel) && (
              <div className="flex items-center space-x-1 flex-shrink-0">
                <Sparkles className="w-3 h-3 text-purple-500" />
                <span className="text-xs text-purple-600 font-medium hidden sm:inline">2025</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-xs text-gray-500 truncate">
              {selectedModel.provider === 'anthropic' ? 'Anthropic' : 'OpenAI'} • {MODEL_CATEGORIES[selectedModel.category]?.name || selectedModel.category}
            </span>
            {getTierBadge(selectedModel) && getTierBadge(selectedModel)}
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Full dropdown implementation would be similar to compact version */}
    </div>
  )
}