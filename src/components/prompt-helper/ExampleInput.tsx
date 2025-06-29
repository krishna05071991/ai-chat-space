// MINIMAL: Clean example input with 1000 chars
import React, { useState } from 'react'
import { ArrowLeft, ArrowRight, SkipForward } from 'lucide-react'
import { TaskType, UserExamples } from './PromptHelper'

interface ExampleInputProps {
  taskType: TaskType
  initialExamples: UserExamples
  onComplete: (examples: UserExamples) => void
  onBack: () => void
}

export function ExampleInput({ taskType, initialExamples, onComplete, onBack }: ExampleInputProps) {
  const [example1, setExample1] = useState(initialExamples.example1)
  const [example2, setExample2] = useState(initialExamples.example2)

  const handleContinue = () => {
    onComplete({ example1: example1.trim(), example2: example2.trim() })
  }

  const handleSkip = () => {
    onComplete({ example1: '', example2: '' })
  }

  return (
    <div className="max-w-lg mx-auto py-4">
      <h2 className="text-lg font-bold text-gray-800 mb-2 text-center">
        Add examples (optional)
      </h2>
      <p className="text-gray-600 text-sm text-center mb-4">
        Show your preferred style or approach
      </p>

      <div className="space-y-3 mb-4">
        <div>
          <textarea
            value={example1}
            onChange={(e) => setExample1(e.target.value)}
            placeholder="Example 1..."
            className="w-full h-20 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm"
            maxLength={1000}
          />
          <div className="text-right text-xs text-gray-500 mt-1">
            {example1.length}/1000
          </div>
        </div>

        <div>
          <textarea
            value={example2}
            onChange={(e) => setExample2(e.target.value)}
            placeholder="Example 2..."
            className="w-full h-20 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm"
            maxLength={1000}
          />
          <div className="text-right text-xs text-gray-500 mt-1">
            {example2.length}/1000
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-xl text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex space-x-2">
          <button
            onClick={handleSkip}
            className="flex items-center space-x-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm"
          >
            <SkipForward className="w-4 h-4" />
            <span>Skip</span>
          </button>
          
          <button
            onClick={handleContinue}
            className="flex items-center space-x-1 bg-purple-600 text-white font-medium px-4 py-2 rounded-xl text-sm"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="flex justify-center mt-4">
        <div className="flex space-x-1">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
          <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
        </div>
      </div>
    </div>
  )
}