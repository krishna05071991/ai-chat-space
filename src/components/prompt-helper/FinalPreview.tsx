// MINIMAL: Clean final preview
import React, { useState, useEffect } from 'react'
import { ArrowLeft, Send, ChevronDown } from 'lucide-react'
import { TaskType, UserExamples } from './PromptHelper'
import { AIModel } from '../../types/chat'

interface FinalPreviewProps {
  userRequest: string
  taskType: TaskType
  userExamples: UserExamples
  selectedModel: AIModel
  availableModels: AIModel[]
  onModelChange: (model: AIModel) => void
  onSubmit: (enhancedPrompt: string, model: AIModel) => void
  onBack: () => void
}

const ROLES = {
  creative: 'You are a creative writer with exceptional imagination and natural style.',
  coding: 'You are an expert software engineer with deep technical knowledge.',
  analysis: 'You are a meticulous analyst with strong logical reasoning.',
  general: 'You are a helpful and knowledgeable assistant.'
}

export function FinalPreview({ 
  userRequest,
  taskType, 
  userExamples, 
  selectedModel, 
  availableModels,
  onModelChange,
  onSubmit, 
  onBack 
}: FinalPreviewProps) {
  const [prompt, setPrompt] = useState('')
  const [showModelDropdown, setShowModelDropdown] = useState(false)

  const buildPrompt = () => {
    let result = ROLES[taskType] + "\n\n"
    
    const hasExamples = userExamples.example1.trim() || userExamples.example2.trim()
    if (hasExamples) {
      result += "Examples of the style I want:\n\n"
      
      if (userExamples.example1.trim()) {
        result += `Example 1: ${userExamples.example1.trim()}\n\n`
      }
      
      if (userExamples.example2.trim()) {
        result += `Example 2: ${userExamples.example2.trim()}\n\n`
      }
    }
    
    result += `Please help with: ${userRequest.trim()}`
    return result
  }

  useEffect(() => {
    setPrompt(buildPrompt())
  }, [userRequest, userExamples, taskType])

  const handleSend = () => {
    if (prompt.trim()) {
      onSubmit(prompt, selectedModel)
    }
  }

  return (
    <div className="max-w-lg mx-auto py-4">
      <h2 className="text-lg font-bold text-gray-800 mb-3 text-center">
        Review & Send
      </h2>

      {/* Prompt preview */}
      <div className="mb-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full h-40 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-xs bg-white"
        />
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-xl text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center space-x-2">
          {/* Model selector */}
          <div className="relative">
            <button
              onClick={() => setShowModelDropdown(!showModelDropdown)}
              className="flex items-center space-x-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm"
            >
              <span>{selectedModel.displayName}</span>
              <ChevronDown className={`w-3 h-3 ${showModelDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showModelDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowModelDropdown(false)} />
                <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 min-w-[160px] max-h-[150px] overflow-y-auto">
                  {availableModels.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        onModelChange(model)
                        setShowModelDropdown(false)
                      }}
                      className={`w-full px-3 py-2 text-left hover:bg-gray-50 text-xs ${
                        selectedModel.id === model.id ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
                      }`}
                    >
                      {model.displayName}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            onClick={handleSend}
            className="flex items-center space-x-1 bg-purple-600 text-white font-medium px-4 py-2 rounded-xl text-sm"
          >
            <Send className="w-4 h-4" />
            <span>Send</span>
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="flex justify-center mt-4">
        <div className="flex space-x-1">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
        </div>
      </div>
    </div>
  )
}