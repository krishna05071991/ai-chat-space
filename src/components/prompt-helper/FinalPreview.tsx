// Final Preview screen - Review and send enhanced prompt (Step 4)
import React, { useState, useEffect } from 'react'
import { ArrowLeft, Send, ChevronDown, ChevronUp, Edit3, Zap } from 'lucide-react'
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

// Role instructions for different task types
const ROLE_INSTRUCTIONS = {
  creative: 'You are a creative writer with exceptional imagination and natural style. Focus on emotional depth, vivid imagery, and engaging storytelling.',
  coding: 'You are an expert software engineer with deep technical knowledge. Provide clean, efficient, well-documented code with best practices.',
  analysis: 'You are a meticulous analyst with strong logical reasoning. Break down complex problems systematically and provide data-driven insights.',
  general: 'You are a helpful and knowledgeable assistant. Provide clear, comprehensive, and well-structured responses.'
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
  const [isPromptManuallyEdited, setIsPromptManuallyEdited] = useState(false)
  const [showModelDropdown, setShowModelDropdown] = useState(false)

  // Build enhanced prompt based on inputs
  const buildEnhancedPrompt = () => {
    let prompt = ""
    
    // Add role instruction based on task type
    prompt += ROLE_INSTRUCTIONS[taskType] + "\n\n"
    
    // Add few-shot examples if user provided them
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
    
    // Add the main user request
    prompt += `Now, please help with: ${userRequest.trim()}`
    
    return prompt
  }

  // Update enhanced prompt when component mounts or inputs change
  useEffect(() => {
    if (!isPromptManuallyEdited) {
      const newPrompt = buildEnhancedPrompt()
      setEnhancedPrompt(newPrompt)
    }
  }, [userRequest, userExamples, taskType, isPromptManuallyEdited])

  // Estimate token count (rough estimation)
  const estimateTokens = (text: string) => {
    return Math.ceil(text.length / 4)
  }

  const handlePromptEdit = (newPrompt: string) => {
    setEnhancedPrompt(newPrompt)
    setIsPromptManuallyEdited(true)
  }

  const handleSend = () => {
    if (enhancedPrompt.trim()) {
      onSubmit(enhancedPrompt, selectedModel)
    }
  }

  const canSend = enhancedPrompt.trim().length > 0

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-4">
          Your Enhanced Prompt is Ready!
        </h2>
        <p className="text-gray-600 text-lg">
          Review your optimized prompt below, make any final adjustments, and send it for the best results.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Request Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="font-medium text-blue-800 mb-2">Your Request</div>
          <p className="text-blue-700 text-sm italic">"{userRequest.substring(0, 100)}{userRequest.length > 100 ? '...' : ''}"</p>
        </div>

        {/* Task Type */}
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <div className="font-medium text-purple-800 mb-2">Approach</div>
          <p className="text-purple-700 text-sm capitalize">{taskType} optimization with {selectedModel.displayName}</p>
        </div>

        {/* Examples Status */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="font-medium text-green-800 mb-2">Style Examples</div>
          <p className="text-green-700 text-sm">
            {userExamples.example1.trim() || userExamples.example2.trim() 
              ? `${(userExamples.example1.trim() ? 1 : 0) + (userExamples.example2.trim() ? 1 : 0)} example(s) provided`
              : 'No examples (using defaults)'
            }
          </p>
        </div>
      </div>

      {/* Enhanced Prompt Preview */}
      <div className="mb-8">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                <Edit3 className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-800">Enhanced Prompt</h3>
                <p className="text-sm text-gray-600">
                  {isPromptManuallyEdited && <span className="text-purple-600">(manually edited) </span>}
                  You can edit this directly if needed
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <Zap className="w-3 h-3" />
              <span>~{estimateTokens(enhancedPrompt)} tokens</span>
            </div>
          </div>
          
          <textarea
            value={enhancedPrompt}
            onChange={(e) => handlePromptEdit(e.target.value)}
            className="w-full min-h-[200px] max-h-[400px] p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-y text-sm bg-white"
            placeholder="Your enhanced prompt will appear here..."
          />
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 px-4 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center space-x-4">
          {/* Model Selector */}
          <div className="relative">
            <button
              onClick={() => setShowModelDropdown(!showModelDropdown)}
              className="flex items-center space-x-2 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
            >
              <span className="text-sm font-medium text-gray-700">
                Model: {selectedModel.displayName}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showModelDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showModelDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowModelDropdown(false)}
                />
                <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-20 min-w-[250px] max-h-[300px] overflow-y-auto">
                  {availableModels.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        onModelChange(model)
                        setShowModelDropdown(false)
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                        selectedModel.id === model.id ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
                      }`}
                    >
                      <div>
                        <div className="font-medium">{model.displayName}</div>
                        <div className="text-xs text-gray-500">{model.provider}</div>
                      </div>
                      {selectedModel.id === model.id && (
                        <div className="w-2 h-2 rounded-full bg-purple-500" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!canSend}
            className={`flex items-center space-x-2 font-medium px-8 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl ${
              canSend
                ? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white transform hover:scale-105'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5" />
            <span className="text-lg">Send Enhanced Prompt</span>
            {enhancedPrompt && (
              <span className="text-sm opacity-75">
                (~{estimateTokens(enhancedPrompt)} tokens)
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="mt-8 flex justify-center">
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <div className="w-3 h-3 rounded-full bg-purple-500" />
        </div>
      </div>
    </div>
  )
}