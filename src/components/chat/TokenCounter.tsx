// Real-time token counter component for message input
import React, { useState, useEffect } from 'react'
import { Zap, DollarSign, TrendingUp } from 'lucide-react'
import { AIModel, estimateTokens, calculateCost } from '../../types/chat'
import { anthropicService } from '../../lib/anthropicService'

interface TokenCounterProps {
  content: string
  model: AIModel
  className?: string
  showCost?: boolean
}

export function TokenCounter({ content, model, className = '', showCost = true }: TokenCounterProps) {
  const [tokenCount, setTokenCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!content.trim()) {
      setTokenCount(0)
      return
    }

    const countTokens = async () => {
      setLoading(true)
      setError(null)

      try {
        if (model.provider === 'anthropic') {
          // Use Anthropic's token counting API for accurate counts
          const messages = [{ 
            id: 'temp', 
            conversation_id: 'temp',
            role: 'user' as const, 
            content, 
            model_used: null,
            created_at: new Date().toISOString()
          }]
          
          const tokenData = await anthropicService.countTokens(messages, model)
          setTokenCount(tokenData.input_tokens)
        } else {
          // Use estimation for OpenAI models
          const estimated = estimateTokens(content)
          setTokenCount(estimated)
        }
      } catch (err) {
        console.error('Token counting error:', err)
        setError('Failed to count tokens')
        // Fallback to estimation
        setTokenCount(estimateTokens(content))
      } finally {
        setLoading(false)
      }
    }

    // Debounce token counting
    const timer = setTimeout(countTokens, 300)
    return () => clearTimeout(timer)
  }, [content, model])

  const estimatedOutputTokens = Math.ceil(tokenCount * 0.5) // Rough estimate
  const estimatedCost = calculateCost(model, tokenCount, estimatedOutputTokens)

  if (!content.trim()) return null

  return (
    <div className={`bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg px-3 py-2 ${className}`}>
      <div className="flex items-center justify-between text-xs space-x-4">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <Zap className={`w-3 h-3 ${loading ? 'animate-pulse text-yellow-500' : 'text-purple-500'}`} />
            <span className="text-gray-700">
              {loading ? 'Counting...' : `${tokenCount.toLocaleString()} tokens`}
            </span>
            {error && (
              <span className="text-red-500 text-xs">*estimated</span>
            )}
          </div>

          {showCost && estimatedCost > 0 && (
            <div className="flex items-center space-x-1">
              <DollarSign className="w-3 h-3 text-green-500" />
              <span className="text-gray-600">
                ~${estimatedCost.toFixed(4)}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-1 text-gray-500">
          <TrendingUp className="w-3 h-3" />
          <span>{model.provider === 'anthropic' ? 'Claude' : 'GPT'}</span>
        </div>
      </div>

      {model.pricing && (
        <div className="mt-1 text-xs text-gray-500">
          ${model.pricing.input}/${model.pricing.output} per 1M tokens
        </div>
      )}
    </div>
  )
}