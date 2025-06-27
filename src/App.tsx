// Main App component for chat.space - AI chat platform with multi-model switching
import React from 'react'
import { AuthLayout } from './components/auth/AuthLayout'
import { ChatLayout } from './components/chat/ChatLayout'
import { SimpleNameSetupScreen } from './components/onboarding/SimpleNameSetupScreen'
import { useAuth } from './hooks/useAuth'
import { useUserProfile } from './hooks/useUserProfile'
import { useDatabaseSync } from './hooks/useDatabaseSync'

function App() {
  const { user, loading } = useAuth()
  
  // CRITICAL: Always show loading if auth is not fully resolved
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

  // CRITICAL: FIRST AND ABSOLUTE PRIORITY - Authentication check
  // If user is not authenticated, IMMEDIATELY show auth screen - NO EXCEPTIONS
  if (!user || !user.id || !user.email || user.aud !== 'authenticated') {
    console.log('🚫 User not authenticated, showing auth screen:', {
      hasUser: !!user,
      hasUserId: !!user?.id,
      hasEmail: !!user?.email,
      userAud: user?.aud
    })
    return <AuthLayout />
  }

  // CRITICAL: Only call these hooks AFTER confirming authentication
  // This prevents any data fetching for non-authenticated users
  return <AuthenticatedApp user={user} />
}

// Separate component for authenticated users only
function AuthenticatedApp({ user }: { user: any }) {
  const { profile, loading: profileLoading, refetchProfile } = useUserProfile()
  const { conversations } = useDatabaseSync()

  // Wait for profile data to load
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

  // CRITICAL: Onboarding check - with additional safety measures
  // Only show onboarding if ALL conditions are met AND user is definitely authenticated
  const isNewUser = user && 
                    user.id && 
                    user.email && 
                    user.aud === 'authenticated' &&     // Double-check authentication
                    profile !== null &&                 // Profile loaded successfully
                    !profile?.full_name &&              // No name set
                    conversations.length === 0 &&       // No conversations exist
                    !profileLoading                     // Profile loading complete
  
  console.log('🔍 Onboarding decision for authenticated user:', {
    userId: user.id,
    userEmail: user.email,
    userAud: user.aud,
    hasProfile: !!profile,
    hasFullName: !!profile?.full_name,
    conversationCount: conversations.length,
    profileLoading,
    isNewUser
  })
  
  // Show onboarding for new authenticated users
  if (isNewUser) {
    console.log('✅ Showing onboarding for authenticated new user')
    return <SimpleNameSetupScreen onComplete={refetchProfile} />
  }

  // Show main app for existing authenticated users
  console.log('✅ Showing main app for authenticated user')
  return <ChatLayout />
}

export default App