import React from 'react'
import { ArrowLeft } from 'lucide-react'
import { TaskType } from './PromptHelper'

interface TaskSelectionProps {
  userRequest: string
  onSelectTask: (taskType: TaskType) => void
  onBack: () => void
}

const TASKS = [
  { 
    type: 'creative' as TaskType, 
    emoji: '🎨', 
    title: 'Creative', 
    subtitle: 'Writing, design, content',
    model: 'GPT-4.1'
  },
  { 
    type: 'coding' as TaskType, 
    emoji: '💻', 
    title: 'Coding', 
    subtitle: 'Programming, debugging',
    model: 'Claude 3.7'
  },
  { 
    type: 'analysis' as TaskType, 
    emoji: '🔍', 
    title: 'Analysis', 
    subtitle: 'Research, reasoning',
    model: 'OpenAI o3'
  },
  { 
    type: 'general' as TaskType, 
    emoji: '📝', 
    title: 'General', 
    subtitle: 'Questions, help',
    model: 'Claude 4'
  }
]

export function TaskSelection({ userRequest, onSelectTask, onBack }: TaskSelectionProps) {
  return (
    <div className="py-4">
      <h2 className="text-lg font-bold text-gray-800 mb-2 text-center">
        What type of task is this?
      </h2>
      
      <p className="text-gray-600 text-sm text-center mb-6">
        I'll optimize for the best model and approach
      </p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {TASKS.map((task) => (
          <button
            key={task.type}
            onClick={() => onSelectTask(task.type)}
            className="bg-white border border-gray-200 hover:border-purple-300 hover:shadow-md rounded-xl p-4 text-center transition-all group"
          >
            <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">{task.emoji}</div>
            <h3 className="font-semibold text-gray-800 text-sm mb-1">{task.title}</h3>
            <p className="text-xs text-gray-500 mb-2">{task.subtitle}</p>
            <div className="text-xs text-purple-600 font-medium">{task.model}</div>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-1 px-3 py-2 text-gray-500 hover:text-gray-700 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </div>
    </div>
  )
}