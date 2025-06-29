// Main Prompt Helper Mode component - Pro-tier prompt construction wizard
import React, { useState, useEffect } from 'react'
import { Introduction } from './Introduction'
import { RequestInput } from './RequestInput'
import { TaskSelection } from './TaskSelection'
import { ExampleInput } from './ExampleInput'
import { FinalPreview } from './FinalPreview'
import { UpgradeModal } from './UpgradeModal'
import { AIModel } from '../../types/chat'
import { useUsageStats } from '../../hooks/useUsageStats'

interface PromptHelperProps {
  onSendMessage: (content: string, model: AIModel) => void
  onExit: () => void
  selectedModel: AIModel
  onModelChange: (model: AIModel) => void
  availableModels: AIModel[]
}

export type TaskType = 'creative' | 'coding' | 'analysis' | 'general'

export interface UserExamples {
  example1: string
  example2: string
}

type PromptHelperStep = 'introduction' | 'request-input' | 'task-selection' | 'example-input' | 'final-preview'

// Model mapping for different task types
const TASK_MODEL_MAPPING: Record<TaskType, string> = {
  creative: 'gpt-4.1',
  coding: 'claude-3-7-sonnet-20250219',
  analysis: 'o3',
  general: 'claude-sonnet-4-20250514'
}

// Key for localStorage to persist state
const PROMPT_HELPER_STATE_KEY = 'prompt-helper-state'

interface PromptHelperState {
  currentStep: PromptHelperStep
  userRequest: string
  selectedTask: TaskType | null
  userExamples: UserExamples
}

export function PromptHelper({ 
  onSendMessage, 
  onExit, 
  selectedModel, 
  onModelChange,
  availableModels 
}: PromptHelperProps) {
  const { usageStats } = useUsageStats()
  
  // Initialize state from localStorage or defaults
  const [state, setState] = useState<PromptHelperState>(() => {
    try {
      const savedState = localStorage.getItem(PROMPT_HELPER_STATE_KEY)
      if (savedState) {
        return JSON.parse(savedState)
      }
    } catch (error) {
      console.warn('Failed to load prompt helper state:', error)
    }
    
    return {
      currentStep: 'introduction' as PromptHelperStep,
      userRequest: '',
      selectedTask: null,
      userExamples: { example1: '', example2: '' }
    }
  })

  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  // Save state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(PROMPT_HELPER_STATE_KEY, JSON.stringify(state))
    } catch (error) {
      console.warn('Failed to save prompt helper state:', error)
    }
  }, [state])

  // Clear state when component unmounts
  useEffect(() => {
    return () => {
      try {
        localStorage.removeItem(PROMPT_HELPER_STATE_KEY)
      } catch (error) {
        console.warn('Failed to clear prompt helper state:', error)
      }
    }
  }, [])

  // Check if user has Pro tier access
  const isProUser = usageStats?.tier?.tier === 'pro'

  // Update state helper
  const updateState = (updates: Partial<PromptHelperState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }

  // Handle introduction completion
  const handleIntroductionComplete = () => {
    console.log('📖 Introduction completed')
    updateState({ currentStep: 'request-input' })
  }

  // Handle request input completion
  const handleRequestInput = (request: string) => {
    console.log('📝 User request entered:', request.substring(0, 50) + '...')
    updateState({ 
      currentStep: 'task-selection',
      userRequest: request 
    })
  }

  // Handle task selection
  const handleTaskSelection = (taskType: TaskType) => {
    console.log('🎯 Task selected:', taskType)
    updateState({ 
      currentStep: 'example-input',
      selectedTask: taskType 
    })
    
    // Auto-select optimal model for this task
    const optimalModelId = TASK_MODEL_MAPPING[taskType]
    const optimalModel = availableModels.find(m => m.id === optimalModelId)
    
    if (optimalModel) {
      console.log('🤖 Auto-selecting optimal model:', optimalModel.displayName)
      onModelChange(optimalModel)
    }
  }

  // Handle example input completion
  const handleExampleInput = (examples: UserExamples, skip: boolean = false) => {
    console.log('📝 Examples provided:', skip ? 'Skipped' : 'Provided', examples)
    updateState({ 
      currentStep: 'final-preview',
      userExamples: examples 
    })
  }

  // Handle final prompt submission
  const handlePromptSubmission = (enhancedPrompt: string, finalModel: AIModel) => {
    console.log('🚀 Sending enhanced prompt with model:', finalModel.displayName)
    
    // Clear saved state since we're done
    try {
      localStorage.removeItem(PROMPT_HELPER_STATE_KEY)
    } catch (error) {
      console.warn('Failed to clear prompt helper state:', error)
    }
    
    onSendMessage(enhancedPrompt, finalModel)
    onExit() // Return to normal chat mode
  }

  // Handle exit with confirmation if user has made progress
  const handleExit = () => {
    const hasProgress = state.userRequest || state.selectedTask || state.userExamples.example1 || state.userExamples.example2
    
    if (hasProgress && state.currentStep !== 'introduction') {
      const confirmed = window.confirm('Are you sure you want to exit? Your progress will be saved and you can continue later.')
      if (!confirmed) return
    }
    
    // Don't clear state on exit - let it persist for next time
    onExit()
  }

  // Handle back navigation
  const handleBack = () => {
    switch (state.currentStep) {
      case 'request-input':
        updateState({ currentStep: 'introduction' })
        break
      case 'task-selection':
        updateState({ currentStep: 'request-input' })
        break
      case 'example-input':
        updateState({ currentStep: 'task-selection' })
        break
      case 'final-preview':
        updateState({ currentStep: 'example-input' })
        break
    }
  }

  // Show upgrade modal for non-Pro users
  if (!isProUser) {
    return (
      <UpgradeModal 
        isOpen={true}
        onClose={onExit}
        onUpgrade={() => {
          setShowUpgradeModal(true)
        }}
      />
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-br from-purple-50 via-white to-indigo-50 overflow-hidden">
      {/* Header */}
      <div className="relative z-20 flex-shrink-0 border-b border-purple-200">
        <div className="flex items-center justify-between py-6 px-4 lg:px-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">✨</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-800">Smart Prompt Mode</h1>
              <p className="text-sm text-purple-600 font-medium">Pro Feature</p>
            </div>
          </div>
          
          <button
            onClick={handleExit}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors font-medium"
          >
            Exit
          </button>
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4 lg:p-8">
          {state.currentStep === 'introduction' && (
            <Introduction onContinue={handleIntroductionComplete} />
          )}
          
          {state.currentStep === 'request-input' && (
            <RequestInput 
              initialValue={state.userRequest}
              onComplete={handleRequestInput}
              onBack={handleBack}
            />
          )}
          
          {state.currentStep === 'task-selection' && (
            <TaskSelection 
              userRequest={state.userRequest}
              onSelectTask={handleTaskSelection} 
              onBack={handleBack}
            />
          )}
          
          {state.currentStep === 'example-input' && state.selectedTask && (
            <ExampleInput 
              taskType={state.selectedTask}
              initialExamples={state.userExamples}
              onComplete={handleExampleInput}
              onBack={handleBack}
            />
          )}
          
          {state.currentStep === 'final-preview' && state.selectedTask && (
            <FinalPreview
              userRequest={state.userRequest}
              taskType={state.selectedTask}
              userExamples={state.userExamples}
              selectedModel={selectedModel}
              availableModels={availableModels}
              onModelChange={onModelChange}
              onSubmit={handlePromptSubmission}
              onBack={handleBack}
            />
          )}
        </div>
      </div>
    </div>
  )
}