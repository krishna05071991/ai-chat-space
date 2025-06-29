// FIXED: Clean final preview screen
import React, { useState, useEffect } from 'react'
import { ArrowLeft, Send, ChevronDown, Edit3 } from 'lucide-react'
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

const ROLE_INSTRUCTIONS = {
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
  const [enhancedPrompt, setEnhancedPrompt] = useState('')
  const [showModelDropdown, setShowModelDropdown] = useState(false)

  const buildEnhancedPrompt = () => {
    let prompt = ROLE_INSTRUCTIONS[taskType] + "\n\n"
    
    const hasExamples = userExamples.example1.trim() || userExamples.example2.trim()
    if (hasExamples) {
      prompt += "Here are examples of the style/approach I want:\n\n"
      
      if (userExamples.example1.trim()) {
        prompt += `Example 1: ${userExamples.example1.trim()}\n\n`
      }
      
      if (userExamples.example2.trim()) {
        prompt += `Example 2: ${userExamples.example2.trim()}\n\n`
      }
      
      prompt += "Please match this style and approach.\n\n"
    }
    
    prompt += `Now, please help with: ${userRequest.trim()}`
    return prompt
  }

  useEffect(() => {
    setEnhancedPrompt(buildEnhancedPrompt())
  }, [userRequest, userExamples, taskType])

  const handleSend = () => {
    if (enhancedPrompt.trim()) {
      onSubmit(enhancedPrompt, selectedModel)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Clean header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Review & Send
        </h2>
        <p className="text-gray-600">
          Your enhanced prompt is ready. Make any final adjustments and send.
        </p>
      </div>

      {/* Clean prompt preview */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 mb-3">
          <Edit3 className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-medium text-gray-700">Enhanced Prompt</span>
        </div>
        
        <textarea
          value={enhancedPrompt}
          onChange={(e) => setEnhancedPrompt(e.target.value)}
          className="w-full min-h-[200px] p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-y text-sm bg-white"
        />
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

        <div className="flex items-center space-x-4">
          {/* Simple model selector */}
          <div className="relative">
            <button
              onClick={() => setShowModelDropdown(!showModelDropdown)}
              className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors text-sm"
            >
              <span>{selectedModel.displayName}</span>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showModelDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showModelDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowModelDropdown(false)}
                />
                <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-20 min-w-[200px] max-h-[200px] overflow-y-auto">
                  {availableModels.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        onModelChange(model)
                        setShowModelDropdown(false)
                      }}
                      className={`w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors text-sm ${
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
            className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium px-6 py-2 rounded-xl transition-all duration-200"
          >
            <Send className="w-4 h-4" />
            <span>Send</span>
          </button>
        </div>
      </div>

      {/* Simple progress */}
      <div className="mt-6 flex justify-center">
        <div className="flex space-x-2">
          <div className="w-2 h-2 rounded-full bg-purple-500" />
          <div className="w-2 h-2 rounded-full bg-purple-500" />
          <div className="w-2 h-2 rounded-full bg-purple-500" />
          <div className="w-2 h-2 rounded-full bg-purple-500" />
        </div>
      </div>
    </div>
  )
}