import { supabase } from './supabase'

// ============================================
// Types
// ============================================

export type AuditFieldType = 'text' | 'numeric' | 'select' | 'checkbox'
export type AuditCadence = 'daily' | 'weekly' | 'monthly'
export type AuditCategory = 'cash_handling' | 'void_comp' | 'waste' | 'inventory' | 'general'
export type AuditRunStatus = 'pending' | 'in_progress' | 'completed'

export type AuditForm = {
  id: string
  org_id: string
  name: string
  description: string | null
  category: AuditCategory
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export type AuditItem = {
  id: string
  form_id: string
  label: string
  field_type: AuditFieldType
  select_options: string[] | null
  threshold_min: number | null
  threshold_max: number | null
  photo_required: boolean
  is_required: boolean
  order_index: number
  created_at: string
  updated_at: string
}

export type AuditSchedule = {
  id: string
  form_id: string
  org_id: string
  location_name: string
  cadence: AuditCadence
  time_of_day: string
  day_of_week: number | null
  day_of_month: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type AuditRun = {
  id: string
  form_id: string
  schedule_id: string | null
  org_id: string
  location_name: string
  status: AuditRunStatus
  score: number | null
  started_by: string | null
  submitted_by: string | null
  started_at: string | null
  submitted_at: string | null
  audit_date: string
  notes: string | null
  created_at: string
  updated_at: string
}

export type AuditException = {
  id: string
  run_id: string
  item_id: string
  org_id: string
  response_text: string | null
  response_numeric: number | null
  response_bool: boolean | null
  photo_url: string | null
  is_exception: boolean
  is_resolved: boolean
  resolved_by: string | null
  resolved_at: string | null
  resolution_note: string | null
  created_at: string
}

export type AuditFormWithItems = AuditForm & { audit_items: AuditItem[] }
export type AuditRunWithExceptions = AuditRun & {
  exceptions: (AuditException & { audit_items: AuditItem })[]
}

// Helper: get org_id from authenticated user
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
// Audit Forms CRUD
// ============================================

export async function getAuditForms(): Promise<AuditForm[]> {
  const { data, error } = await supabase
    .from('audit_forms')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function getAuditFormWithItems(formId: string): Promise<AuditFormWithItems | null> {
  const { data, error } = await supabase
    .from('audit_forms')
    .select('*, audit_items(*)  ')
    .eq('id', formId)
    .single()

  if (error) throw error
  if (!data) return null

  // Sort items by order_index
  data.audit_items = (data.audit_items ?? []).sort(
    (a: AuditItem, b: AuditItem) => a.order_index - b.order_index
  )
  return data as AuditFormWithItems
}

export async function createAuditForm(
  form: Pick<AuditForm, 'name' | 'description' | 'category'>
): Promise<AuditForm> {
  const orgId = await getOrgId()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('audit_forms')
    .insert([{ ...form, org_id: orgId, created_by: user?.id ?? null }])
    .select()
    .single()

  if (error) throw error
  return data as AuditForm
}

export async function updateAuditForm(
  formId: string,
  updates: Partial<Pick<AuditForm, 'name' | 'description' | 'category' | 'is_active'>>
): Promise<void> {
  const { error } = await supabase
    .from('audit_forms')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', formId)

  if (error) throw error
}

export async function deleteAuditForm(formId: string): Promise<void> {
  // Soft-delete by deactivating
  const { error } = await supabase
    .from('audit_forms')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', formId)

  if (error) throw error
}

// ============================================
// Audit Items CRUD
// ============================================

export async function addAuditItem(
  formId: string,
  item: Pick<AuditItem, 'label' | 'field_type' | 'select_options' | 'threshold_min' | 'threshold_max' | 'photo_required' | 'is_required'>
): Promise<AuditItem> {
  // Get current max order_index
  const { data: existing } = await supabase
    .from('audit_items')
    .select('order_index')
    .eq('form_id', formId)
    .order('order_index', { ascending: false })
    .limit(1)

  const nextIndex = existing && existing.length > 0 ? existing[0].order_index + 1 : 1

  const { data, error } = await supabase
    .from('audit_items')
    .insert([{ ...item, form_id: formId, order_index: nextIndex }])
    .select()
    .single()

  if (error) throw error
  return data as AuditItem
}

export async function updateAuditItem(
  itemId: string,
  updates: Partial<Pick<AuditItem, 'label' | 'field_type' | 'select_options' | 'threshold_min' | 'threshold_max' | 'photo_required' | 'is_required'>>
): Promise<void> {
  const { error } = await supabase
    .from('audit_items')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', itemId)

  if (error) throw error
}

export async function deleteAuditItem(itemId: string): Promise<void> {
  const { error } = await supabase
    .from('audit_items')
    .delete()
    .eq('id', itemId)

  if (error) throw error
}

export async function reorderAuditItems(formId: string, itemIds: string[]): Promise<void> {
  const updates = itemIds.map((id, index) =>
    supabase
      .from('audit_items')
      .update({ order_index: index + 1, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('form_id', formId)
  )
  await Promise.all(updates)
}

// ============================================
// Audit Schedules CRUD
// ============================================

export async function getSchedulesForForm(formId: string): Promise<AuditSchedule[]> {
  const { data, error } = await supabase
    .from('audit_schedules')
    .select('*')
    .eq('form_id', formId)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function createSchedule(
  schedule: Pick<AuditSchedule, 'form_id' | 'location_name' | 'cadence' | 'time_of_day' | 'day_of_week' | 'day_of_month'>
): Promise<AuditSchedule> {
  const orgId = await getOrgId()

  const { data, error } = await supabase
    .from('audit_schedules')
    .insert([{ ...schedule, org_id: orgId }])
    .select()
    .single()

  if (error) throw error
  return data as AuditSchedule
}

export async function updateSchedule(
  scheduleId: string,
  updates: Partial<Pick<AuditSchedule, 'location_name' | 'cadence' | 'time_of_day' | 'day_of_week' | 'day_of_month' | 'is_active'>>
): Promise<void> {
  const { error } = await supabase
    .from('audit_schedules')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', scheduleId)

  if (error) throw error
}

export async function deleteSchedule(scheduleId: string): Promise<void> {
  const { error } = await supabase
    .from('audit_schedules')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', scheduleId)

  if (error) throw error
}

// ============================================
// Audit Runs
// ============================================

export async function createAuditRun(
  formId: string,
  locationName: string,
  scheduleId?: string
): Promise<AuditRun> {
  const orgId = await getOrgId()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('audit_runs')
    .insert([{
      form_id: formId,
      org_id: orgId,
      location_name: locationName,
      schedule_id: scheduleId ?? null,
      status: 'in_progress',
      started_by: user?.id ?? null,
      started_at: new Date().toISOString(),
      audit_date: new Date().toISOString().split('T')[0],
    }])
    .select()
    .single()

  if (error) throw error
  return data as AuditRun
}

// Returns pending scheduled runs for today (created by cron, not yet started by staff)
export async function getPendingScheduledRuns(): Promise<(AuditRun & { audit_forms: Pick<AuditForm, 'name' | 'category'> })[]> {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('audit_runs')
    .select('*, audit_forms(name, category)')
    .eq('status', 'pending')
    .eq('audit_date', today)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as (AuditRun & { audit_forms: Pick<AuditForm, 'name' | 'category'> })[]
}

export async function getAuditRun(runId: string): Promise<AuditRun | null> {
  const { data, error } = await supabase
    .from('audit_runs')
    .select('*')
    .eq('id', runId)
    .single()

  if (error) throw error
  return data as AuditRun
}

export async function getRecentRuns(formId: string, limit = 10): Promise<AuditRun[]> {
  const { data, error } = await supabase
    .from('audit_runs')
    .select('*')
    .eq('form_id', formId)
    .eq('status', 'completed')
    .order('audit_date', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data ?? []
}

export async function getAllRecentRuns(limit = 20): Promise<(AuditRun & { audit_forms: Pick<AuditForm, 'name' | 'category'> })[]> {
  const { data, error } = await supabase
    .from('audit_runs')
    .select('*, audit_forms(name, category)')
    .eq('status', 'completed')
    .order('audit_date', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []) as (AuditRun & { audit_forms: Pick<AuditForm, 'name' | 'category'> })[]
}

// ============================================
// Exception / Response Handling
// ============================================

type ItemResponse = {
  item: AuditItem
  response_text?: string
  response_numeric?: number
  response_bool?: boolean
  photo_url?: string
}

function isException(item: AuditItem, response: ItemResponse): boolean {
  if (item.field_type === 'numeric' && response.response_numeric !== undefined) {
    const val = response.response_numeric
    if (item.threshold_min !== null && val < item.threshold_min) return true
    if (item.threshold_max !== null && val > item.threshold_max) return true
  }
  if (item.field_type === 'checkbox' && item.is_required && response.response_bool === false) {
    return true
  }
  return false
}

export async function submitAuditRun(
  runId: string,
  responses: ItemResponse[],
  notes?: string
): Promise<{ score: number; exceptionCount: number }> {
  const { data: { user } } = await supabase.auth.getUser()
  const orgId = await getOrgId()

  // Build exception rows
  const exceptionRows = responses.map((r) => ({
    run_id: runId,
    item_id: r.item.id,
    org_id: orgId,
    response_text: r.response_text ?? null,
    response_numeric: r.response_numeric ?? null,
    response_bool: r.response_bool ?? null,
    photo_url: r.photo_url ?? null,
    is_exception: isException(r.item, r),
  }))

  const { error: insertError } = await supabase
    .from('audit_exceptions')
    .insert(exceptionRows)

  if (insertError) throw insertError

  const exceptionCount = exceptionRows.filter((r) => r.is_exception).length
  const score =
    exceptionRows.length > 0
      ? Math.round(((exceptionRows.length - exceptionCount) / exceptionRows.length) * 100)
      : 100

  // Mark run complete
  const { error: updateError } = await supabase
    .from('audit_runs')
    .update({
      status: 'completed',
      score,
      submitted_by: user?.id ?? null,
      submitted_at: new Date().toISOString(),
      notes: notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', runId)

  if (updateError) throw updateError

  return { score, exceptionCount }
}

export async function getRunExceptions(runId: string): Promise<(AuditException & { audit_items: AuditItem })[]> {
  const { data, error } = await supabase
    .from('audit_exceptions')
    .select('*, audit_items(*)')
    .eq('run_id', runId)
    .eq('is_exception', true)

  if (error) throw error
  return (data ?? []) as (AuditException & { audit_items: AuditItem })[]
}

export async function getOpenExceptions(): Promise<(AuditException & { audit_items: AuditItem; audit_runs: Pick<AuditRun, 'audit_date' | 'location_name' | 'form_id'>; audit_forms: Pick<AuditForm, 'name'> })[]> {
  const { data, error } = await supabase
    .from('audit_exceptions')
    .select('*, audit_items(*), audit_runs(audit_date, location_name, form_id, audit_forms(name))')
    .eq('is_exception', true)
    .eq('is_resolved', false)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as any
}

export async function resolveException(
  exceptionId: string,
  resolutionNote: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('audit_exceptions')
    .update({
      is_resolved: true,
      resolved_by: user?.id ?? null,
      resolved_at: new Date().toISOString(),
      resolution_note: resolutionNote,
    })
    .eq('id', exceptionId)

  if (error) throw error
}

// ============================================
// Trend Data
// ============================================

export type TrendDataPoint = {
  audit_date: string
  location_name: string
  score: number
  form_name: string
}

export async function getAuditTrends(
  formId: string,
  weeksBack = 8
): Promise<TrendDataPoint[]> {
  const since = new Date()
  since.setDate(since.getDate() - weeksBack * 7)

  const { data, error } = await supabase
    .from('audit_runs')
    .select('audit_date, location_name, score, audit_forms(name)')
    .eq('form_id', formId)
    .eq('status', 'completed')
    .gte('audit_date', since.toISOString().split('T')[0])
    .order('audit_date', { ascending: true })

  if (error) throw error

  return (data ?? []).map((row: any) => ({
    audit_date: row.audit_date,
    location_name: row.location_name,
    score: row.score ?? 0,
    form_name: row.audit_forms?.name ?? '',
  }))
}

// Group trend data by week for week-over-week chart
export function groupByWeek(
  data: TrendDataPoint[]
): { week: string; avgScore: number; byLocation: Record<string, number> }[] {
  const weeks: Record<string, { scores: number[]; byLocation: Record<string, number[]> }> = {}

  for (const point of data) {
    const d = new Date(point.audit_date)
    // Get Monday of that week
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(d.setDate(diff))
    const weekKey = monday.toISOString().split('T')[0]

    if (!weeks[weekKey]) weeks[weekKey] = { scores: [], byLocation: {} }
    weeks[weekKey].scores.push(point.score)

    const loc = point.location_name
    if (!weeks[weekKey].byLocation[loc]) weeks[weekKey].byLocation[loc] = []
    weeks[weekKey].byLocation[loc].push(point.score)
  }

  return Object.entries(weeks)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, { scores, byLocation }]) => ({
      week,
      avgScore: Math.round(scores.reduce((s, v) => s + v, 0) / scores.length),
      byLocation: Object.fromEntries(
        Object.entries(byLocation).map(([loc, vals]) => [
          loc,
          Math.round(vals.reduce((s, v) => s + v, 0) / vals.length),
        ])
      ),
    }))
}
