// Mobile-first sidebar component with responsive design
import React from 'react'
import { Plus, MessageSquare, Menu, User, Settings, CreditCard, ChevronDown, LogOut, Trash2, X } from 'lucide-react'
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
      {/* Desktop Sidebar - Only rendered when not mobile */}
      <div className="hidden lg:flex lg:flex-col lg:w-full lg:h-full">
        {/* Desktop Header */}
        <div className="p-6 border-b border-gray-200/30 bg-white/50 backdrop-blur-md">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-light text-[#222427]">chat.space</h1>
          </div>
          
          <button
            onClick={onNewChat}
            className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium py-4 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center group shadow-lg hover:shadow-xl"
          >
            <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" />
            New Conversation
          </button>
        </div>

        {/* Desktop Conversations */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin bg-white/30 backdrop-blur-sm">
          <div className="space-y-2">
            {conversations.length === 0 ? (
              <div className="text-center py-12 text-[#8A8377]">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-r from-purple-500/20 to-purple-600/20 flex items-center justify-center mx-auto mb-4 opacity-60">
                  <MessageSquare className="w-6 h-6 text-purple-600" />
                </div>
                <p className="text-sm font-light">No conversations yet</p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`group relative rounded-2xl transition-all duration-200 cursor-pointer p-4 ${
                    activeConversationId === conversation.id
                      ? 'bg-white/70 shadow-md border border-purple-200/50'
                      : 'hover:bg-white/50 border border-transparent hover:shadow-sm'
                  }`}
                  onClick={() => onSelectConversation(conversation.id)}
                >
                  <div className="flex items-center space-x-3 pr-8">
                    <MessageSquare className={`w-4 h-4 flex-shrink-0 ${
                      activeConversationId === conversation.id 
                        ? 'text-purple-600' 
                        : 'text-[#8A8377]'
                    }`} />
                    <span className={`text-sm truncate leading-relaxed ${
                      activeConversationId === conversation.id 
                        ? 'text-[#222427] font-medium'
                        : 'text-[#222427]'
                    }`}>
                      {conversation.title}
                    </span>
                  </div>
                  
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ConversationMenu
                      conversation={conversation}
                      onRename={onRenameConversation}
                      onDelete={onDeleteConversation}
                      isActive={activeConversationId === conversation.id}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Desktop Usage Stats */}
        {usageStats && (
          <div className="p-4 bg-white/20 backdrop-blur-sm border-t border-gray-200/30">
            <div className="rounded-2xl overflow-hidden bg-white/40">
              <UsageDisplay usageStats={usageStats} />
            </div>
          </div>
        )}

        {/* Desktop Footer */}
        <div className="p-4 border-t border-gray-200/30 bg-white/40 backdrop-blur-sm">
          <div className="relative">
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="w-full flex items-center space-x-3 p-4 rounded-2xl hover:bg-white/60 transition-colors group"
            >
              <div className="w-8 h-8 rounded-2xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="text-sm font-medium text-[#222427] truncate">
                  {usageStats?.tier.tier.replace('_', ' ').toUpperCase() || 'FREE'}
                </div>
                {usageStats && (
                  <div className="text-xs text-[#8A8377] truncate">
                    {Math.round((usageStats.tokens_used_month / usageStats.tier.monthly_tokens) * 100)}% used
                  </div>
                )}
              </div>
              <ChevronDown className={`w-4 h-4 text-[#8A8377] transition-transform flex-shrink-0 ${profileMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Desktop Profile Menu */}
            {profileMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-3 bg-white/95 backdrop-blur-md border border-gray-200/50 rounded-2xl shadow-2xl overflow-hidden">
                <button
                  onClick={() => setProfileMenuOpen(false)}
                  className="w-full flex items-center space-x-3 p-4 hover:bg-gray-50/50 transition-colors"
                >
                  <Settings className="w-4 h-4 text-[#8A8377] flex-shrink-0" />
                  <span className="text-sm text-[#222427]">Settings</span>
                </button>
                
                <button
                  onClick={() => {
                    onUpgrade()
                    setProfileMenuOpen(false)
                  }}
                  className="w-full flex items-center space-x-3 p-4 hover:bg-purple-50/50 transition-colors"
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
                    className="w-full flex items-center space-x-3 p-4 hover:bg-red-50/50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span className="text-sm text-red-600">Clear conversations</span>
                  </button>
                )}
                
                <div className="border-t border-gray-200/50">
                  <button
                    onClick={() => {
                      signOut()
                      setProfileMenuOpen(false)
                    }}
                    className="w-full flex items-center space-x-3 p-4 hover:bg-gray-50/50 transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-[#8A8377] flex-shrink-0" />
                    <span className="text-sm text-[#222427]">Log out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sidebar - Slide-in drawer */}
      <div className={`lg:hidden fixed inset-0 z-50 ${isOpen ? 'block' : 'hidden'}`}>
        <>
          {/* Mobile backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onToggle}
          />
          
          {/* Mobile drawer */}
          <div className="absolute top-0 left-0 h-full w-80 bg-white/95 backdrop-blur-md shadow-2xl flex flex-col transform transition-transform duration-300 ease-out">
            {/* Mobile header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-2xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-lg font-light text-[#222427]">chat.space</h2>
              </div>
              <button
                onClick={onToggle}
                className="p-2 hover:bg-gray-100/50 rounded-2xl transition-colors shadow-sm"
              >
                <X className="w-5 h-5 text-[#8A8377]" />
              </button>
            </div>
            
            {/* Mobile New Chat */}
            <div className="p-6">
              <button
                onClick={onNewChat}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium py-4 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center group shadow-lg hover:shadow-xl"
              >
                <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" />
                New Conversation
              </button>
            </div>

            {/* Mobile conversations */}
            <div className="flex-1 overflow-y-auto px-4 scrollbar-thin">
              <div className="space-y-2">
                {conversations.length === 0 ? (
                  <div className="text-center py-12 text-[#8A8377]">
                    <div className="w-16 h-16 rounded-3xl bg-gradient-to-r from-purple-500/20 to-purple-600/20 flex items-center justify-center mx-auto mb-4 opacity-60">
                      <MessageSquare className="w-6 h-6 text-purple-600" />
                    </div>
                    <p className="text-sm font-light">No conversations yet</p>
                  </div>
                ) : (
                  conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`group relative rounded-2xl transition-all duration-200 cursor-pointer p-4 ${
                        activeConversationId === conversation.id
                          ? 'bg-white/70 shadow-md border border-purple-200/50'
                          : 'hover:bg-white/50 border border-transparent hover:shadow-sm'
                      }`}
                      onClick={() => onSelectConversation(conversation.id)}
                    >
                      <div className="flex items-center space-x-3 pr-8">
                        <MessageSquare className={`w-4 h-4 flex-shrink-0 ${
                          activeConversationId === conversation.id 
                            ? 'text-purple-600' 
                            : 'text-[#8A8377]'
                        }`} />
                        <span className={`text-sm truncate leading-relaxed ${
                          activeConversationId === conversation.id 
                            ? 'text-[#222427] font-medium'
                            : 'text-[#222427]'
                        }`}>
                          {conversation.title}
                        </span>
                      </div>

                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ConversationMenu
                          conversation={conversation}
                          onRename={onRenameConversation}
                          onDelete={onDeleteConversation}
                          isActive={activeConversationId === conversation.id}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Mobile usage stats */}
            {usageStats && (
              <div className="p-4 border-t border-gray-200/30">
                <div className="rounded-2xl overflow-hidden bg-white/60">
                  <UsageDisplay usageStats={usageStats} />
                </div>
              </div>
            )}

            {/* Mobile footer */}
            <div className="p-4 border-t border-gray-200/50">
              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="w-full flex items-center space-x-3 p-4 rounded-2xl hover:bg-white/60 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-2xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-sm font-medium text-[#222427] truncate">
                      {usageStats?.tier.tier.replace('_', ' ').toUpperCase() || 'FREE'}
                    </div>
                    {usageStats && (
                      <div className="text-xs text-[#8A8377] truncate">
                        {Math.round((usageStats.tokens_used_month / usageStats.tier.monthly_tokens) * 100)}% used
                      </div>
                    )}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-[#8A8377] transition-transform flex-shrink-0 ${profileMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Mobile profile menu - similar to desktop */}
                {profileMenuOpen && (
                  <div className="absolute bottom-full left-0 right-0 mb-3 bg-white/95 backdrop-blur-md border border-gray-200/50 rounded-2xl shadow-2xl overflow-hidden">
                    <button
                      onClick={() => {
                        setProfileMenuOpen(false)
                      }}
                      className="w-full flex items-center space-x-3 p-4 hover:bg-gray-50/50 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-[#8A8377] flex-shrink-0" />
                      <span className="text-sm text-[#222427]">Settings</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        onUpgrade()
                        setProfileMenuOpen(false)
                      }}
                      className="w-full flex items-center space-x-3 p-4 hover:bg-purple-50/50 transition-colors"
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
                        className="w-full flex items-center space-x-3 p-4 hover:bg-red-50/50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-500 flex-shrink-0" />
                        <span className="text-sm text-red-600">Clear conversations</span>
                      </button>
                    )}
                    
                    <div className="border-t border-gray-200/50">
                      <button
                        onClick={() => {
                          signOut()
                          setProfileMenuOpen(false)
                        }}
                        className="w-full flex items-center space-x-3 p-4 hover:bg-gray-50/50 transition-colors"
                      >
                        <LogOut className="w-4 h-4 text-[#8A8377] flex-shrink-0" />
                        <span className="text-sm text-[#222427]">Log out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      </div>

      {/* Clear conversations modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl border border-gray-200/50">
            <div className="mb-6">
              <div>
                <h3 className="text-xl font-light text-[#222427] mb-2">Clear conversations</h3>
                <p className="text-sm text-[#8A8377]">This will archive all your conversations</p>
              </div>
              <div className="bg-red-50/60 border border-red-200/50 rounded-2xl p-4 mb-6 mt-4">
                <p className="text-sm text-red-800 font-medium">
                  This action cannot be undone.
                </p>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 px-6 py-3 border border-gray-200/50 text-[#222427] rounded-2xl hover:bg-gray-50/50 transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onClearAllConversations()
                    setShowClearConfirm(false)
                  }}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-2xl transition-colors font-medium px-6 py-3 text-sm shadow-lg hover:shadow-xl"
                >
                  Clear Conversations
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}