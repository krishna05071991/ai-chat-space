// NEW: Full-page Profile Settings component
import React from 'react'
import { ArrowLeft, User } from 'lucide-react'
import { ProfileSettings } from '../settings/ProfileSettings'
import { Logo } from '../common/Logo'

interface ProfileSettingsPageProps {
  onBack: () => void
}

export function ProfileSettingsPage({ onBack }: ProfileSettingsPageProps) {
  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
      {/* Clean page header */}
      <div className="relative z-20 flex-shrink-0 border-b border-gray-200">
        <div className="flex items-center justify-between py-6 px-4 lg:px-6">
          {/* Back button */}
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Chat</span>
          </button>

          {/* Page title */}
          <div className="flex items-center space-x-3">
            <User className="w-5 h-5 text-purple-600" />
            <h1 className="text-xl font-semibold text-gray-800">Profile Settings</h1>
          </div>

          {/* Logo for desktop */}
          <div className="hidden lg:block">
            <Logo size="md" compact />
          </div>
        </div>
      </div>

      {/* Page content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4 lg:p-8">
          <ProfileSettings />
        </div>
      </div>
    </div>
  )
}