// Profile settings component for managing user information
import React, { useState } from 'react'
import { User, MapPin, Briefcase, Camera, Check, X } from 'lucide-react'
import { useUserProfile } from '../../hooks/useUserProfile'

export function ProfileSettings() {
  const { profile, updateProfile, loading } = useUserProfile()
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    location: profile?.location || '',
    profession: profile?.profession || ''
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!formData.full_name.trim()) {
      return
    }

    setSaving(true)
    try {
      await updateProfile({
        full_name: formData.full_name.trim(),
        location: formData.location.trim() || null,
        profession: formData.profession.trim() || null
      })
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update profile:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      full_name: profile?.full_name || '',
      location: profile?.location || '',
      profession: profile?.profession || ''
    })
    setIsEditing(false)
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Profile Information</h3>
        
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="text-purple-600 hover:text-purple-700 font-medium text-sm transition-colors"
          >
            Edit Profile
          </button>
        ) : (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCancel}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !formData.full_name.trim()}
              className="p-2 text-green-600 hover:text-green-700 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
            </button>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Avatar section */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={profile.full_name || 'Profile'}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <span className="text-white text-xl font-semibold">
                  {profile?.full_name 
                    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                    : profile?.email?.[0]?.toUpperCase() || 'U'
                  }
                </span>
              )}
            </div>
            
            {isEditing && (
              <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white hover:bg-purple-700 transition-colors">
                <Camera className="w-3 h-3" />
              </button>
            )}
          </div>
          
          <div>
            <p className="font-medium text-gray-800">{profile?.full_name || 'No name set'}</p>
            <p className="text-sm text-gray-500">{profile?.email}</p>
          </div>
        </div>

        {/* Profile fields */}
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            {isEditing ? (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Enter your full name"
                  maxLength={100}
                />
              </div>
            ) : (
              <p className="text-gray-800 py-2.5 px-3 bg-gray-50 rounded-xl">
                {profile?.full_name || 'No name set'}
              </p>
            )}
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            {isEditing ? (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="e.g., San Francisco, London, Remote"
                  maxLength={100}
                />
              </div>
            ) : (
              <p className="text-gray-800 py-2.5 px-3 bg-gray-50 rounded-xl">
                {profile?.location || 'Not specified'}
              </p>
            )}
          </div>

          {/* Profession */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profession
            </label>
            {isEditing ? (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Briefcase className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={formData.profession}
                  onChange={(e) => handleInputChange('profession', e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="e.g., Software Developer, Designer, Student"
                  maxLength={100}
                />
              </div>
            ) : (
              <p className="text-gray-800 py-2.5 px-3 bg-gray-50 rounded-xl">
                {profile?.profession || 'Not specified'}
              </p>
            )}
          </div>
        </div>

        {/* Account info */}
        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Account Information</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Member since:</span>
              <p className="text-gray-800 font-medium">
                {profile?.created_at 
                  ? new Date(profile.created_at).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })
                  : 'Unknown'
                }
              </p>
            </div>
            <div>
              <span className="text-gray-500">Profile updated:</span>
              <p className="text-gray-800 font-medium">
                {profile?.updated_at 
                  ? new Date(profile.updated_at).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })
                  : 'Never'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}