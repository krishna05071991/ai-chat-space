// FIXED: Clean task selection with minimal design
import React from 'react'
import { ArrowLeft } from 'lucide-react'
import { TaskType } from './PromptHelper'

interface TaskSelectionProps {
  userRequest: string
  onSelectTask: (taskType: TaskType) => void
  onBack: () => void
}

const TASK_CARDS = [
  {
    type: 'creative' as TaskType,
    emoji: '🎨',
    title: 'Creative',
    model: 'GPT-4.1',
    description: 'Writing, storytelling, creative content'
  },
  {
    type: 'coding' as TaskType,
    emoji: '💻',
    title: 'Coding',
    model: 'Claude 3.7',
    description: 'Programming, debugging, code review'
  },
  {
    type: 'analysis' as TaskType,
    emoji: '🔍',
    title: 'Analysis',
    model: 'OpenAI o3',
    description: 'Research, problem solving, data analysis'
  },
  {
    type: 'general' as TaskType,
    emoji: '📝',
    title: 'General',
    model: 'Claude 4',
    description: 'Explanations, advice, general help'
  }
]

export function TaskSelection({ userRequest, onSelectTask, onBack }: TaskSelectionProps) {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Clean header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Choose your approach
        </h2>
        <p className="text-gray-600 mb-6">
          This will select the optimal model and prompt structure.
        </p>
        
        {/* Show user's request in minimal way */}
        <div className="bg-gray-50 rounded-xl p-3 text-left">
          <div className="text-xs text-gray-500 mb-1">Your request:</div>
          <p className="text-gray-800 text-sm italic">"{userRequest}"</p>
        </div>
      </div>

      {/* Clean task cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {TASK_CARDS.map((card) => (
          <button
            key={card.type}
            onClick={() => onSelectTask(card.type)}
            className="bg-white border border-gray-200 hover:border-purple-300 hover:bg-purple-50 rounded-xl p-4 text-left transition-all group"
          >
            <div className="text-2xl mb-2">{card.emoji}</div>
            <h3 className="font-medium text-gray-800 mb-1">{card.title}</h3>
            <div className="text-xs text-purple-600 font-medium mb-2">Using {card.model}</div>
            <p className="text-xs text-gray-600">{card.description}</p>
          </button>
        ))}
      </div>

      {/* Clean navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Select the best approach for your request
          </p>
        </div>
      </div>

      {/* Simple progress */}
      <div className="mt-6 flex justify-center">
        <div className="flex space-x-2">
          <div className="w-2 h-2 rounded-full bg-purple-500" />
          <div className="w-2 h-2 rounded-full bg-purple-500" />
          <div className="w-2 h-2 rounded-full bg-gray-300" />
          <div className="w-2 h-2 rounded-full bg-gray-300" />
        </div>
      </div>
    </div>
  )
}