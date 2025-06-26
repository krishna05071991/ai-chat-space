// Hook for periodic database synchronization with cross-device support - OPTIMIZED to prevent excessive calls
import { useEffect, useCallback, useRef, useState } from 'react'
import { Conversation } from '../types/chat'
import { databaseService } from '../lib/databaseService'
import { useAuth } from './useAuth'

interface UseDatabaseSyncProps {
  conversations: Conversation[]
  onConversationsUpdated: (conversations: Conversation[]) => void
  autoSaveInterval?: number // in milliseconds, default 30 seconds
}

export function useDatabaseSync({
  conversations,
  onConversationsUpdated,
  autoSaveInterval = 30000 // 30 seconds
}: UseDatabaseSyncProps) {
  const { user, isSessionValid } = useAuth()
  const lastSyncRef = useRef<Date | null>(null)
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasLoadedInitialRef = useRef(false)
  const [isLoading, setIsLoading] = useState(false)
  const loadingRef = useRef(false)

  /**
   * Load conversations from database on app start
   */
  const loadFromDatabase = useCallback(async () => {
    if (!user || hasLoadedInitialRef.current || loadingRef.current) {
      return // Prevent multiple simultaneous loads
    }

    // OPTIMIZATION: Set flag immediately to prevent race conditions
    hasLoadedInitialRef.current = true
    loadingRef.current = true
    setIsLoading(true)
    
    try {
      // Validate session before loading
      const sessionValid = await isSessionValid()
      if (!sessionValid) {
        return
      }
      
      console.log('📥 Loading initial conversations from database...')
      const dbConversations = await databaseService.loadConversations()
      
      if (dbConversations && dbConversations.length > 0) {
        console.log('✅ Successfully loaded conversations from database:', {
          count: dbConversations.length,
          withMessages: dbConversations.filter(c => c.messages.length > 0).length
        })
        onConversationsUpdated(dbConversations)
      } else {
        console.log('📭 No conversations found in database')
      }
      
      lastSyncRef.current = new Date()
    } catch (error) {
      console.error('❌ Failed to load initial conversations:', error)
      
      // Check if it's an auth error
      if (error.message?.includes('refresh_token_not_found') ||
          error.message?.includes('Invalid Refresh Token') ||
          error.message?.includes('JWT expired')) {
        // Don't reset flag so user can retry after re-auth
        hasLoadedInitialRef.current = false
        return
      }
      
      // For other errors, keep flag set to prevent retry loops
    } finally {
      loadingRef.current = false
      setIsLoading(false)
    }
  }, [user, isSessionValid, onConversationsUpdated])

  /**
   * Save conversations to database
   */
  const saveToDatabase = useCallback(async (conversationsToSave: Conversation[]) => {
    if (!user || conversationsToSave.length === 0) {
      return
    }

    try {
      // Validate session before saving
      const sessionValid = await isSessionValid()
      if (!sessionValid) {
        return
      }
      
      // MODIFIED: Only save conversation metadata, not messages
      // Edge Function handles message saving
      for (const conversation of conversationsToSave) {
        try {
          await databaseService.saveConversationMetadata(conversation)
        } catch (error) {
          console.error('Failed to save conversation metadata:', error)
          // Continue with other conversations
        }
      }
      lastSyncRef.current = new Date()
    } catch (error) {
      
      // Check if it's an auth error
      if (error.message?.includes('refresh_token_not_found') ||
          error.message?.includes('Invalid Refresh Token') ||
          error.message?.includes('JWT expired')) {
        return
      }
      
      // Don't throw error for other issues - let the app continue with local storage
    }
  }, [user, isSessionValid])

  /**
   * Perform full sync with merge strategy
   */
  const syncWithDatabase = useCallback(async () => {
    if (!user) {
      return
    }

    try {
      // Validate session before syncing
      const sessionValid = await isSessionValid()
      if (!sessionValid) {
        return
      }
      
      const syncedConversations = await databaseService.syncWithDatabase(conversations)
      
      if (syncedConversations && (syncedConversations.length !== conversations.length || 
          JSON.stringify(syncedConversations) !== JSON.stringify(conversations))) {
        onConversationsUpdated(syncedConversations)
      }
      
      lastSyncRef.current = new Date()
    } catch (error) {
      
      // Check if it's an auth error
      if (error.message?.includes('refresh_token_not_found') ||
          error.message?.includes('Invalid Refresh Token') ||
          error.message?.includes('JWT expired')) {
        return
      }
    }
  }, [user, conversations, onConversationsUpdated, isSessionValid])

  /**
   * Schedule automatic save
   */
  const scheduleAutoSave = useCallback(() => {
    // Only schedule if user is authenticated
    if (!user) {
      return
    }
    
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
    }

    syncTimeoutRef.current = setTimeout(async () => {
      if (conversations.length > 0) {
        // Double-check auth before auto-save
        const sessionValid = await isSessionValid()
        if (!sessionValid) {
          return
        }
        
        saveToDatabase(conversations)
      }
    }, autoSaveInterval)
  }, [conversations, saveToDatabase, autoSaveInterval, user, isSessionValid])

  /**
   * Save immediately (for important operations)
   */
  const saveImmediately = useCallback(async () => {
    if (!user) {
      return
    }
    
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
      syncTimeoutRef.current = null
    }
    
    // Check session before immediate save
    const sessionValid = await isSessionValid()
    if (!sessionValid) {
      return
    }
    
    await saveToDatabase(conversations)
  }, [conversations, saveToDatabase, user, isSessionValid])

  // Load initial data when user authenticates
  useEffect(() => {
    if (user && !hasLoadedInitialRef.current) {
      loadFromDatabase()
    }
    
    // Reset loaded flag when user changes (sign out/sign in)
    if (!user && hasLoadedInitialRef.current) {
      hasLoadedInitialRef.current = false
      lastSyncRef.current = null
    }
  }, [user, loadFromDatabase])

  // Schedule auto-save when conversations change
  useEffect(() => {
    if (hasLoadedInitialRef.current && conversations.length > 0) {
      scheduleAutoSave()
    }

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [conversations, scheduleAutoSave])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [])

  // Sync periodically (every 5 minutes)
  useEffect(() => {
    if (!user) {
      return
    }

    const syncInterval = setInterval(async () => {
      // Check session before periodic sync
      const sessionValid = await isSessionValid()
      if (!sessionValid) {
        return
      }
      syncWithDatabase()
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(syncInterval)
  }, [user, syncWithDatabase, isSessionValid])

  return {
    saveImmediately,
    syncWithDatabase,
    lastSync: lastSyncRef.current,
    hasLoadedInitial: hasLoadedInitialRef.current
  }
}