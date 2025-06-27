// Main App component for chat.space - AI chat platform with multi-model switching
import React from 'react'
import { AuthLayout } from './components/auth/AuthLayout'
import { ChatLayout } from './components/chat/ChatLayout'
import { ProfileSetupScreen } from './components/onboarding/ProfileSetupScreen'
import { useAuth } from './hooks/useAuth'
import { useUserProfile } from './hooks/useUserProfile'

function App() {
  const { user, loading } = useAuth()
  const { profile, needsOnboarding, loading: profileLoading, refetchProfile } = useUserProfile()

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

  // Not authenticated - show auth
  if (!user) {
    return <AuthLayout />
  }

  // Loading profile data
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

  // Authenticated but needs onboarding
  if (needsOnboarding) {
    return <ProfileSetupScreen onComplete={refetchProfile} />
  }

  // Authenticated and onboarded - show main app
  return <ChatLayout />
}

export default App