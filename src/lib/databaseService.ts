// UPDATED: Database service with enhanced error handling for connection issues
import { supabase } from './supabase'
import { Conversation, Message } from '../types/chat'

// Add retry configuration for network requests
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 5000   // 5 seconds
}

// Helper function to add delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

interface UserUsageData {
  daily_messages_sent: number
  monthly_tokens_used: number
  billing_period_start: string
  last_daily_reset: string
  last_monthly_reset: string
  subscription_tier?: {
    tier_name: string
    monthly_token_limit: number
    daily_message_limit: number
  }
}

interface DatabaseConversation {
  id: string
  user_id: string
  title: string
  model_history: string[]
  total_tokens: number
  created_at: string
  updated_at: string
  messages?: DatabaseMessage[]
}

interface DatabaseMessage {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  model_used: string | null
  input_tokens: number
  output_tokens: number
  total_tokens: number
  sequence_number?: number
  created_at: string
}

class DatabaseService {
  private syncInProgress = false
  private pendingOperations: (() => Promise<void>)[] = []

  /**
   * Test Supabase connectivity before making requests
   */
  private async testSupabaseConnectivity(): Promise<{ success: boolean; error?: string }> {
    try {
      // Simple connectivity test - try to get session
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        return { 
          success: false, 
          error: `Supabase auth error: ${error.message}` 
        }
      }
      
      return { success: true }
    } catch (error) {
      // Network-level errors
      if (error.message?.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'Cannot reach Supabase servers. Please check your internet connection and Supabase project status.' 
        }
      }
      
      return { 
        success: false, 
        error: `Connectivity test failed: ${error.message}` 
      }
    }
  }

  /**
   * Retry wrapper for database operations
   */
  private async withRetry<T>(
    operation: () => Promise<T>, 
    operationName: string,
    retries = RETRY_CONFIG.maxRetries
  ): Promise<T> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        const isLastAttempt = attempt === retries
        const isNetworkError = error.message?.includes('Failed to fetch') || 
                              error.message?.includes('fetch') ||
                              error.message?.includes('network')
        
        if (isNetworkError && !isLastAttempt) {
          const delayMs = Math.min(
            RETRY_CONFIG.baseDelay * Math.pow(2, attempt - 1),
            RETRY_CONFIG.maxDelay
          )
          
          console.warn(`🔄 ${operationName} failed (attempt ${attempt}/${retries}), retrying in ${delayMs}ms...`, error.message)
          await delay(delayMs)
          continue
        }
        
        // If it's the last attempt or not a network error, throw the error
        throw error
      }
    }
    
    throw new Error(`Operation failed after ${retries} attempts`)
  }

  /**
   * Enhanced error handling for database operations
   */
  private handleDatabaseError(error: any, operation: string): Error {
    console.error(`❌ Database error in ${operation}:`, error)

    // Handle network connectivity errors
    if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
      return new Error(
        `Unable to connect to Supabase. Please check:\n` +
        `1. Your internet connection\n` +
        `2. Supabase project status (visit dashboard.supabase.com)\n` +
        `3. VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env file\n` +
        `4. Project might be paused or suspended\n\n` +
        `Current URL: ${import.meta.env.VITE_SUPABASE_URL || 'NOT SET'}`
      )
    }

    // Handle authentication errors
    if (error.message?.includes('refresh_token_not_found') ||
        error.message?.includes('Invalid Refresh Token') ||
        error.message?.includes('JWT expired')) {
      return new Error(`Your session has expired. Please sign in again.`)
    }

    // Handle RLS policy violations
    if (error.message?.includes('Row Level Security policy violation') ||
        error.message?.includes('permission denied')) {
      return new Error(`You don't have permission to access this data. Please ensure you're properly authenticated.`)
    }

    // Handle connection timeouts
    if (error.message?.includes('timeout') || error.message?.includes('ETIMEDOUT')) {
      return new Error(`The request timed out. Please try again.`)
    }

    // Default error message with context
    return new Error(`Database operation failed (${operation}): ${error.message || 'Unknown error'}`)
  }

  /**
   * Update user profile information
   */
  async updateUserProfile(profileData: {
    full_name?: string | null
    location?: string | null  
    profession?: string | null
    avatar_url?: string | null
    onboarding_completed?: boolean
  }): Promise<void> {
    await this.withAuth(async () => {
      const user = await this.getCurrentUser()
      if (!user) {
        throw new Error('No authenticated user found')
      }

      const { error } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.email || '',
          ...profileData,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' })

      if (error) {
        throw this.handleDatabaseError(error, 'updateUserProfile')
      }

    }, 'updateUserProfile')
  }

  /**
   * Get user profile information
   */
  async getUserProfile(): Promise<{
    id: string
    email: string
    full_name: string | null
    location: string | null
    profession: string | null
    avatar_url: string | null
    onboarding_completed: boolean
    created_at: string
    updated_at: string
  } | null> {
    const result = await this.withAuth(async () => {
      const user = await this.getCurrentUser()
      if (!user) {
        throw new Error('No authenticated user found')
      }

      const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name, location, profession, avatar_url, onboarding_completed, created_at, updated_at')
        .eq('id', user.id)
        .maybeSingle()

      if (error) {
        throw this.handleDatabaseError(error, 'getUserProfile')
      }

      return data

    }, 'getUserProfile')
    
    return result
  }

  /**
   * Check if user has completed onboarding
   */
  async isOnboardingComplete(): Promise<boolean> {
    try {
      const profile = await this.getUserProfile()
      return profile?.onboarding_completed === true && !!profile?.full_name
    } catch (error) {
      console.error('Failed to check onboarding status:', error)
      return false
    }
  }

  /**
   * Check if user is authenticated and session is valid
   */
  private async isAuthenticated(): Promise<boolean> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error || !session || !session.user) {
        return false
      }
      
      // Check if token is expired
      const now = Math.floor(Date.now() / 1000)
      if (session.expires_at && session.expires_at < now) {
        return false
      }
      
      return true
    } catch (error) {
      console.error('Authentication check failed:', error)
      return false
    }
  }

  /**
   * ENHANCED: Wrapper for database operations with better error handling
   */
  private async withAuth<T>(operation: () => Promise<T>, operationName: string): Promise<T> {
    // First test connectivity
    const connectivityTest = await this.testSupabaseConnectivity()
    if (!connectivityTest.success) {
      throw new Error(`Connection failed: ${connectivityTest.error}`)
    }
    
    try {
      return await this.withRetry(async () => {
        // Check authentication first
        const isAuth = await this.isAuthenticated()
        if (!isAuth) {
          throw new Error(`Authentication required for ${operationName}. Please sign in again.`)
        }
        
        return await operation()
      }, operationName)
    } catch (error) {
      // Use enhanced error handling
      throw this.handleDatabaseError(error, operationName)
    }
  }

  /**
   * Get current authenticated user
   */
  private async getCurrentUser() {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.user
  }

  /**
   * REMOVED: Save a single message to the database
   * Edge Function now handles ALL message saving to prevent RLS violations
   */
  async saveMessage(message: Message, sequenceNumber?: number, usage?: { input_tokens?: number; output_tokens?: number; total_tokens?: number }): Promise<void> {
    // REMOVED - Edge Function handles ALL message saving
    console.warn('❌ saveMessage() is now handled by Edge Function. This method is deprecated.')
    return Promise.resolve()
  }

  /**
   * Load all conversations for the current user from database with proper user filtering
   */
  async loadConversations(): Promise<Conversation[]> {
    const result = await this.withAuth(async () => {
      const user = await this.getCurrentUser()
      if (!user) {
        throw new Error('No authenticated user found')
      }

      console.log('📥 Loading conversations for user:', user.id.substring(0, 8))

      // Get conversations - let RLS policy handle all filtering automatically
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (convError) {
        throw this.handleDatabaseError(convError, 'loadConversations')
      }

      console.log('📋 Found conversations:', {
        total: conversations?.length || 0,
        conversations: conversations?.map(c => ({
          id: c?.id?.substring(0, 8) || 'N/A',
          title: c?.title?.substring(0, 30) || 'N/A',
          is_archived: c?.is_archived || false
        }))
      })

      // Then, get all messages for these conversations
      const conversationIds = conversations?.map(c => c.id) || []
      let allMessages: any[] = []

      if (conversationIds.length > 0) {
        const { data: messages, error: msgError } = await supabase
          .from('messages')
          .select('*')
          .in('conversation_id', conversationIds)
          .order('created_at', { ascending: true })

        if (msgError) {
          console.error('❌ Failed to load messages:', msgError)
          // Continue with empty messages if query fails
          allMessages = []
        } else {
          allMessages = messages || []
          console.log('💬 Found messages:', allMessages.length)
        }
      }

      // Combine conversations with their messages
      const result: Conversation[] = (conversations || []).map(conv => ({
        id: conv.id,
        title: conv.title,
        messages: allMessages
          .filter(msg => msg.conversation_id === conv.id)
          .map(msg => ({
            id: msg.id,
            conversation_id: msg.conversation_id,
            role: msg.role,
            content: msg.content,
            model_used: msg.model_used,
            input_tokens: msg.input_tokens || 0,
            output_tokens: msg.output_tokens || 0,
            total_tokens: msg.total_tokens || 0,
            created_at: msg.created_at
          })),
        total_tokens: conv.total_tokens || 0,
        created_at: conv.created_at,
        updated_at: conv.updated_at
      }))

      console.log('✅ Assembled conversations with messages:', {
        totalConversations: result.length,
        conversationsWithMessages: result.filter(c => c.messages.length > 0).length,
        totalMessages: result.reduce((sum, c) => sum + c.messages.length, 0),
        conversationSummary: result.map(c => ({
          id: c?.id?.substring(0, 8) || 'N/A',
          title: c?.title?.substring(0, 30) || 'N/A',
          messageCount: c?.messages?.length || 0
        }))
      })

      return result

    }, 'loadConversations')
    
    return result
  }

  /**
   * Save conversation metadata to database
   */
  async saveConversationMetadata(conversation: Conversation): Promise<void> {
    await this.withAuth(async () => {
      const user = await this.getCurrentUser()
      if (!user) {
        throw new Error('No authenticated user found')
      }

      const { error } = await supabase
        .from('conversations')
        .upsert({
          id: conversation.id,
          user_id: user.id,
          title: conversation.title,
          model_history: [], // Can implement model tracking later
          created_at: conversation.created_at,
          updated_at: conversation.updated_at
        }, { onConflict: 'id' })

      if (error) {
        throw this.handleDatabaseError(error, 'saveConversationMetadata')
      }

    }, 'saveConversationMetadata')
  }

  /**
   * MODIFIED: Save conversation metadata only (no messages)
   * Edge Function handles message saving
   */
  async saveConversation(conversation: Conversation): Promise<void> {
    await this.withAuth(async () => {
      // Only save conversation metadata - Edge Function handles messages
      await this.saveConversationMetadata(conversation)

    }, 'saveConversation')
  }

  /**
   * MODIFIED: Save multiple conversations metadata only
   */
  async saveConversations(conversations: Conversation[]): Promise<void> {
    if (!conversations || conversations.length === 0) {
      return
    }

    await this.withAuth(async () => {
      for (const conversation of conversations) {
        try {
          // Only save conversation metadata - Edge Function handles messages
          await this.saveConversationMetadata(conversation)
        } catch (error) {
          // Continue with other conversations even if one fails
        }
      }

    }, 'saveConversations')
  }

  /**
   * Delete conversation from database
   */
  async deleteConversation(conversationId: string): Promise<void> {
    await this.withAuth(async () => {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId)

      if (error) {
        throw this.handleDatabaseError(error, 'deleteConversation')
      }

    }, 'deleteConversation')
  }

  /**
   * Delete all conversations for the current user from database
   */
  async deleteAllConversations(): Promise<void> {
    await this.withAuth(async () => {
      const user = await this.getCurrentUser()
      if (!user) {
        throw new Error('No authenticated user found')
      }
      
      console.log('🗑️ Deleting conversations for user:', user.id.substring(0, 8))
      
      // Delete all conversations for this user
      const { error: deleteError, count: deletedCount } = await supabase
        .from('conversations')
        .delete({ count: 'exact' })
        .eq('user_id', user.id)
      
      if (deleteError) {
        throw this.handleDatabaseError(deleteError, 'deleteAllConversations')
      }
      
      console.log('✅ Deleted conversations:', deletedCount)
      
    }, 'deleteAllConversations')
  }

  /**
   * Test database connectivity and permissions
   */
  async testDatabaseConnection(): Promise<{ success: boolean; details: string }> {
    try {
      // First test basic connectivity
      const connectivityTest = await this.testSupabaseConnectivity()
      if (!connectivityTest.success) {
        return {
          success: false,
          details: `Connectivity test failed: ${connectivityTest.error}`
        }
      }
      
      const isAuth = await this.isAuthenticated()
      if (!isAuth) {
        return {
          success: false,
          details: 'User not authenticated'
        }
      }

      const user = await this.getCurrentUser()
      if (!user) {
        return {
          success: false,
          details: 'No user session found'
        }
      }

      // Test conversation table access with user filter
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)

      if (convError) {
        return {
          success: false,
          details: `Conversation table error: ${convError.message}`
        }
      }

      // Test message table access
      const { data: msgData, error: msgError } = await supabase
        .from('messages')
        .select('id')
        .limit(1)

      if (msgError) {
        return {
          success: false,
          details: `Message table error: ${msgError.message}`
        }
      }

      return {
        success: true,
        details: `Database accessible. User: ${user.id.substring(0, 8)}. Found ${convData?.length || 0} conversations, ${msgData?.length || 0} messages accessible.`
      }

    } catch (error) {
      return {
        success: false,
        details: `Connection test failed: ${error.message}`
      }
    }
  }

  /**
   * UPDATED: Get usage statistics with better error handling
   */
  async getUserUsageStats(): Promise<{
    tokensUsedToday: number
    tokensUsedMonth: number  
    messagesUsedToday: number
  }> {
    const result = await this.withAuth(async () => {
      const user = await this.getCurrentUser()
      if (!user) {
        throw new Error('No authenticated user found')
      }

      // Get user's conversations first
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', user.id)

      if (convError) {
        throw this.handleDatabaseError(convError, 'getUserUsageStats')
      }

      if (!conversations || conversations.length === 0) {
        return { tokensUsedToday: 0, tokensUsedMonth: 0, messagesUsedToday: 0 }
      }

      const conversationIds = conversations.map(c => c.id)

      // Get today's date range
      const today = new Date()
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
      const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString()

      // Get this month's date range
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1).toISOString()

      // Query today's messages for count
      const { count: todayMessageCount } = await supabase
        .from('messages')
        .select('id', { count: 'exact' })
        .eq('role', 'user')
        .in('conversation_id', conversationIds)
        .gte('created_at', todayStart)
        .lt('created_at', todayEnd)

      // Query today's tokens
      const { data: todayTokens } = await supabase
        .from('messages')
        .select('total_tokens, input_tokens, output_tokens')
        .in('conversation_id', conversationIds)
        .gte('created_at', todayStart)
        .lt('created_at', todayEnd)

      // Query this month's tokens
      const { data: monthTokens } = await supabase
        .from('messages')
        .select('total_tokens, input_tokens, output_tokens')
        .in('conversation_id', conversationIds)
        .gte('created_at', monthStart)
        .lt('created_at', monthEnd)

      // Calculate totals
      const tokensUsedToday = (todayTokens || []).reduce((sum, msg) => {
        return sum + (msg.total_tokens || msg.input_tokens + msg.output_tokens || 0)
      }, 0)

      const tokensUsedMonth = (monthTokens || []).reduce((sum, msg) => {
        return sum + (msg.total_tokens || msg.input_tokens + msg.output_tokens || 0)
      }, 0)

      return {
        tokensUsedToday,
        tokensUsedMonth,
        messagesUsedToday: todayMessageCount || 0
      }

    }, 'getUserUsageStats')

    return result
  }

  /**
   * UPDATED: Get current user usage with enhanced error handling
   */
  async getCurrentUsage(): Promise<UserUsageData | null> {
    try {
      const result = await this.withAuth(async () => {
        const user = await this.getCurrentUser()
        if (!user) {
          throw new Error('No authenticated user found')
        }

        console.log('📊 Getting current usage for user:', user.id)

        // Get user data with subscription tier information
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
          console.error('❌ Error loading user data:', userError)
          // Continue without user data - we'll use defaults and fallback
        }

        console.log('👤 User data loaded:', {
          hasUserData: !!userData,
          tierName: userData?.subscription_tiers?.tier_name || 'free',
          monthlyLimit: userData?.subscription_tiers?.monthly_token_limit || 35000,
          tokensUsed: userData?.monthly_tokens_used || 0,
          messagesUsed: userData?.daily_messages_sent || 0
        })

        // Get fallback usage stats if user data is incomplete
        let usage: any
        if (userData?.monthly_tokens_used !== undefined && userData?.daily_messages_sent !== undefined) {
          // Use data from users table (updated by Edge Function)
          usage = {
            tokensUsedToday: 0, // Not tracked separately in users table
            tokensUsedMonth: userData.monthly_tokens_used,
            messagesUsedToday: userData.daily_messages_sent
          }
        } else {
          // Fallback to message table calculation
          usage = await this.getUserUsageStats()
        }
        
        // Calculate billing period start (anniversary-based)
        const now = new Date()
        const userCreatedAt = userData?.created_at ? new Date(userData.created_at) : new Date(now.getFullYear(), now.getMonth(), 15)
        const billingPeriodStart = userData?.billing_period_start ? 
          new Date(userData.billing_period_start) : 
          new Date(now.getFullYear(), now.getMonth(), userCreatedAt.getDate())
        
        // Calculate reset times
        const nextDayReset = new Date(now)
        nextDayReset.setDate(nextDayReset.getDate() + 1)
        nextDayReset.setHours(0, 0, 0, 0)
        
        // Calculate next billing anniversary
        const nextMonthReset = new Date(billingPeriodStart)
        if (now.getDate() >= userCreatedAt.getDate()) {
          // If we're past the anniversary date, next reset is next month's anniversary
          nextMonthReset.setMonth(nextMonthReset.getMonth() + 1)
        }
        
        return {
          daily_messages_sent: usage.messagesUsedToday,
          monthly_tokens_used: usage.tokensUsedMonth,
          billing_period_start: billingPeriodStart.toISOString(),
          last_daily_reset: nextDayReset.toISOString(),
          last_monthly_reset: nextMonthReset.toISOString(),
          subscription_tier: userData?.subscription_tiers ? {
            tier_name: userData.subscription_tiers.tier_name,
            monthly_token_limit: userData.subscription_tiers.monthly_token_limit,
            daily_message_limit: userData.subscription_tiers.daily_message_limit
          } : {
            tier_name: 'free',
            monthly_token_limit: 35000,
            daily_message_limit: 25
          }
        }
        
      }, 'getCurrentUsage')
      
      return result
    } catch (error) {
      console.error('❌ Failed to get current usage:', error)
      
      // Return null instead of throwing to allow graceful degradation
      return null
    }
  }

  /**
   * Sync local conversations with database (merge strategy)
   */
  async syncWithDatabase(localConversations: Conversation[]): Promise<Conversation[]> {
    try {
      const result = await this.withAuth(async () => {
        // Load remote conversations
        const remoteConversations = await this.loadConversations()

        // Simple merge strategy: use the most recently updated version
        const mergedConversations = new Map<string, Conversation>()

        // Add all remote conversations
        (remoteConversations || []).forEach(conv => {
          mergedConversations.set(conv.id, conv)
        })

        // Override with local if newer
        localConversations.forEach(localConv => {
          const remoteConv = mergedConversations.get(localConv.id)
          if (!remoteConv || new Date(localConv.updated_at) > new Date(remoteConv.updated_at)) {
            mergedConversations.set(localConv.id, localConv)
          }
        })

        const result = Array.from(mergedConversations.values())
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())

        return result

      }, 'syncWithDatabase')
      
      return result
    } catch (error) {
      console.error('❌ Database sync failed:', error)
      // Return local conversations if sync fails
      return localConversations
    }
  }
}

export const databaseService = new DatabaseService()