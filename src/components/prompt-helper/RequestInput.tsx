// Request Input screen - User enters what they want to do (Step 1)
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

  const examplePrompts = [
    "Write a React component for a shopping cart",
    "Analyze the environmental impact of electric vehicles",
    "Create a short story about time travel",
    "Explain quantum computing in simple terms",
    "Design a database schema for a social media app"
  ]

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-4">
          What do you want AI to help you with?
        </h2>
        <p className="text-lg text-gray-600">
          Describe your request as specifically as possible. We'll help you optimize it for the best results.
        </p>
      </div>

      {/* Main Input Area */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Your Request
        </label>
        <textarea
          value={userRequest}
          onChange={(e) => setUserRequest(e.target.value)}
          placeholder="Describe exactly what you want help with..."
          className="w-full min-h-[200px] max-h-[400px] p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-y text-base"
          autoFocus
        />
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-gray-500">
            💡 The more specific you are, the better we can optimize your prompt
          </span>
          <span className="text-xs text-gray-500 font-medium">
            {userRequest.length} characters
          </span>
        </div>
      </div>

      {/* Example Prompts for Inspiration */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-700 mb-4">Need inspiration? Try these examples:</h3>
        <div className="grid gap-3">
          {examplePrompts.map((example, index) => (
            <button
              key={index}
              onClick={() => setUserRequest(example)}
              className="text-left p-3 bg-gray-50 hover:bg-purple-50 border border-gray-200 hover:border-purple-300 rounded-lg transition-colors"
            >
              <span className="text-gray-700 text-sm">{example}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 px-4 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          onClick={handleContinue}
          disabled={!canContinue}
          className={`flex items-center space-x-2 font-medium px-6 py-3 rounded-xl transition-all duration-200 ${
            canContinue
              ? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Indicator */}
      <div className="mt-8 flex justify-center">
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <div className="w-3 h-3 rounded-full bg-gray-300" />
          <div className="w-3 h-3 rounded-full bg-gray-300" />
          <div className="w-3 h-3 rounded-full bg-gray-300" />
        </div>
      </div>
    </div>
  )
}