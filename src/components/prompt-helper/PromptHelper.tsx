// FIXED: Smart Prompt flow with proper state management and flow control
import React, { useState, useEffect } from 'react'
import { Introduction } from './Introduction'
import { RequestInput } from './RequestInput'
import { TaskSelection } from './TaskSelection'
import { RoleSelection } from './RoleSelection'
import { CustomRoleInput } from './CustomRoleInput'
import { ExampleInput } from './ExampleInput'
import { FinalPreview } from './FinalPreview'
import { AIModel } from '../../types/chat'

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

type Step = 'request' | 'task' | 'role' | 'customRole' | 'examples' | 'preview'

interface State {
  step: Step
  request: string
  task: TaskType | null
  role: string
  examples: UserExamples
}

const STORAGE_KEY = 'prompt-helper-state'
const INTRO_SEEN_KEY = 'prompt-helper-intro-seen'

export function PromptHelper({ 
  onSendMessage, 
  onExit, 
  selectedModel, 
  onModelChange,
  availableModels 
}: PromptHelperProps) {
  // Check if user has seen intro before
  const hasSeenIntro = localStorage.getItem(INTRO_SEEN_KEY) === 'true'
  
  // Start directly at request step if user has seen intro
  const [state, setState] = useState<State>({
    step: 'request',
    request: '',
    task: null,
    role: '',
    examples: { example1: '', example2: '' }
  })

  // Clear any previous state on mount to ensure fresh start
  useEffect(() => {
    // Mark intro as seen
    localStorage.setItem(INTRO_SEEN_KEY, 'true')
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const updateState = (updates: Partial<State>) => {
    setState(prev => ({ ...prev, ...updates }))
  }

  const handleRequestComplete = (request: string) => {
    if (!request?.trim()) {
      console.error('Request is required')
      return
    }
    updateState({ step: 'task', request: request.trim() })
  }

  const handleTaskComplete = (task: TaskType) => {
    updateState({ step: 'role', task })
    
    // Auto-select optimal model based on task
    const taskModelMap: Record<TaskType, string> = {
      creative: 'gpt-4.1',
      coding: 'claude-3-7-sonnet-20250219',
      analysis: 'o3-mini',
      general: 'claude-sonnet-4-20250514'
    }
    
    const optimalModel = availableModels.find(m => m.id === taskModelMap[task])
    if (optimalModel) {
      onModelChange(optimalModel)
    }
  }

  const handleRoleComplete = (role: string) => {
    if (!role?.trim()) {
      console.error('Role is required')
      return
    }
    
    if (role === 'custom') {
      updateState({ step: 'customRole' })
    } else {
      updateState({ step: 'examples', role: role.trim() })
    }
  }

  const handleCustomRoleComplete = (customRole: string) => {
    if (!customRole?.trim()) {
      console.error('Custom role is required')
      return
    }
    updateState({ step: 'examples', role: customRole.trim() })
  }

  const handleExamplesComplete = (examples: UserExamples) => {
    // Validate we have minimum required data before final step
    if (!state.request?.trim() || !state.task || !state.role?.trim()) {
      console.error('Missing required data for final step', { 
        hasRequest: !!state.request?.trim(), 
        hasTask: !!state.task, 
        hasRole: !!state.role?.trim() 
      })
      return
    }
    
    updateState({ step: 'preview', examples })
  }

  const handleSubmit = (prompt: string, model: AIModel) => {
    if (!prompt?.trim()) {
      console.error('Prompt is required for submission')
      return
    }
    
    // Clear state since we're done
    localStorage.removeItem(STORAGE_KEY)
    
    onSendMessage(prompt, model)
    onExit()
  }

  const handleBack = () => {
    const backMap: Record<Step, Step> = {
      request: 'request', // First step - exit to main chat
      task: 'request',
      role: 'task',
      customRole: 'role',
      examples: state.role === 'custom' ? 'customRole' : 'role',
      preview: 'examples'
    }
    
    const nextStep = backMap[state.step]
    if (nextStep === 'request' && state.step === 'request') {
      // If we're at the first step and try to go back, exit prompt helper
      onExit()
    } else if (nextStep !== state.step) {
      updateState({ step: nextStep })
    }
  }

  // STREAMLINED: Direct content without unnecessary intro
  return (
    <div className="flex-1 flex flex-col h-full bg-white">
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-lg mx-auto">
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
          
          {state.step === 'examples' && state.task && state.role && (
            <ExampleInput 
              taskType={state.task}
              initialExamples={state.examples}
              onComplete={handleExamplesComplete}
              onBack={handleBack}
              userRequest={state.request}
              availableModels={availableModels}
            />
          )}
          
          {state.step === 'preview' && state.request && state.task && state.role && (
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
    </div>
  )
}