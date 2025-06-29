// ENHANCED: Final preview with AI prompt enhancement when no examples
import React, { useState, useEffect } from 'react'
import { ArrowLeft, Send, ChevronDown, Wand2, Loader2 } from 'lucide-react'
import { TaskType, UserExamples } from './PromptHelper'
import { AIModel } from '../../types/chat'
import { supabase } from '../../lib/supabase'

interface FinalPreviewProps {
  userRequest: string
  taskType: TaskType
  userRole: string
  userExamples: UserExamples
  selectedModel: AIModel
  availableModels: AIModel[]
  onModelChange: (model: AIModel) => void
  onSubmit: (enhancedPrompt: string, model: AIModel) => void
  onBack: () => void
}

// ENHANCED: Role definitions for different selections
const ROLE_DEFINITIONS = {
  expert_professional: (taskType: string) => 
    `You are a senior expert professional with 15+ years of experience in ${taskType || 'your field'}. You provide authoritative, detailed guidance based on industry best practices and deep expertise.`,
  
  helpful_assistant: () => 
    'You are a helpful, knowledgeable assistant who provides clear, practical guidance. You focus on being useful, accessible, and easy to understand.',
  
  creative_collaborator: () => 
    'You are a creative collaborator with exceptional imagination and artistic vision. You approach challenges with innovation, originality, and creative problem-solving.',
  
  analytical_consultant: () => 
    'You are an analytical consultant who approaches problems systematically. You use data-driven insights, logical reasoning, and structured methodologies.',
  
  mentor_teacher: () => 
    'You are an experienced mentor and teacher who excels at breaking down complex concepts. You provide patient, clear explanations and guide learning step-by-step.'
}

export function FinalPreview({ 
  userRequest,
  taskType,
  userRole,
  userExamples, 
  selectedModel, 
  availableModels,
  onModelChange,
  onSubmit, 
  onBack 
}: FinalPreviewProps) {
  const [prompt, setPrompt] = useState('')
  const [showModelDropdown, setShowModelDropdown] = useState(false)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [enhancementError, setEnhancementError] = useState<string | null>(null)

  // ENHANCED: Build prompt with role-task format
  const buildBasicPrompt = () => {
    // FIXED: Better validation with detailed logging
    if (!userRequest || typeof userRequest !== 'string' || !userRequest.trim()) {
      console.warn('Invalid userRequest:', { userRequest, type: typeof userRequest })
      return 'Please provide your request.'
    }
    
    // Determine role instruction
    let roleInstruction = ''
    
    // FIXED: Comprehensive role validation
    if (!userRole || typeof userRole !== 'string') {
      console.warn('Invalid userRole:', { userRole, type: typeof userRole })
      roleInstruction = 'You are a helpful assistant who provides clear, practical guidance.'
    } else if (ROLE_DEFINITIONS[userRole]) {
      roleInstruction = ROLE_DEFINITIONS[userRole](taskType || 'general')
    } else {
      // Custom role - use as provided
      const roleText = userRole.trim()
      roleInstruction = roleText.startsWith('You are') ? roleText : `You are ${roleText}`
    }
    
    let result = roleInstruction + "\n\n"
    
    const hasExamples = userExamples?.example1?.trim() || userExamples?.example2?.trim()
    if (hasExamples) {
      result += "Examples of the style I want:\n\n"
      
      if (userExamples?.example1?.trim()) {
        result += `Example 1: ${userExamples.example1.trim()}\n\n`
      }
      
      if (userExamples?.example2?.trim()) {
        result += `Example 2: ${userExamples.example2.trim()}\n\n`
      }
    }
    
    result += `Please help with: ${userRequest.trim()}`
    return result
  }

  // NEW: Enhance prompt using GPT-4o when no examples provided
  const enhancePrompt = async () => {
    setIsEnhancing(true)
    setEnhancementError(null)

    try {
      // FIXED: Validate required data
      if (!userRequest || typeof userRequest !== 'string' || !userRequest.trim()) {
        throw new Error('User request is required for enhancement')
      }
      
      if (!taskType || typeof taskType !== 'string') {
        throw new Error('Task type is required for enhancement')  
      }
      
      if (!userRole || typeof userRole !== 'string') {
        throw new Error('User role is required for enhancement')
      }
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Authentication required')
      }

      console.log('🚀 Enhancing prompt with advanced prompt engineering:', {
        userRequest: userRequest.substring(0, 50) + '...',
        taskType,
        userRole,
        hasExamples: !!(userExamples.example1?.trim() || userExamples.example2?.trim())
      })

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-completion`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          purpose: 'enhance_prompt',
          userRequest: userRequest?.trim() || '',
          taskType: taskType || 'general',
          userRole: userRole || 'helpful_assistant',
          currentPrompt: buildBasicPrompt()
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        
        // Handle specific enhancement errors
        if (errorData.error === 'PROMPT_ENHANCEMENT_FAILED') {
          console.warn('Enhancement failed, using fallback')
          setPrompt(errorData.fallback || buildBasicPrompt())
          setEnhancementError('Enhancement service unavailable, using basic prompt')
          return
        }
        
        throw new Error(errorData.message || 'Failed to enhance prompt')
      }

      const data = await response.json()
      
      if (data.enhancedPrompt) {
        setPrompt(data.enhancedPrompt)
        console.log('✅ Prompt enhanced with advanced engineering:', {
          originalLength: buildBasicPrompt().length,
          enhancedLength: data.enhancedPrompt.length,
          model: data.model,
          improvementRatio: (data.enhancedPrompt.length / buildBasicPrompt().length).toFixed(2) + 'x'
        })
      } else {
        throw new Error('No enhanced prompt received')
      }

    } catch (error) {
      console.error('❌ Prompt enhancement failed:', error)
      setEnhancementError(error.message || 'Failed to enhance prompt')
      // Fallback to basic prompt
      setPrompt(buildBasicPrompt())
    } finally {
      setIsEnhancing(false)
    }
  }

  useEffect(() => {
    // FIXED: Add proper null checks
    const hasExamples = userExamples?.example1?.trim() || userExamples?.example2?.trim()
    
    if (!hasExamples) {
      // No examples - enhance the prompt automatically
      enhancePrompt()
    } else {
      // Has examples - use basic prompt
      setPrompt(buildBasicPrompt())
    }
  }, [userRequest, userExamples, taskType, userRole])

  const handleSend = () => {
    if (prompt && prompt.trim()) {
      onSubmit(prompt, selectedModel)
    }
  }

  const hasExamples = userExamples?.example1?.trim() || userExamples?.example2?.trim()

  return (
    <div className="max-w-lg mx-auto py-4">
      <h2 className="text-lg font-bold text-gray-800 mb-3 text-center">
        Review & Send
      </h2>

      {/* Enhancement status */}
      {!hasExamples && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-center space-x-2">
            {isEnhancing ? (
              <>
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                <span className="text-sm text-blue-800 font-medium">Enhancing your prompt with AI...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-800 font-medium">Prompt enhanced by GPT-4o</span>
              </>
            )}
          </div>
          {enhancementError && (
            <p className="text-xs text-red-600 mt-1">{enhancementError}</p>
          )}
          {!isEnhancing && !enhancementError && (
            <p className="text-xs text-blue-600 mt-1">
              Since you skipped examples, we've optimized your prompt for better results.
            </p>
          )}
        </div>
      )}

      {/* Prompt preview */}
      <div className="mb-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full h-40 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-xs bg-white"
          disabled={isEnhancing}
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
            disabled={isEnhancing}
            className="flex items-center space-x-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium px-4 py-2 rounded-xl text-sm disabled:cursor-not-allowed"
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