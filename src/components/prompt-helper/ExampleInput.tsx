// Example Input screen - Second step of prompt helper wizard
import React, { useState } from 'react'
import { ArrowLeft, ArrowRight, SkipForward } from 'lucide-react'
import { TaskType } from './PromptHelper'

interface ExampleInputProps {
  taskType: TaskType
  onComplete: (examples: { example1: string; example2: string }, skip?: boolean) => void
  onBack: () => void
}

const TASK_PLACEHOLDERS = {
  creative: {
    title: 'Creative Writing Examples',
    subtitle: 'Share examples of your preferred writing style, tone, or approach',
    placeholder1: 'Example: Write a short story about finding an old letter in the attic...',
    placeholder2: 'Example: Describe a character who discovers they can see emotions as colors...'
  },
  coding: {
    title: 'Coding Style Examples',
    subtitle: 'Show examples of your preferred coding patterns, documentation style, or approach',
    placeholder1: 'Example: A function that validates user input with clear error messages...',
    placeholder2: 'Example: How you structure React components with hooks and TypeScript...'
  },
  analysis: {
    title: 'Analysis Examples',
    subtitle: 'Provide examples of how you like analysis presented - format, depth, structure',
    placeholder1: 'Example: Break down the pros and cons of renewable energy with data...',
    placeholder2: 'Example: Analyze market trends with clear methodology and conclusions...'
  },
  general: {
    title: 'Communication Examples',
    subtitle: 'Share examples of your preferred communication style and approach',
    placeholder1: 'Example: Explain a complex topic in simple terms with analogies...',
    placeholder2: 'Example: Provide step-by-step instructions with helpful tips...'
  }
}

export function ExampleInput({ taskType, onComplete, onBack }: ExampleInputProps) {
  const [example1, setExample1] = useState('')
  const [example2, setExample2] = useState('')
  
  const config = TASK_PLACEHOLDERS[taskType]
  const maxLength = 500

  const handleContinue = () => {
    onComplete({ example1: example1.trim(), example2: example2.trim() })
  }

  const handleSkip = () => {
    onComplete({ example1: '', example2: '' }, true)
  }

  const getCharacterCountColor = (text: string) => {
    const length = text.length
    const percentage = (length / maxLength) * 100
    
    if (percentage >= 90) return 'text-red-500'
    if (percentage >= 75) return 'text-amber-500'
    return 'text-gray-500'
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-4">
          {config.title}
        </h2>
        <div className="space-y-2">
          <p className="text-lg text-gray-600">
            Do you have examples of your preferred style? 
            <span className="text-purple-600 font-medium"> (Optional but recommended)</span>
          </p>
          <p className="text-gray-500">
            {config.subtitle}
          </p>
        </div>
      </div>

      {/* Example Input Areas */}
      <div className="space-y-6 mb-8">
        {/* Example 1 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Example 1 (Optional)
          </label>
          <textarea
            value={example1}
            onChange={(e) => setExample1(e.target.value)}
            placeholder={config.placeholder1}
            className="w-full min-h-[120px] max-h-[300px] p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-y"
            maxLength={maxLength}
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500">
              This helps the AI match your exact style and approach
            </span>
            <span className={`text-xs font-medium ${getCharacterCountColor(example1)}`}>
              {example1.length}/{maxLength}
            </span>
          </div>
        </div>

        {/* Example 2 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Example 2 (Optional)
          </label>
          <textarea
            value={example2}
            onChange={(e) => setExample2(e.target.value)}
            placeholder={config.placeholder2}
            className="w-full min-h-[120px] max-h-[300px] p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-y"
            maxLength={maxLength}
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500">
              Additional examples improve AI understanding
            </span>
            <span className={`text-xs font-medium ${getCharacterCountColor(example2)}`}>
              {example2.length}/{maxLength}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 px-4 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex space-x-3">
          <button
            onClick={handleSkip}
            className="flex items-center space-x-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors font-medium"
          >
            <SkipForward className="w-4 h-4" />
            <span>Skip</span>
          </button>
          
          <button
            onClick={handleContinue}
            className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="mt-8 flex justify-center">
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <div className="w-3 h-3 rounded-full bg-gray-300" />
        </div>
      </div>
    </div>
  )
}