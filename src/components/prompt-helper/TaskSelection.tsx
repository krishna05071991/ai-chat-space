// MINIMAL: Clean task selection
import React from 'react'
import { ArrowLeft } from 'lucide-react'
import { TaskType } from './PromptHelper'

interface TaskSelectionProps {
  userRequest: string
  onSelectTask: (taskType: TaskType) => void
  onBack: () => void
}

const TASKS = [
  { type: 'creative' as TaskType, emoji: '🎨', title: 'Creative', model: 'GPT-4.1' },
  { type: 'coding' as TaskType, emoji: '💻', title: 'Coding', model: 'Claude 3.7' },
  { type: 'analysis' as TaskType, emoji: '🔍', title: 'Analysis', model: 'OpenAI o3' },
  { type: 'general' as TaskType, emoji: '📝', title: 'General', model: 'Claude 4' }
]

export function TaskSelection({ userRequest, onSelectTask, onBack }: TaskSelectionProps) {
  return (
    <div className="max-w-lg mx-auto py-4">
      <h2 className="text-lg font-bold text-gray-800 mb-3 text-center">
        Choose approach
      </h2>
      
      {/* Show user request */}
      <div className="bg-gray-50 rounded-xl p-3 mb-4">
        <div className="text-xs text-gray-500 mb-1">Your request:</div>
        <p className="text-gray-800 text-xs italic">"{userRequest}"</p>
      </div>

      {/* Task grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {TASKS.map((task) => (
          <button
            key={task.type}
            onClick={() => onSelectTask(task.type)}
            className="bg-white border border-gray-200 hover:border-purple-300 rounded-xl p-3 text-left transition-all"
          >
            <div className="text-xl mb-1">{task.emoji}</div>
            <h3 className="font-medium text-gray-800 text-sm">{task.title}</h3>
            <div className="text-xs text-purple-600 font-medium">{task.model}</div>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-xl text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </div>

      {/* Progress */}
      <div className="flex justify-center mt-4">
        <div className="flex space-x-1">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
          <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
          <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
        </div>
      </div>
    </div>
  )
}