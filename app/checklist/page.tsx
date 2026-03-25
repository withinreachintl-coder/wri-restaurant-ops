'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import PhotoUpload from '@/app/components/PhotoUpload'
import {
  getChecklist,
  addChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  moveItemUp,
  moveItemDown,
  type Checklist,
  type ChecklistItem,
  type ChecklistType
} from '@/lib/checklists'

export default function ChecklistPage() {
  const [checklistType, setChecklistType] = useState<ChecklistType>('opening')
  const [checklist, setChecklist] = useState<Checklist | null>(null)
  const [tasks, setTasks] = useState<ChecklistItem[]>([])
  const [staffName, setStaffName] = useState('')
  const [showNamePrompt, setShowNamePrompt] = useState(true)
  const [loading, setLoading] = useState(true)
  
  // Edit mode state
  const [editMode, setEditMode] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [newItemText, setNewItemText] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  // Completion tracking (for display only, not saved yet)
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set())
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({})

  // Load checklist from Supabase
  useEffect(() => {
    loadChecklist()
  }, [checklistType])

  async function loadChecklist() {
    setLoading(true)
    const data = await getChecklist(checklistType)
    if (data) {
      setChecklist(data)
      setTasks(data.items || [])
    }
    setLoading(false)
  }

  const handleTypeChange = (type: ChecklistType) => {
    setChecklistType(type)
    setCompletedItems(new Set())
    setPhotoUrls({})
  }

  const handleToggleTask = (itemId: string) => {
    if (!staffName) {
      alert('Please enter your name first')
      return
    }

    const newCompleted = new Set(completedItems)
    if (newCompleted.has(itemId)) {
      newCompleted.delete(itemId)
    } else {
      newCompleted.add(itemId)
    }
    setCompletedItems(newCompleted)
  }

  const handlePhotoUploaded = (itemId: string, photoUrl: string) => {
    setPhotoUrls(prev => ({ ...prev, [itemId]: photoUrl }))
  }

  // Edit mode functions
  const handleAddItem = async () => {
    if (!newItemText.trim() || !checklist) return

    const newItem = await addChecklistItem(checklist.id, newItemText.trim(), false)
    if (newItem) {
      setTasks([...tasks, newItem])
      setNewItemText('')
      setShowAddForm(false)
    }
  }

  const handleStartEdit = (item: ChecklistItem) => {
    setEditingItemId(item.id)
    setEditText(item.text)
  }

  const handleSaveEdit = async () => {
    if (!editingItemId || !editText.trim()) return

    const success = await updateChecklistItem(editingItemId, editText.trim())
    if (success) {
      setTasks(tasks.map(t => 
        t.id === editingItemId ? { ...t, text: editText.trim() } : t
      ))
      setEditingItemId(null)
      setEditText('')
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Delete this checklist item?')) return

    const success = await deleteChecklistItem(itemId)
    if (success) {
      setTasks(tasks.filter(t => t.id !== itemId))
    }
  }

  const handleMoveUp = async (itemId: string) => {
    if (!checklist) return
    const success = await moveItemUp(checklist.id, itemId)
    if (success) await loadChecklist()
  }

  const handleMoveDown = async (itemId: string) => {
    if (!checklist) return
    const success = await moveItemDown(checklist.id, itemId)
    if (success) await loadChecklist()
  }

  const completedCount = completedItems.size
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0

  const missingPhotos = tasks.filter(t => 
    t.photo_required && completedItems.has(t.id) && !photoUrls[t.id]
  )
  const canComplete = completedCount === tasks.length && missingPhotos.length === 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading checklist...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Daily Ops Checklist</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditMode(!editMode)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  editMode
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {editMode ? '✓ Done Editing' : '✏️ Edit Checklist'}
              </button>
              <Link 
                href="/dashboard"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Dashboard →
              </Link>
            </div>
          </div>

          {/* Type Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => handleTypeChange('opening')}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
                checklistType === 'opening'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Opening
            </button>
            <button
              onClick={() => handleTypeChange('closing')}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
                checklistType === 'closing'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Closing
            </button>
          </div>

          {/* Progress Bar (only in non-edit mode) */}
          {!editMode && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>{completedCount} of {tasks.length} complete</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Missing Photos Warning */}
          {!editMode && missingPhotos.length > 0 && (
            <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <span className="text-yellow-600 text-lg">⚠️</span>
                <div className="text-sm text-yellow-800">
                  <strong>{missingPhotos.length} photo{missingPhotos.length > 1 ? 's' : ''} required</strong>
                  <div className="text-yellow-700 mt-1">
                    Please add photos for all completed tasks that require them
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Name Prompt (only in non-edit mode) */}
      {!editMode && showNamePrompt && (
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Who's completing this checklist?
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                placeholder="Enter your name"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={() => staffName && setShowNamePrompt(false)}
                disabled={!staffName}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Start
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-3">
        {tasks.map((task, index) => (
          <div
            key={task.id}
            className={`bg-white rounded-lg border-2 transition-all ${
              !editMode && completedItems.has(task.id)
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <div className="p-4">
              <div className="flex items-start gap-3">
                {!editMode && (
                  <button
                    onClick={() => handleToggleTask(task.id)}
                    className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                      completedItems.has(task.id)
                        ? 'bg-green-500 border-green-500'
                        : 'border-gray-300 hover:border-blue-500'
                    }`}
                  >
                    {completedItems.has(task.id) && (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                )}

                <div className="flex-1">
                  {editingItemId === task.id ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveEdit}
                        className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingItemId(null)}
                        className="px-3 py-1.5 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <div className={`font-medium ${!editMode && completedItems.has(task.id) ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                        {task.text}
                      </div>
                      {task.photo_required && (
                        <span className="flex-shrink-0 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                          Photo Required
                        </span>
                      )}
                    </div>
                  )}

                  {/* Edit mode controls */}
                  {editMode && editingItemId === task.id && (
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => handleStartEdit(task)}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteItem(task.id)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        🗑️ Delete
                      </button>
                      <button
                        onClick={() => handleMoveUp(task.id)}
                        disabled={index === 0}
                        className="text-sm text-gray-600 hover:text-gray-700 disabled:text-gray-300"
                      >
                        ↑ Up
                      </button>
                      <button
                        onClick={() => handleMoveDown(task.id)}
                        disabled={index === tasks.length - 1}
                        className="text-sm text-gray-600 hover:text-gray-700 disabled:text-gray-300"
                      >
                        ↓ Down
                      </button>
                    </div>
                  )}

                  {/* Photo upload (only in non-edit mode) */}
                  {!editMode && task.photo_required && (
                    <PhotoUpload
                      taskId={task.id}
                      existingPhotoUrl={photoUrls[task.id]}
                      onPhotoUploaded={(url) => handlePhotoUploaded(task.id, url)}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Add New Item (in edit mode) */}
        {editMode && (
          <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-4">
            {showAddForm ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  placeholder="Enter new checklist item..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                  autoFocus
                />
                <button
                  onClick={handleAddItem}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false)
                    setNewItemText('')
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full text-center text-blue-600 hover:text-blue-700 font-medium"
              >
                + Add New Item
              </button>
            )}
          </div>
        )}
      </div>

      {/* Complete Button (only in non-edit mode) */}
      {!editMode && completedCount === tasks.length && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <div className="max-w-4xl mx-auto">
            {canComplete ? (
              <Link
                href="/dashboard"
                className="block w-full py-3 bg-green-600 text-white text-center rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                ✓ All Done! Go to Dashboard
              </Link>
            ) : (
              <div className="w-full py-3 bg-gray-300 text-gray-600 text-center rounded-lg font-semibold cursor-not-allowed">
                {missingPhotos.length > 0 
                  ? `Add ${missingPhotos.length} required photo${missingPhotos.length > 1 ? 's' : ''} to complete`
                  : 'Complete all tasks to finish'
                }
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
