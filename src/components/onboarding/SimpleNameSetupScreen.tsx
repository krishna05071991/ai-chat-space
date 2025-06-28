// Simple name setup for new users with Chat Models branding
import React, { useState } from 'react'
import { User, ArrowRight, Sparkles, SkipForward } from 'lucide-react'
import { Logo } from '../common/Logo'
import { databaseService } from '../../lib/databaseService'

interface SimpleNameSetupScreenProps {
  onComplete: () => void
}

export function SimpleNameSetupScreen({ onComplete }: SimpleNameSetupScreenProps) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    fullName: '',
    location: '',
    profession: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.fullName.trim()) {
      setError('Please enter your name')
      return
    }

    setStep(2) // Move to next question
    setError(null)
  }

  const handleLocationSubmit = async () => {
    setStep(3) // Move to profession question
  }

  const handleSkipLocation = () => {
    setStep(3) // Skip to profession
  }

  const handleComplete = async (skipProfession = false) => {
    setLoading(true)
    setError(null)

    try {
      await databaseService.updateUserProfile({
        full_name: formData.fullName.trim(),
        location: formData.location.trim() || null,
        profession: (skipProfession ? null : formData.profession.trim()) || null,
        onboarding_completed: true
      })

      onComplete()
    } catch (err) {
      console.error('Profile setup error:', err)
      setError('Failed to save. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSkipProfession = () => {
    handleComplete(true)
  }

  const renderNameStep = () => (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <Logo showText={true} size="lg" />
        </div>
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Sparkles className="w-5 h-5 text-purple-500" />
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">
            Welcome to Chat Models!
          </h1>
        </div>
        <p className="text-gray-600 text-sm sm:text-base">
          What should we call you?
        </p>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl border border-purple-100 p-6 sm:p-8">
        <form onSubmit={handleNameSubmit} className="space-y-6">
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
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                className="block w-full pl-9 sm:pl-10 pr-3 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm sm:text-base"
                placeholder="Enter your name"
                maxLength={100}
                autoFocus
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={!formData.fullName.trim()}
            className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium py-2.5 sm:py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center group disabled:opacity-50 text-sm sm:text-base disabled:cursor-not-allowed"
          >
            Continue
            <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </div>
    </div>
  )

  const renderLocationStep = () => (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <Logo showText={true} size="lg" />
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4">
          Hi {formData.fullName.split(' ')[0]}! 👋
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Where are you based? <span className="text-gray-400">(optional)</span>
        </p>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl border border-purple-100 p-6 sm:p-8">
        <div className="space-y-6">
          <div>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              className="block w-full px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm sm:text-base"
              placeholder="e.g., San Francisco, London, Remote"
              maxLength={100}
              autoFocus
            />
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleSkipLocation}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm flex items-center justify-center"
            >
              <SkipForward className="w-4 h-4 mr-2" />
              Skip
            </button>
            <button
              onClick={handleLocationSubmit}
              className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium py-2.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center group text-sm"
            >
              Continue
              <ArrowRight className="ml-2 h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderProfessionStep = () => (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <Logo showText={true} size="lg" />
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4">
          One last thing...
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          What do you do? <span className="text-gray-400">(optional)</span>
        </p>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl border border-purple-100 p-6 sm:p-8">
        <div className="space-y-6">
          <div>
            <input
              type="text"
              value={formData.profession}
              onChange={(e) => setFormData(prev => ({ ...prev, profession: e.target.value }))}
              className="block w-full px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm sm:text-base"
              placeholder="e.g., Software Developer, Designer, Student"
              maxLength={100}
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={handleSkipProfession}
              disabled={loading}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm flex items-center justify-center disabled:opacity-50"
            >
              <SkipForward className="w-4 h-4 mr-2" />
              Skip & Start
            </button>
            <button
              onClick={() => handleComplete(false)}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium py-2.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center group text-sm disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Complete Setup
                  <ArrowRight className="ml-2 h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              You can always update this information later in settings
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex items-center justify-center p-4">
      {step === 1 && renderNameStep()}
      {step === 2 && renderLocationStep()}
      {step === 3 && renderProfessionStep()}
    </div>
  )
}