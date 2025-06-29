// Introduction screen - Explains Smart Prompt Mode and its benefits
import React from 'react'
import { ArrowRight, Sparkles, Target, Brain, Zap } from 'lucide-react'

interface IntroductionProps {
  onContinue: () => void
}

export function Introduction({ onContinue }: IntroductionProps) {
  const features = [
    {
      icon: <Target className="w-5 h-5" />,
      title: 'Task-Optimized Prompting',
      description: 'Choose from Creative, Coding, Analysis, or General tasks for specialized prompt engineering'
    },
    {
      icon: <Brain className="w-5 h-5" />,
      title: 'Intelligent Model Selection',
      description: 'Automatically selects the best AI model for your specific task type'
    },
    {
      icon: <Sparkles className="w-5 h-5" />,
      title: 'Style Learning',
      description: 'Add examples to teach the AI your preferred tone, format, and approach'
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: 'Enhanced Results',
      description: 'Get significantly better AI responses with professionally structured prompts'
    }
  ]

  return (
    <div className="max-w-3xl mx-auto text-center">
      {/* Main Header */}
      <div className="mb-8">
        <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        
        <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-4">
          Welcome to Smart Prompt Mode
        </h2>
        
        <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-100 to-indigo-100 border border-purple-200 rounded-full px-4 py-2 mb-6">
          <div className="w-4 h-4 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600" />
          <span className="text-sm font-medium text-purple-700">Pro Feature - Advanced Prompt Engineering</span>
        </div>
        
        <p className="text-xl text-gray-600 leading-relaxed">
          Transform your simple requests into expertly crafted prompts that get 
          <span className="text-purple-600 font-semibold"> dramatically better results</span> from AI
        </p>
      </div>

      {/* How It Works */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">How It Works</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="bg-white rounded-xl border border-gray-200 p-6 text-left">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center text-white flex-shrink-0">
                  {feature.icon}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">
                    {feature.title}
                  </h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Example Before/After */}
      <div className="mb-10">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">See the Difference</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Before */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="text-red-600 font-medium mb-3">❌ Basic Prompt</div>
            <div className="bg-white rounded-lg p-4 text-left">
              <p className="text-gray-700 text-sm italic">
                "Write a function to sort an array"
              </p>
            </div>
            <p className="text-red-600 text-sm mt-3">
              Gets generic, basic results
            </p>
          </div>

          {/* After */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <div className="text-green-600 font-medium mb-3">✅ Smart Prompt</div>
            <div className="bg-white rounded-lg p-4 text-left">
              <p className="text-gray-700 text-sm italic">
                "You are an expert software engineer with deep technical knowledge. Please write a TypeScript function to sort an array with proper error handling, type safety, and JSDoc comments..."
              </p>
            </div>
            <p className="text-green-600 text-sm mt-3">
              Gets professional, detailed, optimized results
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center">
        <button
          onClick={onContinue}
          className="inline-flex items-center space-x-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <span className="text-lg">Let's Get Started</span>
          <ArrowRight className="w-5 h-5" />
        </button>
        
        <p className="text-gray-500 text-sm mt-4">
          This will take just 2-3 minutes to create your perfect prompt
        </p>
      </div>
    </div>
  )
}