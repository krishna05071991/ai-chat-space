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
      
      // Force page reload to completely re-initialize Supabase client
      window.location.reload()
      
    } catch (error) {
      console.log('Session cleanup completed with minor errors:', error)
      setUser(null)
      setLoading(false)
      
      // Force page reload even if cleanup had errors
      window.location.reload()
    }
  }

  // Check if current session is valid
  const isSessionValid = async (): Promise<boolean> => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.log('Session validation error:', error.message)
        return false
      }
      
      if (!session || !session.access_token) {
        console.log('No valid session found')
        return false
      }
      
      // Check if token is expired
      const now = Math.floor(Date.now() / 1000)
      if (session.expires_at && session.expires_at < now) {
        console.log('Session token expired')
        return false
      }
      
      return true
    } catch (error) {
      console.log('Session validation failed:', error)
      return false
    }
  }
  useEffect(() => {
    // Get initial session with error handling
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth initialization error:', error)
          if (error.message?.includes('refresh_token_not_found') || 
              error.message?.includes('Invalid Refresh Token')) {
            console.log('Detected corrupted auth state, clearing session...')
            await clearInvalidSession()
            return
          }
        }
        
        setUser(session?.user ?? null)
        setLoading(false)
      } catch (error) {
        console.error('Failed to initialize auth:', error)
        await clearInvalidSession()
      }
    }
    
    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state changed:', event)
        
        if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          if (event === 'TOKEN_REFRESHED' && !session) {
            console.log('Token refresh failed, clearing session')
            await clearInvalidSession()
            return
          }
        }
        
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
      
      // Clear any remaining session data
      await clearInvalidSession()
      
      return { error }
    } catch (error) {
      console.error('Sign out error:', error)
      await clearInvalidSession()
      return { error }
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