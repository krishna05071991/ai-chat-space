// Custom logo component for chat.space - supports both light and dark variants
import React from 'react'
import { MessageSquare } from 'lucide-react'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'light' | 'dark' | 'gradient'
  className?: string
  showText?: boolean
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16'
}

const textSizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl',
  xl: 'text-2xl'
}

export function Logo({ 
  size = 'md', 
  variant = 'gradient', 
  className = '',
  showText = false 
}: LogoProps) {
  // Try to use custom logo first, fallback to icon
  const useCustomLogo = true // Set to true when logo.png is available

  const getBackgroundClass = () => {
    switch (variant) {
      case 'light':
        return 'bg-white border border-purple-200'
      case 'dark':
        return 'bg-gray-800 border border-gray-700'
      case 'gradient':
      default:
        return 'bg-gradient-to-r from-purple-500 to-purple-600'
    }
  }

  const getIconColor = () => {
    switch (variant) {
      case 'light':
        return 'text-purple-600'
      case 'dark':
        return 'text-white'
      case 'gradient':
      default:
        return 'text-white'
    }
  }

  const logoElement = useCustomLogo ? (
    <div className={`
      ${sizeClasses[size]} rounded-2xl ${getBackgroundClass()} 
      flex items-center justify-center p-2 ${className}
    `}>
      <img 
        src="/logo.png" 
        alt="chat.space logo" 
        className="w-full h-full object-contain"
        onError={(e) => {
          // Fallback to icon if custom logo fails to load
          e.currentTarget.style.display = 'none'
          e.currentTarget.nextElementSibling?.removeAttribute('style')
        }}
      />
      <MessageSquare 
        className={`${getIconColor()} w-3/4 h-3/4`}
        style={{ display: 'none' }}
      />
    </div>
  ) : (
    <div className={`
      ${sizeClasses[size]} rounded-2xl ${getBackgroundClass()} 
      flex items-center justify-center ${className}
    `}>
      <MessageSquare className={`${getIconColor()} w-3/4 h-3/4`} />
    </div>
  )

  if (!showText) {
    return logoElement
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {logoElement}
      <h1 className={`
        ${textSizeClasses[size]} font-bold 
        bg-gradient-to-r from-purple-600 to-purple-700 
        bg-clip-text text-transparent
      `}>
        chat.space
      </h1>
    </div>
  )
}