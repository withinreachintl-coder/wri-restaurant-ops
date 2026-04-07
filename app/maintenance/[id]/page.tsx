'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  getTicket,
  getTicketHistory,
  getVendors,
  updateTicketStatus,
  assignTicketVendor,
  type RMTicketWithRelations,
  type TicketHistory,
  type VendorWithCategory,
  type TicketStatus,
  type TicketUrgency,
} from '@/lib/maintenance'

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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
}

const LABEL_STYLE = {
  fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
  fontSize: '11px',
  fontWeight: 500 as const,
  color: '#6B5B4E',
  letterSpacing: '0.06em',
  textTransform: 'uppercase' as const,
  display: 'block' as const,
  marginBottom: '6px',
}

const INPUT_STYLE = {
  fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
  fontSize: '14px',
  color: '#1C1917',
  background: '#FFFFFF',
  border: '1px solid #E8E3DC',
  borderRadius: '6px',
  padding: '10px 12px',
  width: '100%',
  outline: 'none',
}

export default function TicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const ticketId = params.id as string

  const [ticket, setTicket] = useState<RMTicketWithRelations | null>(null)
  const [history, setHistory] = useState<TicketHistory[]>([])
  const [vendors, setVendors] = useState<VendorWithCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // Assign vendor workflow
  const [showAssign, setShowAssign] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState('')
  const [followUpDate, setFollowUpDate] = useState('')

  // Status update workflow
  const [showStatusUpdate, setShowStatusUpdate] = useState(false)
  const [newStatus, setNewStatus] = useState<TicketStatus>('in_progress')
  const [statusNote, setStatusNote] = useState('')
  const [resolutionNotes, setResolutionNotes] = useState('')

  const load = async () => {
    try {
      const [t, h, v] = await Promise.all([
        getTicket(ticketId),
        getTicketHistory(ticketId),
        getVendors(),
      ])
      setTicket(t)
      setHistory(h)
      setVendors(v)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [ticketId])

  const handleAssignVendor = async () => {
    if (!selectedVendor) return
    setSaving(true)
    setError('')
    try {
      await assignTicketVendor(ticketId, selectedVendor, followUpDate || undefined)
      // Trigger notification
      await fetch('/api/maintenance-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, action: 'assigned' }),
      })
      setShowAssign(false)
      await load()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleStatusUpdate = async () => {
    setSaving(true)
    setError('')
    try {
      await updateTicketStatus(
        ticketId,
        newStatus,
        statusNote || undefined,
        newStatus === 'completed' ? { resolution_notes: resolutionNotes || null } : undefined
      )
      // Trigger notification
      await fetch('/api/maintenance-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, action: newStatus }),
      })
      setShowStatusUpdate(false)
      setStatusNote('')
      setResolutionNotes('')
      await load()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen" style={{ background: '#FAFAF9' }}>
        <div style={{ maxWidth: '768px', margin: '0 auto', padding: '64px 24px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: '14px', color: '#6B5B4E' }}>Loading ticket...</p>
        </div>
      </main>
    )
  }

  if (!ticket) {
    return (
      <main className="min-h-screen" style={{ background: '#FAFAF9' }}>
        <div style={{ maxWidth: '768px', margin: '0 auto', padding: '64px 24px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: '14px', color: '#991B1B' }}>Ticket not found.</p>
          <Link href="/maintenance" style={{ color: '#D97706', textDecoration: 'none', fontFamily: 'var(--font-dmsans)', fontSize: '13px' }}>← Back to queue</Link>
        </div>
      </main>
    )
  }

  const urgencyStyle = URGENCY_COLORS[ticket.urgency]
  const statusStyle = STATUS_COLORS[ticket.status]
  const age = daysSince(ticket.created_at)
  const isClosed = ticket.status === 'completed' || ticket.status === 'cancelled'

  return (
    <main className="min-h-screen" style={{ background: '#FAFAF9', color: '#1C1917' }}>
      {/* Header */}
      <div style={{ background: '#1C1917', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: '768px', margin: '0 auto', padding: '24px' }}>
          <div className="flex items-center gap-4">
            <Link href="/maintenance" style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#A89880', textDecoration: 'none' }}>
              ← Queue
            </Link>
            <h1
              style={{
                fontFamily: 'var(--font-playfair), "Playfair Display", serif',
                fontSize: '22px',
                fontWeight: 700,
                color: '#F5F0E8',
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {ticket.title}
            </h1>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '768px', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '6px', padding: '12px 16px', fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#991B1B' }}>
            {error}
          </div>
        )}

        {/* Status bar */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E8E3DC', borderRadius: '8px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: '11px', fontWeight: 500, color: urgencyStyle.text, background: urgencyStyle.bg, padding: '4px 10px', borderRadius: '4px' }}>
              {URGENCY_LABELS[ticket.urgency]}
            </span>
            <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: '11px', fontWeight: 500, color: statusStyle.text, background: statusStyle.bg, padding: '4px 10px', borderRadius: '4px' }}>
              {STATUS_LABELS[ticket.status]}
            </span>
            {ticket.is_stale && (
              <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: '11px', fontWeight: 500, color: '#DC2626', background: 'rgba(220,38,38,0.1)', padding: '4px 10px', borderRadius: '4px' }}>
                Stale — {age}d open
              </span>
            )}
            {ticket.r_m_categories && (
              <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: '11px', color: '#6B5B4E', background: '#F5F0E8', padding: '4px 10px', borderRadius: '4px' }}>
                {ticket.r_m_categories.name}
              </span>
            )}
          </div>

          {/* Action buttons */}
          {!isClosed && (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {ticket.status === 'open' && (
                <button
                  onClick={() => setShowAssign(true)}
                  style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', fontWeight: 500, color: '#1C1917', background: '#D97706', borderRadius: '4px', padding: '10px 16px', border: 'none', cursor: 'pointer' }}
                >
                  Assign Vendor
                </button>
              )}
              <button
                onClick={() => {
                  setNewStatus(ticket.status === 'assigned' ? 'in_progress' : 'completed')
                  setShowStatusUpdate(true)
                }}
                style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', fontWeight: 500, color: '#FFFFFF', background: '#16A34A', borderRadius: '4px', padding: '10px 16px', border: 'none', cursor: 'pointer' }}
              >
                {ticket.status === 'assigned' ? 'Mark In Progress' : 'Mark Complete'}
              </button>
              <button
                onClick={() => { setNewStatus('cancelled'); setShowStatusUpdate(true) }}
                style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#9CA3AF', background: 'none', border: '1px solid #E8E3DC', borderRadius: '4px', padding: '10px 16px', cursor: 'pointer' }}
              >
                Cancel Ticket
              </button>
            </div>
          )}
        </div>

        {/* Ticket details */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E8E3DC', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontFamily: 'var(--font-dmsans)', fontSize: '11px', fontWeight: 500, color: '#6B5B4E', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Details</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <div style={{ ...LABEL_STYLE, marginBottom: '4px' }}>Submitted</div>
              <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#1C1917' }}>{formatDate(ticket.created_at)}</div>
            </div>
            <div>
              <div style={{ ...LABEL_STYLE, marginBottom: '4px' }}>Location</div>
              <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#1C1917' }}>{ticket.location_name}</div>
            </div>
            {ticket.equipment_tag && (
              <div>
                <div style={{ ...LABEL_STYLE, marginBottom: '4px' }}>Equipment</div>
                <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#1C1917' }}>{ticket.equipment_tag}</div>
              </div>
            )}
            {ticket.follow_up_date && (
              <div>
                <div style={{ ...LABEL_STYLE, marginBottom: '4px' }}>Follow-up Date</div>
                <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#1C1917' }}>{ticket.follow_up_date}</div>
              </div>
            )}
          </div>

          {ticket.description && (
            <div>
              <div style={{ ...LABEL_STYLE, marginBottom: '4px' }}>Description</div>
              <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: '14px', color: '#1C1917', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{ticket.description}</div>
            </div>
          )}

          {ticket.vendor_contacts && (
            <div>
              <div style={{ ...LABEL_STYLE, marginBottom: '4px' }}>Assigned Vendor</div>
              <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: '14px', color: '#1C1917' }}>
                {ticket.vendor_contacts.name}
                {ticket.vendor_contacts.company && ` — ${ticket.vendor_contacts.company}`}
                {ticket.vendor_contacts.phone && (
                  <a href={`tel:${ticket.vendor_contacts.phone}`} style={{ marginLeft: '8px', color: '#D97706', textDecoration: 'none', fontSize: '13px' }}>
                    {ticket.vendor_contacts.phone}
                  </a>
                )}
              </div>
            </div>
          )}

          {ticket.resolution_notes && (
            <div>
              <div style={{ ...LABEL_STYLE, marginBottom: '4px' }}>Resolution Notes</div>
              <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: '14px', color: '#1C1917', lineHeight: '1.6' }}>{ticket.resolution_notes}</div>
            </div>
          )}
        </div>

        {/* Photo */}
        {ticket.photo_url && (
          <div style={{ background: '#FFFFFF', border: '1px solid #E8E3DC', borderRadius: '8px', padding: '20px' }}>
            <div style={{ ...LABEL_STYLE, marginBottom: '12px' }}>Photo</div>
            <img
              src={ticket.photo_url}
              alt="Ticket photo"
              style={{ width: '100%', maxWidth: '400px', borderRadius: '6px', border: '1px solid #E8E3DC' }}
            />
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div style={{ background: '#FFFFFF', border: '1px solid #E8E3DC', borderRadius: '8px', padding: '20px' }}>
            <h2 style={{ fontFamily: 'var(--font-dmsans)', fontSize: '11px', fontWeight: 500, color: '#6B5B4E', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '16px' }}>
              Activity
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {history.map((entry, idx) => (
                <div
                  key={entry.id}
                  style={{
                    paddingBottom: '16px',
                    paddingLeft: '20px',
                    borderLeft: idx < history.length - 1 ? '2px solid #E8E3DC' : '2px solid transparent',
                    position: 'relative',
                    marginLeft: '8px',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: '-9px',
                      top: '2px',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: STATUS_COLORS[entry.new_status]?.bg ?? '#F5F0E8',
                      border: `2px solid ${STATUS_COLORS[entry.new_status]?.text ?? '#D97706'}`,
                    }}
                  />
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', fontWeight: 500, color: STATUS_COLORS[entry.new_status]?.text ?? '#1C1917' }}>
                      {STATUS_LABELS[entry.new_status]}
                    </span>
                    <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: '12px', color: '#9CA3AF' }}>
                      {formatDate(entry.created_at)}
                    </span>
                  </div>
                  {entry.note && (
                    <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#6B5B4E', marginTop: '2px' }}>
                      {entry.note}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Assign Vendor Modal */}
      {showAssign && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '24px' }}
          onClick={e => e.target === e.currentTarget && setShowAssign(false)}
        >
          <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '28px', width: '100%', maxWidth: '440px' }}>
            <h3 style={{ fontFamily: 'var(--font-playfair), "Playfair Display", serif', fontSize: '20px', fontWeight: 600, color: '#1C1917', marginBottom: '24px' }}>
              Assign Vendor
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={LABEL_STYLE}>Vendor</label>
                <select
                  style={{ ...INPUT_STYLE, cursor: 'pointer' }}
                  value={selectedVendor}
                  onChange={e => setSelectedVendor(e.target.value)}
                >
                  <option value="">Select vendor</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name}{v.company ? ` — ${v.company}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={LABEL_STYLE}>Follow-up Date (optional)</label>
                <input
                  type="date"
                  style={INPUT_STYLE}
                  value={followUpDate}
                  onChange={e => setFollowUpDate(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowAssign(false)}
                  style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#6B5B4E', background: 'none', border: '1px solid #E8E3DC', borderRadius: '4px', padding: '10px 16px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignVendor}
                  disabled={saving || !selectedVendor}
                  style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', fontWeight: 500, color: '#1C1917', background: '#D97706', borderRadius: '4px', padding: '10px 20px', border: 'none', cursor: 'pointer', opacity: !selectedVendor ? 0.7 : 1 }}
                >
                  {saving ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusUpdate && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '24px' }}
          onClick={e => e.target === e.currentTarget && setShowStatusUpdate(false)}
        >
          <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '28px', width: '100%', maxWidth: '440px' }}>
            <h3 style={{ fontFamily: 'var(--font-playfair), "Playfair Display", serif', fontSize: '20px', fontWeight: 600, color: '#1C1917', marginBottom: '24px' }}>
              Update Status
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={LABEL_STYLE}>New Status</label>
                <select
                  style={{ ...INPUT_STYLE, cursor: 'pointer' }}
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value as TicketStatus)}
                >
                  {(['open', 'assigned', 'in_progress', 'completed', 'cancelled'] as TicketStatus[]).map(s => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>
              {newStatus === 'completed' && (
                <div>
                  <label style={LABEL_STYLE}>Resolution Notes</label>
                  <textarea
                    style={{ ...INPUT_STYLE, minHeight: '80px', resize: 'vertical' }}
                    placeholder="What was fixed? Parts replaced? Cost?"
                    value={resolutionNotes}
                    onChange={e => setResolutionNotes(e.target.value)}
                  />
                </div>
              )}
              <div>
                <label style={LABEL_STYLE}>Note (optional)</label>
                <input
                  style={INPUT_STYLE}
                  placeholder="Add a note about this status change"
                  value={statusNote}
                  onChange={e => setStatusNote(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowStatusUpdate(false)}
                  style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#6B5B4E', background: 'none', border: '1px solid #E8E3DC', borderRadius: '4px', padding: '10px 16px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleStatusUpdate}
                  disabled={saving}
                  style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', fontWeight: 500, color: '#FFFFFF', background: newStatus === 'completed' ? '#16A34A' : newStatus === 'cancelled' ? '#EF4444' : '#D97706', borderRadius: '4px', padding: '10px 20px', border: 'none', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? 'Saving...' : `Mark ${STATUS_LABELS[newStatus]}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
