// UPDATED: Hook for tracking user usage statistics - Enhanced for backend-driven tracking
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
  const hasFetchedInitialStatsRef = useRef(false)

  // UPDATED: Get current user tier from database (matches Edge Function logic)
  const getCurrentTier = async (): Promise<UserTier> => {
    if (!user) {
      return PRICING_TIERS.free
    }

    try {
      console.log('📊 Fetching user tier from database...')
      
      // Get user data with subscription tier (same query as Edge Function)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          *,
          subscription_tiers (
            tier_name,
            monthly_token_limit,
            daily_message_limit,
            allowed_models
          )
        `)
        .eq('id', user.id)
        .maybeSingle()

      if (userError) {
        console.error('❌ Error loading user tier:', userError)
        return PRICING_TIERS.free
      }

      // Determine tier (same logic as Edge Function)
      let tierName = 'free'
      if (userData?.subscription_tiers?.tier_name && PRICING_TIERS[userData.subscription_tiers.tier_name]) {
        tierName = userData.subscription_tiers.tier_name
      }

      console.log('✅ User tier determined:', {
        tierName,
        monthlyLimit: PRICING_TIERS[tierName].monthly_tokens,
        dailyLimit: PRICING_TIERS[tierName].daily_messages,
        allowedModels: PRICING_TIERS[tierName].allowed_models.length
      })

      return {
        tier: tierName as any,
        monthly_tokens: PRICING_TIERS[tierName].monthly_tokens,
        daily_messages: PRICING_TIERS[tierName].daily_messages,
        allowed_models: PRICING_TIERS[tierName].allowed_models
      }
      
    } catch (error) {
      console.error('❌ Failed to get user tier:', error)
      return PRICING_TIERS.free
    }
  }

  const fetchUsageStats = async () => {
    if (!user || isLoadingStats) {
      setUsageStats(null)
      return
    }

    if (loadStatsTimeoutRef.current) {
      clearTimeout(loadStatsTimeoutRef.current)
    }

    loadStatsTimeoutRef.current = setTimeout(async () => {
      setLoading(true)
      setIsLoadingStats(true)
      
      try {
        console.log('📊 Fetching usage stats for frontend display...')

        // Get user tier from database
        const tier = await getCurrentTier()

        // UPDATED: Get current usage with anniversary-based billing information
        const currentUsage = await databaseService.getCurrentUsage()
        
        let tokensUsedMonth = 0
        let messagesUsedToday = 0
        let dailyResetTime: string | undefined
        let monthlyResetTime: string | undefined
        let billingPeriodStart: string | undefined

        if (currentUsage) {
          // Use backend-tracked usage data
          tokensUsedMonth = currentUsage.monthly_tokens_used
          messagesUsedToday = currentUsage.daily_messages_sent
          dailyResetTime = currentUsage.last_daily_reset
          monthlyResetTime = currentUsage.last_monthly_reset
          billingPeriodStart = currentUsage.billing_period_start

          console.log('✅ Got usage data from backend:', {
            tokensUsedMonth,
            messagesUsedToday,
            dailyResetTime,
            monthlyResetTime,
            billingPeriodStart
          })
        } else {
          // Fallback to calculated usage
          console.log('⚠️ No backend usage data, using fallback calculation')
          const fallbackUsage = await databaseService.getUserUsageStats()
          tokensUsedMonth = fallbackUsage.tokensUsedMonth
          messagesUsedToday = fallbackUsage.messagesUsedToday
        }
        
        // Calculate warning levels based on usage
        const monthlyPercentage = (tokensUsedMonth / tier.monthly_tokens) * 100
        let warnings: number[] = []
        
        if (tier.tier === 'free') {
          warnings = [70, 90]
          if (monthlyPercentage >= 90) warnings = [90]
          else if (monthlyPercentage >= 70) warnings = [70]
          else warnings = []
        } else {
          warnings = [50, 80, 95]
          if (monthlyPercentage >= 95) warnings = [95]
          else if (monthlyPercentage >= 80) warnings = [80]
          else if (monthlyPercentage >= 50) warnings = [50]
          else warnings = []
        }

        console.log('📈 Final usage stats calculated:', {
          tier: tier.tier,
          monthlyTokens: tier.monthly_tokens,
          dailyMessages: tier.daily_messages,
          tokensUsed: tokensUsedMonth,
          messagesUsed: messagesUsedToday,
          percentage: Math.round(monthlyPercentage),
          warnings
        })

        // UPDATED: Enhanced usage stats with anniversary-based reset times
        setUsageStats({
          tokens_used_today: 0, // Not separately tracked
          tokens_used_month: tokensUsedMonth,
          messages_sent_today: messagesUsedToday,
          tier,
          warnings,
          // CRITICAL: Anniversary-based reset information
          daily_reset_time: dailyResetTime,
          monthly_reset_time: monthlyResetTime,
          billing_period_start: billingPeriodStart
        })

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
    }, 500)
  }

  // Fetch stats when user changes or on mount
  useEffect(() => {
    if (user && !hasFetchedInitialStatsRef.current) {
      fetchUsageStats()
    }
    
    if (!user && hasFetchedInitialStatsRef.current) {
      hasFetchedInitialStatsRef.current = false
      setUsageStats(null)
    }
  }, [user])

  // UPDATED: Listen for refresh events and periodic updates
  useEffect(() => {
    if (!user) return

    const handleRefresh = () => {
      console.log('🔄 Manual usage stats refresh triggered')
      fetchUsageStats()
    }
    
    window.addEventListener('refreshUsageStats', handleRefresh)

    // Refresh every 5 minutes for real-time accuracy
    const interval = setInterval(() => {
      fetchUsageStats()
    }, 5 * 60 * 1000)

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