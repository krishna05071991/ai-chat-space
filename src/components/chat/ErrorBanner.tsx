// Error banner component for displaying API errors and other issues
import React from 'react'
import { AlertTriangle, X } from 'lucide-react'

interface ErrorBannerProps {
  message: string
  onDismiss: () => void
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg shadow-lg backdrop-blur-sm relative z-40">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <p className="text-sm text-red-700 font-medium">
            {message}
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="text-red-400 hover:text-red-600 transition-colors p-1 rounded-md hover:bg-red-100 flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}