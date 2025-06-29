import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { ChatArea } from './ChatArea'
import { ProfileSettingsPage } from './ProfileSettingsPage'
import { PricingPlansPage } from './PricingPlansPage'
import { LimitExceededModal, UsageLimitError } from '../usage/LimitExceededModal'
import { useAuth } from '../../hooks/useAuth'
import { databaseService } from '../../lib/databaseService'
import { AI_MODELS, AIModel, Message, StreamingState, TokenUsage, getDefaultModel } from '../../types/chat'
import { streamingService } from '../../lib/streamingService'

interface ConversationState {
  id: string
  title: string
  messages: Message[]
  created_at: string
  updated_at: string
}

// CLEAR ROUTING: Define all possible page types for the application
type CurrentPage = 'chat' | 'profile' | 'pricing'

/**
 * ROUTING DOCUMENTATION:
 * 
 * Chat Models uses client-side state-based routing with these pages:
 * 
 * 1. 'chat' (default) - Main chat interface with conversations
 * 2. 'profile' - Profile settings page (full page, not modal)
 * 3. 'pricing' - Pricing plans page (full page, not modal)
 * 
 * Navigation is handled through:
 * - Sidebar menu items (Profile Settings, Pricing Plans)
 * - Back buttons on each page
 * - Programmatic navigation (upgrade prompts → pricing page)
 * 
 * All routing is contained within this ChatLayout component using useState.
 * No external routing library is used to keep the app simple and focused.
 */

export function ChatLayout() {
  const { user, clearInvalidSession } = useAuth()
  
  // PRIMARY REACT STATE
  const [conversations, setConversations] = useState<ConversationState[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState<AIModel>(getDefaultModel())
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [streamingState, setStreamingState] = useState<StreamingState>({
    isStreaming: false,
    currentMessage: '',
    messageId: null
  })
  const [error, setError] = useState<string | null>(null)
  const [isLoadingConversations, setIsLoadingConversations] = useState(false)

  // ROUTING STATE: Current page management
  const [currentPage, setCurrentPage] = useState<CurrentPage>('chat')

  // USAGE LIMIT MODAL STATE
  const [limitExceededModal, setLimitExceededModal] = useState<{
    isOpen: boolean
    error: UsageLimitError | null
  }>({ isOpen: false, error: null })

  const abortControllerRef = useRef<AbortController | null>(null)

  // Listen for usage limit exceeded events
  useEffect(() => {
    const handleUsageLimitExceeded = (event: CustomEvent<UsageLimitError>) => {
      console.log('🚫 Usage limit exceeded event received:', event.detail)
      setLimitExceededModal({
        isOpen: true,
        error: event.detail
      })
    }

    window.addEventListener('usageLimitExceeded', handleUsageLimitExceeded as EventListener)
    return () => {
      window.removeEventListener('usageLimitExceeded', handleUsageLimitExceeded as EventListener)
    }
  }, [])

  // CRITICAL: Load conversations from database when user authenticates
  useEffect(() => {
    const loadConversationsFromDB = async () => {
      if (!user) {
        setConversations([])
        setActiveConversationId(null)
        return
      }

      setIsLoadingConversations(true)
      setError(null) // Clear any previous errors
      
      try {
        console.log('📥 Loading conversations from database for user:', user.id.substring(0, 8))
        
        // Test database connectivity first
        console.log('🔍 Testing database connection...')
        const connectionTest = await databaseService.testDatabaseConnection()
        if (!connectionTest.success) {
          throw new Error(`Database connection failed: ${connectionTest.details}`)
        }
        console.log('✅ Database connection successful')
        
        const dbConversations = await databaseService.loadConversations()
        
        if (dbConversations && dbConversations.length > 0) {
          console.log('✅ Successfully loaded conversations:', {
            count: dbConversations.length,
            withMessages: dbConversations.filter(c => c.messages.length > 0).length,
            titles: dbConversations.map(c => c.title.substring(0, 30))
          })
          
          // Convert to our state format
          const stateConversations: ConversationState[] = dbConversations.map(conv => ({
            id: conv.id,
            title: conv.title,
            messages: conv.messages || [],
            created_at: conv.created_at,
            updated_at: conv.updated_at
          }))
          
          setConversations(stateConversations)
        } else {
          console.log('📭 No conversations found (or all archived)')
          setConversations([])
        }
      } catch (error) {
        console.error('❌ Failed to load conversations:', {
          error: error.message,
          stack: error.stack?.split('\n').slice(0, 3)
        })
        
        // More specific error messaging
        if (error.message?.includes('refresh_token_not_found') || 
            error.message?.includes('Invalid Refresh Token')) {
          clearInvalidSession()
          setError('Session expired. Please sign in again.')
        } else if (error.message?.includes('row-level security')) {
          setError('Database access error. Please try signing out and back in.')
        } else {
          setError(`Failed to load conversations: ${error.message}`)
        }
      } finally {
        setIsLoadingConversations(false)
      }
    }

    loadConversationsFromDB()
  }, [user])

  // Get active conversation from React state
  const activeConversation = conversations.find(c => c.id === activeConversationId) || null

  // Helper function to create new conversation
  const createNewConversation = useCallback((title: string): ConversationState => {
    const newConversation: ConversationState = {
      id: crypto.randomUUID(),
      title,
      messages: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    setConversations(prev => [newConversation, ...prev])
    return newConversation
  }, [])

  // Helper function to update conversation
  const updateConversation = useCallback((conversationId: string, updates: Partial<ConversationState>) => {
    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, ...updates, updated_at: new Date().toISOString() }
          : conv
      )
    )
  }, [])

  // ROUTING: Navigation handlers
  const handleNewChat = useCallback(() => {
    if (!user) return
    
    const newConversation = createNewConversation('New Chat')
    setActiveConversationId(newConversation.id)
    setCurrentPage('chat') // Navigate to chat page
    setSidebarOpen(false)
    setError(null)
    setStreamingState({
      isStreaming: false,
      currentMessage: '',
      messageId: null
    })
  }, [user, createNewConversation])

  // ROUTING: Conversation selection navigation
  const handleSelectConversation = useCallback(async (id: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    streamingService.cancelStreaming()
    
    console.log('🔄 Selecting conversation:', id)
    
    // Find conversation in current state
    const conversation = conversations.find(c => c.id === id)
    
    if (conversation) {
      console.log('✅ Found conversation in state:', {
        id: conversation.id,
        title: conversation.title,
        messageCount: conversation.messages.length
      })
      
      // If conversation has no messages, try to reload from database
      if (conversation.messages.length === 0) {
        console.log('🔄 Conversation has no messages, reloading from database...')
        try {
          const dbConversations = await databaseService.loadConversations()
          const dbConversation = dbConversations.find(c => c.id === id)
          
          if (dbConversation && dbConversation.messages.length > 0) {
            console.log('✅ Found messages in database:', dbConversation.messages.length)
            
            // Update the conversation in state with messages
            const updatedConversation: ConversationState = {
              id: dbConversation.id,
              title: dbConversation.title,
              messages: dbConversation.messages,
              created_at: dbConversation.created_at,
              updated_at: dbConversation.updated_at
            }
            
            setConversations(prev => 
              prev.map(conv => 
                conv.id === id ? updatedConversation : conv
              )
            )
          }
        } catch (error) {
          console.error('❌ Failed to reload conversation from database:', error)
        }
      }
    } else {
      console.warn('⚠️ Conversation not found in state:', id)
    }
    
    setActiveConversationId(id)
    setCurrentPage('chat') // Navigate to chat page
    setSidebarOpen(false)
    setError(null)
    setStreamingState({
      isStreaming: false,
      currentMessage: '',
      messageId: null
    })
  }, [conversations])

  const handleModelChange = useCallback((model: AIModel) => {
    setSelectedModel(model)
  }, [])

  // ROUTING: Enhanced model change with upgrade prompts
  const handleUpgradePrompt = useCallback((requiredTier: string) => {
    setCurrentPage('pricing') // Navigate to pricing page
    setSidebarOpen(false)
  }, [])

  // ROUTING: Page navigation handlers
  const handleProfileSettings = useCallback(() => {
    setCurrentPage('profile')
    setSidebarOpen(false)
  }, [])

  const handlePricingPlans = useCallback(() => {
    setCurrentPage('pricing')
    setSidebarOpen(false)
  }, [])

  const handleBackToChat = useCallback(() => {
    setCurrentPage('chat')
  }, [])

  // CRITICAL: Updated handleSendMessage to send FULL conversation history
  const handleSendMessage = useCallback(async (content: string) => {
    if (!user || streamingState.isStreaming) {
      return
    }

    if (!content.trim()) {
      return
    }

    // Create conversation if it doesn't exist
    let targetConversation = activeConversation
    if (!targetConversation) {
      targetConversation = createNewConversation('New Chat')
      setActiveConversationId(targetConversation.id)
      
      try {
        await databaseService.saveConversationMetadata(targetConversation)
      } catch (error) {
        console.error('Failed to save new conversation:', error)
        setError('Failed to create new conversation. Please try again.')
        return
      }
    }

    setError(null)

    // Create user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      conversation_id: targetConversation.id,
      role: 'user',
      content: content.trim(),
      model_used: null,
      created_at: new Date().toISOString()
    }

    // Add user message to UI immediately (optimistic update)
    setConversations(prev => 
      prev.map(conv => 
        conv.id === targetConversation.id
          ? {
              ...conv,
              messages: [...conv.messages, userMessage],
              updated_at: new Date().toISOString()
            }
          : conv
      )
    )

    // Update conversation title if first message
    if (targetConversation.messages.length === 0) {
      const title = content.length > 50 ? content.substring(0, 50) + '...' : content
      updateConversation(targetConversation.id, { title })
    }

    // CRITICAL: Prepare FULL conversation history for Edge Function
    const fullConversationHistory = [...targetConversation.messages, userMessage]

    console.log('📤 Sending full conversation history to Edge Function:', {
      conversationId: targetConversation.id,
      messageCount: fullConversationHistory.length,
      model: selectedModel.id
    })

    // Start streaming
    setStreamingState({
      isStreaming: true,
      currentMessage: '',
      messageId: crypto.randomUUID()
    })

    abortControllerRef.current = new AbortController()

    try {
      // CRITICAL: Send FULL conversation history to Edge Function
      // The Edge Function now handles ALL message persistence and usage tracking
      await streamingService.sendStreamingMessage(
        fullConversationHistory,
        selectedModel,
        {
          onToken: (token: string) => {
            setStreamingState(prev => ({
              ...prev,
              currentMessage: prev.currentMessage + token
            }))
          },
          onComplete: (fullContent: string, usage?: TokenUsage) => {
            // The Edge Function has already saved both messages to database
            // We just need to update the UI state
            const assistantMessage: Message = {
              id: crypto.randomUUID(),
              conversation_id: targetConversation.id,
              role: 'assistant',
              content: fullContent,
              model_used: selectedModel.id,
              input_tokens: usage?.prompt_tokens || 0,
              output_tokens: usage?.completion_tokens || 0,
              total_tokens: usage?.total_tokens || 0,
              created_at: new Date().toISOString()
            }

            // Add assistant message to UI
            setConversations(prev => 
              prev.map(conv => 
                conv.id === targetConversation.id
                  ? {
                      ...conv,
                      messages: [...conv.messages, assistantMessage],
                      updated_at: new Date().toISOString()
                    }
                  : conv
              )
            )

            setStreamingState({
              isStreaming: false,
              currentMessage: '',
              messageId: null
            })

            console.log('✅ Message completed with usage tracking by Edge Function')

            // Refresh usage stats after message completion
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('refreshUsageStats'))
            }, 1000)
          },
          onError: (errorMsg: string) => {
            // Handle auth errors specifically
            if (errorMsg.includes('refresh_token_not_found') ||
                errorMsg.includes('Invalid Refresh Token') ||
                errorMsg.includes('Authentication required')) {
              clearInvalidSession()
              setError('Authentication expired. Please sign in again.')
              return
            }
            
            setError(errorMsg)
            
            // Remove user message from UI if failed
            setConversations(prev => 
              prev.map(conv => 
                conv.id === targetConversation.id
                  ? {
                      ...conv,
                      messages: conv.messages.slice(0, -1),
                      updated_at: new Date().toISOString()
                    }
                  : conv
              )
            )

            setStreamingState({
              isStreaming: false,
              currentMessage: '',
              messageId: null
            })
          }
        },
        abortControllerRef.current.signal
      )

    } catch (error) {
      if (error instanceof Error && (
        error.message.includes('refresh_token_not_found') ||
        error.message.includes('Invalid Refresh Token') ||
        error.message.includes('Authentication required')
      )) {
        clearInvalidSession()
        setError('Authentication expired. Please sign in again.')
        setStreamingState({
          isStreaming: false,
          currentMessage: '',
          messageId: null
        })
        return
      }
      
      if (error instanceof Error && (
        error.message.includes('cancelled') || 
        error.message.includes('abort')
      )) {
        return
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message'
      setError(errorMessage)

      // Remove user message from UI if failed
      setConversations(prev => 
        prev.map(conv => 
          conv.id === targetConversation.id
            ? {
                ...conv,
                messages: conv.messages.slice(0, -1),
                updated_at: new Date().toISOString()
              }
            : conv
        )
      )
      setStreamingState({
        isStreaming: false,
        currentMessage: '',
        messageId: null
      })
    } finally {
      abortControllerRef.current = null
    }
  }, [activeConversation, user, selectedModel, streamingState.isStreaming, updateConversation, clearInvalidSession, createNewConversation])

  const handleCancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    streamingService.cancelStreaming()
    
    setStreamingState({
      isStreaming: false,
      currentMessage: '',
      messageId: null
    })
  }, [])

  // Handle upgrade selections
  const handleUpgrade = useCallback((tier?: string) => {
    setCurrentPage('pricing')
    setSidebarOpen(false)
  }, [])

  const handleSelectPlan = useCallback((tier: string) => {
    console.log('Selected plan:', tier)
    setCurrentPage('chat')
    // TODO: Implement actual subscription logic
    alert(`Upgrading to ${tier} plan! (This would integrate with your payment processor)`)
  }, [])

  // Handle limit exceeded modal actions
  const handleLimitExceededUpgrade = useCallback((tier: string) => {
    setLimitExceededModal({ isOpen: false, error: null })
    setCurrentPage('pricing')
    setSidebarOpen(false)
  }, [])

  const handleTryTomorrow = useCallback(() => {
    setLimitExceededModal({ isOpen: false, error: null })
    setError('Daily limit reached. Try again tomorrow or upgrade for unlimited access.')
  }, [])

  // Other handlers remain the same
  const handleRenameConversation = (id: string, newTitle: string) => {
    updateConversation(id, { title: newTitle })
    // Save to database
    databaseService.saveConversationMetadata(conversations.find(c => c.id === id)!)
  }
  
  /**
   * Delete conversation from database and local state
   */
  const handleDeleteConversation = async (id: string) => {
    try {
      console.log('🗑️ Deleting conversation:', id)
      
      // Delete from database first
      await databaseService.deleteConversation(id)
      
      // Remove from local state after successful deletion
      setConversations(prev => prev.filter(c => c.id !== id))
      
      // Handle active conversation
      if (id === activeConversationId) {
        const remaining = conversations.filter(c => c.id !== id)
        if (remaining.length > 0) {
          setActiveConversationId(remaining[0].id)
        } else {
          setActiveConversationId(null)
        }
      }
      
      console.log('✅ Conversation deleted successfully')
      
    } catch (error) {
      console.error('❌ Failed to delete conversation:', error)
      setError(`Failed to delete conversation: ${error.message}`)
    }
  }
  
  /**
   * Delete all conversations from database and local state
   */
  const handleClearAllConversations = async () => {
    try {
      console.log('🗑️ Clearing all conversations...')
      
      // Delete from database first
      await databaseService.deleteAllConversations()
      
      // Clear local state after successful deletion
      setConversations([])
      setActiveConversationId(null)
      setError(null)
      setStreamingState({
        isStreaming: false,
        currentMessage: '',
        messageId: null
      })
      
      console.log('✅ All conversations cleared successfully')
      
    } catch (error) {
      console.error('❌ Failed to clear conversations:', error)
      setError(`Failed to clear conversations: ${error.message}`)
    }
  }
  
  const handleExportConversation = (id: string) => {
    try {
      const conversation = conversations.find(c => c.id === id)
      if (!conversation) {
        setError('Conversation not found')
        return
      }
      
      const exportData = {
        title: conversation.title,
        messages: conversation.messages,
        created_at: conversation.created_at,
        updated_at: conversation.updated_at,
        total_tokens: conversation.messages.reduce((sum, msg) => sum + (msg.total_tokens || 0), 0)
      }
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      })
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `conversation-${conversation.title.substring(0, 30)}-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('❌ Failed to export conversation:', error)
      setError('Failed to export conversation')
    }
  }

  if (isLoadingConversations) {
    return (
      <div className="h-screen flex bg-gray-50 overflow-hidden items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading conversations...</p>
        </div>
      </div>
    )
  }

  // ROUTING: Render different pages based on currentPage state
  const renderMainContent = () => {
    switch (currentPage) {
      case 'profile':
        return <ProfileSettingsPage onBack={handleBackToChat} />
      case 'pricing':
        return <PricingPlansPage onBack={handleBackToChat} onSelectPlan={handleSelectPlan} />
      case 'chat':
      default:
        return (
          <ChatArea
            conversation={activeConversation}
            selectedModel={selectedModel}
            onModelChange={handleModelChange}
            onUpgradePrompt={handleUpgradePrompt}
            onSendMessage={handleSendMessage}
            streamingState={streamingState}
            onCancelGeneration={handleCancelGeneration}
            error={error}
            onClearError={() => setError(null)}
            onRenameConversation={handleRenameConversation}
            onDeleteConversation={handleDeleteConversation}
            onExportConversation={() => {}}
          />
        )
    }
  }

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        currentPage={currentPage} // Pass current page
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        onProfileSettings={handleProfileSettings} // Profile handler
        onPricingPlans={handlePricingPlans} // Pricing handler
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        usageStats={null}
        onUpgrade={() => handleUpgrade()}
        onRenameConversation={handleRenameConversation}
        onDeleteConversation={handleDeleteConversation}
        onClearAllConversations={handleClearAllConversations}
      />
      
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {renderMainContent()}
      </div>

      {/* Usage Limit Exceeded Modal */}
      {limitExceededModal.isOpen && limitExceededModal.error && (
        <LimitExceededModal
          error={limitExceededModal.error}
          onClose={() => setLimitExceededModal({ isOpen: false, error: null })}
          onUpgrade={handleLimitExceededUpgrade}
          onTryTomorrow={limitExceededModal.error.errorType === 'DAILY_MESSAGE_LIMIT_EXCEEDED' ? handleTryTomorrow : undefined}
        />
      )}
    </div>
  )
}