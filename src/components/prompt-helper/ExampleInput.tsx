// FIXED: Clean example input with 1000 character limit
import React, { useState } from 'react'
import { ArrowLeft, ArrowRight, SkipForward } from 'lucide-react'
import { TaskType, UserExamples } from './PromptHelper'

interface ExampleInputProps {
  taskType: TaskType
  initialExamples: UserExamples
  onComplete: (examples: UserExamples, skip?: boolean) => void
  onBack: () => void
}

export function ExampleInput({ taskType, initialExamples, onComplete, onBack }: ExampleInputProps) {
  const [example1, setExample1] = useState(initialExamples.example1)
  const [example2, setExample2] = useState(initialExamples.example2)
  
  const maxLength = 1000

  const handleContinue = () => {
    onComplete({ example1: example1.trim(), example2: example2.trim() })
  }

  const handleSkip = () => {
    onComplete({ example1: '', example2: '' }, true)
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Clean header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Add style examples
        </h2>
        <p className="text-gray-600">
          Optional: Show examples of your preferred style or approach.
        </p>
      </div>

      {/* Clean example inputs */}
      <div className="space-y-6 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Example 1 (Optional)
          </label>
          <textarea
            value={example1}
            onChange={(e) => setExample1(e.target.value)}
            placeholder="Example of your preferred style or approach..."
            className="w-full min-h-[100px] p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-y"
            maxLength={maxLength}
          />
          <div className="text-right mt-1">
            <span className="text-xs text-gray-500">
              {example1.length}/{maxLength}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Example 2 (Optional)
          </label>
          <textarea
            value={example2}
            onChange={(e) => setExample2(e.target.value)}
            placeholder="Another example (helps AI understand your style better)..."
            className="w-full min-h-[100px] p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-y"
            maxLength={maxLength}
          />
          <div className="text-right mt-1">
            <span className="text-xs text-gray-500">
              {example2.length}/{maxLength}
            </span>
          </div>
        </div>
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

        <div className="flex space-x-3">
          <button
            onClick={handleSkip}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors"
          >
            <SkipForward className="w-4 h-4" />
            <span>Skip</span>
          </button>
          
          <button
            onClick={handleContinue}
            className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium px-6 py-2 rounded-xl transition-all duration-200"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Simple progress */}
      <div className="mt-6 flex justify-center">
        <div className="flex space-x-2">
          <div className="w-2 h-2 rounded-full bg-purple-500" />
          <div className="w-2 h-2 rounded-full bg-purple-500" />
          <div className="w-2 h-2 rounded-full bg-purple-500" />
          <div className="w-2 h-2 rounded-full bg-gray-300" />
        </div>
      </div>
    </div>
  )
}