// Authentication hook for chat.space platform
import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Clear corrupted session data and force re-authentication
  const clearInvalidSession = async () => {
    try {
      console.log('🧹 Clearing corrupted session data...')
      
      // Clear Supabase session
      await supabase.auth.signOut()
      
      // Clear any cached auth tokens from localStorage
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.includes('supabase') || key.includes('auth') || key.includes('token')) {
          localStorage.removeItem(key)
        }
      })
      
      // Clear sessionStorage as well
      sessionStorage.clear()
      
      console.log('✅ Session cleanup completed')
      
      // Reset user state
      setUser(null)
      setLoading(false)
      
      // DON'T reload the page - just let the auth flow handle it
      
    } catch (error) {
      console.log('Session cleanup completed with minor errors:', error)
      setUser(null)
      setLoading(false)
    }
  }

  // Check if current session is valid
  const isSessionValid = async (): Promise<boolean> => {
    try {
      console.log('🔍 Validating session...')
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.log('❌ Session validation error:', error.message)
        return false
      }
      
      if (!session || !session.access_token) {
        console.log('❌ No valid session found')
        return false
      }
      
      // Check if token is expired
      const now = Math.floor(Date.now() / 1000)
      if (session.expires_at && session.expires_at < now) {
        console.log('❌ Session token expired')
        return false
      }
      
      // Additional validation checks
      if (!session.user || !session.user.id || !session.user.email) {
        console.log('❌ Session missing user data')
        return false
      }
      
      if (session.user.aud !== 'authenticated') {
        console.log('❌ User not authenticated')
        return false
      }
      
      console.log('✅ Session is valid for user:', session.user.id.substring(0, 8))
      return true
    } catch (error) {
      console.log('❌ Session validation failed:', error)
      return false
    }
  }

  useEffect(() => {
    // Get initial session with simplified error handling
    const initializeAuth = async () => {
      try {
        console.log('🔐 Initializing authentication...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        // If there's an error or no session, just set no user and finish loading
        if (error || !session) {
          console.log('No session found or session error:', error?.message || 'No session')
          setUser(null)
          setLoading(false)
          return
        }
        
        // Basic validation - if it fails, just clear and continue
        if (!session.user || !session.user.id || !session.user.email) {
          console.log('Invalid session data, clearing')
          await clearInvalidSession()
          return
        }
        
        console.log('✅ Auth initialized with user:', session.user.id.substring(0, 8))
        setUser(session.user)
        setLoading(false)
        
      } catch (error) {
        console.error('❌ Failed to initialize auth:', error)
        // Don't get stuck in loops - just set no user and finish loading
        setUser(null)
        setLoading(false)
      }
    }
    
    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state changed:', event, {
          hasSession: !!session,
          hasUser: !!session?.user,
          userId: session?.user?.id?.substring(0, 8) || 'none'
        })
        
        // Simple state management - no complex validation
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      return { data, error }
    } catch (error) {
      console.error('Sign up error:', error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { data, error }
    } catch (error) {
      console.error('Sign in error:', error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      
      // Clear session data but don't reload page
      localStorage.clear()
      sessionStorage.clear()
      setUser(null)
      
      return { error }
    } catch (error) {
      console.error('Sign out error:', error)
      setUser(null)
      return { error }
    } finally {
      setLoading(false)
    }
  }

  return {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    clearInvalidSession,
    isSessionValid,
  }
}