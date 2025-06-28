// Mobile-first sidebar component with Chat Models branding and clean design
import React from 'react'
import { Plus, MessageSquare, ChevronLeft, Menu, User, Settings, CreditCard, ChevronDown, LogOut, Trash2, X } from 'lucide-react'
import { Conversation } from '../../types/chat'
import { useAuth } from '../../hooks/useAuth'
import { ConversationMenu } from './ConversationMenu'
import { UsageDisplay } from '../usage/UsageDisplay'
import { useUserProfile } from '../../hooks/useUserProfile'
import { ProfileSettings } from '../settings/ProfileSettings'
import { Logo } from '../common/Logo'

import { useUsageStats } from '../../hooks/useUsageStats'

interface SidebarProps {
  conversations: Conversation[]
  activeConversationId: string | null
  onNewChat: () => void
  onSelectConversation: (id: string) => void
  isOpen: boolean
  onToggle: () => void
  usageStats?: any
  onUpgrade: () => void
  onRenameConversation: (id: string, newTitle: string) => void
  onDeleteConversation: (id: string) => void
  onClearAllConversations: () => void
}

export function Sidebar({ 
  conversations, 
  activeConversationId, 
  onNewChat, 
  onSelectConversation,
  isOpen,
  onToggle,
  onUpgrade,
  onRenameConversation,
  onDeleteConversation,
  onClearAllConversations
}: SidebarProps) {
  const { signOut } = useAuth()
  const { usageStats } = useUsageStats()
  const { profile, displayName, initials } = useUserProfile()
  const [profileMenuOpen, setProfileMenuOpen] = React.useState(false)
  const [showClearConfirm, setShowClearConfirm] = React.useState(false)
  const [showProfileSettings, setShowProfileSettings] = React.useState(false)

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Mobile toggle button */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed top-6 left-4 z-50 lg:hidden bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-gray-200 hover:bg-white hover:shadow-xl transition-all duration-200 flex items-center justify-center safe-area-top"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
      )}

      {/* Redesigned sidebar with subtle transparency */}
      <div className={`
        fixed lg:relative top-0 left-0 h-full bg-white/60 backdrop-blur-xl border-r border-gray-200/50 z-40
        transform transition-transform duration-300 ease-in-out
        w-72 sm:w-80 lg:w-64
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        shadow-2xl lg:shadow-none
        flex flex-col
      `}>
        {/* Clean header with logo and branding */}
        <div className="flex-shrink-0 border-b border-gray-200/30">
          {/* Mobile header with close button */}
          <div className="flex items-center justify-between p-4 lg:hidden">
            <Logo showText={true} size="md" />
            <button
              onClick={onToggle}
              className="p-2 hover:bg-gray-100/50 rounded-xl transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          
          {/* Desktop header with logo */}
          <div className="hidden lg:block p-6 pt-8">
            <Logo showText={true} size="lg" />
          </div>
          
          {/* Start New Button with clean design */}
          <div className="p-4 lg:px-6 lg:pb-6">
            <button
              onClick={onNewChat}
              className="w-full bg-white/80 hover:bg-white border border-gray-200/50 hover:border-gray-300/50 text-gray-700 hover:text-gray-900 font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center text-sm shadow-sm hover:shadow-md backdrop-blur-sm"
            >
              <Plus className="w-4 h-4 mr-2 transition-transform group-hover:rotate-90" />
              Start New
            </button>
          </div>
        </div>

        {/* Clean conversations list */}
        <div className="flex-1 overflow-y-auto px-3 lg:px-6">
          <div className="space-y-1 sm:space-y-1">
            {conversations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No conversations yet</p>
              </div>
            ) : (
              <>
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`
                      group relative rounded-xl transition-all duration-200 cursor-pointer
                      ${activeConversationId === conversation.id
                        ? 'bg-white/70 backdrop-blur-sm border border-gray-200/50 shadow-sm'
                        : 'hover:bg-white/40 hover:backdrop-blur-sm border border-transparent hover:border-gray-200/30'
                      }
                    `}
                    onClick={() => onSelectConversation(conversation.id)}
                  >
                    <div className="flex items-center p-3 pr-10">
                      <MessageSquare className={`w-4 h-4 mr-3 flex-shrink-0 ${
                        activeConversationId === conversation.id 
                          ? 'text-purple-600' 
                          : 'text-gray-400'
                      }`} />
                      <span className={`text-sm truncate ${
                        activeConversationId === conversation.id 
                          ? 'text-purple-800 font-medium' 
                          : 'text-gray-700'
                      }`}>
                        {conversation.title}
                      </span>
                    </div>

                    {/* Conversation menu */}
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <ConversationMenu
                        conversation={conversation}
                        onRename={onRenameConversation}
                        onDelete={onDeleteConversation}
                        isActive={activeConversationId === conversation.id}
                      />
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Usage stats with subtle background */}
        {usageStats && (
          <div className="p-3 sm:p-4 flex-shrink-0">
            <div className="rounded-xl overflow-hidden bg-white/50 backdrop-blur-sm border border-gray-200/30">
              <UsageDisplay usageStats={usageStats} />
            </div>
          </div>
        )}

        {/* Clean footer with profile menu */}
        <div className="p-3 sm:p-4 border-t border-gray-200/30 bg-white/30 backdrop-blur-sm flex-shrink-0">
          <div className="relative">
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-white/50 transition-colors group"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt={displayName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white text-sm font-semibold">
                    {initials}
                  </span>
                )}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="text-sm font-medium text-gray-800 truncate">
                  {displayName}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {usageStats?.tier.tier.replace('_', ' ').toUpperCase() || 'FREE'} Plan
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${profileMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Profile menu with clean design */}
            {profileMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-xl shadow-2xl overflow-hidden z-[9998]">
                
                {/* Usage statistics in profile menu */}
                {usageStats && (
                  <div className="px-3 py-3 border-b border-gray-100">
                    <div className="text-xs text-gray-600 font-medium mb-2 flex items-center">
                      <span className="mr-1">📊</span>
                      Usage Statistics
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">Tokens:</span>
                        <span className="font-medium text-gray-800 truncate ml-2">
                          {usageStats.tokens_used_month.toLocaleString()}/{(usageStats.tier.monthly_tokens / 1000).toFixed(0)}K 
                          ({Math.round((usageStats.tokens_used_month / usageStats.tier.monthly_tokens) * 100)}%)
                        </span>
                      </div>
                      {usageStats.tier.daily_messages > 0 && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Messages:</span>
                          <span className="font-medium text-gray-800">
                            {usageStats.messages_sent_today}/{usageStats.tier.daily_messages} today
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => {
                    setProfileMenuOpen(false)
                    setShowProfileSettings(true)
                  }}
                  className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50/50 transition-colors"
                >
                  <Settings className="w-4 h-4 text-gray-600 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Profile Settings</span>
                </button>
                
                <button
                  onClick={() => {
                    onUpgrade()
                    setProfileMenuOpen(false)
                  }}
                  className="w-full flex items-center space-x-3 p-3 hover:bg-purple-50/50 transition-colors"
                >
                  <CreditCard className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  <span className="text-sm text-purple-600 font-medium">Upgrade plan</span>
                </button>
                
                {conversations.length > 1 && (
                  <button
                    onClick={() => {
                      setShowClearConfirm(true)
                      setProfileMenuOpen(false)
                    }}
                    className="w-full flex items-center space-x-3 p-3 hover:bg-red-50/50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span className="text-sm text-red-600">Clear conversations</span>
                  </button>
                )}
                
                <div className="border-t border-gray-100">
                  <button
                    onClick={() => {
                      signOut()
                      setProfileMenuOpen(false)
                    }}
                    className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50/50 transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-gray-600 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Log out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Clear conversations modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4">
            <div className="mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">Clear conversations</h3>
                <p className="text-sm text-gray-600">This will delete all your conversations</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-6 mt-3">
                <p className="text-sm text-red-800 font-medium">
                  This action cannot be undone.
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onClearAllConversations()
                    setShowClearConfirm(false)
                  }}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors font-medium px-4 py-3 text-sm"
                >
                  Clear conversations
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Settings Modal */}
      {showProfileSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">Profile Settings</h2>
                <button
                  onClick={() => setShowProfileSettings(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              <ProfileSettings />
            </div>
          </div>
        </div>
      )}
    </>
  )
}