// NEW: Custom role input for when user selects "custom"
import React, { useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'

interface CustomRoleInputProps {
  userRequest: string
  taskType: string
  onComplete: (customRole: string) => void
  onBack: () => void
}

export function CustomRoleInput({ userRequest, taskType, onComplete, onBack }: CustomRoleInputProps) {
  const [customRole, setCustomRole] = useState('')

  const handleContinue = () => {
    if (customRole.trim()) {
      onComplete(customRole.trim())
    }
  }

  return (
    <div className="max-w-lg mx-auto py-4">
      <h2 className="text-lg font-bold text-gray-800 mb-3 text-center">
        Define the AI's role
      </h2>
      
      {/* Show context */}
      <div className="bg-gray-50 rounded-xl p-3 mb-4">
        <div className="text-xs text-gray-500 mb-1">Your request:</div>
        <p className="text-gray-800 text-xs italic">"{userRequest}"</p>
        <div className="text-xs text-gray-500 mt-1">Task type: <span className="capitalize">{taskType}</span></div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Custom Role Description
        </label>
        <textarea
          value={customRole}
          onChange={(e) => setCustomRole(e.target.value)}
          placeholder="Describe exactly what role you want the AI to play... (e.g., 'You are a senior marketing strategist with expertise in B2B SaaS companies...')"
          className="w-full h-24 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm"
          maxLength={500}
          autoFocus
        />
        <div className="text-right text-xs text-gray-500 mt-1">
          {customRole.length}/500
        </div>
      </div>

      {/* Examples */}
      <div className="mb-4 p-3 bg-blue-50 rounded-xl">
        <p className="text-xs font-medium text-blue-800 mb-2">💡 Good examples:</p>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• "You are a senior UX designer with 10+ years at top tech companies"</li>
          <li>• "You are a financial advisor specializing in small business planning"</li>
          <li>• "You are a published author and writing coach with expertise in fiction"</li>
        </ul>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-xl text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          onClick={handleContinue}
          disabled={!customRole.trim()}
          className={`flex items-center space-x-1 px-4 py-2 rounded-xl text-sm font-medium ${
            customRole.trim()
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
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
          <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
          <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
        </div>
      </div>
    </div>
  )
}