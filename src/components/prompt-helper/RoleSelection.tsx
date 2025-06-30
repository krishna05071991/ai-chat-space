import React from 'react'
import { ArrowLeft } from 'lucide-react'

interface RoleSelectionProps {
  userRequest: string
  taskType: string
  onSelectRole: (role: string) => void
  onBack: () => void
}

const ROLE_OPTIONS = [
  {
    id: 'expert_professional',
    title: '👔 Expert',
    subtitle: 'Professional with deep expertise'
  },
  {
    id: 'helpful_assistant',
    title: '🤝 Helper',
    subtitle: 'Friendly and practical'
  },
  {
    id: 'creative_collaborator',
    title: '🎨 Creative',
    subtitle: 'Imaginative and innovative'
  },
  {
    id: 'analytical_consultant',
    title: '📊 Analyst',
    subtitle: 'Logical and methodical'
  },
  {
    id: 'mentor_teacher',
    title: '🎓 Teacher',
    subtitle: 'Patient and explanatory'
  },
  {
    id: 'custom',
    title: '⚙️ Custom',
    subtitle: 'Define your own role'
  }
]

export function RoleSelection({ userRequest, taskType, onSelectRole, onBack }: RoleSelectionProps) {
  return (
    <div className="py-4">
      <h2 className="text-lg font-bold text-gray-800 mb-2 text-center">
        How should the AI respond?
      </h2>
      
      <p className="text-gray-600 text-sm text-center mb-6">
        Choose the personality and expertise level
      </p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {ROLE_OPTIONS.map((role) => (
          <button
            key={role.id}
            onClick={() => onSelectRole(role.id)}
            className="bg-white border border-gray-200 hover:border-purple-300 hover:shadow-md rounded-xl p-4 text-center transition-all group"
          >
            <div className="text-lg mb-2 group-hover:scale-110 transition-transform">{role.title.split(' ')[0]}</div>
            <h3 className="font-semibold text-gray-800 text-sm mb-1">{role.title.split(' ').slice(1).join(' ')}</h3>
            <p className="text-xs text-gray-500">{role.subtitle}</p>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-1 px-3 py-2 text-gray-500 hover:text-gray-700 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </div>
    </div>
  )
}