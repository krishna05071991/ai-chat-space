// Email confirmation waiting screen
import React, { useState } from 'react'
import { Mail, RefreshCw, CheckCircle } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { Logo } from '../common/Logo'

interface EmailConfirmationScreenProps {
  email: string
}

export function EmailConfirmationScreen({ email }: EmailConfirmationScreenProps) {
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const { signUp } = useAuth()

  const handleResendEmail = async () => {
    setIsResending(true)
    try {
      // Trigger another signup which will resend confirmation email
      await signUp(email, 'dummy-password-for-resend')
      setResendSuccess(true)
      setTimeout(() => setResendSuccess(false), 3000)
    } catch (error) {
      console.error('Failed to resend email:', error)
    } finally {
      setIsResending(false)
    }
  }

  const maskedEmail = email.replace(/(.{2})(.*)(?=.{4})/, '$1***')

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo showText={true} size="lg" />
          </div>
        </div>

        {/* Main confirmation card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl border border-purple-100 p-6 sm:p-8 text-center">
          {/* Email icon */}
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-white" />
          </div>

          {/* Heading */}
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4">
            Check your email
          </h1>

          {/* Description */}
          <p className="text-gray-600 mb-6 leading-relaxed">
            We've sent a confirmation link to <strong>{maskedEmail}</strong>
          </p>

          <p className="text-sm text-gray-500 mb-8">
            Click the link in the email to activate your account and start using chat.space
          </p>

          {/* Resend button */}
          <div className="space-y-4">
            {resendSuccess ? (
              <div className="flex items-center justify-center space-x-2 text-green-600 bg-green-50 border border-green-200 rounded-xl py-3 px-4">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Email sent successfully!</span>
              </div>
            ) : (
              <button
                onClick={handleResendEmail}
                disabled={isResending}
                className="w-full flex items-center justify-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isResending ? 'animate-spin' : ''}`} />
                <span>{isResending ? 'Sending...' : 'Resend email'}</span>
              </button>
            )}

            <p className="text-xs text-gray-500">
              Didn't receive the email? Check your spam folder or try again.
            </p>
          </div>
        </div>

        {/* Additional help */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Having trouble? Email us at{' '}
            <a href="mailto:support@chat.space" className="text-purple-600 hover:text-purple-700 font-medium">
              support@chat.space
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}