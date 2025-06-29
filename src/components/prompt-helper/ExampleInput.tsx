// ENHANCED: Clean example input with Gemini-powered example generation
import React, { useState } from 'react'
import { ArrowLeft, ArrowRight, SkipForward, Wand2, Loader2 } from 'lucide-react'
import { TaskType, UserExamples } from './PromptHelper'
import { supabase } from '../../lib/supabase'

interface ExampleInputProps {
  taskType: TaskType
  initialExamples: UserExamples
  onComplete: (examples: UserExamples) => void
  onBack: () => void
  userRequest?: string // NEW: Pass user request for example generation
  availableModels?: any[] // NEW: Pass available models for tier checking
}

export function ExampleInput({ 
  taskType, 
  initialExamples, 
  onComplete, 
  onBack,
  userRequest = '',
  availableModels = []
}: ExampleInputProps) {
  const [example1, setExample1] = useState(initialExamples.example1)
  const [example2, setExample2] = useState(initialExamples.example2)
  const [isGeneratingExample, setIsGeneratingExample] = useState(false)
  const [exampleGenerationError, setExampleGenerationError] = useState<string | null>(null)

  const handleContinue = () => {
    onComplete({ example1: example1.trim(), example2: example2.trim() })
  }

  const handleSkip = () => {
    onComplete({ example1: '', example2: '' })
  }

  // NEW: Generate example using Gemini API
  const handleGenerateExample = async () => {
    if (!userRequest.trim()) {
      setExampleGenerationError('Please provide your request first')
      return
    }

    setIsGeneratingExample(true)
    setExampleGenerationError(null)

    try {
      // Get user session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Authentication required')
      }

      // Call Edge Function for example generation
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-completion`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          purpose: 'generate_example',
          userRequest: userRequest.trim(),
          taskType: taskType
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to generate example')
      }

      const data = await response.json()
      
      if (data.example) {
        // Set the generated example in the first example field
        setExample1(data.example)
        console.log('✅ Example generated successfully:', {
          contentLength: data.example.length,
          model: data.model,
          usage: data.usage
        })
      } else {
        throw new Error('No example content received')
      }

    } catch (error) {
      console.error('❌ Example generation failed:', error)
      setExampleGenerationError(error.message || 'Failed to generate example')
    } finally {
      setIsGeneratingExample(false)
    }
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

        {/* NEW: Generate Example Button */}
        {userRequest.trim() && (
          <div className="mt-3">
            <button
              onClick={handleGenerateExample}
              disabled={isGeneratingExample}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white text-sm font-medium rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
            >
              {isGeneratingExample ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Generate Example</span>
                </>
              )}
            </button>
            
            {exampleGenerationError && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-xs text-red-600">{exampleGenerationError}</p>
              </div>
            )}
            
            <p className="text-xs text-gray-500 mt-1 text-center">
              AI-powered example based on your request
            </p>
          </div>
        )}
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