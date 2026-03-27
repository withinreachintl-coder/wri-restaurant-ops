'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase, ChecklistTask } from '@/lib/supabase'

const OPENING_TASKS: ChecklistTask[] = [
  { id: '1', text: 'Check walk-in cooler temperature (38°F or below)', completed: false, photoRequired: true, checklistType: 'opening', order: 1 },
  { id: '2', text: 'Check freezer temperature (0°F or below)', completed: false, photoRequired: true, checklistType: 'opening', order: 2 },
  { id: '3', text: 'Verify prep station setup and cleanliness', completed: false, photoRequired: false, checklistType: 'opening', order: 3 },
  { id: '4', text: 'Test all cooking equipment (ovens, fryers, grills)', completed: false, photoRequired: false, checklistType: 'opening', order: 4 },
  { id: '5', text: 'Check hand wash stations (soap, towels, hot water)', completed: false, photoRequired: false, checklistType: 'opening', order: 5 },
  { id: '6', text: 'Verify first aid kit is stocked', completed: false, photoRequired: false, checklistType: 'opening', order: 6 },
  { id: '7', text: 'Count and verify register cash (starting balance)', completed: false, photoRequired: true, checklistType: 'opening', order: 7 },
  { id: '8', text: 'Turn on all lights and music', completed: false, photoRequired: false, checklistType: 'opening', order: 8 },
  { id: '9', text: 'Unlock entrance doors', completed: false, photoRequired: false, checklistType: 'opening', order: 9 },
]

const CLOSING_TASKS: ChecklistTask[] = [
  { id: 'c1', text: 'Lock entrance doors', completed: false, photoRequired: false, checklistType: 'closing', order: 1 },
  { id: 'c2', text: 'Turn off all cooking equipment', completed: false, photoRequired: true, checklistType: 'closing', order: 2 },
  { id: 'c3', text: 'Clean and sanitize all food prep surfaces', completed: false, photoRequired: true, checklistType: 'closing', order: 3 },
  { id: 'c4', text: 'Sweep and mop all kitchen floors', completed: false, photoRequired: true, checklistType: 'closing', order: 4 },
  { id: 'c5', text: 'Empty all trash and replace liners', completed: false, photoRequired: false, checklistType: 'closing', order: 5 },
  { id: 'c6', text: 'Restock prep station for tomorrow', completed: false, photoRequired: false, checklistType: 'closing', order: 6 },
  { id: 'c7', text: 'Count register cash and complete cash drop', completed: false, photoRequired: true, checklistType: 'closing', order: 7 },
  { id: 'c8', text: 'Turn off lights and music', completed: false, photoRequired: false, checklistType: 'closing', order: 8 },
  { id: 'c9', text: 'Set alarm and lock all doors', completed: false, photoRequired: false, checklistType: 'closing', order: 9 },
]

export default function ChecklistPage() {
  const [checklistType, setChecklistType] = useState<'opening' | 'closing'>('opening')
  const [tasks, setTasks] = useState<ChecklistTask[]>([])
  const [staffName, setStaffName] = useState('')
  const [showNamePrompt, setShowNamePrompt] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [newItemText, setNewItemText] = useState('')
  const [newItemPhotoRequired, setNewItemPhotoRequired] = useState(false)
  const [loading, setLoading] = useState(true)

  // Load tasks from Supabase or use defaults
  useEffect(() => {
    loadTasks()
  }, [checklistType])

  const loadTasks = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('checklist_tasks')
        .select('*')
        .eq('checklistType', checklistType)
        .order('order', { ascending: true })

      if (error) {
        console.error('Error loading tasks:', error)
        // Fallback to default tasks if DB fails
        setTasks(checklistType === 'opening' ? OPENING_TASKS : CLOSING_TASKS)
      } else if (data && data.length > 0) {
        setTasks(data)
      } else {
        // No tasks in DB, use defaults
        setTasks(checklistType === 'opening' ? OPENING_TASKS : CLOSING_TASKS)
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err)
      setTasks(checklistType === 'opening' ? OPENING_TASKS : CLOSING_TASKS)
    } finally {
      setLoading(false)
    }
  }

  const handleTypeChange = (type: 'opening' | 'closing') => {
    setChecklistType(type)
  }

  const handleToggleTask = (taskId: string) => {
    if (editMode) return // Don't toggle in edit mode

    if (!staffName) {
      alert('Please enter your name first')
      return
    }

    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? {
              ...task,
              completed: !task.completed,
              completedBy: !task.completed ? staffName : undefined,
              completedAt: !task.completed ? new Date().toLocaleTimeString() : undefined,
            }
          : task
      )
    )
  }

  const handlePhotoUpload = (taskId: string) => {
    // TODO: Implement actual photo upload
    const fakeUrl = `https://placeholder.com/photo-${taskId}`
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, photoUrl: fakeUrl } : task
      )
    )
  }

  const handleAddItem = async () => {
    if (!newItemText.trim()) {
      alert('Please enter task text')
      return
    }

    const newTask: ChecklistTask = {
      id: `temp-${Date.now()}`, // Temporary ID
      text: newItemText.trim(),
      completed: false,
      photoRequired: newItemPhotoRequired,
      checklistType,
      order: tasks.length + 1,
    }

    try {
      const { data, error } = await supabase
        .from('checklist_tasks')
        .insert([{
          text: newTask.text,
          completed: newTask.completed,
          photoRequired: newTask.photoRequired,
          checklistType: newTask.checklistType,
          order: newTask.order,
        }])
        .select()

      if (error) {
        console.error('Error adding task:', error)
        alert('Failed to add task. Check console for details.')
        return
      }

      if (data && data.length > 0) {
        // Use the returned task with real ID
        setTasks(prev => [...prev, data[0]])
      } else {
        // Fallback to local state if no data returned
        setTasks(prev => [...prev, newTask])
      }

      // Reset form
      setNewItemText('')
      setNewItemPhotoRequired(false)
    } catch (err) {
      console.error('Failed to add task:', err)
      alert('Failed to add task. Check console for details.')
    }
  }

  const handleDeleteItem = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return

    try {
      const { error } = await supabase
        .from('checklist_tasks')
        .delete()
        .eq('id', taskId)

      if (error) {
        console.error('Error deleting task:', error)
        alert('Failed to delete task. Check console for details.')
        return
      }

      setTasks(prev => prev.filter(t => t.id !== taskId))
    } catch (err) {
      console.error('Failed to delete task:', err)
      alert('Failed to delete task. Check console for details.')
    }
  }

  const completedCount = tasks.filter(t => t.completed).length
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Daily Ops Checklist</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setEditMode(!editMode)}
                className={`text-sm px-4 py-2 rounded-lg font-medium transition-colors ${
                  editMode
                    ? 'bg-orange-600 text-white hover:bg-orange-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {editMode ? '✓ Done Editing' : '✏️ Edit'}
              </button>
              <Link 
                href="/dashboard"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium px-4 py-2"
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

          {/* Progress Bar (hide in edit mode) */}
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
        </div>
      </div>

      {/* Name Prompt (hide in edit mode) */}
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

      {/* Add Item Form (edit mode only) */}
      {editMode && (
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Add New Task</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                placeholder="Task description..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newItemText.trim()) {
                    handleAddItem()
                  }
                }}
              />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newItemPhotoRequired}
                  onChange={(e) => setNewItemPhotoRequired(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700">Photo required</span>
              </label>
              <div className="flex gap-2">
                <button
                  onClick={handleAddItem}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Add Item
                </button>
                <button
                  onClick={() => {
                    setNewItemText('')
                    setNewItemPhotoRequired(false)
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-3">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No tasks yet. {editMode && 'Add some above!'}
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`bg-white rounded-lg border-2 transition-all ${
                task.completed
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
                        task.completed
                          ? 'bg-green-500 border-green-500'
                          : 'border-gray-300 hover:border-blue-500'
                      }`}
                    >
                      {task.completed && (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  )}

                  <div className="flex-1">
                    <div className={`font-medium ${task.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                      {task.text}
                    </div>

                    {task.completed && task.completedBy && (
                      <div className="text-sm text-gray-500 mt-1">
                        ✓ Completed by {task.completedBy} at {task.completedAt}
                      </div>
                    )}

                    {!editMode && task.photoRequired && (
                      <div className="mt-2">
                        {task.photoUrl ? (
                          <div className="text-sm text-green-600 flex items-center gap-1">
                            <span>📸</span>
                            <span>Photo attached</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handlePhotoUpload(task.id)}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                          >
                            <span>📷</span>
                            <span>Add photo {task.completed ? '(optional)' : '(required)'}</span>
                          </button>
                        )}
                      </div>
                    )}

                    {editMode && (
                      <div className="text-sm text-gray-500 mt-1">
                        {task.photoRequired ? '📷 Photo required' : '📷 No photo'}
                      </div>
                    )}
                  </div>

                  {editMode && (
                    <button
                      onClick={() => handleDeleteItem(task.id)}
                      className="flex-shrink-0 px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 text-sm font-medium transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Complete Button (hide in edit mode) */}
      {!editMode && completedCount === tasks.length && tasks.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <div className="max-w-4xl mx-auto">
            <Link
              href="/dashboard"
              className="block w-full py-3 bg-green-600 text-white text-center rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              ✓ All Done! Go to Dashboard
            </Link>
          </div>
        </div>
      )}
    </main>
  )
}
