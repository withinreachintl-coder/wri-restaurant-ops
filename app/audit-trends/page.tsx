'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  getAuditForms,
  getAuditTrends,
  getAllRecentRuns,
  groupByWeek,
  type AuditForm,
  type TrendDataPoint,
  type AuditRun,
} from '@/lib/audits'

function formatWeek(weekStr: string): string {
  const d = new Date(weekStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function ScoreBar({ score, maxWidth = '100%' }: { score: number; maxWidth?: string }) {
  const color = score >= 90 ? '#059669' : score >= 70 ? '#D97706' : '#EF4444'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{ flex: 1, height: '8px', background: '#E8E3DC', borderRadius: '4px', overflow: 'hidden', maxWidth }}>
        <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: '4px', transition: 'width 0.4s' }} />
      </div>
      <span style={{
        fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
        fontSize: '13px', fontWeight: 600,
        color,
        minWidth: '36px',
      }}>
        {score}%
      </span>
    </div>
  )
}

export default function AuditTrendsPage() {
  const [forms, setForms] = useState<AuditForm[]>([])
  const [selectedFormId, setSelectedFormId] = useState<string>('')
  const [trends, setTrends] = useState<TrendDataPoint[]>([])
  const [recentRuns, setRecentRuns] = useState<(AuditRun & { audit_forms: Pick<AuditForm, 'name' | 'category'> })[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingTrends, setLoadingTrends] = useState(false)
  const [error, setError] = useState('')
  const [weeksBack, setWeeksBack] = useState(8)

  const loadInitial = useCallback(async () => {
    try {
      const [formsData, runsData] = await Promise.all([
        getAuditForms(),
        getAllRecentRuns(20),
      ])
      setForms(formsData)
      setRecentRuns(runsData)
      if (formsData.length > 0) setSelectedFormId(formsData[0].id)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadInitial() }, [loadInitial])

  useEffect(() => {
    if (!selectedFormId) return
    setLoadingTrends(true)
    getAuditTrends(selectedFormId, weeksBack)
      .then(setTrends)
      .catch(e => setError(e.message))
      .finally(() => setLoadingTrends(false))
  }, [selectedFormId, weeksBack])

  const weeklyData = groupByWeek(trends)
  const locations = Array.from(new Set(trends.map(t => t.location_name)))

  // Week-over-week change
  const latestWeek = weeklyData[weeklyData.length - 1]
  const prevWeek = weeklyData[weeklyData.length - 2]
  const wow = latestWeek && prevWeek
    ? latestWeek.avgScore - prevWeek.avgScore
    : null

  // Location comparison (latest week)
  const locationScores = latestWeek
    ? Object.entries(latestWeek.byLocation).sort((a, b) => b[1] - a[1])
    : []

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
                Audit Trends
              </h1>
              <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: '14px', fontWeight: 300, color: '#A89880', marginTop: '4px' }}>
                Week-over-week scores · location comparison
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <Link
                href="/audit-exceptions"
                style={{
                  fontFamily: 'var(--font-dmsans)', fontSize: '13px', fontWeight: 500, color: '#D97706',
                  border: '1px solid rgba(217,119,6,0.4)', borderRadius: '4px', padding: '10px 16px', textDecoration: 'none',
                }}
              >
                Exceptions
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '768px', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '6px', padding: '12px 16px', fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#991B1B' }}>
            {error}
          </div>
        )}

        {/* Form selector + period */}
        {!loading && forms.length > 0 && (
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ fontFamily: 'var(--font-dmsans)', fontSize: '11px', fontWeight: 500, color: '#6B5B4E', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                Audit Form
              </label>
              <select
                style={{ fontFamily: 'var(--font-dmsans)', fontSize: '14px', color: '#1C1917', background: '#FFFFFF', border: '1px solid #E8E3DC', borderRadius: '6px', padding: '10px 12px', width: '100%', cursor: 'pointer' }}
                value={selectedFormId}
                onChange={e => setSelectedFormId(e.target.value)}
              >
                {forms.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontFamily: 'var(--font-dmsans)', fontSize: '11px', fontWeight: 500, color: '#6B5B4E', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                Period
              </label>
              <select
                style={{ fontFamily: 'var(--font-dmsans)', fontSize: '14px', color: '#1C1917', background: '#FFFFFF', border: '1px solid #E8E3DC', borderRadius: '6px', padding: '10px 12px', cursor: 'pointer' }}
                value={weeksBack}
                onChange={e => setWeeksBack(Number(e.target.value))}
              >
                <option value={4}>Last 4 weeks</option>
                <option value={8}>Last 8 weeks</option>
                <option value={12}>Last 12 weeks</option>
              </select>
            </div>
          </div>
        )}

        {/* Key metrics */}
        {!loading && latestWeek && (
          <div className="grid md:grid-cols-3 gap-4">
            <div style={{ background: '#FFFFFF', border: '1px solid #E8E3DC', borderRadius: '8px', padding: '20px' }}>
              <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: '11px', fontWeight: 500, color: '#6B5B4E', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>
                Latest Week Avg
              </div>
              <div style={{ fontFamily: 'var(--font-playfair), "Playfair Display", serif', fontSize: '36px', fontWeight: 700, color: latestWeek.avgScore >= 80 ? '#D97706' : '#EF4444' }}>
                {latestWeek.avgScore}%
              </div>
              <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: '12px', color: '#6B5B4E', marginTop: '4px' }}>
                Week of {formatWeek(latestWeek.week)}
              </div>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E8E3DC', borderRadius: '8px', padding: '20px' }}>
              <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: '11px', fontWeight: 500, color: '#6B5B4E', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>
                Week-over-Week
              </div>
              <div style={{ fontFamily: 'var(--font-playfair), "Playfair Display", serif', fontSize: '36px', fontWeight: 700, color: wow === null ? '#6B5B4E' : wow >= 0 ? '#059669' : '#EF4444' }}>
                {wow === null ? '—' : `${wow > 0 ? '+' : ''}${wow}%`}
              </div>
              <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: '12px', color: '#6B5B4E', marginTop: '4px' }}>
                {wow === null ? 'Need 2+ weeks of data' : wow >= 0 ? 'Improving' : 'Declining'}
              </div>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E8E3DC', borderRadius: '8px', padding: '20px' }}>
              <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: '11px', fontWeight: 500, color: '#6B5B4E', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>
                Audits This Period
              </div>
              <div style={{ fontFamily: 'var(--font-playfair), "Playfair Display", serif', fontSize: '36px', fontWeight: 700, color: '#1C1917' }}>
                {trends.length}
              </div>
              <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: '12px', color: '#6B5B4E', marginTop: '4px' }}>
                {locations.length} location{locations.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        )}

        {/* Week-over-week chart (bar chart) */}
        {weeklyData.length > 0 && (
          <section>
            <h2 style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', fontWeight: 500, color: '#6B5B4E', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '16px' }}>
              Score by Week
            </h2>
            <div style={{ background: '#FFFFFF', border: '1px solid #E8E3DC', borderRadius: '8px', padding: '24px' }}>
              {loadingTrends ? (
                <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: '14px', color: '#6B5B4E', textAlign: 'center', padding: '24px' }}>Loading...</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {weeklyData.map((week, i) => (
                    <div key={week.week}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: '12px', color: '#6B5B4E', minWidth: '72px' }}>
                          {formatWeek(week.week)}
                        </span>
                        <div style={{ flex: 1, marginLeft: '16px' }}>
                          <ScoreBar score={week.avgScore} />
                        </div>
                      </div>
                      {i < weeklyData.length - 1 && (
                        <div style={{ height: '1px', background: '#F0EBE3', marginTop: '6px' }} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Location comparison */}
        {locationScores.length > 1 && (
          <section>
            <h2 style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', fontWeight: 500, color: '#6B5B4E', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '16px' }}>
              Location Comparison — Latest Week
            </h2>
            <div style={{ background: '#FFFFFF', border: '1px solid #E8E3DC', borderRadius: '8px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {locationScores.map(([loc, score], i) => (
                <div key={loc}>
                  <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', fontWeight: 500, color: '#1C1917', marginBottom: '6px' }}>
                    {loc}
                    {i === 0 && <span style={{ marginLeft: '8px', fontSize: '11px', color: '#D97706', background: 'rgba(217,119,6,0.1)', padding: '2px 8px', borderRadius: '4px' }}>Top</span>}
                  </div>
                  <ScoreBar score={score} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recent runs table */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', fontWeight: 500, color: '#6B5B4E', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Recent Audit History
            </h2>
          </div>
          <div style={{ background: '#FFFFFF', border: '1px solid #E8E3DC', borderRadius: '8px', overflow: 'hidden' }}>
            {recentRuns.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: '14px', color: '#6B5B4E', marginBottom: '16px' }}>No completed audits yet.</p>
                <Link href="/audit-forms" style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', fontWeight: 500, color: '#D97706', textDecoration: 'none' }}>
                  Start your first audit →
                </Link>
              </div>
            ) : (
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E8E3DC' }}>
                      {['Date', 'Form', 'Location', 'Score', ''].map((h, i) => (
                        <th
                          key={i}
                          style={{ fontFamily: 'var(--font-dmsans)', fontSize: '11px', fontWeight: 500, color: '#6B5B4E', letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'left', padding: '12px 16px' }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentRuns.map((run, idx) => {
                      const score = run.score ?? 0
                      const scoreColor = score >= 90 ? '#059669' : score >= 70 ? '#D97706' : '#EF4444'
                      return (
                        <tr key={run.id} style={{ borderBottom: idx < recentRuns.length - 1 ? '1px solid #F0EBE3' : 'none' }}>
                          <td style={{ padding: '14px 16px', fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#6B5B4E' }}>
                            {new Date(run.audit_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </td>
                          <td style={{ padding: '14px 16px', fontFamily: 'var(--font-dmsans)', fontSize: '13px', fontWeight: 500, color: '#1C1917' }}>
                            {run.audit_forms?.name ?? '—'}
                          </td>
                          <td style={{ padding: '14px 16px', fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#6B5B4E' }}>
                            {run.location_name}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ fontFamily: 'var(--font-playfair), "Playfair Display", serif', fontSize: '16px', fontWeight: 700, color: scoreColor }}>
                              {score}%
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <a
                              href={`/api/audit-pdf?runId=${run.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ fontFamily: 'var(--font-dmsans)', fontSize: '12px', fontWeight: 500, color: '#D97706', textDecoration: 'none' }}
                            >
                              PDF
                            </a>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Empty state for no data */}
        {!loading && trends.length === 0 && selectedFormId && (
          <div style={{ background: '#FEF9F0', border: '1px solid rgba(217,119,6,0.2)', borderRadius: '8px', padding: '24px', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: '14px', color: '#6B5B4E', marginBottom: '16px' }}>
              No completed audits for this form in the selected period.
            </p>
            <Link
              href="/audit-forms"
              style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', fontWeight: 500, color: '#1C1917', background: '#D97706', borderRadius: '4px', padding: '10px 20px', textDecoration: 'none' }}
            >
              Start an audit
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
