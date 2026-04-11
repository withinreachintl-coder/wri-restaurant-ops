'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase, RMTicket } from '../../lib/supabase'

export default function RMRequestsPage() {
  const [requests, setRequests] = useState<RMTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [formData, setFormData] = useState({ title: '', description: '', location: '', priority: 'medium' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const loadRequests = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) {
          window.location.href = '/auth/login'
          return
        }
        setUser(authUser)

        const { data: userData } = await supabase
          .from('users')
          .select('org_id')
          .eq('auth_id', authUser.id)
          .single()

        if (!userData) throw new Error('User org not found')

        const { data: requestsData } = await supabase
          .from('r_m_tickets')
          .select('*')
          .eq('org_id', userData.org_id)
          .order('created_at', { ascending: false })

        setRequests(requestsData || [])
      } catch (err) {
        console.error('Failed to load requests:', err)
      } finally {
        setLoading(false)
      }
    }

    loadRequests()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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

      const { data: newRequest, error } = await supabase
        .from('r_m_tickets')
        .insert([{
          org_id: userData.org_id,
          submitted_by_user_id: authUser.id,
          title: formData.title,
          description: formData.description || null,
          location: formData.location || null,
          priority: formData.priority,
          status: 'open',
          status_history: [{ status: 'open', changed_at: new Date().toISOString(), changed_by_user_id: authUser.id }],
        }])
        .select()
        .single()

      if (error) throw error
      if (newRequest) {
        setRequests([newRequest, ...requests])
        setFormData({ title: '', description: '', location: '', priority: 'medium' })
        setShowForm(false)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create request')
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) throw new Error('Not authenticated')

      const request = requests.find(r => r.id === id)
      if (!request) return

      const updatedHistory = [
        ...(request.status_history || []),
        { status: newStatus, changed_at: new Date().toISOString(), changed_by_user_id: authUser.id }
      ]

      const { error } = await supabase
        .from('r_m_tickets')
        .update({ status: newStatus as any, status_history: updatedHistory })
        .eq('id', id)

      if (error) throw error

      setRequests(requests.map(r => r.id === id ? { ...r, status: newStatus as any, status_history: updatedHistory } : r))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update status')
    }
  }

  if (loading) return <div style={{ padding: '24px' }}>Loading...</div>

  const openCount = requests.filter(r => r.status === 'open').length
  const inProgressCount = requests.filter(r => r.status === 'in_progress').length
  const resolvedCount = requests.filter(r => r.status === 'resolved').length

  const statusColors: Record<string, string> = {
    open: '#EF4444',
    in_progress: '#F59E0B',
    resolved: '#10B981',
    closed: '#6B7280',
  }

  const statusLabels: Record<string, string> = {
    open: 'Open',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    closed: 'Closed',
  }

  return (
    <main style={{ background: '#FAFAF9', minHeight: '100vh' }}>
      <header style={{ background: '#1C1917', padding: '16px 24px', borderBottom: '1px solid #E5E0D8' }}>
        <div style={{ maxWidth: '768px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/dashboard" style={{ textDecoration: 'none', color: '#F5F0E8', fontWeight: 500 }}>
            ← Dashboard
          </Link>
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '20px', color: '#F5F0E8', margin: 0 }}>
            R&M Requests
          </h1>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              background: '#D97706',
              color: '#1C1917',
              fontFamily: 'var(--font-dmsans)',
              fontSize: '13px',
              fontWeight: 500,
              padding: '8px 16px',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            + New Request
          </button>
        </div>
      </header>

      <div style={{ maxWidth: '768px', margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: 'Open', count: openCount, color: '#EF4444' },
            { label: 'In Progress', count: inProgressCount, color: '#F59E0B' },
            { label: 'Resolved', count: resolvedCount, color: '#10B981' },
          ].map((stat, i) => (
            <div key={i} style={{ background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: '8px', padding: '20px' }}>
              <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: '12px', color: '#6B5B4E', margin: '0 0 8px 0' }}>
                {stat.label}
              </p>
              <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '28px', fontWeight: 600, color: stat.color, margin: 0 }}>
                {stat.count}
              </p>
            </div>
          ))}
        </div>

        {showForm && (
          <div style={{ background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: '8px', padding: '24px', marginBottom: '32px' }}>
            <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '18px', fontWeight: 600, color: '#1C1917', margin: '0 0 20px 0' }}>
              New Request
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', fontWeight: 500, color: '#1C1917', display: 'block', marginBottom: '6px' }}>
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="e.g., Fix refrigerator door"
                  style={{
                    width: '100%',
                    fontFamily: 'var(--font-dmsans)',
                    fontSize: '14px',
                    padding: '10px 12px',
                    border: '1px solid #E5E0D8',
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                    color: '#1C1917',
                  }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', fontWeight: 500, color: '#1C1917', display: 'block', marginBottom: '6px' }}>
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  style={{
                    width: '100%',
                    fontFamily: 'var(--font-dmsans)',
                    fontSize: '14px',
                    padding: '10px 12px',
                    border: '1px solid #E5E0D8',
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                    color: '#1C1917',
                  }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', fontWeight: 500, color: '#1C1917', display: 'block', marginBottom: '6px' }}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Details..."
                  style={{
                    width: '100%',
                    fontFamily: 'var(--font-dmsans)',
                    fontSize: '14px',
                    padding: '10px 12px',
                    border: '1px solid #E5E0D8',
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                    minHeight: '80px',
                    color: '#1C1917',
                  }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', fontWeight: 500, color: '#1C1917', display: 'block', marginBottom: '6px' }}>
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Kitchen"
                  style={{
                    width: '100%',
                    fontFamily: 'var(--font-dmsans)',
                    fontSize: '14px',
                    padding: '10px 12px',
                    border: '1px solid #E5E0D8',
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                    color: '#1C1917',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    flex: 1,
                    background: '#D97706',
                    color: '#1C1917',
                    fontFamily: 'var(--font-dmsans)',
                    fontSize: '13px',
                    fontWeight: 500,
                    padding: '10px 16px',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? 'Creating...' : 'Create Request'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    flex: 1,
                    background: '#FFFFFF',
                    color: '#6B5B4E',
                    fontFamily: 'var(--font-dmsans)',
                    fontSize: '13px',
                    fontWeight: 500,
                    padding: '10px 16px',
                    borderRadius: '4px',
                    border: '1px solid #E5E0D8',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {requests.length === 0 ? (
            <div style={{ background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: '8px', padding: '32px', textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: '14px', color: '#6B5B4E', margin: 0 }}>
                No requests yet.
              </p>
            </div>
          ) : (
            requests.map((request) => (
              <div key={request.id} style={{ background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: '8px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontFamily: 'var(--font-dmsans)', fontSize: '14px', fontWeight: 600, color: '#1C1917', margin: '0 0 4px 0' }}>
                      {request.title}
                    </h4>
                    {request.description && (
                      <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#6B5B4E', margin: '0 0 8px 0' }}>
                        {request.description}
                      </p>
                    )}
                    {request.location && (
                      <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: '12px', color: '#A89880', margin: 0 }}>
                        📍 {request.location}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                    <select
                      value={request.status}
                      onChange={(e) => handleStatusChange(request.id, e.target.value)}
                      style={{
                        fontFamily: 'var(--font-dmsans)',
                        fontSize: '12px',
                        fontWeight: 500,
                        padding: '6px 12px',
                        borderRadius: '4px',
                        border: '1px solid #E5E0D8',
                        background: '#FFFFFF',
                        color: statusColors[request.status],
                        cursor: 'pointer',
                      }}
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                    <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: '11px', color: '#A89880', textTransform: 'capitalize' }}>
                      Priority: {request.priority}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  )
}
