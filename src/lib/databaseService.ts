// Database service for syncing conversations with Supabase for cross-device support
import { supabase } from './supabase'
import { Conversation, Message } from '../types/chat'

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
      return false
    }
  }

  /**
   * Wrapper for database operations that require authentication
   */
  private async withAuth<T>(operation: () => Promise<T>, operationName: string): Promise<T | null> {
    try {
      // Check authentication first
      const isAuth = await this.isAuthenticated()
      if (!isAuth) {
        return null
      }
      
      return await operation()
    } catch (error) {
      // Handle specific auth errors
      if (error.message?.includes('refresh_token_not_found') ||
          error.message?.includes('Invalid Refresh Token') ||
          error.message?.includes('JWT expired')) {
        return null
      }
      
      // Re-throw other errors
      throw error
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
    console.warn('saveMessage() called but disabled - Edge Function handles message saving')
    return Promise.resolve()
  }

  /**
   * Load all conversations for the current user from database with proper user filtering
   */
  async loadConversations(): Promise<Conversation[]> {
    const result = await this.withAuth(async () => {
      const user = await this.getCurrentUser()
      if (!user) {
        return []
      }

      console.log('📥 Loading conversations for user:', user.id.substring(0, 8))

      // First, get conversations with explicit user_id filter
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (convError) {
        console.error('❌ Failed to load conversations:', convError)
        throw new Error(`Failed to load conversations: ${convError.message}`)
      }

      console.log('📋 Found conversations:', conversations?.length || 0)

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
          id: c.id.substring(0, 8),
          title: c.title.substring(0, 30),
          messageCount: c.messages.length
        }))
      })

      return result

    }, 'loadConversations')
    
    return result || []
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
        throw new Error(`Failed to save conversation: ${error.message}`)
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
        throw new Error(`Failed to delete conversation: ${error.message}`)
      }

    }, 'deleteConversation')
  }

  /**
   * Delete all conversations for the current user from database
   */
  async deleteAllConversations(): Promise<void> {
    return await this.withAuth(async () => {
      const user = await this.getCurrentUser()
      if (!user) {
        throw new Error('No authenticated user found')
      }

      console.log('🗑️ Deleting conversations for user:', user.id.substring(0, 8))
      
      // First check how many conversations exist
      const { count: beforeCount } = await supabase
        .from('conversations')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
      
      console.log('📋 Conversations to delete:', beforeCount)
      
      // Delete all conversations
      const { data, error, count } = await supabase
        .from('conversations')
        .delete({ count: 'exact' })
        .eq('user_id', user.id)
      
      if (error) {
        console.error('❌ Delete error:', error)
        throw new Error(`Failed to delete conversations: ${error.message}`)
      }
      
      console.log('✅ Deleted conversations:', count)
      
      // Verify deletion worked
      const { count: afterCount } = await supabase
        .from('conversations')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
      
      console.log('📋 Conversations remaining:', afterCount)
      
      if (afterCount > 0) {
        throw new Error(`Delete verification failed: ${afterCount} conversations still exist`)
      }
      
    }, 'deleteAllConversations')
  }

  /**
   * Test database connectivity and permissions
   */
  async testDatabaseConnection(): Promise<{ success: boolean; details: string }> {
    try {
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
   * Get usage statistics for the current user with proper RLS handling
   */
  async getUserUsageStats(): Promise<{
    tokensUsedToday: number
    tokensUsedMonth: number  
    messagesUsedToday: number
  }> {
    const result = await this.withAuth(async () => {
      const user = await this.getCurrentUser()
      if (!user) {
        return { tokensUsedToday: 0, tokensUsedMonth: 0, messagesUsedToday: 0 }
      }

      // Get user's conversations first
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', user.id)

      if (convError || !conversations) {
        return { tokensUsedToday: 0, tokensUsedMonth: 0, messagesUsedToday: 0 }
      }

      const conversationIds = conversations.map(c => c.id)
      
      if (conversationIds.length === 0) {
        return { tokensUsedToday: 0, tokensUsedMonth: 0, messagesUsedToday: 0 }
      }

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

    return result || { tokensUsedToday: 0, tokensUsedMonth: 0, messagesUsedToday: 0 }
  }

  /**
   * Get current user usage with anniversary-based billing information
   */
  async getCurrentUsage(): Promise<UserUsageData | null> {
    const result = await this.withAuth(async () => {
      const user = await this.getCurrentUser()
      if (!user) {
        return null
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
        .single()

      if (userError) {
        console.error('❌ Error loading user data:', userError)
        // Fall back to calculated usage
      }

      console.log('👤 User data loaded:', {
        hasUserData: !!userData,
        tierName: userData?.subscription_tiers?.tier_name,
        monthlyLimit: userData?.subscription_tiers?.monthly_token_limit
      })

      // Get calculated usage stats
      const usageStats = await this.getUserUsageStats()
      
      // Calculate billing period start (anniversary-based)
      const now = new Date()
      // Use user creation date as billing anniversary, or default to 15th
      const userCreatedAt = userData?.created_at ? new Date(userData.created_at) : new Date(now.getFullYear(), now.getMonth(), 15)
      const billingPeriodStart = new Date(now.getFullYear(), now.getMonth(), userCreatedAt.getDate())
      
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
      // If we're before the anniversary date, next reset is this month's anniversary
      
      return {
        daily_messages_sent: usageStats.messagesUsedToday,
        monthly_tokens_used: usageStats.tokensUsedMonth,
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
  }

  /**
   * Sync local conversations with database (merge strategy)
   */
  async syncWithDatabase(localConversations: Conversation[]): Promise<Conversation[]> {
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
    
    // Return local conversations if sync fails or user not authenticated
    return result || localConversations
  }
}

export const databaseService = new DatabaseService()