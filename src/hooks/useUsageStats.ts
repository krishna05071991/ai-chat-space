// Hook for tracking user usage statistics and subscription tier information - OPTIMIZED to prevent excessive calls
import { useState, useEffect, useRef } from 'react'
import { useAuth } from './useAuth'
import { databaseService } from '../lib/databaseService'
import { PRICING_TIERS, UserTier, UsageStats } from '../types/chat'
import { supabase } from '../lib/supabase'

export function useUsageStats() {
  const { user } = useAuth()
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(false)
  const loadStatsTimeoutRef = useRef<NodeJS.Timeout>()
  // OPTIMIZATION: Add flag to prevent multiple initial fetches
  const hasFetchedInitialStatsRef = useRef(false)

  // Get current user tier from database
  const getCurrentTier = async (): Promise<UserTier> => {
    if (!user) {
      return PRICING_TIERS.free
    }

    try {
      const currentUsage = await databaseService.getCurrentUsage()
      if (currentUsage?.subscription_tier?.tier_name) {
        const tierName = currentUsage.subscription_tier.tier_name
        if (PRICING_TIERS[tierName]) {
          return {
            tier: tierName as any,
            monthly_tokens: currentUsage.subscription_tier.monthly_token_limit,
            daily_messages: currentUsage.subscription_tier.daily_message_limit,
            allowed_models: PRICING_TIERS[tierName].allowed_models
          }
        }
      }
    } catch (error) {
      console.error('Failed to get user tier:', error)
      return PRICING_TIERS.free
    }
  }

  const fetchUsageStats = async () => {
    // OPTIMIZATION: Guard against redundant calls
    if (!user || isLoadingStats) {
      setUsageStats(null)
      return
    }

    // Debounce rapid calls
    if (loadStatsTimeoutRef.current) {
      clearTimeout(loadStatsTimeoutRef.current)
    }

    loadStatsTimeoutRef.current = setTimeout(async () => {
      setLoading(true)
      setIsLoadingStats(true)
      
      try {
        // Get user tier from database first
        const tier = await getCurrentTier()
        console.log('📊 Using tier for usage calculation:', tier)

        // Get current usage with billing information
        const currentUsage = await databaseService.getCurrentUsage()
        let usage: any
        
        if (currentUsage) {
          // Use enhanced usage data with billing information
          usage = {
            tokensUsedToday: currentUsage.daily_messages_sent * 100, // Estimate tokens from messages
            tokensUsedMonth: currentUsage.monthly_tokens_used,
            messagesUsedToday: currentUsage.daily_messages_sent
          }
        } else {
          // Fallback to basic usage calculation
          usage = await databaseService.getUserUsageStats()
        }
        
        // Determine warning levels based on usage
        const monthlyPercentage = (usage.tokensUsedMonth / tier.monthly_tokens) * 100
        let warnings: number[] = []
        
        if (tier.tier === 'free') {
          warnings = [70, 90] // Free tier warnings
          if (monthlyPercentage >= 90) warnings = [90]
          else if (monthlyPercentage >= 70) warnings = [70]
          else warnings = []
        } else {
          warnings = [50, 80, 95] // Paid tier warnings
          if (monthlyPercentage >= 95) warnings = [95]
          else if (monthlyPercentage >= 80) warnings = [80]
          else if (monthlyPercentage >= 50) warnings = [50]
          else warnings = []
        }

        console.log('📈 Final usage stats:', {
          tier: tier.tier,
          monthlyTokens: tier.monthly_tokens,
          dailyMessages: tier.daily_messages,
          tokensUsed: usage.tokensUsedMonth,
          percentage: Math.round(monthlyPercentage)
        })

        setUsageStats({
          tokens_used_today: usage.tokensUsedToday,
          tokens_used_month: usage.tokensUsedMonth,
          messages_sent_today: usage.messagesUsedToday,
          tier,
          warnings,
          // Add anniversary-based reset information
          daily_reset_time: currentUsage?.last_daily_reset,
          monthly_reset_time: currentUsage?.last_monthly_reset,
          billing_period_start: currentUsage?.billing_period_start
        })

        // OPTIMIZATION: Set flag after successful fetch
        hasFetchedInitialStatsRef.current = true
        setLastUpdated(new Date())

      } catch (error) {
        console.error('❌ Error fetching usage stats:', error)
        // Set default stats on error
        const tier = await getCurrentTier()
        setUsageStats({
          tokens_used_today: 0,
          tokens_used_month: 0,
          messages_sent_today: 0,
          tier,
          warnings: []
        })
        setLastUpdated(new Date())
      } finally {
        setLoading(false)
        setIsLoadingStats(false)
      }
    }, 500) // 500ms debounce
  }

  // OPTIMIZATION: Fetch stats when user changes or on mount, but prevent redundant calls
  useEffect(() => {
    if (user && !hasFetchedInitialStatsRef.current) {
      fetchUsageStats()
    }
    
    // Reset flag when user changes (sign out/sign in)
    if (!user && hasFetchedInitialStatsRef.current) {
      hasFetchedInitialStatsRef.current = false
      setUsageStats(null)
    }
  }, [user])

  // Refresh stats periodically (every 5 minutes)
  useEffect(() => {
    if (!user) return

    // Listen for manual refresh events
    const handleRefresh = () => {
      fetchUsageStats()
    }
    
    window.addEventListener('refreshUsageStats', handleRefresh)

    const interval = setInterval(() => {
      fetchUsageStats()
    }, 5 * 60 * 1000) // 5 minutes

    return () => {
      clearInterval(interval)
      window.removeEventListener('refreshUsageStats', handleRefresh)
      if (loadStatsTimeoutRef.current) {
        clearTimeout(loadStatsTimeoutRef.current)
      }
    }
  }, [user])

  return {
    usageStats,
    loading,
    lastUpdated,
    refreshUsageStats: fetchUsageStats,
    isNearLimit: (threshold: number = 80) => {
      if (!usageStats) return false
      return (usageStats.tokens_used_month / usageStats.tier.monthly_tokens) * 100 >= threshold
    },
    isAtDailyLimit: () => {
      if (!usageStats) return false
      return usageStats.tier.daily_messages > 0 && usageStats.messages_sent_today >= usageStats.tier.daily_messages
    },
    getUsagePercentage: () => {
      if (!usageStats) return 0
      return Math.round((usageStats.tokens_used_month / usageStats.tier.monthly_tokens) * 100)
    }
  }
}