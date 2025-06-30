import React, { useState } from 'react'
import { ArrowLeft, ArrowRight, Wand2 } from 'lucide-react'

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
    <div className="py-4">
      <div className="flex items-center justify-center space-x-2 mb-4">
        <Wand2 className="w-5 h-5 text-purple-600" />
        <h2 className="text-lg font-bold text-gray-800">Smart Prompt Mode</h2>
      </div>
      
      <p className="text-gray-600 text-sm text-center mb-6">
        I'll help you create the perfect prompt for better AI results
      </p>
      
      <textarea
        value={request}
        onChange={(e) => setRequest(e.target.value)}
        placeholder="What would you like help with? Be as specific as possible..."
        className="w-full h-40 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-base leading-relaxed"
        autoFocus
      />

      <div className="flex items-center justify-between mt-4">
        <button
          onClick={onBack}
          className="flex items-center space-x-1 px-3 py-2 text-gray-500 hover:text-gray-700 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit</span>
        </button>

        <button
          onClick={handleContinue}
          disabled={!request.trim()}
          className={`flex items-center space-x-1 px-6 py-3 rounded-xl text-sm font-medium transition-all ${
            request.trim()
              ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}