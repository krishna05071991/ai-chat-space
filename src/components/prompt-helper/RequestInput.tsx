// FIXED: Clean request input screen - first step
import React, { useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'

interface RequestInputProps {
  initialValue: string
  onComplete: (request: string) => void
  onBack: () => void
}

export function RequestInput({ initialValue, onComplete, onBack }: RequestInputProps) {
  const [userRequest, setUserRequest] = useState(initialValue)

  const handleContinue = () => {
    if (userRequest.trim()) {
      onComplete(userRequest.trim())
    }
  }

  const canContinue = userRequest.trim().length > 0

  return (
    <div className="max-w-2xl mx-auto">
      {/* Clean header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          What do you want AI to help you with?
        </h2>
        <p className="text-gray-600">
          Describe your request clearly. We'll optimize it for the best results.
        </p>
      </div>

      {/* Simple input */}
      <div className="mb-8">
        <textarea
          value={userRequest}
          onChange={(e) => setUserRequest(e.target.value)}
          placeholder="Describe what you want help with..."
          className="w-full min-h-[150px] p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-y"
          autoFocus
        />
        <div className="text-right mt-2">
          <span className="text-xs text-gray-500">
            {userRequest.length} characters
          </span>
        </div>
      </div>

      {/* Clean navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          onClick={handleContinue}
          disabled={!canContinue}
          className={`flex items-center space-x-2 font-medium px-6 py-2 rounded-xl transition-all ${
            canContinue
              ? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Simple progress */}
      <div className="mt-6 flex justify-center">
        <div className="flex space-x-2">
          <div className="w-2 h-2 rounded-full bg-purple-500" />
          <div className="w-2 h-2 rounded-full bg-gray-300" />
          <div className="w-2 h-2 rounded-full bg-gray-300" />
          <div className="w-2 h-2 rounded-full bg-gray-300" />
        </div>
      </div>
    </div>
  )
}