import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type ChecklistTask = {
  id: string
  text: string
  completed: boolean
  photoRequired: boolean
  photoUrl?: string
  completedBy?: string
  completedAt?: string
  checklistType: 'opening' | 'closing'
  order: number
  createdAt?: string
  updatedAt?: string
}
