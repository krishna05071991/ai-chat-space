import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { ChatArea } from './ChatArea'
import { LimitExceededModal, UsageLimitError } from '../usage/LimitExceededModal'
import { PricingModal } from '../pricing/PricingModal'
import { useAuth } from '../../hooks/useAuth'
import { useDatabaseSync } from '../../hooks/useDatabaseSync'
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

  // USAGE LIMIT MODAL STATE
  const [limitExceededModal, setLimitExceededModal] = useState<{
    isOpen: boolean
    error: UsageLimitError | null
  }>({ isOpen: false, error: null })

  // PRICING MODAL STATE
  const [pricingModal, setPricingModal] = useState<{
    isOpen: boolean
    highlightTier?: string
  }>({ isOpen: false })

  const abortControllerRef = useRef<AbortController | null>(null)

  // Database sync hook
  const { saveImmediately, syncWithDatabase, lastSync, hasLoadedInitial } = useDatabaseSync({
    conversations,
    onConversationsUpdated: setConversations,
    autoSaveInterval: 30000
  })

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

  // Get active conversation from React state
  const activeConversation = conversations.find(c => c.id === activeConversationId) || null

  // Clear conversations when user signs out
  useEffect(() => {
    if (!user) {
      setConversations([])
      setActiveConversationId(null)
      setError(null)
      setStreamingState({
        isStreaming: false,
        currentMessage: '',
        messageId: null
      })
    }
  }, [user])

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



  const handleNewChat = useCallback(() => {
    if (!user) return
    
    const newConversation = createNewConversation('New Chat')
    setActiveConversationId(newConversation.id)
    setSidebarOpen(false)
    setError(null)
    setStreamingState({
      isStreaming: false,
      currentMessage: '',
      messageId: null
    })
  }, [user, createNewConversation])

  const handleSelectConversation = useCallback((id: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    streamingService.cancelStreaming()
    
    setActiveConversationId(id)
    setSidebarOpen(false)
    setError(null)
    setStreamingState({
      isStreaming: false,
      currentMessage: '',
      messageId: null
    })
  }, [])

  const handleModelChange = useCallback((model: AIModel) => {
    setSelectedModel(model)
  }, [])

  // Enhanced model change with upgrade prompts
  const handleUpgradePrompt = useCallback((requiredTier: string) => {
    setPricingModal({ isOpen: true, highlightTier: requiredTier })
  }, [])

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

    // Prepare conversation history for Edge Function
    const conversationHistory = [...targetConversation.messages, userMessage]

    // Start streaming
    setStreamingState({
      isStreaming: true,
      currentMessage: '',
      messageId: crypto.randomUUID()
    })

    abortControllerRef.current = new AbortController()

    try {
      // ONLY call Edge Function - it handles ALL message saving
      await streamingService.sendStreamingMessage(
        conversationHistory,
        selectedModel,
        {
          onToken: (token: string) => {
            setStreamingState(prev => ({
              ...prev,
              currentMessage: prev.currentMessage + token
            }))
          },
          onComplete: (fullContent: string, usage?: TokenUsage) => {
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
    setPricingModal({ isOpen: true, highlightTier: tier })
  }, [])

  const handleSelectPlan = useCallback((tier: string) => {
    console.log('Selected plan:', tier)
    setPricingModal({ isOpen: false })
    // TODO: Implement actual subscription logic
    alert(`Upgrading to ${tier} plan! (This would integrate with your payment processor)`)
  }, [])

  // Handle limit exceeded modal actions
  const handleLimitExceededUpgrade = useCallback((tier: string) => {
    setLimitExceededModal({ isOpen: false, error: null })
    setPricingModal({ isOpen: true, highlightTier: tier })
  }, [])

  const handleTryTomorrow = useCallback(() => {
    setLimitExceededModal({ isOpen: false, error: null })
    setError('Daily limit reached. Try again tomorrow or upgrade for unlimited access.')
  }, [])

  // Other handlers remain the same
  const handleRenameConversation = (id: string, newTitle: string) => {
    updateConversation(id, { title: newTitle })
    saveImmediately()
  }
  
  const handleDeleteConversation = async (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id))
    if (id === activeConversationId) {
      const remaining = conversations.filter(c => c.id !== id)
      if (remaining.length > 0) {
        setActiveConversationId(remaining[0].id)
      } else {
        setActiveConversationId(null)
      }
    }
    await saveImmediately()
  }
  
  const handleClearAllConversations = async () => {
    try {
      console.log('🗑️ Clearing conversations from database...')
      
      // Delete from database first
      await databaseService.deleteAllConversations()
      console.log('✅ Database deletion completed')
      
      // Clear React state
      setConversations([])
      setActiveConversationId(null)
      
      // Create new conversation
      if (user) {
        const newConversation = createNewConversation('New Chat')
        setActiveConversationId(newConversation.id)
      }
      
      await saveImmediately()
      console.log('✅ Clear conversations completed successfully')
    } catch (error) {
      console.error('❌ Failed to clear conversations:', error)
      setError('Failed to clear conversations. Please try again.')
    }
  }

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        usageStats={null}
        onUpgrade={() => handleUpgrade()}
        onRenameConversation={handleRenameConversation}
        onDeleteConversation={handleDeleteConversation}
        onClearAllConversations={handleClearAllConversations}
      />
      
      <div className="flex-1 flex flex-col min-w-0 h-full">
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

      {/* Pricing Modal */}
      {pricingModal.isOpen && (
        <PricingModal
          isOpen={pricingModal.isOpen}
          onClose={() => setPricingModal({ isOpen: false })}
          currentTier="free"
          onSelectPlan={handleSelectPlan}
        />
      )}
    </div>
  )
}