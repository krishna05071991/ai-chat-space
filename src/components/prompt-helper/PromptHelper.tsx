// UPDATED: Pass required props for example generation
import React, { useState, useEffect } from 'react'
import { Introduction } from './Introduction'
import { RequestInput } from './RequestInput'
import { TaskSelection } from './TaskSelection'
import { RoleSelection } from './RoleSelection'
import { CustomRoleInput } from './CustomRoleInput'
import { ExampleInput } from './ExampleInput'
import { FinalPreview } from './FinalPreview'
import { AIModel } from '../../types/chat'
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

type Step = 'intro' | 'request' | 'task' | 'role' | 'customRole' | 'examples' | 'preview'

interface State {
  step: Step
  request: string
  task: TaskType | null
  role: string
  examples: UserExamples
  hasStarted: boolean
}

const STORAGE_KEY = 'prompt-helper'

export function PromptHelper({ 
  onSendMessage, 
  onExit, 
  selectedModel, 
  onModelChange,
  availableModels 
}: PromptHelperProps) {
  // FIXED: Simple state loading
  const [state, setState] = useState<State>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        // If user has started before, skip intro
        if (parsed.hasStarted) {
          return { ...parsed, step: parsed.step || 'request' }
        }
      }
    } catch (e) {
      // Ignore loading errors
    }
    
    return {
      step: 'intro' as Step,
      request: '',
      task: null,
      role: '',
      examples: { example1: '', example2: '' },
      hasStarted: false
    }
  })

  // FIXED: Save state on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch (e) {
      // Ignore save errors
    }
  }, [state])

  // FIXED: Persist across tab switches
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
        } catch (e) {
          // Ignore save errors
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [state])

  const updateState = (updates: Partial<State>) => {
    setState(prev => ({ ...prev, ...updates }))
  }

  // FIXED: Proper flow progression
  const handleIntroComplete = () => {
    updateState({ step: 'request', hasStarted: true })
  }

  const handleRequestComplete = (request: string) => {
    updateState({ step: 'task', request })
  }

  const handleTaskComplete = (task: TaskType) => {
    updateState({ step: 'role', task })
    
    // Auto-select optimal model
    const taskModelMap: Record<TaskType, string> = {
      creative: 'gpt-4.1',
      coding: 'claude-3-7-sonnet-20250219',
      analysis: 'o3',
      general: 'claude-sonnet-4-20250514'
    }
    
    const optimalModel = availableModels.find(m => m.id === taskModelMap[task])
    if (optimalModel) {
      onModelChange(optimalModel)
    }
  }

  const handleRoleComplete = (role: string) => {
    if (role === 'custom') {
      updateState({ step: 'customRole' })
    } else {
      updateState({ step: 'examples', role })
    }
  }

  const handleCustomRoleComplete = (customRole: string) => {
    updateState({ step: 'examples', role: customRole })
  }

  const handleExamplesComplete = (examples: UserExamples) => {
    updateState({ step: 'preview', examples })
  }

  const handleSubmit = (prompt: string, model: AIModel) => {
    // Clear state since we're done
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (e) {
      // Ignore cleanup errors
    }
    
    onSendMessage(prompt, model)
    onExit()
  }

  const handleBack = () => {
    const backMap: Record<Step, Step> = {
      intro: 'intro',
      request: 'intro',
      task: 'request',
      role: 'task',
      customRole: 'role',
      examples: state.role ? 'role' : 'task', // Handle both flows
      preview: 'examples'
    }
    updateState({ step: backMap[state.step] })
  }

  const handleExit = () => {
    // Keep state for next time
    onExit()
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white">
      {/* MINIMAL: Clean header */}
      <div className="flex-shrink-0 border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✨</span>
            </div>
            <span className="font-medium text-gray-800">Smart Prompt Mode</span>
          </div>
          <button onClick={handleExit} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* MINIMAL: Content area */}
      <div className="flex-1 p-4">
        {state.step === 'intro' && (
          <Introduction onContinue={handleIntroComplete} />
        )}
        
        {state.step === 'request' && (
          <RequestInput 
            initialValue={state.request}
            onComplete={handleRequestComplete}
            onBack={handleBack}
          />
        )}
        
        {state.step === 'task' && (
          <TaskSelection 
            userRequest={state.request}
            onSelectTask={handleTaskComplete} 
            onBack={handleBack}
          />
        )}
        
        {state.step === 'role' && state.task && (
          <RoleSelection 
            userRequest={state.request}
            taskType={state.task}
            onSelectRole={handleRoleComplete}
            onBack={handleBack}
          />
        )}
        
        {state.step === 'customRole' && state.task && (
          <CustomRoleInput 
            userRequest={state.request}
            taskType={state.task}
            onComplete={handleCustomRoleComplete}
            onBack={handleBack}
          />
        )}
        
        {state.step === 'examples' && state.task && (
          <ExampleInput 
            taskType={state.task}
            initialExamples={state.examples}
            onComplete={handleExamplesComplete}
            onBack={handleBack}
            userRequest={state.request} // NEW: Pass user request for example generation
            availableModels={availableModels} // NEW: Pass available models for tier checking
          />
        )}
        
        {state.step === 'preview' && state.task && state.role !== '' && (
          <FinalPreview
            userRequest={state.request}
            taskType={state.task}
            userRole={state.role}
            userExamples={state.examples}
            selectedModel={selectedModel}
            availableModels={availableModels}
            onModelChange={onModelChange}
            onSubmit={handleSubmit}
            onBack={handleBack}
          />
        )}
      </div>
    </div>
  )
}