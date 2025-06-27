// Mobile-first authentication layout component
import React, { useState } from 'react'
import { Mail, Lock, User, ArrowRight } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { Logo } from '../common/Logo'

export function AuthLayout() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
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
        setError(error.message)
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="infinite-canvas min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Mobile-optimized logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center shadow-xl">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-[#222427] mb-2">chat.space</h1>
          <p className="muted-text mt-2 px-4">
            AI chat platform with multi-model switching
          </p>
        </div>

        {/* Mobile-optimized auth form */}
        <div className="glass rounded-2xl shadow-xl border border-purple-100/50 p-8">
          <div className="text-center mb-8 space-section">
            <h2 className="h1">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="muted-text">
              {isSignUp ? 'Join the conversation' : 'Sign in to continue'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-section">
            <div>
              <label className="block body-text font-medium text-[#222427] mb-3">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-[#8A8377]" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 border border-gray-200/50 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all body-text bg-white/50"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block body-text font-medium text-[#222427] mb-3">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-[#8A8377]" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 border border-gray-200/50 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all body-text bg-white/50"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50/50 border border-red-200/50 rounded-2xl p-4">
                <p className="body-text text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium py-4 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center group disabled:opacity-50 body-text shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="body-text text-[#8A8377]">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="ml-2 text-purple-600 hover:text-purple-700 font-medium transition-colors"
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