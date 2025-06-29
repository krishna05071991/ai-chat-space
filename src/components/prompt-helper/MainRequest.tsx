// Main Request screen with live preview - Final step of prompt helper wizard
import React, { useState, useEffect } from 'react'
import { ArrowLeft, Send, ChevronDown, ChevronUp, Edit3, Zap } from 'lucide-react'
import { TaskType, UserExamples } from './PromptHelper'
import { AIModel } from '../../types/chat'

interface MainRequestProps {
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

export function MainRequest({ 
  taskType, 
  userExamples, 
  selectedModel, 
  availableModels,
  onModelChange,
  onSubmit, 
  onBack 
}: MainRequestProps) {
  const [userRequest, setUserRequest] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [enhancedPrompt, setEnhancedPrompt] = useState('')
  const [isPromptManuallyEdited, setIsPromptManuallyEdited] = useState(false)
  const [showModelDropdown, setShowModelDropdown] = useState(false)

  // Build enhanced prompt based on inputs
  const buildEnhancedPrompt = (request: string) => {
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
    if (request.trim()) {
      prompt += `Now, please help with: ${request.trim()}`
    }
    
    return prompt
  }

  // Update enhanced prompt when inputs change
  useEffect(() => {
    if (!isPromptManuallyEdited) {
      const newPrompt = buildEnhancedPrompt(userRequest)
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
          What's your specific request?
        </h2>
        <p className="text-gray-600 text-lg">
          Describe exactly what you want help with, and we'll enhance it with the perfect prompt structure
        </p>
      </div>

      {/* Main Input Area */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Your Request
        </label>
        <textarea
          value={userRequest}
          onChange={(e) => setUserRequest(e.target.value)}
          placeholder="Type your detailed request here..."
          className="w-full min-h-[150px] max-h-[400px] p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-y text-base"
          autoFocus
        />
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-gray-500">
            Be as specific as possible for the best results
          </span>
          <span className="text-xs text-gray-500 font-medium">
            {userRequest.length} characters
          </span>
        </div>
      </div>

      {/* Preview Section */}
      <div className="mb-8">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center justify-between w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors mb-4"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
              <Edit3 className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-left">
              <h3 className="font-medium text-gray-800">Enhanced Prompt Preview</h3>
              <p className="text-sm text-gray-600">
                {showPreview ? 'Click to collapse' : 'Click to preview the complete prompt'}
                {isPromptManuallyEdited && <span className="text-purple-600"> (manually edited)</span>}
              </p>
            </div>
          </div>
          {showPreview ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
        </button>

        {showPreview && (
          <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">Complete Enhanced Prompt</span>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <Zap className="w-3 h-3" />
                <span>~{estimateTokens(enhancedPrompt)} tokens</span>
              </div>
            </div>
            <textarea
              value={enhancedPrompt}
              onChange={(e) => handlePromptEdit(e.target.value)}
              className="w-full min-h-[200px] max-h-[400px] p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-y text-sm bg-white"
              placeholder="Your enhanced prompt will appear here..."
            />
            <p className="text-xs text-gray-500 mt-2">
              💡 You can edit this prompt directly if needed
            </p>
          </div>
        )}
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
            className={`flex items-center space-x-2 font-medium px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl ${
              canSend
                ? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Send Enhanced Prompt</span>
            {enhancedPrompt && (
              <span className="text-xs opacity-75">
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
        </div>
      </div>
    </div>
  )
}