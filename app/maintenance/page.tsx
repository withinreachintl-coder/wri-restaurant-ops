'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import {
  getTickets,
  getCategories,
  bulkUpdateTicketStatus,
  type RMTicketWithRelations,
  type RMCategory,
  type TicketStatus,
  type TicketUrgency,
} from '@/lib/maintenance'
import { usePhase3Flag } from '@/lib/use-phase3-flag'

const URGENCY_LABELS: Record<TicketUrgency, string> = {
  safety: 'Safety',
  urgent: 'Urgent',
  routine: 'Routine',
}

const URGENCY_COLORS: Record<TicketUrgency, { bg: string; text: string }> = {
  safety: { bg: 'rgba(239,68,68,0.12)', text: '#DC2626' },
  urgent: { bg: 'rgba(249,115,22,0.12)', text: '#EA580C' },
  routine: { bg: 'rgba(107,91,78,0.1)', text: '#6B5B4E' },
}

const STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Open',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const STATUS_COLORS: Record<TicketStatus, { bg: string; text: string }> = {
  open: { bg: 'rgba(217,119,6,0.1)', text: '#D97706' },
  assigned: { bg: 'rgba(59,130,246,0.1)', text: '#2563EB' },
  in_progress: { bg: 'rgba(168,85,247,0.1)', text: '#7C3AED' },
  completed: { bg: 'rgba(34,197,94,0.1)', text: '#16A34A' },
  cancelled: { bg: 'rgba(107,91,78,0.08)', text: '#9CA3AF' },
}

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
}

export default function MaintenancePage() {
  const router = useRouter()
  const { enabled: phase3Enabled, loading: flagLoading } = usePhase3Flag()
  const [tickets, setTickets] = useState<RMTicketWithRelations[]>([])
  const [categories, setCategories] = useState<RMCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all')
  const [urgencyFilter, setUrgencyFilter] = useState<TicketUrgency | 'all'>('all')
  const [sortBy, setSortBy] = useState<'age' | 'priority' | 'status'>('age')
  const [staleOnly, setStaleOnly] = useState(false)

  // Check subscription tier on mount
  useEffect(() => {
    const checkTier = async () => {
      try {
        const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
        
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) return
        
        const { data: userRecord } = await supabase
          .from('users')
          .select('org_id')
          .eq('id', userData.user.id)
          .single()
        
        if (!userRecord?.org_id) return
        
        const { data: org } = await supabase
          .from('organizations')
          .select('subscription_status, subscription_tier')
          .eq('id', userRecord.org_id)
          .single()
        
        if (org?.subscription_tier !== 'pro' || org?.subscription_status !== 'active') {
          router.replace('/dashboard')
        }
      } catch (err) {
        console.error('Failed to check subscription tier:', err)
      }
    }

    checkTier()
  }, [router])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkSaving, setBulkSaving] = useState(false)

  const loadTickets = useCallback(async () => {
    try {
      const data = await getTickets({
        status: statusFilter,
        urgency: urgencyFilter !== 'all' ? urgencyFilter : undefined,
        stale_only: staleOnly ? true : undefined,
      })
      setTickets(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, urgencyFilter, staleOnly])

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    loadTickets()
  }, [loadTickets])

  const sortedTickets = [...tickets].sort((a, b) => {
    if (sortBy === 'age') {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    }
    if (sortBy === 'priority') {
      const order: Record<TicketUrgency, number> = { safety: 0, urgent: 1, routine: 2 }
      return order[a.urgency] - order[b.urgency]
    }
    if (sortBy === 'status') {
      const order: Record<TicketStatus, number> = { open: 0, assigned: 1, in_progress: 2, completed: 3, cancelled: 4 }
      return order[a.status] - order[b.status]
    }
    return 0
  })

  const openCount = tickets.filter(t => t.status === 'open').length
  const staleCount = tickets.filter(t => t.is_stale && t.status !== 'completed' && t.status !== 'cancelled').length

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === sortedTickets.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(sortedTickets.map(t => t.id)))
    }
  }

  const handleBulkAction = async (newStatus: TicketStatus) => {
    if (selected.size === 0) return
    setBulkSaving(true)
    try {
      await bulkUpdateTicketStatus(Array.from(selected), newStatus)
      setSelected(new Set())
      setLoading(true)
      await loadTickets()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setBulkSaving(false)
    }
  }

  if (flagLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: '#FAFAF9' }}>
        <div style={{ fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif', color: '#6B5B4E', fontSize: '14px' }}>
          Loading…
        </div>
      </main>
    )
  }

  if (!phase3Enabled) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: '#FAFAF9' }}>
        <div style={{ maxWidth: '480px', textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>⚙</div>
          <h2 style={{ fontFamily: 'var(--font-playfair), "Playfair Display", serif', fontSize: '22px', fontWeight: 600, color: '#1C1917', marginBottom: '12px' }}>
            R&amp;M Tracking — Coming Soon
          </h2>
          <p style={{ fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif', fontSize: '14px', color: '#78716C', lineHeight: 1.6 }}>
            This feature is rolling out to accounts now. You'll be notified when it's available for your location.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen" style={{ background: '#FAFAF9', color: '#1C1917' }}>
      {/* Header */}
      <div style={{ background: '#1C1917', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: '768px', margin: '0 auto', padding: '24px' }}>
          <div className="flex items-center justify-between">
            <div>
              <h1
                style={{
                  fontFamily: 'var(--font-playfair), "Playfair Display", serif',
                  fontSize: '28px',
                  fontWeight: 700,
                  color: '#F5F0E8',
                  marginBottom: '4px',
                }}
              >
                R&amp;M Tickets
              </h1>
              <p style={{ fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif', fontSize: '14px', fontWeight: 300, color: '#A8A29E' }}>
                Repair &amp; Maintenance — track requests, assign vendors, close tickets
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <Link
                href="/maintenance/vendors"
                className="hover:opacity-80 transition-opacity"
                style={{
                  fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#D97706',
                  textDecoration: 'none',
                  padding: '10px 16px',
                  border: '1px solid rgba(217,119,6,0.4)',
                  borderRadius: '4px',
                }}
              >
                Vendors
              </Link>
              <Link
                href="/maintenance/submit"
                className="hover:opacity-80 transition-opacity"
                style={{
                  fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#1C1917',
                  background: '#D97706',
                  borderRadius: '4px',
                  padding: '10px 16px',
                  textDecoration: 'none',
                }}
              >
                + New Ticket
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '768px', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '6px', padding: '12px 16px', fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#991B1B' }}>
            {error}
          </div>
        )}

        {/* Summary chips */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #E8E3DC', borderRadius: '8px', padding: '14px 20px', minWidth: '120px' }}>
            <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: '24px', fontWeight: 700, color: '#D97706' }}>{openCount}</div>
            <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: '12px', color: '#6B5B4E', marginTop: '2px' }}>Open</div>
          </div>
          <div style={{ background: '#FFFFFF', border: '1px solid #E8E3DC', borderRadius: '8px', padding: '14px 20px', minWidth: '120px' }}>
            <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: '24px', fontWeight: 700, color: staleCount > 0 ? '#DC2626' : '#1C1917' }}>{staleCount}</div>
            <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: '12px', color: '#6B5B4E', marginTop: '2px' }}>Stale (&gt;14d)</div>
          </div>
          <div style={{ background: '#FFFFFF', border: '1px solid #E8E3DC', borderRadius: '8px', padding: '14px 20px', minWidth: '120px' }}>
            <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: '24px', fontWeight: 700, color: '#1C1917' }}>{tickets.length}</div>
            <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: '12px', color: '#6B5B4E', marginTop: '2px' }}>Showing</div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E8E3DC', borderRadius: '8px', padding: '16px 20px' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <label style={{ fontFamily: 'var(--font-dmsans)', fontSize: '11px', fontWeight: 500, color: '#6B5B4E', letterSpacing: '0.06em', textTransform: 'uppercase' as const, display: 'block', marginBottom: '4px' }}>
                Status
              </label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as TicketStatus | 'all')}
                style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#1C1917', background: '#FAFAF9', border: '1px solid #E8E3DC', borderRadius: '4px', padding: '7px 10px', cursor: 'pointer' }}
              >
                <option value="all">All Active</option>
                <option value="open">Open</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label style={{ fontFamily: 'var(--font-dmsans)', fontSize: '11px', fontWeight: 500, color: '#6B5B4E', letterSpacing: '0.06em', textTransform: 'uppercase' as const, display: 'block', marginBottom: '4px' }}>
                Urgency
              </label>
              <select
                value={urgencyFilter}
                onChange={e => setUrgencyFilter(e.target.value as TicketUrgency | 'all')}
                style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#1C1917', background: '#FAFAF9', border: '1px solid #E8E3DC', borderRadius: '4px', padding: '7px 10px', cursor: 'pointer' }}
              >
                <option value="all">All</option>
                <option value="safety">Safety</option>
                <option value="urgent">Urgent</option>
                <option value="routine">Routine</option>
              </select>
            </div>
            <div>
              <label style={{ fontFamily: 'var(--font-dmsans)', fontSize: '11px', fontWeight: 500, color: '#6B5B4E', letterSpacing: '0.06em', textTransform: 'uppercase' as const, display: 'block', marginBottom: '4px' }}>
                Sort
              </label>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as 'age' | 'priority' | 'status')}
                style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#1C1917', background: '#FAFAF9', border: '1px solid #E8E3DC', borderRadius: '4px', padding: '7px 10px', cursor: 'pointer' }}
              >
                <option value="age">Oldest First</option>
                <option value="priority">By Priority</option>
                <option value="status">By Status</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '2px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '22px' }}>
                <input
                  type="checkbox"
                  checked={staleOnly}
                  onChange={e => setStaleOnly(e.target.checked)}
                  style={{ accentColor: '#D97706', width: '15px', height: '15px' }}
                />
                <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#1C1917' }}>Stale only</span>
              </label>
            </div>
          </div>
        </div>

        {/* Bulk action bar */}
        {selected.size > 0 && (
          <div style={{ background: '#1C1917', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#F5F0E8', flex: 1 }}>
              {selected.size} ticket{selected.size !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={() => handleBulkAction('in_progress')}
              disabled={bulkSaving}
              style={{ fontFamily: 'var(--font-dmsans)', fontSize: '12px', fontWeight: 500, color: '#1C1917', background: '#D97706', borderRadius: '4px', padding: '8px 14px', border: 'none', cursor: 'pointer', opacity: bulkSaving ? 0.7 : 1 }}
            >
              Mark In Progress
            </button>
            <button
              onClick={() => handleBulkAction('completed')}
              disabled={bulkSaving}
              style={{ fontFamily: 'var(--font-dmsans)', fontSize: '12px', fontWeight: 500, color: '#FFFFFF', background: '#16A34A', borderRadius: '4px', padding: '8px 14px', border: 'none', cursor: 'pointer', opacity: bulkSaving ? 0.7 : 1 }}
            >
              Mark Complete
            </button>
            <button
              onClick={() => handleBulkAction('cancelled')}
              disabled={bulkSaving}
              style={{ fontFamily: 'var(--font-dmsans)', fontSize: '12px', color: '#9CA3AF', background: 'none', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px', padding: '8px 14px', cursor: 'pointer', opacity: bulkSaving ? 0.7 : 1 }}
            >
              Cancel
            </button>
            <button
              onClick={() => setSelected(new Set())}
              style={{ fontFamily: 'var(--font-dmsans)', fontSize: '12px', color: '#78716C', background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}
            >
              ✕ Clear
            </button>
          </div>
        )}

        {/* Ticket list */}
        {loading ? (
          <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: '14px', color: '#6B5B4E', padding: '48px', textAlign: 'center' }}>Loading tickets...</div>
        ) : sortedTickets.length === 0 ? (
          <div style={{ background: '#FFFFFF', border: '1px solid #E8E3DC', borderRadius: '8px', padding: '48px', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: '14px', color: '#6B5B4E', marginBottom: '16px' }}>
              No tickets match these filters.
            </p>
            <Link
              href="/maintenance/submit"
              style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', fontWeight: 500, color: '#1C1917', background: '#D97706', borderRadius: '4px', padding: '10px 20px', textDecoration: 'none', display: 'inline-block' }}
            >
              Submit a ticket
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Select-all header when tickets exist */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '4px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={sortedTickets.length > 0 && selected.size === sortedTickets.length}
                  onChange={toggleSelectAll}
                  style={{ accentColor: '#D97706', width: '15px', height: '15px' }}
                />
                <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: '12px', color: '#6B5B4E' }}>
                  Select all ({sortedTickets.length})
                </span>
              </label>
            </div>

            {sortedTickets.map((ticket) => {
              const age = daysSince(ticket.created_at)
              const urgency = URGENCY_COLORS[ticket.urgency]
              const statusColor = STATUS_COLORS[ticket.status]
              const isSelected = selected.has(ticket.id)
              return (
                <div
                  key={ticket.id}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}
                >
                  {/* Checkbox */}
                  <div style={{ paddingTop: '18px', flexShrink: 0 }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(ticket.id)}
                      onClick={e => e.stopPropagation()}
                      style={{ accentColor: '#D97706', width: '15px', height: '15px', cursor: 'pointer' }}
                    />
                  </div>

                  <Link
                    href={`/maintenance/${ticket.id}`}
                    style={{ textDecoration: 'none', flex: 1, minWidth: 0 }}
                  >
                    <div
                      style={{
                        background: isSelected ? '#FFFBF0' : '#FFFFFF',
                        border: isSelected ? '1px solid rgba(217,119,6,0.4)' : ticket.is_stale ? '1px solid rgba(220,38,38,0.3)' : '1px solid #E8E3DC',
                        borderLeft: ticket.urgency === 'safety' ? '3px solid #DC2626' : ticket.urgency === 'urgent' ? '3px solid #EA580C' : '3px solid #E8E3DC',
                        borderRadius: '8px',
                        padding: '16px 20px',
                        cursor: 'pointer',
                      }}
                      className="hover:border-amber-300 transition-colors"
                    >
                      <div className="flex items-start justify-between" style={{ gap: '12px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                            <span
                              style={{
                                fontFamily: 'var(--font-dmsans)',
                                fontSize: '11px',
                                fontWeight: 500,
                                color: urgency.text,
                                background: urgency.bg,
                                padding: '2px 8px',
                                borderRadius: '4px',
                              }}
                            >
                              {URGENCY_LABELS[ticket.urgency]}
                            </span>
                            <span
                              style={{
                                fontFamily: 'var(--font-dmsans)',
                                fontSize: '11px',
                                fontWeight: 500,
                                color: statusColor.text,
                                background: statusColor.bg,
                                padding: '2px 8px',
                                borderRadius: '4px',
                              }}
                            >
                              {STATUS_LABELS[ticket.status]}
                            </span>
                            {ticket.is_stale && (
                              <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: '11px', fontWeight: 500, color: '#DC2626', background: 'rgba(220,38,38,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                                Stale
                              </span>
                            )}
                            {ticket.r_m_categories && (
                              <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: '11px', color: '#6B5B4E', background: '#F5F0E8', padding: '2px 8px', borderRadius: '4px' }}>
                                {ticket.r_m_categories.name}
                              </span>
                            )}
                          </div>
                          <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: '15px', fontWeight: 500, color: '#1C1917', marginBottom: '4px' }}>
                            {ticket.title}
                          </div>
                          {ticket.description && (
                            <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#78716C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '480px' }}>
                              {ticket.description}
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: '16px', marginTop: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: '12px', color: age > 14 ? '#DC2626' : '#6B5B4E' }}>
                              {age === 0 ? 'Today' : `${age}d ago`}
                            </span>
                            {ticket.location_name && (
                              <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: '12px', color: '#6B5B4E' }}>
                                {ticket.location_name}
                              </span>
                            )}
                            {ticket.vendor_contacts && (
                              <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: '12px', color: '#6B5B4E' }}>
                                Vendor: {ticket.vendor_contacts.name}
                              </span>
                            )}
                          </div>
                        </div>
                        {ticket.photo_url && (
                          <img
                            src={ticket.photo_url}
                            alt="Ticket photo"
                            style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #E8E3DC', flexShrink: 0 }}
                          />
                        )}
                      </div>
                    </div>
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
