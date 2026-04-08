import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Create a browser client that properly handles SSR sessions
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Match the actual database schema (snake_case columns)
export type ChecklistItem = {
  id: string
  checklist_id: string
  text: string
  photo_required: boolean
  order_index: number
  created_at: string
  updated_at: string
}

export type AuditForm = {
  id: string
  org_id: string
  name: string
  type: 'opening' | 'closing'
  description?: string
  active: boolean
  created_at: string
  updated_at: string
}

export type AuditException = {
  id: string
  org_id: string
  audit_form_id: string
  task_id: string
  task_text: string
  completed: boolean
  completed_by_user_id?: string
  completed_at?: string
  notes?: string
  photo_url?: string
  photo_size_bytes?: number
  completed_date: string
  created_at: string
  updated_at: string
}

export type RMTicket = {
  id: string
  org_id: string
  submitted_by_user_id?: string
  title: string
  description?: string
  location?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  status_history: Array<{
    status: string
    changed_at: string
    changed_by_user_id: string
  }>
  photo_url?: string
  photo_size_bytes?: number
  assigned_to_user_id?: string
  assigned_at?: string
  resolved_at?: string
  created_at: string
  updated_at: string
}

// Auth helpers
export const signInWithMagicLink = async (email: string) => {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
    },
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}
