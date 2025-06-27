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
  const { profile, loading: profileLoading, refetchProfile } = useUserProfile()
  const { conversations } = useDatabaseSync()

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

  // CRITICAL: Not authenticated - ALWAYS show auth first
  if (!user) {
    return <AuthLayout />
  }

  // CRITICAL: Wait for profile data to load before proceeding
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

  // CRITICAL: Additional safety checks for onboarding
  // Only show onboarding if:
  // 1. User is definitely authenticated
  // 2. User has no profile name
  // 3. User has no conversations (truly new)
  // 4. Profile loading is complete (not null due to error)
  const isNewUser = user && 
                    user.id && 
                    !profile?.full_name && 
                    conversations.length === 0 &&
                    !profileLoading
  
  // CRITICAL: Show simple name setup ONLY for brand new users without any activity
  if (isNewUser) {
    return <SimpleNameSetupScreen onComplete={refetchProfile} />
  }

  // Authenticated and onboarded - show main app
  return <ChatLayout />
}

export default App