// Main Prompt Helper Mode component - Pro-tier prompt construction wizard
import React, { useState } from 'react'
import { TaskSelection } from './TaskSelection'
import { ExampleInput } from './ExampleInput'
import { MainRequest } from './MainRequest'
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

type PromptHelperStep = 'task-selection' | 'example-input' | 'main-request'

// Model mapping for different task types
const TASK_MODEL_MAPPING: Record<TaskType, string> = {
  creative: 'gpt-4.1',
  coding: 'claude-3-7-sonnet-20250219',
  analysis: 'o3',
  general: 'claude-sonnet-4-20250514'
}

export function PromptHelper({ 
  onSendMessage, 
  onExit, 
  selectedModel, 
  onModelChange,
  availableModels 
}: PromptHelperProps) {
  const { usageStats } = useUsageStats()
  const [currentStep, setCurrentStep] = useState<PromptHelperStep>('task-selection')
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null)
  const [userExamples, setUserExamples] = useState<UserExamples>({ example1: '', example2: '' })
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  // Check if user has Pro tier access
  const isProUser = usageStats?.tier?.tier === 'pro'

  // Handle task selection
  const handleTaskSelection = (taskType: TaskType) => {
    console.log('🎯 Task selected:', taskType)
    setSelectedTask(taskType)
    
    // Auto-select optimal model for this task
    const optimalModelId = TASK_MODEL_MAPPING[taskType]
    const optimalModel = availableModels.find(m => m.id === optimalModelId)
    
    if (optimalModel) {
      console.log('🤖 Auto-selecting optimal model:', optimalModel.displayName)
      onModelChange(optimalModel)
    }
    
    setCurrentStep('example-input')
  }

  // Handle example input completion
  const handleExampleInput = (examples: UserExamples, skip: boolean = false) => {
    console.log('📝 Examples provided:', skip ? 'Skipped' : 'Provided', examples)
    setUserExamples(examples)
    setCurrentStep('main-request')
  }

  // Handle final prompt submission
  const handlePromptSubmission = (enhancedPrompt: string, finalModel: AIModel) => {
    console.log('🚀 Sending enhanced prompt with model:', finalModel.displayName)
    onSendMessage(enhancedPrompt, finalModel)
    onExit() // Return to normal chat mode
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
            onClick={onExit}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors font-medium"
          >
            Exit
          </button>
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4 lg:p-8">
          {currentStep === 'task-selection' && (
            <TaskSelection onSelectTask={handleTaskSelection} />
          )}
          
          {currentStep === 'example-input' && selectedTask && (
            <ExampleInput 
              taskType={selectedTask}
              onComplete={handleExampleInput}
              onBack={() => setCurrentStep('task-selection')}
            />
          )}
          
          {currentStep === 'main-request' && selectedTask && (
            <MainRequest
              taskType={selectedTask}
              userExamples={userExamples}
              selectedModel={selectedModel}
              availableModels={availableModels}
              onModelChange={onModelChange}
              onSubmit={handlePromptSubmission}
              onBack={() => setCurrentStep('example-input')}
            />
          )}
        </div>
      </div>
    </div>
  )
}