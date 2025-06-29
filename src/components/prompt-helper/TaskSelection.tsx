// Task Selection screen - First step of prompt helper wizard
import React from 'react'
import { TaskType } from './PromptHelper'

interface TaskSelectionProps {
  onSelectTask: (taskType: TaskType) => void
}

const TASK_CARDS = [
  {
    type: 'creative' as TaskType,
    emoji: '🎨',
    title: 'Creative',
    model: 'GPT-4.1',
    description: 'Best for natural, human-like creative writing with emotional sensitivity',
    color: 'from-pink-500 to-rose-500'
  },
  {
    type: 'coding' as TaskType,
    emoji: '💻',
    title: 'Coding',
    model: 'Claude 3.7 Sonnet',
    description: 'Dominates real-world software engineering with superior code generation',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    type: 'analysis' as TaskType,
    emoji: '🔍',
    title: 'Analysis',
    model: 'OpenAI o3',
    description: 'Unparalleled mathematical and logical reasoning for complex problem-solving',
    color: 'from-emerald-500 to-green-500'
  },
  {
    type: 'general' as TaskType,
    emoji: '📝',
    title: 'General',
    model: 'Claude 4 Sonnet',
    description: 'Best balance of capabilities for versatile tasks',
    color: 'from-purple-500 to-indigo-500'
  }
]

export function TaskSelection({ onSelectTask }: TaskSelectionProps) {
  return (
    <div className="text-center">
      {/* Header */}
      <div className="mb-8 lg:mb-12">
        <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-4">
          What do you want to achieve?
        </h2>
        <p className="text-gray-600 text-lg">
          Choose your task type and we'll optimize the perfect prompt with the best AI model
        </p>
      </div>

      {/* Task Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">
        {TASK_CARDS.map((card) => (
          <button
            key={card.type}
            onClick={() => onSelectTask(card.type)}
            className="group relative bg-white rounded-2xl border-2 border-gray-200 hover:border-transparent hover:shadow-2xl transition-all duration-300 p-6 lg:p-8 text-left overflow-hidden transform hover:scale-105"
          >
            {/* Gradient Background on Hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
            
            {/* Content */}
            <div className="relative z-10">
              {/* Icon and Title */}
              <div className="flex items-center space-x-4 mb-4">
                <div className="text-4xl lg:text-5xl">{card.emoji}</div>
                <div>
                  <h3 className="text-xl lg:text-2xl font-bold text-gray-800 mb-1">
                    {card.title}
                  </h3>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${card.color} text-white`}>
                    Using {card.model}
                  </div>
                </div>
              </div>
              
              {/* Description */}
              <p className="text-gray-600 leading-relaxed mb-4">
                {card.description}
              </p>
              
              {/* Selection Indicator */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors">
                  Click to select
                </span>
                <div className="w-8 h-8 rounded-full border-2 border-gray-300 group-hover:border-purple-500 flex items-center justify-center transition-colors">
                  <div className="w-3 h-3 rounded-full bg-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Pro Badge */}
      <div className="mt-8 flex justify-center">
        <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-100 to-indigo-100 border border-purple-200 rounded-full px-4 py-2">
          <div className="w-4 h-4 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600" />
          <span className="text-sm font-medium text-purple-700">Pro Feature - Advanced Prompt Engineering</span>
        </div>
      </div>
    </div>
  )
}