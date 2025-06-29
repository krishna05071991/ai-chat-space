// FIXED: Individual example generation with proper null checks
import React, { useState } from 'react'
import { ArrowLeft, ArrowRight, SkipForward, Wand2, Loader2 } from 'lucide-react'
import { TaskType, UserExamples } from './PromptHelper'
import { supabase } from '../../lib/supabase'

interface ExampleInputProps {
  taskType: TaskType
  initialExamples: UserExamples
  onComplete: (examples: UserExamples) => void
  onBack: () => void
  userRequest?: string
  availableModels?: any[]
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
  const [isGenerating1, setIsGenerating1] = useState(false)
  const [isGenerating2, setIsGenerating2] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleContinue = () => {
    onComplete({ 
      example1: example1?.trim() || '', 
      example2: example2?.trim() || '' 
    })
  }

  const handleSkip = () => {
    onComplete({ example1: '', example2: '' })
  }

  // FIXED: Generate example for specific box with proper error handling
  const handleGenerateExample = async (exampleNumber: 1 | 2) => {
    // FIXED: Proper null/undefined checks
    if (!userRequest || typeof userRequest !== 'string' || !userRequest.trim()) {
      setError('Please provide your request first')
      return
    }

    // Validate taskType
    if (!taskType || typeof taskType !== 'string') {
      setError('Invalid task type. Please restart the prompt helper.')
      return
    }

    const setLoading = exampleNumber === 1 ? setIsGenerating1 : setIsGenerating2
    const setExample = exampleNumber === 1 ? setExample1 : setExample2

    setLoading(true)
    setError(null)

    try {
      // Get user session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Authentication required')
      }

      console.log(`🎯 Generating example ${exampleNumber} for:`, {
        userRequest: userRequest.substring(0, 50) + '...',
        taskType,
        exampleNumber
      })

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
          taskType: taskType,
          exampleNumber: exampleNumber // Pass which example we're generating
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to generate example')
      }

      const data = await response.json()
      
      if (data.example) {
        setExample(data.example)
        console.log(`✅ Example ${exampleNumber} generated successfully:`, {
          contentLength: data.example.length,
          model: data.model,
          usage: data.usage
        })
      } else {
        throw new Error('No example content received')
      }

    } catch (error) {
      console.error(`❌ Example ${exampleNumber} generation failed:`, error)
      setError(error.message || 'Failed to generate example')
    } finally {
      setLoading(false)
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

      <div className="space-y-4 mb-4">
        {/* Example 1 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Example 1</label>
            {userRequest && userRequest.trim() && (
              <button
                onClick={() => handleGenerateExample(1)}
                disabled={isGenerating1}
                className="flex items-center space-x-1 text-xs px-2 py-1 bg-green-100 hover:bg-green-200 disabled:bg-gray-100 text-green-700 disabled:text-gray-500 rounded-md transition-colors disabled:cursor-not-allowed"
              >
                {isGenerating1 ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3 h-3" />
                    <span>Generate</span>
                  </>
                )}
              </button>
            )}
          </div>
          <textarea
            value={example1}
            onChange={(e) => setExample1(e.target.value)}
            placeholder="Example 1..."
            className="w-full h-20 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm"
            maxLength={1000}
          />
          <div className="text-right text-xs text-gray-500 mt-1">
            {example1?.length || 0}/1000
          </div>
        </div>

        {/* Example 2 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Example 2</label>
            {userRequest && userRequest.trim() && (
              <button
                onClick={() => handleGenerateExample(2)}
                disabled={isGenerating2}
                className="flex items-center space-x-1 text-xs px-2 py-1 bg-green-100 hover:bg-green-200 disabled:bg-gray-100 text-green-700 disabled:text-gray-500 rounded-md transition-colors disabled:cursor-not-allowed"
              >
                {isGenerating2 ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3 h-3" />
                    <span>Generate</span>
                  </>
                )}
              </button>
            )}
          </div>
          <textarea
            value={example2}
            onChange={(e) => setExample2(e.target.value)}
            placeholder="Example 2..."
            className="w-full h-20 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm"
            maxLength={1000}
          />
          <div className="text-right text-xs text-gray-500 mt-1">
            {example2?.length || 0}/1000
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        {/* Help text */}
        {userRequest && userRequest.trim() && (
          <p className="text-xs text-gray-500 text-center">
            💡 Click "Generate" to create AI-powered examples based on your request
          </p>
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