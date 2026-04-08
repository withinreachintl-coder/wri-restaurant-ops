'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase, AuditForm, AuditException } from '../../lib/supabase'

const STANDARD_AUDIT_ITEMS = [
  { id: 'temp_walk_in', text: 'Walk-in cooler temperature (38°F or below)', category: 'Safety' },
  { id: 'temp_freezer', text: 'Freezer temperature (0°F or below)', category: 'Safety' },
  { id: 'food_storage', text: 'Proper food storage (no cross-contamination)', category: 'Safety' },
  { id: 'cleanliness', text: 'Kitchen and dining area cleanliness', category: 'Cleanliness' },
  { id: 'pests', text: 'No evidence of pests', category: 'Cleanliness' },
  { id: 'cash', text: 'Cash drawer reconciled and secured', category: 'Security' },
  { id: 'inventory', text: 'Inventory spot-check (no discrepancies)', category: 'Inventory' },
  { id: 'waste', text: 'Proper waste disposal and dumpster locked', category: 'Operations' },
  { id: 'sanitizer', text: 'Sanitizer levels checked and refilled', category: 'Safety' },
]

export default function LPAuditPage() {
  const [items, setItems] = useState<Array<AuditException & { task_text: string; category: string }>>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const loadAudit = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) {
          window.location.href = '/auth/login'
          return
        }
        setUser(authUser)

        // Get user's org
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('org_id')
          .eq('auth_id', authUser.id)
          .single()

        if (userError || !userData) {
          console.error('User org not found:', userError)
          throw new Error('User org not found')
        }

        // Initialize with default items
        const today = new Date().toISOString().split('T')[0]
        const defaultItems = STANDARD_AUDIT_ITEMS.map((item) => ({
          id: `new-${item.id}`,
          org_id: userData.org_id,
          audit_form_id: '',
          task_id: item.id,
          task_text: item.text,
          completed: false,
          completed_date: today,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          category: item.category,
        } as any))

        // Try to load today's existing audit data to pre-populate
        const { data: existingAudit, error: auditError } = await supabase
          .from('audit_exceptions')
          .select('*')
          .eq('org_id', userData.org_id)
          .eq('completed_date', today)

        if (existingAudit && existingAudit.length > 0) {
          // Merge existing data with defaults
          const mergedItems = defaultItems.map(defaultItem => {
            const existing = existingAudit.find(ex => ex.task_id === defaultItem.task_id)
            return existing ? { ...defaultItem, ...existing, category: defaultItem.category } : defaultItem
          })
          setItems(mergedItems)
        } else {
          // No existing audit for today, use defaults
          setItems(defaultItems)
        }
      } catch (err) {
        console.error('Failed to load audit:', err)
        // Fallback: always show default items even on error
        const today = new Date().toISOString().split('T')[0]
        setItems(STANDARD_AUDIT_ITEMS.map((item) => ({
          id: `new-${item.id}`,
          org_id: '',
          audit_form_id: '',
          task_id: item.id,
          task_text: item.text,
          completed: false,
          completed_date: today,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          category: item.category,
        } as any)))
      } finally {
        setLoading(false)
      }
    }

    loadAudit()
  }, [])

  const handleStatusChange = (id: string, completed: boolean) => {
    setItems(items.map(item => item.id === id ? { ...item, completed } : item))
  }

  const handleNotesChange = (id: string, notes: string) => {
    setItems(items.map(item => item.id === id ? { ...item, notes } : item))
  }

  const handleSubmit = async () => {
    if (!user) return
    setSaving(true)

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) throw new Error('Not authenticated')

      const { data: userData } = await supabase
        .from('users')
        .select('org_id')
        .eq('auth_id', authUser.id)
        .single()

      if (!userData) throw new Error('User org not found')

      const today = new Date().toISOString().split('T')[0]

      // Insert/update audit exceptions
      for (const item of items) {
        const { error } = await supabase
          .from('audit_exceptions')
          .upsert({
            org_id: userData.org_id,
            task_id: item.task_id,
            task_text: item.task_text,
            completed: item.completed,
            completed_by_user_id: authUser.id,
            completed_at: item.completed ? new Date().toISOString() : null,
            notes: item.notes,
            completed_date: today,
          }, {
            onConflict: 'org_id,task_id,completed_date'
          })

        if (error) throw error
      }

      alert('Audit saved successfully!')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save audit')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ padding: '24px' }}>Loading...</div>

  const passCount = items.filter(i => i.completed).length
  const categorySet = new Set<string>(items.map(i => i.category))
  const categories = Array.from(categorySet)

  return (
    <main style={{ background: '#FAFAF9', minHeight: '100vh' }}>
      <header style={{ background: '#1C1917', padding: '16px 24px', borderBottom: '1px solid #E5E0D8' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/dashboard" style={{ textDecoration: 'none', color: '#F5F0E8', fontWeight: 500 }}>
            ← Dashboard
          </Link>
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '20px', color: '#F5F0E8', margin: 0 }}>
            Loss Prevention Audit
          </h1>
          <div style={{ width: '100px' }}></div>
        </div>
      </header>

      <div style={{ maxWidth: '768px', margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: '8px', padding: '20px', marginBottom: '32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <div>
              <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: '12px', color: '#6B5B4E', margin: '0 0 8px 0' }}>Pass</p>
              <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '24px', fontWeight: 600, color: '#059669', margin: 0 }}>
                {passCount}/{items.length}
              </p>
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: '12px', color: '#6B5B4E', margin: '0 0 8px 0' }}>Progress</p>
              <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '24px', fontWeight: 600, color: '#D97706', margin: 0 }}>
                {Math.round((passCount / items.length) * 100)}%
              </p>
            </div>
          </div>
        </div>

        {categories.map((category) => (
          <div key={category} style={{ marginBottom: '32px' }}>
            <h3 style={{ fontFamily: 'var(--font-dmsans)', fontSize: '12px', fontWeight: 600, color: '#6B5B4E', textTransform: 'uppercase', margin: '0 0 16px 0' }}>
              {category}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {items.filter(i => i.category === category).map((item) => (
                <div key={item.id} style={{ background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: '8px', padding: '16px' }}>
                  <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: '14px', fontWeight: 500, color: '#1C1917', margin: '0 0 12px 0' }}>
                    {item.task_text}
                  </p>

                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <button
                      onClick={() => handleStatusChange(item.id, true)}
                      style={{
                        flex: 1,
                        fontFamily: 'var(--font-dmsans)',
                        fontSize: '13px',
                        fontWeight: 500,
                        padding: '8px 12px',
                        borderRadius: '4px',
                        border: item.completed === true ? '2px solid #059669' : '1px solid #E5E0D8',
                        background: item.completed === true ? '#ECFDF5' : '#FFFFFF',
                        color: item.completed === true ? '#059669' : '#6B5B4E',
                        cursor: 'pointer',
                      }}
                    >
                      Pass ✓
                    </button>
                    <button
                      onClick={() => handleStatusChange(item.id, false)}
                      style={{
                        flex: 1,
                        fontFamily: 'var(--font-dmsans)',
                        fontSize: '13px',
                        fontWeight: 500,
                        padding: '8px 12px',
                        borderRadius: '4px',
                        border: item.completed === false ? '2px solid #DC2626' : '1px solid #E5E0D8',
                        background: item.completed === false ? '#FEE2E2' : '#FFFFFF',
                        color: item.completed === false ? '#DC2626' : '#6B5B4E',
                        cursor: 'pointer',
                      }}
                    >
                      Fail ✗
                    </button>
                  </div>

                  <textarea
                    value={item.notes || ''}
                    onChange={(e) => handleNotesChange(item.id, e.target.value)}
                    placeholder="Add notes..."
                    style={{
                      width: '100%',
                      fontFamily: 'var(--font-dmsans)',
                      fontSize: '13px',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      border: '1px solid #E5E0D8',
                      boxSizing: 'border-box',
                      minHeight: '60px',
                      resize: 'vertical',
                      color: '#1C1917',
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{
            width: '100%',
            background: '#D97706',
            color: '#1C1917',
            fontFamily: 'var(--font-dmsans)',
            fontSize: '14px',
            fontWeight: 500,
            padding: '12px 24px',
            borderRadius: '4px',
            border: 'none',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'Saving...' : 'Submit Audit'}
        </button>
      </div>
    </main>
  )
}
