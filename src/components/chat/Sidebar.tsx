// Refined sidebar component with rounded design and no logo
import React from 'react'
import { Plus, MessageSquare, ChevronLeft, Menu, User, Settings, CreditCard, ChevronDown, LogOut, Trash2 } from 'lucide-react'
import { Conversation } from '../../types/chat'
import { useAuth } from '../../hooks/useAuth'
import { ConversationMenu } from './ConversationMenu'
import { UsageDisplay } from '../usage/UsageDisplay'

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
  const [profileMenuOpen, setProfileMenuOpen] = React.useState(false)
  const [showClearConfirm, setShowClearConfirm] = React.useState(false)

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Mobile toggle button */}
      <button
        onClick={onToggle}
        className="fixed top-4 left-4 z-50 lg:hidden bg-white/90 backdrop-blur-sm rounded-2xl p-3 shadow-lg border border-gray-200 hover:bg-white hover:shadow-xl transition-all duration-200 flex items-center justify-center"
      >
        <Menu className="w-6 h-6 text-gray-600" />
      </button>

      {/* Sidebar */}
      <div className={`
        fixed lg:relative top-0 left-0 h-full bg-white/95 backdrop-blur-sm border-r border-gray-200 z-40
        transform transition-transform duration-300 ease-in-out
        w-64 md:w-72 lg:w-64
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        shadow-2xl lg:shadow-none
      `}>
        <div className="flex flex-col h-full">
          {/* Header Section - No Logo */}
          <div className="p-4">
            {/* New Chat Button */}
            <button
              onClick={onNewChat}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-2xl transition-all duration-200 flex items-center justify-center group text-sm shadow-lg hover:shadow-xl"
            >
              <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" />
              New chat
            </button>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto px-3">
            <div className="space-y-2">
              {conversations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center shadow-lg mx-auto mb-4 opacity-60">
                    <MessageSquare className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-sm">No conversations yet</p>
                </div>
              ) : (
                <>
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`
                        group relative rounded-2xl transition-all duration-200 cursor-pointer
                        ${activeConversationId === conversation.id
                          ? 'bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 shadow-sm'
                          : 'hover:bg-gray-50 border border-transparent'
                        }
                      `}
                      onClick={() => onSelectConversation(conversation.id)}
                    >
                      <div className="flex items-center p-3 pr-8">
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

                      {/* Conversation Menu - FIXED: Removed onExport */}
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
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

          {/* Usage Stats Display */}
          {usageStats && (
            <div className="p-4">
              <div className="rounded-2xl overflow-hidden">
                <UsageDisplay usageStats={usageStats} />
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-purple-50 to-white">
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="w-full flex items-center space-x-3 p-3 rounded-2xl hover:bg-white/70 transition-colors group"
              >
                <div className="w-7 h-7 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-gray-800">
                    {usageStats?.tier.tier.replace('_', ' ').toUpperCase() || 'FREE'} Plan
                  </div>
                  {usageStats && (
                    <div className="text-xs text-gray-500">
                      {Math.round((usageStats.tokens_used_month / usageStats.tier.monthly_tokens) * 100)}% used
                    </div>
                  )}
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Menu */}
              {profileMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
                  
                  {/* Usage Statistics in Profile Menu */}
                  {usageStats && (
                    <div className="px-3 py-3 border-b border-gray-100">
                      <div className="text-xs text-gray-600 font-medium mb-2 flex items-center">
                        <span className="mr-1">📊</span>
                        Usage Statistics
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Tokens:</span>
                          <span className="font-medium text-gray-800">
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
                        <div className="text-xs text-gray-500 mt-1">
                          📅 Resets monthly • Today: {usageStats.tokens_used_today.toLocaleString()} tokens
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setProfileMenuOpen(false)
                    }}
                    className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-700">Settings</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      onUpgrade()
                      setProfileMenuOpen(false)
                    }}
                    className="w-full flex items-center space-x-3 p-3 hover:bg-purple-50 transition-colors"
                  >
                    <CreditCard className="w-4 h-4 text-purple-600" />
                    <span className="text-sm text-purple-600 font-medium">Upgrade plan</span>
                  </button>
                  
                  {conversations.length > 1 && (
                    <button
                      onClick={() => {
                        setShowClearConfirm(true)
                        setProfileMenuOpen(false)
                      }}
                      className="w-full flex items-center space-x-3 p-3 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-600">Clear conversations</span>
                    </button>
                  )}
                  
                  <div className="border-t border-gray-100">
                    <button
                      onClick={() => {
                        signOut()
                        setProfileMenuOpen(false)
                      }}
                      className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-700">Log out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Clear Conversations Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full">
            <div className="mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Clear conversations</h3>
                <p className="text-sm text-gray-600">This will delete all your conversations</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-2xl p-3 mb-6">
                <p className="text-sm text-red-800 font-medium">
                  This action cannot be undone.
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-2xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onClearAllConversations()
                    setShowClearConfirm(false)
                  }}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-2xl transition-colors font-medium px-4 py-3"
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