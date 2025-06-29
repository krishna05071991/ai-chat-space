// NEW: Role selection step for prompt helper
import React from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'

interface RoleSelectionProps {
  userRequest: string
  taskType: string
  onSelectRole: (role: string) => void
  onBack: () => void
}

const ROLE_OPTIONS = [
  {
    id: 'expert_professional',
    title: 'Expert Professional',
    description: 'A seasoned expert with deep knowledge and experience',
    example: 'You are a senior expert with 15+ years of experience...'
  },
  {
    id: 'helpful_assistant',
    title: 'Helpful Assistant',
    description: 'A friendly, knowledgeable assistant focused on helping',
    example: 'You are a helpful assistant who provides clear, practical guidance...'
  },
  {
    id: 'creative_collaborator',
    title: 'Creative Collaborator',
    description: 'An imaginative partner for creative and innovative work',
    example: 'You are a creative collaborator with exceptional imagination...'
  },
  {
    id: 'analytical_consultant',
    title: 'Analytical Consultant',
    description: 'A logical, methodical consultant focused on analysis',
    example: 'You are an analytical consultant who approaches problems systematically...'
  },
  {
    id: 'mentor_teacher',
    title: 'Mentor & Teacher',
    description: 'An experienced teacher who explains concepts clearly',
    example: 'You are an experienced mentor who breaks down complex ideas...'
  },
  {
    id: 'custom',
    title: 'Custom Role',
    description: 'Define your own specific role for the AI',
    example: 'Specify exactly what role you want the AI to play...'
  }
]

export function RoleSelection({ userRequest, taskType, onSelectRole, onBack }: RoleSelectionProps) {
  return (
    <div className="max-w-lg mx-auto py-4">
      <h2 className="text-lg font-bold text-gray-800 mb-3 text-center">
        What role should the AI play?
      </h2>
      
      {/* Show context */}
      <div className="bg-gray-50 rounded-xl p-3 mb-4">
        <div className="text-xs text-gray-500 mb-1">Your request:</div>
        <p className="text-gray-800 text-xs italic">"{userRequest}"</p>
        <div className="text-xs text-gray-500 mt-1">Task type: <span className="capitalize">{taskType}</span></div>
      </div>

      {/* Role grid */}
      <div className="space-y-3 mb-4">
        {ROLE_OPTIONS.map((role) => (
          <button
            key={role.id}
            onClick={() => onSelectRole(role.id)}
            className="w-full bg-white border border-gray-200 hover:border-purple-300 hover:bg-purple-50 rounded-xl p-3 text-left transition-all"
          >
            <h3 className="font-medium text-gray-800 text-sm mb-1">{role.title}</h3>
            <p className="text-xs text-gray-600 mb-2">{role.description}</p>
            <p className="text-xs text-gray-500 italic">{role.example}</p>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-xl text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </div>

      {/* Progress */}
      <div className="flex justify-center mt-4">
        <div className="flex space-x-1">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
          <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
          <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
        </div>
      </div>
    </div>
  )
}