// Mobile-first authentication layout component with Chat Models branding
import React, { useState } from 'react'
import { Mail, Lock, User, ArrowRight } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { Logo } from '../common/Logo'
import { EmailConfirmationScreen } from './EmailConfirmationScreen'

export function AuthLayout() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [awaitingEmailConfirmation, setAwaitingEmailConfirmation] = useState(false)
  const [pendingEmail, setPendingEmail] = useState('')
  
  const { signUp, signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = isSignUp 
        ? await signUp(email, password)
        : await signIn(email, password)

      if (error) {
        // Handle specific signup cases
        if (isSignUp && error.message?.includes('Email not confirmed')) {
          setAwaitingEmailConfirmation(true)
          setPendingEmail(email)
        } else if (isSignUp && error.message?.includes('User already registered')) {
          setAwaitingEmailConfirmation(true)
          setPendingEmail(email)
        } else {
          setError(error.message)
        }
      } else if (isSignUp) {
        // Successful signup - show email confirmation screen
        setAwaitingEmailConfirmation(true)
        setPendingEmail(email)
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Show email confirmation screen if waiting for verification
  if (awaitingEmailConfirmation && pendingEmail) {
    return <EmailConfirmationScreen email={pendingEmail} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Mobile-optimized logo */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-3">
            <Logo showText={true} size="lg" />
          </div>
          <p className="text-gray-600 mt-2 text-sm sm:text-base px-4">
            AI chat platform with multi-model switching
          </p>
        </div>

        {/* Mobile-optimized auth form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl border border-purple-100 p-6 sm:p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              {isSignUp ? 'Join the conversation' : 'Sign in to continue'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 h-4 sm:h-5 sm:w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-9 sm:pl-10 pr-3 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm sm:text-base"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 h-4 sm:h-5 sm:w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 sm:pl-10 pr-3 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm sm:text-base"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium py-2.5 sm:py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center group disabled:opacity-50 text-sm sm:text-base"
            >
              {loading ? (
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                  <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="ml-1 text-purple-600 hover:text-purple-700 font-medium transition-colors"
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}