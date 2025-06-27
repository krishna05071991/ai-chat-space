// Conversation context menu with light theme for the purple sidebar
import React, { useState } from 'react'
import { MoreHorizontal, Edit3, Trash2, AlertTriangle } from 'lucide-react'
import { Conversation } from '../../types/chat'

interface ConversationMenuProps {
  conversation: Conversation
  onRename: (id: string, newTitle: string) => void
  onDelete: (id: string) => void
  isActive: boolean
}

export function ConversationMenu({ 
  conversation, 
  onRename, 
  onDelete, 
  isActive 
}: ConversationMenuProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [newTitle, setNewTitle] = useState(conversation.title)

  const handleRename = () => {
    if (newTitle.trim() && newTitle.trim() !== conversation.title) {
      onRename(conversation.id, newTitle.trim())
    }
    setIsRenaming(false)
    setShowMenu(false)
  }

  const handleDelete = () => {
    onDelete(conversation.id)
    setShowDeleteConfirm(false)
    setShowMenu(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleRename()
    } else if (e.key === 'Escape') {
      setIsRenaming(false)
      setNewTitle(conversation.title)
    }
  }

  // Rename input component
  if (isRenaming) {
    return (
      <div className="flex items-center space-x-2 p-2">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleRename}
          className="flex-1 text-sm bg-white border border-purple-200 rounded-xl px-2 py-1 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
          autoFocus
          maxLength={100}
        />
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation()
          setShowMenu(!showMenu)
        }}
        className={`
          p-1.5 rounded-xl transition-all duration-200
          ${showMenu ? 'bg-white/70' : 'hover:bg-white/50'}
          ${isActive ? 'text-purple-600' : 'text-gray-500'}
          hover:text-gray-700
        `}
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {/* Context Menu */}
      {showMenu && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute top-0 right-0 z-20 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-xl overflow-hidden min-w-[150px]">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsRenaming(true)
                setShowMenu(false)
              }}
              className="w-full flex items-center space-x-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
            >
              <Edit3 className="w-3 h-3" />
              <span>Rename</span>
            </button>

            <div className="border-t border-gray-100">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowDeleteConfirm(true)
                  setShowMenu(false)
                }}
                className="w-full flex items-center space-x-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Delete chat?</h3>
                  <p className="text-sm text-gray-600">This will delete "{conversation.title}"</p>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors font-medium px-4 py-2"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}