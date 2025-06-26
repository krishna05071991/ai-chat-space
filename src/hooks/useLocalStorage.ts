// Local storage hook for offline-first conversation management
import { useState, useEffect } from 'react'
import { Conversation, Message } from '../types/chat'

const CONVERSATIONS_KEY = 'chat-space-conversations'

interface ConversationUpdate {
  title?: string
  model_history?: string[]
  total_tokens?: number
  updated_at?: string
}

export function useLocalStorage() {
  const [conversations, setConversations] = useState<Conversation[]>([])

  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = () => {
    try {
      const stored = localStorage.getItem(CONVERSATIONS_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setConversations(parsed)
      }
    } catch (error) {
      console.error('Error loading conversations from localStorage:', error)
    }
  }

  const saveConversations = (newConversations: Conversation[]) => {
    try {
      // Sort conversations by updated_at (most recent first)
      const sortedConversations = [...newConversations].sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )
      
      localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(sortedConversations))
      setConversations(sortedConversations)
      
      // Force immediate state update for better UI responsiveness
      setTimeout(() => {
        setConversations([...sortedConversations])
      }, 0)
    } catch (error) {
      console.error('Error saving conversations to localStorage:', error)
      // Try to recover by clearing corrupted data
      if (error instanceof Error && error.message.includes('quota')) {
        console.warn('localStorage quota exceeded, clearing old conversations')
        try {
          localStorage.removeItem(CONVERSATIONS_KEY)
          setConversations([])
        } catch (clearError) {
          console.error('Failed to clear localStorage:', clearError)
        }
      }
    }
  }

  const createConversation = (userId: string, title: string): Conversation => {
    const newConversation: Conversation = {
      id: crypto.randomUUID(),
      user_id: userId,
      title,
      model_history: [],
      messages: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const updated = [newConversation, ...conversations]
    saveConversations(updated)
    return newConversation
  }

  const updateConversation = (conversationId: string, updates: ConversationUpdate) => {
    console.log('📝 Updating conversation:', {
      conversationId,
      updates: Object.keys(updates)
    })

    const updated = conversations.map(conv =>
      conv.id === conversationId
        ? { ...conv, ...updates, updated_at: new Date().toISOString() }
        : conv
    )
    
    const foundConversation = updated.find(conv => conv.id === conversationId)
    if (!foundConversation) {
      console.warn(`Conversation ${conversationId} not found when updating`)
      return
    }
    
    saveConversations(updated)
  }

  const renameConversation = (conversationId: string, newTitle: string) => {
    console.log('📝 Renaming conversation:', {
      conversationId,
      newTitle: newTitle.substring(0, 50)
    })
    
    updateConversation(conversationId, { title: newTitle.trim() })
  }

  const deleteConversation = (conversationId: string) => {
    console.log('🗑️ Deleting conversation:', conversationId)
    
    const updated = conversations.filter(conv => conv.id !== conversationId)
    saveConversations(updated)
    
    console.log('✅ Conversation deleted. Remaining conversations:', updated.length)
  }

  const clearAllConversations = () => {
    console.log('🧹 Clearing all conversations')
    
    try {
      localStorage.removeItem(CONVERSATIONS_KEY)
      setConversations([])
      console.log('✅ All conversations cleared')
    } catch (error) {
      console.error('Error clearing conversations:', error)
    }
  }

  const exportConversations = () => {
    try {
      const dataStr = JSON.stringify(conversations, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `chat-space-conversations-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      console.log('📤 Conversations exported successfully')
    } catch (error) {
      console.error('Error exporting conversations:', error)
    }
  }

  const addMessage = (conversationId: string, message: Message | Omit<Message, 'id' | 'created_at'>) => {
    const newMessage: Message = 'id' in message ? message : {
      ...message,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    }

    console.log('💬 Adding message to conversation:', {
      conversationId,
      messageId: newMessage.id,
      messageRole: newMessage.role,
      contentPreview: newMessage.content.substring(0, 50) + '...',
      messageLength: newMessage.content.length
    })

    const updated = conversations.map(conv => 
      conv.id === conversationId
        ? {
            ...conv,
            messages: [...conv.messages, newMessage],
            updated_at: new Date().toISOString(),
          }
        : conv
    )
    
    // Ensure the conversation exists
    const foundConversation = updated.find(conv => conv.id === conversationId)
    if (!foundConversation) {
      console.warn(`Conversation ${conversationId} not found when adding message`)
      console.log('Available conversations:', conversations.map(c => ({ id: c.id, title: c.title })))
      return newMessage
    }
    
    console.log('✅ Message successfully added:', {
      conversationId,
      totalMessagesAfter: foundConversation.messages.length,
      newMessageId: newMessage.id,
      messageRoles: foundConversation.messages.map(m => m.role),
      lastFewMessages: foundConversation.messages.slice(-3).map(m => ({
        role: m.role,
        contentPreview: m.content.substring(0, 30) + '...'
      }))
    })

    // Save to localStorage and update state
    saveConversations(updated)

    return newMessage
  }

  // Debug function to inspect localStorage state
  const debugLocalStorage = () => {
    console.log('🔍 localStorage Debug Info:', {
      totalConversations: conversations.length,
      localStorageSize: localStorage.getItem(CONVERSATIONS_KEY)?.length || 0,
      conversations: conversations.map(c => ({
        id: c.id,
        title: c.title,
        messageCount: c.messages.length,
        lastUpdated: c.updated_at
      }))
    })
  }

  return {
    conversations,
    createConversation,
    updateConversation,
    renameConversation,
    addMessage,
    deleteConversation,
    clearAllConversations,
    exportConversations,
    debugLocalStorage,
  }
}