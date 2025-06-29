// FIXED: Minimal introduction screen with proper button
import React from 'react'
import { ArrowRight, Wand2 } from 'lucide-react'

interface IntroductionProps {
  onContinue: () => void
}

export function Introduction({ onContinue }: IntroductionProps) {
  return (
    <div className="max-w-2xl mx-auto text-center">
      {/* Clean, minimal header */}
      <div className="mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Wand2 className="w-8 h-8 text-white" />
        </div>
        
        <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-4">
          Smart Prompt Mode
        </h2>
        
        <p className="text-lg text-gray-600 leading-relaxed mb-8">
          Get dramatically better AI results with expertly crafted prompts. 
          We'll guide you through optimizing your request with the right approach, 
          model selection, and examples.
        </p>
      </div>

      {/* Simple before/after example */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="text-gray-600 text-sm font-medium mb-2">❌ Basic</div>
          <p className="text-gray-700 text-sm italic">
            "Write a function to sort an array"
          </p>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <div className="text-purple-600 text-sm font-medium mb-2">✅ Enhanced</div>
          <p className="text-gray-700 text-sm italic">
            "You are an expert software engineer. Write a TypeScript function..."
          </p>
        </div>
      </div>

      {/* Simple call to action */}
      <button
        onClick={onContinue}
        className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
      >
        <span>Get Started</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}