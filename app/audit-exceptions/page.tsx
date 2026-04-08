'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { getOpenExceptions, resolveException, type AuditException, type AuditItem, type AuditRun, type AuditForm } from '@/lib/audits'
import { usePhase3Flag } from '@/lib/use-phase3-flag'

type EnrichedException = AuditException & {
  audit_items: AuditItem
  audit_runs: Pick<AuditRun, 'audit_date' | 'location_name' | 'form_id'> & { audit_forms: Pick<AuditForm, 'name'> }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AuditExceptionsPage() {
  const { enabled: phase3Enabled, loading: flagLoading } = usePhase3Flag()
  const [exceptions, setExceptions] = useState<EnrichedException[]>([])
  const [loading, setLoading] = useState(true)
  const [resolving, setResolving] = useState<string | null>(null)
  const [resolutionNote, setResolutionNote] = useState<Record<string, string>>({})
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const data = await getOpenExceptions()
      setExceptions(data as unknown as EnrichedException[])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleResolve = async (exceptionId: string) => {
    const note = resolutionNote[exceptionId]?.trim()
    if (!note) return
    setResolving(exceptionId)
    try {
      await resolveException(exceptionId, note)
      await load()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setResolving(null)
    }
  }

  function getExceptionSummary(exc: EnrichedException): string {
    const item = exc.audit_items
    if (item.field_type === 'numeric' && exc.response_numeric !== null) {
      const val = exc.response_numeric!
      if (item.threshold_min !== null && val < item.threshold_min) {
        return `Value ${val} is below minimum threshold of ${item.threshold_min}`
      }
      if (item.threshold_max !== null && val > item.threshold_max) {
        return `Value ${val} exceeds maximum threshold of ${item.threshold_max}`
      }
    }
    if (item.field_type === 'checkbox' && exc.response_bool === false) {
      return 'Required item marked as Fail'
    }
    return 'Exception flagged'
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
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>⚑</div>
          <h2 style={{ fontFamily: 'var(--font-playfair), "Playfair Display", serif', fontSize: '22px', fontWeight: 600, color: '#1C1917', marginBottom: '12px' }}>
            LP Audit Exceptions — Coming Soon
          </h2>
          <p style={{ fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif', fontSize: '14px', color: '#78716C', lineHeight: 1.6 }}>
            This feature is rolling out to accounts now. You'll be notified when it's available.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen" style={{ background: '#FAFAF9', color: '#1C1917' }}>
      <div style={{ background: '#1C1917', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: '768px', margin: '0 auto', padding: '24px' }}>
          <div className="flex items-center justify-between">
            <div>
              <Link href="/audit-forms" style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#A89880', textDecoration: 'none', display: 'block', marginBottom: '6px' }}>
                ← Audit Forms
              </Link>
              <h1 style={{ fontFamily: 'var(--font-playfair), "Playfair Display", serif', fontSize: '28px', fontWeight: 700, color: '#F5F0E8' }}>
                Exception Report
              </h1>
              <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: '14px', fontWeight: 300, color: '#A89880', marginTop: '4px' }}>
                Items flagged outside acceptable thresholds — pending resolution
              </p>
            </div>
            <Link
              href="/audit-trends"
              className="hover:opacity-80 transition-opacity"
              style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', fontWeight: 500, color: '#1C1917', background: '#D97706', borderRadius: '4px', padding: '10px 16px', textDecoration: 'none' }}
            >
              Trends
            </Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '768px', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '6px', padding: '12px 16px', fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#991B1B' }}>
            {error}
          </div>
        )}

        {/* Summary banner */}
        {!loading && (
          <div style={{
            background: exceptions.length > 0 ? '#FEF9F0' : '#F0FFF4',
            border: `1px solid ${exceptions.length > 0 ? 'rgba(217,119,6,0.3)' : 'rgba(34,197,94,0.3)'}`,
            borderRadius: '8px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <span style={{ fontSize: '20px' }}>{exceptions.length > 0 ? '⚠' : '✓'}</span>
            <div>
              <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: '14px', fontWeight: 600, color: '#1C1917' }}>
                {exceptions.length > 0
                  ? `${exceptions.length} open exception${exceptions.length !== 1 ? 's' : ''} require${exceptions.length === 1 ? 's' : ''} review`
                  : 'No open exceptions — all audits within range'}
              </div>
              {exceptions.length > 0 && (
                <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#6B5B4E', marginTop: '2px' }}>
                  Add a resolution note to mark each exception as resolved.
                </div>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: '14px', color: '#6B5B4E', padding: '32px', textAlign: 'center' }}>Loading...</div>
        ) : exceptions.length === 0 ? (
          <div style={{ background: '#FFFFFF', border: '1px solid #E8E3DC', borderRadius: '8px', padding: '48px', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: '14px', color: '#6B5B4E' }}>
              No open exceptions. All audit responses are within acceptable ranges.
            </p>
          </div>
        ) : (
          exceptions.map((exc) => (
            <div
              key={exc.id}
              style={{ background: '#FFFFFF', border: '1px solid #E8E3DC', borderLeft: '3px solid #EF4444', borderRadius: '8px', overflow: 'hidden' }}
            >
              {/* Exception header */}
              <div
                onClick={() => setExpandedId(expandedId === exc.id ? null : exc.id)}
                style={{ padding: '18px 20px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: '11px', fontWeight: 500, color: '#6B5B4E', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '6px' }}>
                    {exc.audit_runs?.audit_forms?.name ?? 'Audit'} · {exc.audit_runs?.location_name} · {formatDate(exc.audit_runs?.audit_date ?? '')}
                  </div>
                  <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: '15px', fontWeight: 500, color: '#1C1917', marginBottom: '4px' }}>
                    {exc.audit_items?.label}
                  </div>
                  <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#EF4444' }}>
                    {getExceptionSummary(exc)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                  <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: '11px', fontWeight: 500, color: '#EF4444', background: 'rgba(239,68,68,0.1)', padding: '3px 10px', borderRadius: '4px' }}>
                    Open
                  </span>
                  <span style={{ color: '#9CA3AF', fontSize: '12px' }}>{expandedId === exc.id ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Photo proof */}
              {exc.photo_url && (
                <div style={{ padding: '0 20px 16px' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={exc.photo_url}
                    alt="Audit photo"
                    style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: '6px', border: '1px solid #E8E3DC', objectFit: 'cover' }}
                  />
                </div>
              )}

              {/* Resolution panel */}
              {expandedId === exc.id && (
                <div style={{ padding: '16px 20px', borderTop: '1px solid #F0EBE3', background: '#FAFAF9' }}>
                  <label style={{ fontFamily: 'var(--font-dmsans)', fontSize: '11px', fontWeight: 500, color: '#6B5B4E', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                    Resolution Note (Required)
                  </label>
                  <textarea
                    style={{
                      fontFamily: 'var(--font-dmsans)', fontSize: '14px', color: '#1C1917',
                      border: '1px solid #E8E3DC', borderRadius: '6px',
                      padding: '10px 12px', width: '100%', minHeight: '72px', resize: 'vertical', outline: 'none',
                      marginBottom: '12px',
                    }}
                    placeholder="Describe what action was taken to address this exception..."
                    value={resolutionNote[exc.id] ?? ''}
                    onChange={e => setResolutionNote(p => ({ ...p, [exc.id]: e.target.value }))}
                  />
                  <button
                    onClick={() => handleResolve(exc.id)}
                    disabled={!resolutionNote[exc.id]?.trim() || resolving === exc.id}
                    style={{
                      fontFamily: 'var(--font-dmsans)', fontSize: '13px', fontWeight: 500,
                      color: '#FFFFFF',
                      background: resolutionNote[exc.id]?.trim() ? '#059669' : '#D1D5DB',
                      border: 'none', borderRadius: '4px', padding: '10px 20px', cursor: 'pointer',
                    }}
                  >
                    {resolving === exc.id ? 'Resolving...' : '✓ Mark Resolved'}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </main>
  )
}
