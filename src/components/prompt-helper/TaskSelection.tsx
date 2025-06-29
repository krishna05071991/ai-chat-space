// Task Selection screen - Choose approach/role after entering request
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
    description: 'Best for natural, human-like creative writing with emotional sensitivity',
    color: 'from-pink-500 to-rose-500',
    examples: ['Creative writing', 'Storytelling', 'Poetry', 'Marketing copy']
  },
  {
    type: 'coding' as TaskType,
    emoji: '💻',
    title: 'Coding',
    model: 'Claude 3.7 Sonnet',
    description: 'Dominates real-world software engineering with superior code generation',
    color: 'from-blue-500 to-cyan-500',
    examples: ['Programming', 'Code review', 'Architecture', 'Debugging']
  },
  {
    type: 'analysis' as TaskType,
    emoji: '🔍',
    title: 'Analysis',
    model: 'OpenAI o3',
    description: 'Unparalleled mathematical and logical reasoning for complex problem-solving',
    color: 'from-emerald-500 to-green-500',
    examples: ['Data analysis', 'Research', 'Problem solving', 'Critical thinking']
  },
  {
    type: 'general' as TaskType,
    emoji: '📝',
    title: 'General',
    model: 'Claude 4 Sonnet',
    description: 'Best balance of capabilities for versatile tasks',
    color: 'from-purple-500 to-indigo-500',
    examples: ['Explanations', 'Advice', 'Planning', 'General help']
  }
]

export function TaskSelection({ userRequest, onSelectTask, onBack }: TaskSelectionProps) {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-4">
          How should we approach this?
        </h2>
        <p className="text-lg text-gray-600 mb-6">
          Choose the approach that best fits your request. This will optimize the prompt structure and select the ideal AI model.
        </p>
        
        {/* Show user's request */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-left max-w-2xl mx-auto">
          <div className="text-sm font-medium text-gray-600 mb-2">Your Request:</div>
          <p className="text-gray-800 italic">"{userRequest}"</p>
        </div>
      </div>

      {/* Task Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-8">
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
              
              {/* Examples */}
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Best for:</div>
                <div className="flex flex-wrap gap-2">
                  {card.examples.map((example, index) => (
                    <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      {example}
                    </span>
                  ))}
                </div>
              </div>
              
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

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 px-4 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="text-center">
          <p className="text-sm text-gray-500">
            Choose the approach that best matches your request type
          </p>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="mt-8 flex justify-center">
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <div className="w-3 h-3 rounded-full bg-gray-300" />
          <div className="w-3 h-3 rounded-full bg-gray-300" />
        </div>
      </div>
    </div>
  )
}