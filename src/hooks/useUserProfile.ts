// Hook for managing user profile data
import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import { databaseService } from '../lib/databaseService'

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  location: string | null
  profession: string | null
  avatar_url: string | null
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

export function useUserProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchProfile = async () => {
    if (!user) {
      setProfile(null)
      return
    }

    setLoading(true)
    try {
      const profileData = await databaseService.getUserProfile()
      setProfile(profileData)
      
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      await databaseService.updateUserProfile(updates)
      
      // Refresh profile data
      await fetchProfile()
      
      return true
    } catch (error) {
      console.error('Failed to update profile:', error)
      throw error
    }
  }

  const completeOnboarding = async (profileData: {
    full_name: string
    location?: string
    profession?: string
  }) => {
    try {
      await databaseService.updateUserProfile({
        ...profileData,
        onboarding_completed: true
      })
      
      await fetchProfile()
      return true
    } catch (error) {
      console.error('Failed to complete onboarding:', error)
      throw error
    }
  }

  // Fetch profile when user changes
  useEffect(() => {
    fetchProfile()
  }, [user])

  return {
    profile,
    loading,
    updateProfile,
    completeOnboarding,
    refetchProfile: fetchProfile,
    
    // Computed values
    displayName: profile?.full_name || profile?.email?.split('@')[0] || 'User',
    hasCompletedProfile: profile?.onboarding_completed && !!profile?.full_name,
    initials: profile?.full_name 
      ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
      : profile?.email?.[0]?.toUpperCase() || 'U'
  }
}