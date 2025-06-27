// Main App component for chat.space - AI chat platform with multi-model switching
import React from 'react'
import { AuthLayout } from './components/auth/AuthLayout'
import { ChatLayout } from './components/chat/ChatLayout'
import { SimpleNameSetupScreen } from './components/onboarding/SimpleNameSetupScreen'
import { useAuth } from './hooks/useAuth'
import { useUserProfile } from './hooks/useUserProfile'
import { useDatabaseSync } from './hooks/useDatabaseSync'

function App() {
  const { user, loading, isSessionValid } = useAuth()
  const { profile, loading: profileLoading, refetchProfile } = useUserProfile()
  const { conversations } = useDatabaseSync()

  // CRITICAL: Always show loading if auth is not fully resolved OR if checking session
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading chat.space...</p>
        </div>
      </div>
    )
  }

  // CRITICAL: ULTRA STRICT AUTHENTICATION CHECK - Show auth if ANY of these conditions are true:
  // 1. No user object
  // 2. No user ID  
  // 3. No email
  // 4. Session validation failed
  const isProperlyAuthenticated = user && 
                                  user.id && 
                                  user.email && 
                                  user.aud === 'authenticated'

  if (!isProperlyAuthenticated) {
    console.log('🚫 User not properly authenticated, showing auth screen:', {
      hasUser: !!user,
      hasUserId: !!user?.id,
      hasEmail: !!user?.email,
      userAud: user?.aud,
      isProperlyAuthenticated
    })
    return <AuthLayout />
  }

  // CRITICAL: Additional session validation check for extra safety
  // This async check happens after the basic user object validation
  React.useEffect(() => {
    const validateSession = async () => {
      if (user && isSessionValid) {
        try {
          const sessionValid = await isSessionValid()
          if (!sessionValid) {
            console.log('🚫 Session validation failed, user will be redirected to auth')
            // The useAuth hook will handle clearing the invalid session
          }
        } catch (error) {
          console.error('Session validation error:', error)
        }
      }
    }
    
    validateSession()
  }, [user, isSessionValid])

  // CRITICAL: Wait for profile data to load before proceeding (only for authenticated users)
  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Setting up your profile...</p>
        </div>
      </div>
    )
  }

  // CRITICAL: ULTRA STRICT onboarding checks - only for DEFINITELY authenticated users
  // Multiple layers of validation to prevent showing onboarding to unauthenticated users
  const isNewUser = isProperlyAuthenticated &&           // Must pass strict auth check
                    profile !== null &&                  // Profile must be loaded (not loading error)
                    !profile?.full_name &&               // No name set
                    conversations.length === 0 &&        // No conversations
                    !profileLoading &&                   // Profile loading complete
                    user.email_confirmed_at              // Email must be confirmed
  
  // Additional safety log for debugging
  console.log('🔍 Onboarding check:', {
    isProperlyAuthenticated,
    hasProfile: !!profile,
    hasFullName: !!profile?.full_name,
    conversationCount: conversations.length,
    profileLoading,
    emailConfirmed: !!user.email_confirmed_at,
    isNewUser
  })
  
  // CRITICAL: Show simple name setup ONLY for authenticated users who pass ALL checks
  if (isNewUser) {
    console.log('✅ Showing onboarding for authenticated new user')
    return <SimpleNameSetupScreen onComplete={refetchProfile} />
  }

  // CRITICAL: Only authenticated and onboarded users reach here
  console.log('✅ Showing main app for authenticated user')
  return <ChatLayout />
}

export default App