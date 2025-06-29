// MINIMAL: Clean introduction
import React from 'react'
import { ArrowRight } from 'lucide-react'

interface IntroductionProps {
  onContinue: () => void
}

export function Introduction({ onContinue }: IntroductionProps) {
  return (
    <div className="max-w-md mx-auto text-center py-4">
      {/* Add exit option for seamless feel */}
      <div className="flex items-center justify-between mb-6">
        <div></div> {/* Spacer */}
        <h2 className="text-xl font-bold text-gray-800">
          Smart Prompt Mode
        </h2>
        <button
          onClick={() => window.history.back()}
          className="text-gray-400 hover:text-gray-600 text-sm"
        >
          Exit
        </button>
      </div>
      
      <p className="text-gray-600 mb-6 text-sm leading-relaxed">
        Get better AI results with guided prompt optimization, 
        smart model selection, and style examples.
      </p>

      <button
        onClick={onContinue}
        className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium px-4 py-2 rounded-xl transition-all text-sm"
      >
        <span>Get Started</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}