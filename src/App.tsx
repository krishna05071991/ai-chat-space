// Main App component for chat.space - AI chat platform with multi-model switching
import React, { useEffect } from 'react'
import { AuthLayout } from './components/auth/AuthLayout'
import { ChatLayout } from './components/chat/ChatLayout'
import { SimpleNameSetupScreen } from './components/onboarding/SimpleNameSetupScreen'
import { useAuth } from './hooks/useAuth'
import { useUserProfile } from './hooks/useUserProfile'
import { useDatabaseSync } from './hooks/useDatabaseSync'

function App() {
  const { user, loading, isSessionValid, clearInvalidSession } = useAuth()
  
  // CRITICAL: Validate session on every render and clear if invalid
  useEffect(() => {
    const validateSession = async () => {
      if (user && user.id) {
        console.log('🔍 Validating session for user:', user.id.substring(0, 8))
        
        const valid = await isSessionValid()
        if (!valid) {
          console.log('🚫 Session is invalid, clearing session...')
          await clearInvalidSession()
          return
        }
        
        console.log('✅ Session is valid')
      }
    }
    
    // Only validate if we think we have a user
    if (user && !loading) {
      validateSession()
    }
  }, [user, loading, isSessionValid, clearInvalidSession])
  
  // CRITICAL: Always show loading if auth is not fully resolved
  if (loading) {
    console.log('⏳ Authentication loading...')
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading chat.space...</p>
        </div>
      </div>
    )
  }

  // CRITICAL: STRICTEST POSSIBLE AUTHENTICATION CHECK
  // Multiple layers of validation to ensure user is DEFINITELY authenticated
  const isDefinitelyAuthenticated = (
    user && 
    user.id && 
    user.email && 
    user.aud === 'authenticated' &&
    user.role === 'authenticated' &&
    user.email_confirmed_at &&  // Email must be confirmed
    !user.banned_until &&       // User not banned
    user.created_at &&          // User has creation date
    user.updated_at             // User has update date
  )

  console.log('🔐 Authentication validation:', {
    hasUser: !!user,
    hasUserId: !!user?.id,
    hasEmail: !!user?.email,
    userAud: user?.aud,
    userRole: user?.role,
    emailConfirmed: !!user?.email_confirmed_at,
    notBanned: !user?.banned_until,
    hasCreatedAt: !!user?.created_at,
    hasUpdatedAt: !!user?.updated_at,
    isDefinitelyAuthenticated
  })

  // CRITICAL: If ANY authentication check fails, show auth screen
  if (!isDefinitelyAuthenticated) {
    console.log('🚫 User not properly authenticated, showing auth screen')
    return <AuthLayout />
  }

  // CRITICAL: Only proceed if user is DEFINITELY authenticated
  console.log('✅ User is definitively authenticated, proceeding...')
  return <AuthenticatedApp user={user} />
}

// Separate component for authenticated users only
function AuthenticatedApp({ user }: { user: any }) {
  const { profile, loading: profileLoading, refetchProfile } = useUserProfile()
  const { conversations } = useDatabaseSync()

  console.log('👤 AuthenticatedApp loaded for user:', user.id.substring(0, 8))

  // Wait for profile data to load
  if (profileLoading) {
    console.log('⏳ Profile loading...')
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Setting up your profile...</p>
        </div>
      </div>
    )
  }

  // CRITICAL: Onboarding check - with additional safety measures
  const isNewUser = user && 
                    user.id && 
                    user.email && 
                    user.aud === 'authenticated' &&     
                    profile !== null &&                 
                    !profile?.full_name &&              
                    conversations.length === 0 &&       
                    !profileLoading                     
  
  console.log('🔍 Onboarding decision:', {
    userId: user.id.substring(0, 8),
    hasProfile: !!profile,
    hasFullName: !!profile?.full_name,
    conversationCount: conversations.length,
    isNewUser
  })
  
  // Show onboarding for new authenticated users
  if (isNewUser) {
    console.log('📝 Showing onboarding for new user')
    return <SimpleNameSetupScreen onComplete={refetchProfile} />
  }

  // Show main app for existing authenticated users
  console.log('🏠 Showing main app for existing user')
  return <ChatLayout />
}

export default App