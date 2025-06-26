// Main App component for chat.space - AI chat platform with multi-model switching
import React from 'react'
import { AuthLayout } from './components/auth/AuthLayout'
import { ChatLayout } from './components/chat/ChatLayout'
import { useAuth } from './hooks/useAuth'

function App() {
  const { user, loading } = useAuth()

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

  return user ? <ChatLayout /> : <AuthLayout />
}

export default App