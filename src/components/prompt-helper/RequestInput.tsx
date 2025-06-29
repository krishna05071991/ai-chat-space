// MINIMAL: Clean request input
import React, { useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'

interface RequestInputProps {
  initialValue: string
  onComplete: (request: string) => void
  onBack: () => void
}

export function RequestInput({ initialValue, onComplete, onBack }: RequestInputProps) {
  const [request, setRequest] = useState(initialValue)

  const handleContinue = () => {
    if (request.trim()) {
      onComplete(request.trim())
    }
  }

  return (
    <div className="max-w-lg mx-auto py-4">
      <h2 className="text-lg font-bold text-gray-800 mb-3 text-center">
        What do you need help with?
      </h2>
      
      <textarea
        value={request}
        onChange={(e) => setRequest(e.target.value)}
        placeholder="Describe your request..."
        className="w-full h-32 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm"
        autoFocus
      />

      <div className="flex items-center justify-between mt-4">
        <button
          onClick={onBack}
          className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-xl text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          onClick={handleContinue}
          disabled={!request.trim()}
          className={`flex items-center space-x-1 px-4 py-2 rounded-xl text-sm font-medium ${
            request.trim()
              ? 'bg-purple-600 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Progress */}
      <div className="flex justify-center mt-4">
        <div className="flex space-x-1">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
          <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
          <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
          <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
        </div>
      </div>
    </div>
  )
}