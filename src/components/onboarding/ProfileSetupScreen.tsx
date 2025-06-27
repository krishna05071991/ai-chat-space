// Mobile-first profile setup onboarding screen
import React, { useState } from 'react'
import { User, MapPin, Briefcase, ArrowRight, Sparkles } from 'lucide-react'
import { Logo } from '../common/Logo'
import { databaseService } from '../../lib/databaseService'

interface ProfileSetupScreenProps {
  onComplete: () => void
}

export function ProfileSetupScreen({ onComplete }: ProfileSetupScreenProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    location: '',
    profession: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.fullName.trim()) {
      setError('Please enter your name')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await databaseService.updateUserProfile({
        full_name: formData.fullName.trim(),
        location: formData.location.trim() || null,
        profession: formData.profession.trim() || null,
        onboarding_completed: true
      })

      onComplete()
    } catch (err) {
      console.error('Profile setup error:', err)
      setError('Failed to save profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const isValid = formData.fullName.trim().length > 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo showText={true} size="lg" />
          </div>
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">
              Welcome to chat.space!
            </h1>
          </div>
          <p className="text-gray-600 text-sm sm:text-base">
            Let's set up your profile to personalize your experience
          </p>
        </div>

        {/* Profile setup form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl border border-purple-100 p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name field - required */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className="block w-full pl-9 sm:pl-10 pr-3 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm sm:text-base"
                  placeholder="Enter your full name"
                  maxLength={100}
                />
              </div>
            </div>

            {/* Location field - optional */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Where are you based? <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="block w-full pl-9 sm:pl-10 pr-3 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm sm:text-base"
                  placeholder="e.g., San Francisco, London, Remote"
                  maxLength={100}
                />
              </div>
            </div>

            {/* Profession field - optional */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What do you do? <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={formData.profession}
                  onChange={(e) => handleInputChange('profession', e.target.value)}
                  className="block w-full pl-9 sm:pl-10 pr-3 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm sm:text-base"
                  placeholder="e.g., Software Developer, Designer, Student"
                  maxLength={100}
                />
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={!isValid || loading}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium py-2.5 sm:py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center group disabled:opacity-50 text-sm sm:text-base disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Complete Setup
                  <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Help text */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Don't worry, you can always update this information later in your settings
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}