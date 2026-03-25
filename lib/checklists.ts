// lib/checklists.ts - Checklist management functions

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export type ChecklistType = 'opening' | 'closing'

export type ChecklistItem = {
  id: string
  checklist_id: string
  text: string
  photo_required: boolean
  order_index: number
  created_at: string
  updated_at: string
}

export type Checklist = {
  id: string
  org_id: string
  name: string
  type: ChecklistType
  created_at: string
  updated_at: string
  items?: ChecklistItem[]
}

/**
 * Fetch checklist with items for an org
 */
export async function getChecklist(type: ChecklistType): Promise<Checklist | null> {
  const supabase = createClientComponentClient()
  
  // Get current user's org
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return null

  const { data: userRecord } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', userData.user.id)
    .single()

  if (!userRecord?.org_id) return null

  // Fetch checklist with items
  const { data: checklist, error } = await supabase
    .from('checklists')
    .select(`
      id,
      org_id,
      name,
      type,
      created_at,
      updated_at,
      items:checklist_items(*)
    `)
    .eq('org_id', userRecord.org_id)
    .eq('type', type)
    .order('order_index', { foreignTable: 'checklist_items', ascending: true })
    .single()

  if (error) {
    console.error('Error fetching checklist:', error)
    return null
  }

  return checklist
}

/**
 * Add new checklist item
 */
export async function addChecklistItem(
  checklistId: string,
  text: string,
  photoRequired: boolean = false
): Promise<ChecklistItem | null> {
  const supabase = createClientComponentClient()

  // Get max order_index and add 1
  const { data: existingItems } = await supabase
    .from('checklist_items')
    .select('order_index')
    .eq('checklist_id', checklistId)
    .order('order_index', { ascending: false })
    .limit(1)

  const nextOrderIndex = existingItems?.[0]?.order_index + 1 || 1

  const { data, error } = await supabase
    .from('checklist_items')
    .insert({
      checklist_id: checklistId,
      text,
      photo_required: photoRequired,
      order_index: nextOrderIndex
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding item:', error)
    return null
  }

  return data
}

/**
 * Update checklist item text
 */
export async function updateChecklistItem(
  itemId: string,
  text: string,
  photoRequired?: boolean
): Promise<boolean> {
  const supabase = createClientComponentClient()

  const updates: any = { text, updated_at: new Date().toISOString() }
  if (photoRequired !== undefined) {
    updates.photo_required = photoRequired
  }

  const { error } = await supabase
    .from('checklist_items')
    .update(updates)
    .eq('id', itemId)

  if (error) {
    console.error('Error updating item:', error)
    return false
  }

  return true
}

/**
 * Delete checklist item
 */
export async function deleteChecklistItem(itemId: string): Promise<boolean> {
  const supabase = createClientComponentClient()

  const { error } = await supabase
    .from('checklist_items')
    .delete()
    .eq('id', itemId)

  if (error) {
    console.error('Error deleting item:', error)
    return false
  }

  return true
}

/**
 * Reorder checklist items
 */
export async function reorderChecklistItems(
  checklistId: string,
  itemIds: string[]
): Promise<boolean> {
  const supabase = createClientComponentClient()

  // Update order_index for each item
  const updates = itemIds.map((id, index) => ({
    id,
    order_index: index + 1,
    updated_at: new Date().toISOString()
  }))

  const { error } = await supabase
    .from('checklist_items')
    .upsert(updates)

  if (error) {
    console.error('Error reordering items:', error)
    return false
  }

  return true
}

/**
 * Move item up in order
 */
export async function moveItemUp(checklistId: string, itemId: string): Promise<boolean> {
  const supabase = createClientComponentClient()

  // Get all items sorted by order
  const { data: items } = await supabase
    .from('checklist_items')
    .select('id, order_index')
    .eq('checklist_id', checklistId)
    .order('order_index', { ascending: true })

  if (!items || items.length === 0) return false

  const currentIndex = items.findIndex(item => item.id === itemId)
  if (currentIndex <= 0) return false // Already at top

  // Swap with previous item
  const newOrder = [...items]
  ;[newOrder[currentIndex - 1], newOrder[currentIndex]] = 
    [newOrder[currentIndex], newOrder[currentIndex - 1]]

  return reorderChecklistItems(checklistId, newOrder.map(item => item.id))
}

/**
 * Move item down in order
 */
export async function moveItemDown(checklistId: string, itemId: string): Promise<boolean> {
  const supabase = createClientComponentClient()

  // Get all items sorted by order
  const { data: items } = await supabase
    .from('checklist_items')
    .select('id, order_index')
    .eq('checklist_id', checklistId)
    .order('order_index', { ascending: true })

  if (!items || items.length === 0) return false

  const currentIndex = items.findIndex(item => item.id === itemId)
  if (currentIndex < 0 || currentIndex >= items.length - 1) return false // Already at bottom

  // Swap with next item
  const newOrder = [...items]
  ;[newOrder[currentIndex], newOrder[currentIndex + 1]] = 
    [newOrder[currentIndex + 1], newOrder[currentIndex]]

  return reorderChecklistItems(checklistId, newOrder.map(item => item.id))
}
