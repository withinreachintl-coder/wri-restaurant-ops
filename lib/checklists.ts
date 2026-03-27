// lib/checklists.ts - Checklist management functions with tier limits

import { createBrowserClient } from '@supabase/ssr'

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

// Free tier item limit per checklist
const FREE_TIER_ITEM_LIMIT = 10

/**
 * Check if org is on paid plan
 */
async function isOrgPaid(orgId: string): Promise<boolean> {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  
  const { data: org } = await supabase
    .from('organizations')
    .select('subscription_status, subscription_tier')
    .eq('id', orgId)
    .single()

  // If subscription_status is 'active' or subscription_tier is 'paid', they're paid
  return org?.subscription_status === 'active' || org?.subscription_tier === 'paid'
}

/**
 * Fetch checklist with items for an org
 */
export async function getChecklist(type: ChecklistType): Promise<Checklist | null> {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  
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
 * Add new checklist item (enforces free tier limit)
 */
export async function addChecklistItem(
  checklistId: string,
  text: string,
  photoRequired: boolean = false
): Promise<{ success: boolean; item?: ChecklistItem; error?: string }> {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  // Get checklist to find org_id
  const { data: checklist } = await supabase
    .from('checklists')
    .select('org_id')
    .eq('id', checklistId)
    .single()

  if (!checklist) {
    return { success: false, error: 'Checklist not found' }
  }

  // Check if org is on paid plan
  const isPaid = await isOrgPaid(checklist.org_id)

  // Count existing items
  const { data: existingItems } = await supabase
    .from('checklist_items')
    .select('id, order_index')
    .eq('checklist_id', checklistId)
    .order('order_index', { ascending: false })

  const currentCount = existingItems?.length || 0

  // Enforce free tier limit
  if (!isPaid && currentCount >= FREE_TIER_ITEM_LIMIT) {
    return {
      success: false,
      error: `Free accounts are limited to ${FREE_TIER_ITEM_LIMIT} items per checklist. Upgrade to add more items.`
    }
  }

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
    return { success: false, error: 'Failed to add item' }
  }

  return { success: true, item: data }
}

/**
 * Update checklist item text
 */
export async function updateChecklistItem(
  itemId: string,
  text: string,
  photoRequired?: boolean
): Promise<boolean> {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

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
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

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
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

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
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

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
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

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

/**
 * Check if user can add more items (for UI feedback)
 */
export async function canAddMoreItems(checklistId: string): Promise<{ canAdd: boolean; currentCount: number; limit: number | null; message?: string }> {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  // Get checklist to find org_id
  const { data: checklist } = await supabase
    .from('checklists')
    .select('org_id')
    .eq('id', checklistId)
    .single()

  if (!checklist) {
    return { canAdd: false, currentCount: 0, limit: null, message: 'Checklist not found' }
  }

  // Check if org is on paid plan
  const isPaid = await isOrgPaid(checklist.org_id)

  // Count existing items
  const { data: existingItems } = await supabase
    .from('checklist_items')
    .select('id')
    .eq('checklist_id', checklistId)

  const currentCount = existingItems?.length || 0

  if (isPaid) {
    return { canAdd: true, currentCount, limit: null }
  }

  const canAdd = currentCount < FREE_TIER_ITEM_LIMIT
  const message = canAdd 
    ? `${FREE_TIER_ITEM_LIMIT - currentCount} items remaining (free tier)`
    : `Upgrade to add more than ${FREE_TIER_ITEM_LIMIT} items`

  return { canAdd, currentCount, limit: FREE_TIER_ITEM_LIMIT, message }
}
