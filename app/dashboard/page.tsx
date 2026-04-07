'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getAllRecentRuns, getOpenExceptions } from '@/lib/audits'
import { getRMSummary, type RMSummary } from '@/lib/maintenance'

type ChecklistStatus = {
  type: 'opening' | 'closing'
  date: string
  completedBy: string
  completedAt: string
  progress: number
  totalTasks: number
  completedTasks: number
}

const MOCK_HISTORY: ChecklistStatus[] = [
  {
    type: 'closing',
    date: '2026-03-23',
    completedBy: 'Sarah M.',
    completedAt: '11:45 PM',
    progress: 100,
    totalTasks: 9,
    completedTasks: 9,
  },
  {
    type: 'opening',
    date: '2026-03-23',
    completedBy: 'Mike T.',
    completedAt: '9:15 AM',
    progress: 100,
    totalTasks: 9,
    completedTasks: 9,
  },
  {
    type: 'closing',
    date: '2026-03-22',
    completedBy: 'Sarah M.',
    completedAt: '11:30 PM',
    progress: 89,
    totalTasks: 9,
    completedTasks: 8,
  },
]

export default function DashboardPage() {
  const [currentProgress] = useState({
    type: 'opening' as 'opening' | 'closing',
    progress: 67,
    completedTasks: 6,
    totalTasks: 9,
    inProgressBy: 'Mike T.',
    startedAt: '9:05 AM',
  })
  const [auditSummary, setAuditSummary] = useState<{ lastScore: number | null; openExceptions: number; recentFormName: string } | null>(null)
  const [rmSummary, setRmSummary] = useState<RMSummary | null>(null)

  useEffect(() => {
    Promise.all([getAllRecentRuns(1), getOpenExceptions()])
      .then(([runs, exceptions]) => {
        const lastRun = runs[0]
        setAuditSummary({
          lastScore: lastRun?.score ?? null,
          openExceptions: exceptions.length,
          recentFormName: lastRun?.audit_forms?.name ?? 'LP Audit',
        })
      })
      .catch(() => {/* silently skip — user may not have audits yet */})

    getRMSummary()
      .then(setRmSummary)
      .catch(() => {/* silently skip — user may not have R&M tickets yet */})
  }, [])

  return (
    <main className="min-h-screen" style={{ background: '#FAFAF9', color: '#1C1917' }}>
      {/* Header */}
      <div style={{ background: '#1C1917', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: '768px', margin: '0 auto', padding: '24px 24px' }}>
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
                Manager Dashboard
              </h1>
              <p
                style={{
                  fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                  fontSize: '14px',
                  fontWeight: 300,
                  color: '#A89880',
                }}
              >
                Real-time checklist tracking
              </p>
            </div>
            <Link
              href="/checklist"
              className="hover:opacity-90 transition-opacity"
              style={{
                fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                fontSize: '14px',
                fontWeight: 500,
                color: '#1C1917',
                background: '#D97706',
                borderRadius: '4px',
                padding: '10px 20px',
                textDecoration: 'none',
              }}
            >
              + Start Checklist
            </Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '768px', margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '32px', paddingTop: '32px' }}>
        {/* Live Status */}
        <section>
          <h2
            style={{
              fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
              fontSize: '13px',
              fontWeight: 500,
              color: '#6B5B4E',
              letterSpacing: '0.06em',
              textTransform: 'uppercase' as const,
              marginBottom: '16px',
            }}
          >
            Live Status
          </h2>
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E8E3DC',
              borderLeft: '3px solid #D97706',
              borderRadius: '8px',
              padding: '28px',
            }}
          >
            <div className="flex items-start justify-between" style={{ marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                  <h3
                    style={{
                      fontFamily: 'var(--font-playfair), "Playfair Display", serif',
                      fontSize: '22px',
                      fontWeight: 500,
                      color: '#1C1917',
                      textTransform: 'capitalize' as const,
                    }}
                  >
                    {currentProgress.type} Checklist
                  </h3>
                  <span
                    style={{
                      fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                      fontSize: '11px',
                      fontWeight: 500,
                      color: '#1C1917',
                      background: '#D97706',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      letterSpacing: '0.02em',
                    }}
                  >
                    In Progress
                  </span>
                </div>
                <p
                  style={{
                    fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                    fontSize: '13px',
                    fontWeight: 300,
                    color: '#78716C',
                  }}
                >
                  Started by {currentProgress.inProgressBy} at {currentProgress.startedAt}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    fontFamily: 'var(--font-playfair), "Playfair Display", serif',
                    fontSize: '32px',
                    fontWeight: 700,
                    color: '#D97706',
                  }}
                >
                  {currentProgress.progress}%
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                    fontSize: '13px',
                    fontWeight: 300,
                    color: '#6B5B4E',
                  }}
                >
                  {currentProgress.completedTasks} of {currentProgress.totalTasks}
                </div>
              </div>
            </div>

            <div
              style={{
                height: '6px',
                background: '#E8E3DC',
                borderRadius: '3px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${currentProgress.progress}%`,
                  background: '#D97706',
                  borderRadius: '3px',
                  transition: 'width 0.5s',
                }}
              />
            </div>

            <div style={{ marginTop: '16px' }}>
              <Link
                href="/checklist"
                className="hover:opacity-80 transition-opacity"
                style={{
                  fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#D97706',
                  textDecoration: 'none',
                }}
              >
                View Live Progress &rarr;
              </Link>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section>
          <h2
            style={{
              fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
              fontSize: '13px',
              fontWeight: 500,
              color: '#6B5B4E',
              letterSpacing: '0.06em',
              textTransform: 'uppercase' as const,
              marginBottom: '16px',
            }}
          >
            This Week
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { label: 'Completion Rate', value: '96%', change: '↑ 4% from last week' },
              { label: 'Avg. Completion Time', value: '12 min', change: '↓ 2 min faster' },
              { label: 'Photos Attached', value: '98%', change: '↑ 12% from last week' },
            ].map((stat, i) => (
              <div
                key={i}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E8E3DC',
                  borderRadius: '8px',
                  padding: '24px',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#6B5B4E',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase' as const,
                    marginBottom: '8px',
                  }}
                >
                  {stat.label}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-playfair), "Playfair Display", serif',
                    fontSize: '32px',
                    fontWeight: 700,
                    color: '#1C1917',
                    marginBottom: '4px',
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                    fontSize: '12px',
                    fontWeight: 400,
                    color: '#D97706',
                  }}
                >
                  {stat.change}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* History */}
        <section>
          <h2
            style={{
              fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
              fontSize: '13px',
              fontWeight: 500,
              color: '#6B5B4E',
              letterSpacing: '0.06em',
              textTransform: 'uppercase' as const,
              marginBottom: '16px',
            }}
          >
            Recent Checklists
          </h2>
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E8E3DC',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E8E3DC' }}>
                  {['Date', 'Type', 'Completed By', 'Progress', 'Time', ''].map((h, i) => (
                    <th
                      key={i}
                      style={{
                        fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                        fontSize: '11px',
                        fontWeight: 500,
                        color: '#6B5B4E',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase' as const,
                        textAlign: 'left',
                        padding: '12px 20px',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MOCK_HISTORY.map((item, idx) => (
                  <tr
                    key={idx}
                    style={{ borderBottom: idx < MOCK_HISTORY.length - 1 ? '1px solid #E8E3DC' : 'none' }}
                  >
                    <td style={{ padding: '14px 20px', fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif', fontSize: '13px', fontWeight: 400, color: '#1C1917' }}>
                      {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                          fontSize: '11px',
                          fontWeight: 500,
                          color: '#D97706',
                          background: 'rgba(217,119,6,0.1)',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          textTransform: 'capitalize' as const,
                        }}
                      >
                        {item.type}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif', fontSize: '13px', fontWeight: 400, color: '#1C1917' }}>
                      {item.completedBy}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '4px', background: '#E8E3DC', borderRadius: '2px', width: '80px' }}>
                          <div
                            style={{
                              height: '100%',
                              borderRadius: '2px',
                              width: `${item.progress}%`,
                              background: item.progress === 100 ? '#D97706' : '#B45309',
                            }}
                          />
                        </div>
                        <span style={{ fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif', fontSize: '12px', color: '#6B5B4E' }}>
                          {item.completedTasks}/{item.totalTasks}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px', fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif', fontSize: '13px', fontWeight: 300, color: '#6B5B4E' }}>
                      {item.completedAt}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <button
                        className="hover:opacity-80 transition-opacity"
                        style={{
                          fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                          fontSize: '12px',
                          fontWeight: 500,
                          color: '#D97706',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        View Report
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </section>

        {/* LP Audit Summary */}
        <section>
          <h2
            style={{
              fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
              fontSize: '13px',
              fontWeight: 500,
              color: '#6B5B4E',
              letterSpacing: '0.06em',
              textTransform: 'uppercase' as const,
              marginBottom: '16px',
            }}
          >
            Loss Prevention
          </h2>
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E8E3DC',
              borderLeft: '3px solid #D97706',
              borderRadius: '8px',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-playfair), "Playfair Display", serif',
                    fontSize: '18px',
                    fontWeight: 600,
                    color: '#1C1917',
                    marginBottom: '4px',
                  }}
                >
                  LP Audit Forms
                </div>
                {auditSummary ? (
                  <p style={{ fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif', fontSize: '13px', fontWeight: 300, color: '#78716C' }}>
                    {auditSummary.lastScore !== null
                      ? `Last audit: ${auditSummary.lastScore}% — ${auditSummary.recentFormName}`
                      : 'No audits run yet'}
                    {auditSummary.openExceptions > 0 && (
                      <span style={{ marginLeft: '8px', color: '#EF4444', fontWeight: 500 }}>
                        · {auditSummary.openExceptions} open exception{auditSummary.openExceptions !== 1 ? 's' : ''}
                      </span>
                    )}
                  </p>
                ) : (
                  <p style={{ fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif', fontSize: '13px', fontWeight: 300, color: '#78716C' }}>
                    Configure and run LP audits for your location
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                {auditSummary?.openExceptions ? (
                  <Link
                    href="/audit-exceptions"
                    className="hover:opacity-80 transition-opacity"
                    style={{
                      fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                      fontSize: '12px', fontWeight: 500,
                      color: '#EF4444', background: 'rgba(239,68,68,0.08)',
                      border: '1px solid rgba(239,68,68,0.3)',
                      borderRadius: '4px', padding: '8px 14px', textDecoration: 'none',
                    }}
                  >
                    ⚠ Exceptions
                  </Link>
                ) : null}
                <Link
                  href="/audit-forms"
                  className="hover:opacity-80 transition-opacity"
                  style={{
                    fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                    fontSize: '13px', fontWeight: 500,
                    color: '#D97706', textDecoration: 'none',
                  }}
                >
                  View Audits →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* R&M Ticket Summary */}
        <section>
          <h2
            style={{
              fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
              fontSize: '13px',
              fontWeight: 500,
              color: '#6B5B4E',
              letterSpacing: '0.06em',
              textTransform: 'uppercase' as const,
              marginBottom: '16px',
            }}
          >
            Repair &amp; Maintenance
          </h2>
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E8E3DC',
              borderLeft: rmSummary && rmSummary.staleCount > 0 ? '3px solid #DC2626' : '3px solid #D97706',
              borderRadius: '8px',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-playfair), "Playfair Display", serif',
                    fontSize: '18px',
                    fontWeight: 600,
                    color: '#1C1917',
                    marginBottom: '4px',
                  }}
                >
                  R&amp;M Tickets
                </div>
                {rmSummary ? (
                  <p style={{ fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif', fontSize: '13px', fontWeight: 300, color: '#78716C' }}>
                    {rmSummary.openCount} open
                    {rmSummary.assignedCount > 0 && ` · ${rmSummary.assignedCount} in progress`}
                    {rmSummary.completedThisWeek > 0 && ` · ${rmSummary.completedThisWeek} closed this week`}
                    {rmSummary.staleCount > 0 && (
                      <span style={{ marginLeft: '8px', color: '#DC2626', fontWeight: 500 }}>
                        · {rmSummary.staleCount} stale (&gt;14d)
                      </span>
                    )}
                  </p>
                ) : (
                  <p style={{ fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif', fontSize: '13px', fontWeight: 300, color: '#78716C' }}>
                    Track and resolve equipment issues
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                {rmSummary && rmSummary.staleCount > 0 ? (
                  <Link
                    href="/maintenance?stale=1"
                    className="hover:opacity-80 transition-opacity"
                    style={{
                      fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                      fontSize: '12px', fontWeight: 500,
                      color: '#DC2626', background: 'rgba(220,38,38,0.08)',
                      border: '1px solid rgba(220,38,38,0.3)',
                      borderRadius: '4px', padding: '8px 14px', textDecoration: 'none',
                    }}
                  >
                    ⚠ Stale
                  </Link>
                ) : null}
                <Link
                  href="/maintenance"
                  className="hover:opacity-80 transition-opacity"
                  style={{
                    fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                    fontSize: '13px', fontWeight: 500,
                    color: '#D97706', textDecoration: 'none',
                  }}
                >
                  View Tickets →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Tip */}
        <section>
          <div
            style={{
              background: '#FEF9F0',
              border: '1px solid rgba(217,119,6,0.2)',
              borderRadius: '8px',
              padding: '24px',
              display: 'flex',
              gap: '16px',
            }}
          >
            <div style={{ fontSize: '24px', flexShrink: 0 }}>&#9889;</div>
            <div>
              <h3
                style={{
                  fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#1C1917',
                  marginBottom: '4px',
                }}
              >
                Pro Tip
              </h3>
              <p
                style={{
                  fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                  fontSize: '13px',
                  fontWeight: 300,
                  color: '#78716C',
                  lineHeight: 1.6,
                }}
              >
                Share the checklist link with your team via text or print a QR code.
                They can complete it without creating an account — just open and go.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
