// Mobile-first sidebar component with Chat Models branding and page navigation
import React from 'react'
import { Plus, MessageSquare, ChevronLeft, Menu, User, Settings, CreditCard, ChevronDown, LogOut, Trash2, X } from 'lucide-react'
import { Conversation } from '../../types/chat'
import { useAuth } from '../../hooks/useAuth'
import { ConversationMenu } from './ConversationMenu'
import { UsageDisplay } from '../usage/UsageDisplay'
import { useUserProfile } from '../../hooks/useUserProfile'
import { Logo } from '../common/Logo'

import { useUsageStats } from '../../hooks/useUsageStats'

interface SidebarProps {
  conversations: Conversation[]
  activeConversationId: string | null
  currentPage: 'chat' | 'profile' | 'pricing' // NEW: Current page state
  onNewChat: () => void
  onSelectConversation: (id: string) => void
  onProfileSettings: () => void // NEW: Profile settings handler
  onPricingPlans: () => void // NEW: Pricing plans handler
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
  currentPage, // NEW: Current page prop
  onNewChat, 
  onSelectConversation,
  onProfileSettings, // NEW: Profile settings handler
  onPricingPlans, // NEW: Pricing plans handler
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
            <button onClick={onNewChat} className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors">
              <Logo showText={true} size="md" />
            </button>
            <button
              onClick={onToggle}
              className="p-2 hover:bg-gray-100/50 rounded-xl transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          
          {/* Desktop header with clickable logo */}
          <div className="hidden lg:block p-6 pt-8">
            <button 
              onClick={onNewChat}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <Logo showText={true} size="lg" />
            </button>
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

        {/* Clean conversations list - only show on chat page */}
        {currentPage === 'chat' && (
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
        )}

        {/* NEW: Page indicator for non-chat pages */}
        {currentPage !== 'chat' && (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center text-gray-500">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {currentPage === 'profile' ? (
                  <User className="w-8 h-8 text-purple-600" />
                ) : (
                  <CreditCard className="w-8 h-8 text-purple-600" />
                )}
              </div>
              <p className="text-sm font-medium text-gray-700">
                {currentPage === 'profile' ? 'Profile Settings' : 'Pricing Plans'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {currentPage === 'profile' ? 'Manage your account' : 'Choose your plan'}
              </p>
            </div>
          </div>
        )}

        {/* Usage stats with subtle background - only show on chat page */}
        {usageStats && currentPage === 'chat' && (
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
                
                {/* Usage statistics in profile menu - only show on chat page */}
                {usageStats && currentPage === 'chat' && (
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

                {/* NEW: Profile Settings navigation */}
                <button
                  onClick={() => {
                    setProfileMenuOpen(false)
                    onProfileSettings()
                  }}
                  className={`w-full flex items-center space-x-3 p-3 transition-colors ${
                    currentPage === 'profile' 
                      ? 'bg-purple-50/50 text-purple-700' 
                      : 'hover:bg-gray-50/50 text-gray-700'
                  }`}
                >
                  <Settings className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">Profile Settings</span>
                </button>
                
                {/* NEW: Pricing Plans navigation */}
                <button
                  onClick={() => {
                    setProfileMenuOpen(false)
                    onPricingPlans()
                  }}
                  className={`w-full flex items-center space-x-3 p-3 transition-colors ${
                    currentPage === 'pricing' 
                      ? 'bg-purple-50/50 text-purple-700' 
                      : 'hover:bg-purple-50/50 text-purple-600'
                  }`}
                >
                  <CreditCard className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm font-medium">Pricing Plans</span>
                </button>
                
                {conversations.length > 1 && currentPage === 'chat' && (
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
    </>
  )
}