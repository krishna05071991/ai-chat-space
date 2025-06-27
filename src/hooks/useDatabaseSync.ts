// Simple hook to check if user has conversations (to determine if they're new)
import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import { databaseService } from '../lib/databaseService'

export function useDatabaseSync() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadConversations = async () => {
      if (!user) {
        setConversations([])
        setLoading(false)
        return
      }

      try {
        const dbConversations = await databaseService.loadConversations()
        setConversations(dbConversations || [])
      } catch (error) {
        console.error('Failed to load conversations:', error)
        setConversations([])
      } finally {
        setLoading(false)
      }
    }

    loadConversations()
  }, [user])

  return {
    conversations,
    loading
  }
}