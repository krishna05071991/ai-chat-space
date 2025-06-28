// Updated logo component for Chat Models branding
import React from 'react'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'light' | 'dark' | 'gradient'
  className?: string
  showText?: boolean
  compact?: boolean
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
  xl: 'w-12 h-12'
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
  showText = false,
  compact = false
}: LogoProps) {
  const logoElement = (
    <div className={`${sizeClasses[size]} flex-shrink-0 ${className}`}>
      <img 
        src="/cm-logo.png" 
        alt="Chat Models logo" 
        className="w-full h-full object-contain"
      />
    </div>
  )

  if (!showText || compact) {
    return logoElement
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {logoElement}
      <h1 className={`
        ${textSizeClasses[size]} font-poppins font-semibold
        bg-gradient-to-r from-purple-600 to-purple-700 
        bg-clip-text text-transparent
      `}>
        chat models
      </h1>
    </div>
  )
}