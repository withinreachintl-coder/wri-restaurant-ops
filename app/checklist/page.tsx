'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase, ChecklistItem } from '../../lib/supabase'
import PhotoUpload from '../components/PhotoUpload'

type DisplayTask = {
  id: string
  text: string
  photoRequired: boolean
  completed: boolean
  completedBy?: string
  completedAt?: string
  photoUrl?: string
}

const OPENING_TASKS: DisplayTask[] = [
  { id: '1', text: 'Check walk-in cooler temperature (38°F or below)', photoRequired: true, completed: false },
  { id: '2', text: 'Check freezer temperature (0°F or below)', photoRequired: true, completed: false },
  { id: '3', text: 'Verify prep station setup and cleanliness', photoRequired: false, completed: false },
  { id: '4', text: 'Test all cooking equipment (ovens, fryers, grills)', photoRequired: false, completed: false },
  { id: '5', text: 'Check hand wash stations (soap, towels, hot water)', photoRequired: false, completed: false },
  { id: '6', text: 'Verify first aid kit is stocked', photoRequired: false, completed: false },
  { id: '7', text: 'Count and verify register cash (starting balance)', photoRequired: true, completed: false },
  { id: '8', text: 'Turn on all lights and music', photoRequired: false, completed: false },
  { id: '9', text: 'Unlock entrance doors', photoRequired: false, completed: false },
]

const CLOSING_TASKS: DisplayTask[] = [
  { id: 'c1', text: 'Lock entrance doors', photoRequired: false, completed: false },
  { id: 'c2', text: 'Turn off all cooking equipment', photoRequired: true, completed: false },
  { id: 'c3', text: 'Clean and sanitize all food prep surfaces', photoRequired: true, completed: false },
  { id: 'c4', text: 'Sweep and mop all kitchen floors', photoRequired: true, completed: false },
  { id: 'c5', text: 'Empty all trash and replace liners', photoRequired: false, completed: false },
  { id: 'c6', text: 'Restock prep station for tomorrow', photoRequired: false, completed: false },
  { id: 'c7', text: 'Count register cash and complete cash drop', photoRequired: true, completed: false },
  { id: 'c8', text: 'Turn off lights and music', photoRequired: false, completed: false },
  { id: 'c9', text: 'Set alarm and lock all doors', photoRequired: false, completed: false },
]

export default function ChecklistPage() {
  const [checklistType, setChecklistType] = useState<'opening' | 'closing'>('opening')
  const [tasks, setTasks] = useState<DisplayTask[]>([])
  const [staffName, setStaffName] = useState('')
  const [showNamePrompt, setShowNamePrompt] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [newItemText, setNewItemText] = useState('')
  const [newItemPhotoRequired, setNewItemPhotoRequired] = useState(false)
  const [loading, setLoading] = useState(true)
  const [checklistId, setChecklistId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    loadOrCreateChecklist()
  }, [checklistType])

  const loadOrCreateChecklist = async () => {
    setLoading(true)
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        console.error('No authenticated user:', authError)
        setTasks(checklistType === 'opening' ? OPENING_TASKS : CLOSING_TASKS)
        setLoading(false)
        return
      }

      let orgId: string

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('org_id')
        .eq('id', user.id)
        .single()

      const needsUserCreation = userError?.code === 'PGRST116' || !userData?.org_id

      if (needsUserCreation) {
        console.log('Creating user and org records...')
        console.log('User email:', user.email)
        console.log('User ID:', user.id)

        const { data: newOrg, error: orgCreateError } = await supabase
          .from('organizations')
          .insert([{
            name: user.email?.split('@')[0] || 'My Restaurant',
            owner_email: user.email || '',
            plan: 'basic'
          }])
          .select('id')
          .single()

        if (orgCreateError || !newOrg) {
          console.error('Error creating org:', orgCreateError)
          console.error('Org create error details:', JSON.stringify(orgCreateError, null, 2))
          alert(`Failed to create org: ${orgCreateError?.message || 'Unknown error'}`)
          setTasks(checklistType === 'opening' ? OPENING_TASKS : CLOSING_TASKS)
          setLoading(false)
          return
        }

        console.log('Org created successfully:', newOrg.id)

        orgId = newOrg.id

        const { error: userUpsertError } = await supabase
          .from('users')
          .upsert([{
            id: user.id,
            email: user.email,
            name: user.email?.split('@')[0] || 'User',
            org_id: orgId,
            role: 'admin'
          }], {
            onConflict: 'id'
          })

        if (userUpsertError) {
          console.error('Error upserting user:', userUpsertError)
          setTasks(checklistType === 'opening' ? OPENING_TASKS : CLOSING_TASKS)
          setLoading(false)
          return
        }
      } else if (userError) {
        console.error('Error fetching user:', userError)
        setTasks(checklistType === 'opening' ? OPENING_TASKS : CLOSING_TASKS)
        setLoading(false)
        return
      } else {
        orgId = userData.org_id
      }

      const { data: existingChecklists, error: fetchError } = await supabase
        .from('checklists')
        .select('id, org_id, type')
        .eq('type', checklistType)
        .eq('org_id', orgId)
        .limit(1)

      if (fetchError) {
        console.error('Error fetching checklist:', fetchError)
        setTasks(checklistType === 'opening' ? OPENING_TASKS : CLOSING_TASKS)
        setLoading(false)
        return
      }

      let currentChecklistId: string

      if (existingChecklists && existingChecklists.length > 0) {
        currentChecklistId = existingChecklists[0].id
        setChecklistId(currentChecklistId)
        console.log('✅ Loaded existing checklist:', currentChecklistId)
      } else {
        const { data: newChecklist, error: createError } = await supabase
          .from('checklists')
          .insert([{
            org_id: orgId,
            name: `${checklistType.charAt(0).toUpperCase() + checklistType.slice(1)} Checklist`,
            type: checklistType
          }])
          .select('id')
          .single()

        if (createError || !newChecklist) {
          console.error('Error creating checklist:', createError)
          setTasks(checklistType === 'opening' ? OPENING_TASKS : CLOSING_TASKS)
          setLoading(false)
          return
        }

        currentChecklistId = newChecklist.id
        setChecklistId(currentChecklistId)
        console.log('✅ Created new checklist:', currentChecklistId)
      }

      console.log('📋 Final checklistId set to:', currentChecklistId)
      await loadTasks(currentChecklistId)
    } catch (err) {
      console.error('Failed to load checklist:', err)
      setTasks(checklistType === 'opening' ? OPENING_TASKS : CLOSING_TASKS)
      setLoading(false)
    }
  }

  const loadTasks = async (currentChecklistId: string) => {
    try {
      const { data, error } = await supabase
        .from('checklist_items')
        .select('*')
        .eq('checklist_id', currentChecklistId)
        .order('order_index', { ascending: true })

      if (error) {
        console.error('Error loading tasks:', error)
        setTasks(checklistType === 'opening' ? OPENING_TASKS : CLOSING_TASKS)
      } else if (data && data.length > 0) {
        const displayTasks: DisplayTask[] = data.map((item: ChecklistItem) => ({
          id: item.id,
          text: item.text,
          photoRequired: item.photo_required,
          completed: false,
        }))
        setTasks(displayTasks)
      } else {
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
    if (editMode) return

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

  const handlePhotoUploaded = (taskId: string, photoUrl: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, photoUrl } : task
      )
    )
  }

  const handleAddItem = async () => {
    if (!newItemText.trim()) {
      alert('Please enter task text')
      return
    }

    if (!checklistId) {
      alert('Checklist not loaded. Please refresh the page.')
      return
    }

    if (tasks.length >= 10) {
      const shouldUpgrade = confirm(
        `You've reached the free plan limit of 10 checklist items.\n\n` +
        `Upgrade to Pro ($19/month) for unlimited items?\n\n` +
        `Click OK to upgrade, or Cancel to stay on the free plan.`
      )
      if (shouldUpgrade) {
        window.location.href = '/billing'
      }
      return
    }

    const nextOrderIndex = tasks.length + 1

    try {
      const { data, error} = await supabase
        .from('checklist_items')
        .insert([{
          checklist_id: checklistId,
          text: newItemText.trim(),
          photo_required: newItemPhotoRequired,
          order_index: nextOrderIndex,
        }])
        .select()

      if (error) {
        console.error('Error adding task:', error)

        if (error.message && error.message.includes('Free accounts are limited to')) {
          const shouldUpgrade = confirm(
            `You've reached the free plan limit of 10 checklist items.\n\n` +
            `Upgrade to Pro ($19/month) for unlimited items?\n\n` +
            `Click OK to upgrade, or Cancel to stay on the free plan.`
          )
          if (shouldUpgrade) {
            window.location.href = '/billing'
          }
          return
        }

        alert(`Failed to add task: ${error.message}`)
        return
      }

      if (data && data.length > 0) {
        const newTask: DisplayTask = {
          id: data[0].id,
          text: data[0].text,
          photoRequired: data[0].photo_required,
          completed: false,
        }
        setTasks(prev => [...prev, newTask])
      }

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
        .from('checklist_items')
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
    <main className="min-h-screen" style={{ background: '#FAFAF9', color: '#1C1917', paddingBottom: '100px' }}>
      {/* Header */}
      <div
        className="sticky top-0 z-10"
        style={{ background: '#1C1917', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div style={{ maxWidth: '768px', margin: '0 auto', padding: '16px 24px' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
            <h1
              style={{
                fontFamily: 'var(--font-playfair), "Playfair Display", serif',
                fontSize: '22px',
                fontWeight: 700,
              }}
            >
              Daily Ops Checklist
            </h1>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={() => setEditMode(!editMode)}
                className="hover:opacity-80 transition-opacity"
                style={{
                  fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: editMode ? '#1C1917' : '#F5F0E8',
                  background: editMode ? '#D97706' : 'transparent',
                  border: editMode ? 'none' : '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '4px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                }}
              >
                {editMode ? '✓ Done' : 'Edit'}
              </button>
              <Link
                href="/help"
                className="hover:opacity-80 transition-opacity"
                style={{
                  fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#1C1917',
                  background: '#D97706',
                  borderRadius: '4px',
                  padding: '8px 16px',
                  textDecoration: 'none',
                }}
              >
                How to Use
              </Link>
              <Link
                href="/dashboard"
                className="hover:opacity-80 transition-opacity"
                style={{
                  fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#D97706',
                  textDecoration: 'none',
                  padding: '8px 12px',
                }}
              >
                Dashboard &rarr;
              </Link>
            </div>
          </div>

          {/* Type Toggle */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['opening', 'closing'] as const).map((type) => (
              <button
                key={type}
                onClick={() => handleTypeChange(type)}
                className="hover:opacity-90 transition-opacity"
                style={{
                  flex: 1,
                  fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: checklistType === type ? '#1C1917' : '#A89880',
                  background: checklistType === type ? '#D97706' : 'rgba(255,255,255,0.04)',
                  border: checklistType === type ? 'none' : '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '4px',
                  padding: '10px 16px',
                  cursor: 'pointer',
                  textTransform: 'capitalize' as const,
                }}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Progress Bar */}
          {!editMode && (
            <div style={{ marginTop: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                  fontSize: '12px',
                  fontWeight: 400,
                  color: '#6B5B4E',
                  marginBottom: '6px',
                }}
              >
                <span>{completedCount} of {tasks.length} complete</span>
                <span>{progressPercent}%</span>
              </div>
              <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${progressPercent}%`,
                    background: progressPercent === 100 ? '#D97706' : '#B45309',
                    borderRadius: '2px',
                    transition: 'width 0.3s',
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Name Prompt */}
      {!editMode && showNamePrompt && (
        <div style={{ maxWidth: '768px', margin: '0 auto', padding: '24px 24px 0' }}>
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E8E3DC',
              borderRadius: '8px',
              padding: '20px',
            }}
          >
            <label
              style={{
                display: 'block',
                fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                fontSize: '13px',
                fontWeight: 500,
                color: '#78716C',
                marginBottom: '10px',
              }}
            >
              Who&apos;s completing this checklist?
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                placeholder="Enter your name"
                style={{
                  flex: 1,
                  fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                  fontSize: '14px',
                  fontWeight: 400,
                  color: '#1C1917',
                  background: '#FAFAF9',
                  border: '1px solid #E8E3DC',
                  borderRadius: '4px',
                  padding: '10px 14px',
                  outline: 'none',
                }}
              />
              <button
                onClick={() => staffName && setShowNamePrompt(false)}
                disabled={!staffName}
                className="hover:opacity-90 transition-opacity"
                style={{
                  fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#1C1917',
                  background: '#D97706',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '10px 24px',
                  cursor: !staffName ? 'not-allowed' : 'pointer',
                }}
              >
                Start
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Item (edit mode) */}
      {editMode && (
        <div style={{ maxWidth: '768px', margin: '0 auto', padding: '24px 24px 0' }}>
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E8E3DC',
              borderRadius: '8px',
              padding: '20px',
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                fontSize: '14px',
                fontWeight: 500,
                color: '#1C1917',
                marginBottom: '14px',
              }}
            >
              Add New Task
            </h3>
            <div>
              <input
                type="text"
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                placeholder="Task description..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newItemText.trim()) {
                    handleAddItem()
                  }
                }}
                style={{
                  width: '100%',
                  fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                  fontSize: '14px',
                  fontWeight: 400,
                  color: '#1C1917',
                  background: '#FAFAF9',
                  border: '1px solid #E8E3DC',
                  borderRadius: '4px',
                  padding: '10px 14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  marginBottom: '12px',
                }}
              />
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                  fontSize: '13px',
                  fontWeight: 400,
                  color: '#78716C',
                  marginBottom: '14px',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={newItemPhotoRequired}
                  onChange={(e) => setNewItemPhotoRequired(e.target.checked)}
                  style={{ accentColor: '#D97706' }}
                />
                Photo required
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleAddItem}
                  disabled={!checklistId || loading}
                  className="hover:opacity-90 transition-opacity"
                  style={{
                    flex: 1,
                    fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#1C1917',
                    background: '#D97706',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '10px 20px',
                    cursor: (!mounted || !checklistId) ? 'not-allowed' : 'pointer',
                  }}
                >
                  Add Item
                </button>
                <button
                  onClick={() => {
                    setNewItemText('')
                    setNewItemPhotoRequired(false)
                  }}
                  className="hover:opacity-80 transition-opacity"
                  style={{
                    fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#78716C',
                    background: 'transparent',
                    border: '1px solid #E8E3DC',
                    borderRadius: '4px',
                    padding: '10px 20px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task List */}
      <div style={{ maxWidth: '768px', margin: '0 auto', padding: '24px 24px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {loading ? (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 0',
              fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
              fontSize: '14px',
              fontWeight: 300,
              color: '#6B5B4E',
            }}
          >
            Loading tasks...
          </div>
        ) : tasks.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 0',
              fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
              fontSize: '14px',
              fontWeight: 300,
              color: '#6B5B4E',
            }}
          >
            No tasks yet. {editMode && 'Add some above!'}
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              style={{
                background: task.completed ? '#FEF9F0' : '#FFFFFF',
                border: task.completed
                  ? '1px solid rgba(217,119,6,0.25)'
                  : '1px solid #E8E3DC',
                borderLeft: task.completed ? '3px solid #D97706' : '3px solid transparent',
                borderRadius: '8px',
                padding: '16px',
                transition: 'all 0.25s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                {!editMode && (
                  <button
                    onClick={() => handleToggleTask(task.id)}
                    style={{
                      flexShrink: 0,
                      width: '22px',
                      height: '22px',
                      borderRadius: '4px',
                      border: task.completed ? 'none' : '1.5px solid #D4C5B0',
                      background: task.completed ? '#D97706' : '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      marginTop: '1px',
                    }}
                  >
                    {task.completed && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                )}

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                      fontSize: '14px',
                      fontWeight: task.completed ? 300 : 400,
                      color: task.completed ? '#78716C' : '#1C1917',
                      textDecoration: task.completed ? 'line-through' : 'none',
                    }}
                  >
                    {task.text}
                  </div>

                  {task.completed && task.completedBy && (
                    <div
                      style={{
                        fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                        fontSize: '12px',
                        fontWeight: 300,
                        color: '#6B5B4E',
                        marginTop: '4px',
                      }}
                    >
                      &#10003; Completed by {task.completedBy} at {task.completedAt}
                    </div>
                  )}

                  {!editMode && task.photoRequired && (
                    <PhotoUpload
                      taskId={task.id}
                      onPhotoUploaded={handlePhotoUploaded}
                      currentPhotoUrl={task.photoUrl}
                    />
                  )}

                  {editMode && (
                    <div
                      style={{
                        fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                        fontSize: '12px',
                        fontWeight: 300,
                        color: '#6B5B4E',
                        marginTop: '4px',
                      }}
                    >
                      {task.photoRequired ? '\uD83D\uDCF7 Photo required' : '\uD83D\uDCF7 No photo'}
                    </div>
                  )}
                </div>

                {editMode && (
                  <button
                    onClick={() => handleDeleteItem(task.id)}
                    className="hover:opacity-80 transition-opacity"
                    style={{
                      flexShrink: 0,
                      fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                      fontSize: '12px',
                      fontWeight: 500,
                      color: '#EF4444',
                      background: 'rgba(239,68,68,0.08)',
                      border: '1px solid rgba(239,68,68,0.15)',
                      borderRadius: '4px',
                      padding: '6px 12px',
                      cursor: 'pointer',
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Complete Button */}
      {!editMode && completedCount === tasks.length && tasks.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: '#1C1917',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            padding: '16px',
          }}
        >
          <div style={{ maxWidth: '768px', margin: '0 auto', padding: '0 24px' }}>
            <Link
              href="/dashboard"
              className="hover:opacity-90 transition-opacity"
              style={{
                display: 'block',
                width: '100%',
                fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                fontSize: '15px',
                fontWeight: 500,
                color: '#1C1917',
                background: '#D97706',
                borderRadius: '4px',
                padding: '14px 24px',
                textDecoration: 'none',
                textAlign: 'center',
                boxSizing: 'border-box',
              }}
            >
              &#10003; All Done — Go to Dashboard
            </Link>
          </div>
        </div>
      )}
    </main>
  )
}
