'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  getAuditFormWithItems,
  getSchedulesForForm,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  type AuditForm,
  type AuditSchedule,
  type AuditCadence,
} from '@/lib/audits'

const LABEL_STYLE = {
  fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
  fontSize: '11px',
  fontWeight: 500,
  color: '#6B5B4E',
  letterSpacing: '0.06em',
  textTransform: 'uppercase' as const,
  display: 'block',
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

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function formatScheduleDescription(s: AuditSchedule): string {
  if (s.cadence === 'daily') return `Daily at ${s.time_of_day}`
  if (s.cadence === 'weekly') return `Every ${DAY_NAMES[s.day_of_week ?? 1]} at ${s.time_of_day}`
  if (s.cadence === 'monthly') return `Monthly on the ${s.day_of_month}${ordinal(s.day_of_month ?? 1)} at ${s.time_of_day}`
  return ''
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}

const defaultSchedule = {
  location_name: 'Main Location',
  cadence: 'daily' as AuditCadence,
  time_of_day: '09:00',
  day_of_week: 1,
  day_of_month: 1,
}

export default function AuditSchedulePage() {
  const params = useParams()
  const formId = params.id as string

  const [form, setForm] = useState<AuditForm | null>(null)
  const [schedules, setSchedules] = useState<AuditSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [draft, setDraft] = useState(defaultSchedule)

  const load = useCallback(async () => {
    try {
      const [formData, scheduleData] = await Promise.all([
        getAuditFormWithItems(formId),
        getSchedulesForForm(formId),
      ])
      setForm(formData)
      setSchedules(scheduleData)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [formId])

  useEffect(() => { load() }, [load])

  const handleAdd = async () => {
    setSaving(true)
    try {
      await createSchedule({
        form_id: formId,
        location_name: draft.location_name,
        cadence: draft.cadence,
        time_of_day: draft.time_of_day,
        day_of_week: draft.cadence === 'weekly' ? draft.day_of_week : null,
        day_of_month: draft.cadence === 'monthly' ? draft.day_of_month : null,
      })
      setShowAdd(false)
      setDraft(defaultSchedule)
      await load()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (schedule: AuditSchedule) => {
    try {
      await updateSchedule(schedule.id, { is_active: !schedule.is_active })
      await load()
    } catch (e: any) {
      setError(e.message)
    }
  }

  const handleDelete = async (scheduleId: string) => {
    if (!confirm('Remove this schedule?')) return
    try {
      await deleteSchedule(scheduleId)
      await load()
    } catch (e: any) {
      setError(e.message)
    }
  }

  return (
    <main className="min-h-screen" style={{ background: '#FAFAF9', color: '#1C1917' }}>
      <div style={{ background: '#1C1917', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: '768px', margin: '0 auto', padding: '24px' }}>
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/audit-forms"
                style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#A89880', textDecoration: 'none', display: 'block', marginBottom: '6px' }}
              >
                ← Audit Forms
              </Link>
              <h1 style={{ fontFamily: 'var(--font-playfair), "Playfair Display", serif', fontSize: '26px', fontWeight: 700, color: '#F5F0E8' }}>
                {loading ? 'Schedule...' : `Schedule — ${form?.name ?? ''}`}
              </h1>
              <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: '14px', fontWeight: 300, color: '#A89880', marginTop: '4px' }}>
                Configure recurring audit cadence and location assignment
              </p>
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

        <section>
          <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
            <h2 style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', fontWeight: 500, color: '#6B5B4E', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Active Schedules
            </h2>
            <button
              onClick={() => setShowAdd(true)}
              style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', fontWeight: 500, color: '#1C1917', background: '#D97706', borderRadius: '4px', padding: '8px 16px', border: 'none', cursor: 'pointer' }}
            >
              + Add Schedule
            </button>
          </div>

          {/* Add Schedule Form */}
          {showAdd && (
            <div style={{ background: '#FFFFFF', border: '1px solid #E8E3DC', borderRadius: '8px', padding: '24px', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: 'var(--font-playfair), "Playfair Display", serif', fontSize: '18px', fontWeight: 600, color: '#1C1917', marginBottom: '20px' }}>
                New Schedule
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={LABEL_STYLE}>Location Name</label>
                  <input
                    style={INPUT_STYLE}
                    placeholder="Main Location"
                    value={draft.location_name}
                    onChange={e => setDraft(p => ({ ...p, location_name: e.target.value }))}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={LABEL_STYLE}>Cadence</label>
                    <select
                      style={{ ...INPUT_STYLE, cursor: 'pointer' }}
                      value={draft.cadence}
                      onChange={e => setDraft(p => ({ ...p, cadence: e.target.value as AuditCadence }))}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label style={LABEL_STYLE}>Time of Day</label>
                    <input
                      type="time"
                      style={INPUT_STYLE}
                      value={draft.time_of_day}
                      onChange={e => setDraft(p => ({ ...p, time_of_day: e.target.value }))}
                    />
                  </div>
                </div>

                {draft.cadence === 'weekly' && (
                  <div>
                    <label style={LABEL_STYLE}>Day of Week</label>
                    <select
                      style={{ ...INPUT_STYLE, cursor: 'pointer' }}
                      value={draft.day_of_week}
                      onChange={e => setDraft(p => ({ ...p, day_of_week: Number(e.target.value) }))}
                    >
                      {DAY_NAMES.map((d, i) => (
                        <option key={i} value={i}>{d}</option>
                      ))}
                    </select>
                  </div>
                )}

                {draft.cadence === 'monthly' && (
                  <div>
                    <label style={LABEL_STYLE}>Day of Month (1–28)</label>
                    <input
                      type="number"
                      min={1}
                      max={28}
                      style={INPUT_STYLE}
                      value={draft.day_of_month}
                      onChange={e => setDraft(p => ({ ...p, day_of_month: Number(e.target.value) }))}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => { setShowAdd(false); setDraft(defaultSchedule) }}
                    style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#6B5B4E', background: 'none', border: '1px solid #E8E3DC', borderRadius: '4px', padding: '8px 16px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAdd}
                    disabled={saving}
                    style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', fontWeight: 500, color: '#1C1917', background: '#D97706', borderRadius: '4px', padding: '8px 20px', border: 'none', cursor: 'pointer' }}
                  >
                    {saving ? 'Saving...' : 'Save Schedule'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: '14px', color: '#6B5B4E', padding: '32px', textAlign: 'center' }}>Loading...</div>
          ) : schedules.length === 0 && !showAdd ? (
            <div style={{ background: '#FFFFFF', border: '1px solid #E8E3DC', borderRadius: '8px', padding: '48px', textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: '14px', color: '#6B5B4E', marginBottom: '16px' }}>
                No schedules configured. Audits can still be started manually.
              </p>
              <button
                onClick={() => setShowAdd(true)}
                style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', fontWeight: 500, color: '#1C1917', background: '#D97706', borderRadius: '4px', padding: '10px 20px', border: 'none', cursor: 'pointer' }}
              >
                Add first schedule
              </button>
            </div>
          ) : (
            <div style={{ background: '#FFFFFF', border: '1px solid #E8E3DC', borderRadius: '8px', overflow: 'hidden' }}>
              {schedules.map((s, idx) => (
                <div
                  key={s.id}
                  style={{
                    padding: '18px 20px',
                    borderBottom: idx < schedules.length - 1 ? '1px solid #F0EBE3' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    opacity: s.is_active ? 1 : 0.5,
                  }}
                >
                  <div>
                    <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: '14px', fontWeight: 500, color: '#1C1917', marginBottom: '4px' }}>
                      {s.location_name}
                    </div>
                    <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#6B5B4E' }}>
                      {formatScheduleDescription(s)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      onClick={() => handleToggleActive(s)}
                      style={{
                        fontFamily: 'var(--font-dmsans)', fontSize: '12px', fontWeight: 500,
                        color: s.is_active ? '#D97706' : '#6B5B4E',
                        background: s.is_active ? 'rgba(217,119,6,0.1)' : '#F5F0E8',
                        border: 'none', borderRadius: '4px', padding: '4px 12px', cursor: 'pointer',
                      }}
                    >
                      {s.is_active ? 'Active' : 'Paused'}
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      style={{ fontFamily: 'var(--font-dmsans)', fontSize: '12px', color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Info box */}
        <div style={{ background: '#FEF9F0', border: '1px solid rgba(217,119,6,0.2)', borderRadius: '8px', padding: '20px 24px' }}>
          <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', fontWeight: 400, color: '#78716C', lineHeight: 1.6, margin: 0 }}>
            <strong style={{ color: '#1C1917' }}>How schedules work:</strong> Configured schedules drive push notification reminders at the set time. Audits must still be started manually from the Audit Forms page or your daily ops summary. Missed audits are flagged in the trend report.
          </p>
        </div>
      </div>
    </main>
  )
}
