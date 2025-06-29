// FIXED: Better state persistence and cleaner flow
import React, { useState, useEffect } from 'react'
import { Introduction } from './Introduction'
import { RequestInput } from './RequestInput'
import { TaskSelection } from './TaskSelection'
import { ExampleInput } from './ExampleInput'
import { FinalPreview } from './FinalPreview'
import { UpgradeModal } from './UpgradeModal'
import { AIModel } from '../../types/chat'
import { useUsageStats } from '../../hooks/useUsageStats'
import { X } from 'lucide-react'

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

const TASK_MODEL_MAPPING: Record<TaskType, string> = {
  creative: 'gpt-4.1',
  coding: 'claude-3-7-sonnet-20250219',
  analysis: 'o3',
  general: 'claude-sonnet-4-20250514'
}

const PROMPT_HELPER_STATE_KEY = 'prompt-helper-state'

interface PromptHelperState {
  currentStep: PromptHelperStep
  userRequest: string
  selectedTask: TaskType | null
  userExamples: UserExamples
  hasStarted: boolean
}

export function PromptHelper({ 
  onSendMessage, 
  onExit, 
  selectedModel, 
  onModelChange,
  availableModels 
}: PromptHelperProps) {
  const { usageStats } = useUsageStats()
  
  // FIXED: Better state initialization with persistence
  const [state, setState] = useState<PromptHelperState>(() => {
    try {
      const savedState = localStorage.getItem(PROMPT_HELPER_STATE_KEY)
      if (savedState) {
        const parsed = JSON.parse(savedState)
        // If user has started before, skip introduction
        if (parsed.hasStarted) {
          return {
            ...parsed,
            currentStep: parsed.currentStep || 'request-input'
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load prompt helper state:', error)
    }
    
    return {
      currentStep: 'introduction' as PromptHelperStep,
      userRequest: '',
      selectedTask: null,
      userExamples: { example1: '', example2: '' },
      hasStarted: false
    }
  })

  // FIXED: Save state on every change for better persistence
  useEffect(() => {
    try {
      localStorage.setItem(PROMPT_HELPER_STATE_KEY, JSON.stringify(state))
    } catch (error) {
      console.warn('Failed to save prompt helper state:', error)
    }
  }, [state])

  // FIXED: Listen for page visibility to persist state across tabs
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible again - ensure state is saved
        try {
          localStorage.setItem(PROMPT_HELPER_STATE_KEY, JSON.stringify(state))
        } catch (error) {
          console.warn('Failed to save state on visibility change:', error)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [state])

  const isProUser = usageStats?.tier?.tier === 'pro'

  const updateState = (updates: Partial<PromptHelperState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }

  const handleIntroductionComplete = () => {
    updateState({ 
      currentStep: 'request-input',
      hasStarted: true 
    })
  }

  const handleRequestInput = (request: string) => {
    updateState({ 
      currentStep: 'task-selection',
      userRequest: request 
    })
  }

  const handleTaskSelection = (taskType: TaskType) => {
    updateState({ 
      currentStep: 'example-input',
      selectedTask: taskType 
    })
    
    // Auto-select optimal model
    const optimalModelId = TASK_MODEL_MAPPING[taskType]
    const optimalModel = availableModels.find(m => m.id === optimalModelId)
    
    if (optimalModel) {
      onModelChange(optimalModel)
    }
  }

  const handleExampleInput = (examples: UserExamples) => {
    updateState({ 
      currentStep: 'final-preview',
      userExamples: examples 
    })
  }

  const handlePromptSubmission = (enhancedPrompt: string, finalModel: AIModel) => {
    // Clear state since we're done
    try {
      localStorage.removeItem(PROMPT_HELPER_STATE_KEY)
    } catch (error) {
      console.warn('Failed to clear prompt helper state:', error)
    }
    
    onSendMessage(enhancedPrompt, finalModel)
    onExit()
  }

  const handleExit = () => {
    // Keep state for next time unless user confirms clear
    onExit()
  }

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

  if (!isProUser) {
    return (
      <UpgradeModal 
        isOpen={true}
        onClose={onExit}
        onUpgrade={() => {}}
      />
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
      {/* FIXED: Clean, minimal header */}
      <div className="flex-shrink-0 border-b border-gray-200">
        <div className="flex items-center justify-between py-4 px-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-sm">✨</span>
            </div>
            <div>
              <h1 className="text-lg font-medium text-gray-800">Smart Prompt Mode</h1>
            </div>
          </div>
          
          <button
            onClick={handleExit}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* FIXED: Clean content area without extra padding */}
      <div className="flex-1 overflow-y-auto p-6">
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
  )
}