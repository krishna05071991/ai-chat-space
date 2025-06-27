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
  
  // Show loading spinner while authentication is being resolved
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

  // Simple authentication check
  const isAuthenticated = user && user.id && user.email

  console.log('🔐 Authentication status:', {
    hasUser: !!user,
    hasUserId: !!user?.id,
    hasEmail: !!user?.email,
    isAuthenticated
  })

  // If no authenticated user, show auth screen
  if (!isAuthenticated) {
    console.log('🚫 User not properly authenticated, showing auth screen')
    return <AuthLayout />
  }

  // User is authenticated, proceed to main app
  console.log('✅ User is authenticated, proceeding...')
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