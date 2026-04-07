import { supabase } from './supabase'

// ============================================
// Types
// ============================================

export type TicketUrgency = 'safety' | 'urgent' | 'routine'
export type TicketStatus = 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'

export type RMCategory = {
  id: string
  org_id: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type VendorContact = {
  id: string
  org_id: string
  category_id: string | null
  name: string
  company: string | null
  phone: string | null
  email: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type VendorWithCategory = VendorContact & {
  r_m_categories: Pick<RMCategory, 'name'> | null
}

export type RMTicket = {
  id: string
  org_id: string
  title: string
  description: string | null
  urgency: TicketUrgency
  status: TicketStatus
  location_name: string
  category_id: string | null
  equipment_tag: string | null
  photo_url: string | null
  vendor_id: string | null
  follow_up_date: string | null
  is_stale: boolean
  submitted_by: string | null
  assigned_to: string | null
  completed_by: string | null
  resolution_notes: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export type RMTicketWithRelations = RMTicket & {
  r_m_categories: Pick<RMCategory, 'name'> | null
  vendor_contacts: Pick<VendorContact, 'name' | 'company' | 'phone'> | null
}

export type TicketHistory = {
  id: string
  ticket_id: string
  org_id: string
  previous_status: TicketStatus | null
  new_status: TicketStatus
  changed_by: string | null
  note: string | null
  created_at: string
}

// ============================================
// Helper: get org_id from authenticated user
// ============================================
async function getOrgId(): Promise<string> {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (error || !data) throw new Error('Could not resolve org')
  return data.org_id
}

// ============================================
// R&M Categories CRUD
// ============================================

export async function getCategories(): Promise<RMCategory[]> {
  const { data, error } = await supabase
    .from('r_m_categories')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function createCategory(
  category: Pick<RMCategory, 'name' | 'description'>
): Promise<RMCategory> {
  const orgId = await getOrgId()

  const { data, error } = await supabase
    .from('r_m_categories')
    .insert([{ ...category, org_id: orgId }])
    .select()
    .single()

  if (error) throw error
  return data as RMCategory
}

export async function updateCategory(
  categoryId: string,
  updates: Partial<Pick<RMCategory, 'name' | 'description'>>
): Promise<void> {
  const { error } = await supabase
    .from('r_m_categories')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', categoryId)

  if (error) throw error
}

export async function deleteCategory(categoryId: string): Promise<void> {
  const { error } = await supabase
    .from('r_m_categories')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', categoryId)

  if (error) throw error
}

// ============================================
// Vendor Contacts CRUD
// ============================================

export async function getVendors(): Promise<VendorWithCategory[]> {
  const { data, error } = await supabase
    .from('vendor_contacts')
    .select('*, r_m_categories(name)')
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) throw error
  return (data ?? []) as VendorWithCategory[]
}

export async function getVendorsByCategory(categoryId: string): Promise<VendorContact[]> {
  const { data, error } = await supabase
    .from('vendor_contacts')
    .select('*')
    .eq('category_id', categoryId)
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function createVendor(
  vendor: Pick<VendorContact, 'name' | 'company' | 'phone' | 'email' | 'notes' | 'category_id'>
): Promise<VendorContact> {
  const orgId = await getOrgId()

  const { data, error } = await supabase
    .from('vendor_contacts')
    .insert([{ ...vendor, org_id: orgId }])
    .select()
    .single()

  if (error) throw error
  return data as VendorContact
}

export async function updateVendor(
  vendorId: string,
  updates: Partial<Pick<VendorContact, 'name' | 'company' | 'phone' | 'email' | 'notes' | 'category_id'>>
): Promise<void> {
  const { error } = await supabase
    .from('vendor_contacts')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', vendorId)

  if (error) throw error
}

export async function deleteVendor(vendorId: string): Promise<void> {
  const { error } = await supabase
    .from('vendor_contacts')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', vendorId)

  if (error) throw error
}

// ============================================
// R&M Tickets CRUD
// ============================================

export type TicketFilters = {
  status?: TicketStatus | 'all'
  urgency?: TicketUrgency | 'all'
  category_id?: string
  stale_only?: boolean
}

export async function getTickets(
  filters: TicketFilters = {}
): Promise<RMTicketWithRelations[]> {
  let query = supabase
    .from('r_m_tickets')
    .select('*, r_m_categories(name), vendor_contacts(name, company, phone)')
    .order('created_at', { ascending: false })

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  } else if (!filters.status) {
    // Default: exclude completed + cancelled
    query = query.not('status', 'in', '("completed","cancelled")')
  }

  if (filters.urgency && filters.urgency !== 'all') {
    query = query.eq('urgency', filters.urgency)
  }

  if (filters.category_id) {
    query = query.eq('category_id', filters.category_id)
  }

  if (filters.stale_only) {
    query = query.eq('is_stale', true)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as RMTicketWithRelations[]
}

export async function getTicket(ticketId: string): Promise<RMTicketWithRelations | null> {
  const { data, error } = await supabase
    .from('r_m_tickets')
    .select('*, r_m_categories(name), vendor_contacts(name, company, phone)')
    .eq('id', ticketId)
    .single()

  if (error) throw error
  return data as RMTicketWithRelations
}

export async function getTicketHistory(ticketId: string): Promise<TicketHistory[]> {
  const { data, error } = await supabase
    .from('ticket_history')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function createTicket(
  ticket: Pick<RMTicket, 'title' | 'description' | 'urgency' | 'location_name' | 'category_id' | 'equipment_tag' | 'photo_url'>
): Promise<RMTicket> {
  const orgId = await getOrgId()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('r_m_tickets')
    .insert([{
      ...ticket,
      org_id: orgId,
      status: 'open',
      submitted_by: user?.id ?? null,
    }])
    .select()
    .single()

  if (error) throw error

  // Seed initial history entry
  await supabase.from('ticket_history').insert([{
    ticket_id: (data as RMTicket).id,
    org_id: orgId,
    previous_status: null,
    new_status: 'open',
    changed_by: user?.id ?? null,
    note: 'Ticket submitted',
  }])

  return data as RMTicket
}

export async function updateTicketStatus(
  ticketId: string,
  newStatus: TicketStatus,
  note?: string,
  extras?: Partial<Pick<RMTicket, 'vendor_id' | 'follow_up_date' | 'resolution_notes' | 'assigned_to'>>
): Promise<RMTicket> {
  const { data: { user } } = await supabase.auth.getUser()
  const orgId = await getOrgId()

  // Get current ticket for history
  const { data: current } = await supabase
    .from('r_m_tickets')
    .select('status')
    .eq('id', ticketId)
    .single()

  const updatePayload: Record<string, unknown> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
    ...extras,
  }

  if (newStatus === 'completed') {
    updatePayload.completed_by = user?.id ?? null
    updatePayload.completed_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('r_m_tickets')
    .update(updatePayload)
    .eq('id', ticketId)
    .select()
    .single()

  if (error) throw error

  // Record history
  await supabase.from('ticket_history').insert([{
    ticket_id: ticketId,
    org_id: orgId,
    previous_status: current?.status ?? null,
    new_status: newStatus,
    changed_by: user?.id ?? null,
    note: note ?? null,
  }])

  return data as RMTicket
}

export async function assignTicketVendor(
  ticketId: string,
  vendorId: string,
  followUpDate?: string
): Promise<RMTicket> {
  return updateTicketStatus(ticketId, 'assigned', 'Vendor assigned', {
    vendor_id: vendorId,
    follow_up_date: followUpDate ?? null,
  })
}

// ============================================
// Dashboard / Summary Stats
// ============================================

export type RMSummary = {
  openCount: number
  assignedCount: number
  staleCount: number
  completedThisWeek: number
}

export async function getRMSummary(): Promise<RMSummary> {
  const [openRes, assignedRes, staleRes, completedRes] = await Promise.all([
    supabase.from('r_m_tickets').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('r_m_tickets').select('id', { count: 'exact', head: true }).in('status', ['assigned', 'in_progress']),
    supabase.from('r_m_tickets').select('id', { count: 'exact', head: true }).eq('is_stale', true).not('status', 'in', '("completed","cancelled")'),
    supabase.from('r_m_tickets').select('id', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('completed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
  ])

  return {
    openCount: openRes.count ?? 0,
    assignedCount: assignedRes.count ?? 0,
    staleCount: staleRes.count ?? 0,
    completedThisWeek: completedRes.count ?? 0,
  }
}

// ============================================
// Photo Upload
// ============================================

export async function uploadTicketPhoto(file: File): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `maintenance/${user?.id ?? 'anon'}/${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from('photos')
    .upload(path, file, { contentType: file.type, upsert: false })

  if (error) throw error

  const { data: urlData } = supabase.storage.from('photos').getPublicUrl(path)
  return urlData.publicUrl
}
