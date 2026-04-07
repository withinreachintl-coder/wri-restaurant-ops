'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  getAuditRun,
  getAuditFormWithItems,
  submitAuditRun,
  type AuditRun,
  type AuditItem,
  type AuditFormWithItems,
} from '@/lib/audits'
import { supabase } from '@/lib/supabase'

type ResponseState = {
  response_text?: string
  response_numeric?: number | ''
  response_bool?: boolean
  photo_url?: string
  photo_file?: File
}

function isComplete(item: AuditItem, resp: ResponseState): boolean {
  if (!item.is_required) return true
  if (item.field_type === 'checkbox') return resp.response_bool !== undefined
  if (item.field_type === 'numeric') return resp.response_numeric !== '' && resp.response_numeric !== undefined
  if (item.field_type === 'text') return (resp.response_text ?? '').trim().length > 0
  if (item.field_type === 'select') return (resp.response_text ?? '').length > 0
  return false
}

function wouldFlag(item: AuditItem, resp: ResponseState): boolean {
  if (item.field_type === 'numeric' && resp.response_numeric !== '' && resp.response_numeric !== undefined) {
    const v = Number(resp.response_numeric)
    if (item.threshold_min !== null && v < item.threshold_min) return true
    if (item.threshold_max !== null && v > item.threshold_max) return true
  }
  if (item.field_type === 'checkbox' && item.is_required && resp.response_bool === false) return true
  return false
}

export default function AuditRunPage() {
  const params = useParams()
  const runId = params.runId as string

  const [run, setRun] = useState<AuditRun | null>(null)
  const [form, setForm] = useState<AuditFormWithItems | null>(null)
  const [responses, setResponses] = useState<Record<string, ResponseState>>({})
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitResult, setSubmitResult] = useState<{ score: number; exceptionCount: number } | null>(null)
  const [error, setError] = useState('')
  const [currentIdx, setCurrentIdx] = useState(0)

  const load = useCallback(async () => {
    try {
      const runData = await getAuditRun(runId)
      if (!runData) throw new Error('Run not found')
      setRun(runData)

      if (runData.status === 'completed') {
        setSubmitted(true)
      }

      const formData = await getAuditFormWithItems(runData.form_id)
      setForm(formData)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [runId])

  useEffect(() => { load() }, [load])

  const setResponse = (itemId: string, update: Partial<ResponseState>) => {
    setResponses(prev => ({ ...prev, [itemId]: { ...prev[itemId], ...update } }))
  }

  const handlePhotoCapture = async (itemId: string, file: File) => {
    // Optimistic local preview
    setResponse(itemId, { photo_file: file, photo_url: URL.createObjectURL(file) })

    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `audit-photos/${runId}/${itemId}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('audit-photos')
        .upload(path, file, { upsert: true })

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('audit-photos').getPublicUrl(path)
        setResponse(itemId, { photo_url: publicUrl })
      }
    } catch {
      // Keep local preview even if upload fails
    }
  }

  const handleSubmit = async () => {
    if (!form || !run) return
    setSubmitting(true)
    try {
      const responseList = form.audit_items.map((item) => ({
        item,
        response_text: responses[item.id]?.response_text,
        response_numeric: responses[item.id]?.response_numeric !== '' ? Number(responses[item.id]?.response_numeric) : undefined,
        response_bool: responses[item.id]?.response_bool,
        photo_url: responses[item.id]?.photo_url,
      }))

      const result = await submitAuditRun(runId, responseList, notes)
      setSubmitResult(result)
      setSubmitted(true)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const items = form?.audit_items ?? []
  const completedCount = items.filter(item => isComplete(item, responses[item.id] ?? {})).length
  const requiredCount = items.filter(i => i.is_required).length
  const allRequiredDone = items.every(item => isComplete(item, responses[item.id] ?? {}))
  const progress = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0

  if (loading) {
    return (
      <main style={{ background: '#FAFAF9', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: '14px', color: '#6B5B4E' }}>Loading audit...</p>
      </main>
    )
  }

  if (error) {
    return (
      <main style={{ background: '#FAFAF9', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: '14px', color: '#991B1B', marginBottom: '16px' }}>{error}</p>
          <Link href="/audit-forms" style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#D97706' }}>← Back to Audit Forms</Link>
        </div>
      </main>
    )
  }

  // Submission success screen
  if (submitted && submitResult) {
    return (
      <main style={{ background: '#FAFAF9', minHeight: '100vh' }}>
        <div style={{ background: '#1C1917', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ maxWidth: '768px', margin: '0 auto', padding: '24px' }}>
            <h1 style={{ fontFamily: 'var(--font-playfair), "Playfair Display", serif', fontSize: '26px', fontWeight: 700, color: '#F5F0E8' }}>
              Audit Submitted
            </h1>
          </div>
        </div>
        <div style={{ maxWidth: '768px', margin: '0 auto', padding: '48px 24px', textAlign: 'center' }}>
          <div style={{
            width: '120px', height: '120px', borderRadius: '50%',
            background: submitResult.score >= 80 ? 'rgba(217,119,6,0.12)' : 'rgba(220,38,38,0.08)',
            border: `3px solid ${submitResult.score >= 80 ? '#D97706' : '#EF4444'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <span style={{
              fontFamily: 'var(--font-playfair), "Playfair Display", serif',
              fontSize: '36px', fontWeight: 700,
              color: submitResult.score >= 80 ? '#D97706' : '#EF4444',
            }}>
              {submitResult.score}%
            </span>
          </div>

          <h2 style={{ fontFamily: 'var(--font-playfair), "Playfair Display", serif', fontSize: '24px', fontWeight: 600, color: '#1C1917', marginBottom: '8px' }}>
            {submitResult.score >= 90 ? 'Excellent' : submitResult.score >= 70 ? 'Needs Attention' : 'Action Required'}
          </h2>
          <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: '14px', color: '#6B5B4E', marginBottom: '40px' }}>
            {submitResult.exceptionCount === 0
              ? 'No exceptions flagged. All items within acceptable range.'
              : `${submitResult.exceptionCount} exception${submitResult.exceptionCount > 1 ? 's' : ''} flagged for owner review.`}
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {submitResult.exceptionCount > 0 && (
              <Link
                href="/audit-exceptions"
                style={{
                  fontFamily: 'var(--font-dmsans)', fontSize: '14px', fontWeight: 500,
                  color: '#1C1917', background: '#D97706',
                  borderRadius: '4px', padding: '12px 24px', textDecoration: 'none',
                }}
              >
                Review Exceptions
              </Link>
            )}
            <Link
              href="/audit-forms"
              style={{
                fontFamily: 'var(--font-dmsans)', fontSize: '14px', fontWeight: 500,
                color: '#6B5B4E', background: '#FFFFFF',
                border: '1px solid #E8E3DC', borderRadius: '4px', padding: '12px 24px', textDecoration: 'none',
              }}
            >
              Back to Forms
            </Link>
            <Link
              href="/audit-trends"
              style={{
                fontFamily: 'var(--font-dmsans)', fontSize: '14px', fontWeight: 500,
                color: '#D97706', background: 'none',
                border: '1px solid rgba(217,119,6,0.4)', borderRadius: '4px', padding: '12px 24px', textDecoration: 'none',
              }}
            >
              View Trends
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const currentItem = items[currentIdx]
  const currentResp = currentItem ? (responses[currentItem.id] ?? {}) : {}

  return (
    <main style={{ background: '#FAFAF9', minHeight: '100vh' }}>
      {/* Header with progress */}
      <div style={{ background: '#1C1917', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: '768px', margin: '0 auto', padding: '24px' }}>
          <Link href="/audit-forms" style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#A89880', textDecoration: 'none', display: 'block', marginBottom: '6px' }}>
            ← Cancel Audit
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 style={{ fontFamily: 'var(--font-playfair), "Playfair Display", serif', fontSize: '24px', fontWeight: 700, color: '#F5F0E8', marginBottom: '4px' }}>
                {form?.name}
              </h1>
              <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', fontWeight: 300, color: '#A89880' }}>
                {run?.location_name} · {new Date(run?.audit_date ?? '').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-playfair), "Playfair Display", serif', fontSize: '28px', fontWeight: 700, color: '#D97706' }}>
                {progress}%
              </div>
              <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: '12px', color: '#A89880' }}>
                {completedCount}/{items.length}
              </div>
            </div>
          </div>
          <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '16px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: '#D97706', borderRadius: '2px', transition: 'width 0.3s' }} />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '768px', margin: '0 auto', padding: '24px' }}>
        {/* Question nav pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '24px' }}>
          {items.map((item, idx) => {
            const resp = responses[item.id] ?? {}
            const done = isComplete(item, resp)
            const flagged = wouldFlag(item, resp)
            return (
              <button
                key={item.id}
                onClick={() => setCurrentIdx(idx)}
                style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  border: idx === currentIdx ? '2px solid #D97706' : '1px solid #E8E3DC',
                  background: flagged ? '#FEF2F2' : done ? 'rgba(217,119,6,0.15)' : '#FFFFFF',
                  color: flagged ? '#EF4444' : idx === currentIdx ? '#D97706' : done ? '#D97706' : '#6B5B4E',
                  fontFamily: 'var(--font-dmsans)', fontSize: '12px', fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                {idx + 1}
              </button>
            )
          })}
        </div>

        {/* Current question card */}
        {currentItem && (
          <div style={{ background: '#FFFFFF', border: '1px solid #E8E3DC', borderRadius: '12px', padding: '28px', marginBottom: '16px' }}>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: '11px', fontWeight: 500, color: '#6B5B4E', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>
                Question {currentIdx + 1} of {items.length}
                {!currentItem.is_required && <span style={{ marginLeft: '8px', color: '#A89880' }}>· Optional</span>}
              </div>
              <h2 style={{ fontFamily: 'var(--font-playfair), "Playfair Display", serif', fontSize: '20px', fontWeight: 600, color: '#1C1917', lineHeight: 1.4 }}>
                {currentItem.label}
              </h2>
              {(currentItem.threshold_min !== null || currentItem.threshold_max !== null) && (
                <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#D97706', marginTop: '6px' }}>
                  Acceptable range: {currentItem.threshold_min ?? '—'} to {currentItem.threshold_max ?? '—'}
                </p>
              )}
            </div>

            {/* Answer input by field type */}
            {currentItem.field_type === 'checkbox' && (
              <div style={{ display: 'flex', gap: '12px' }}>
                {[{ label: 'Pass', val: true }, { label: 'Fail', val: false }].map(({ label, val }) => (
                  <button
                    key={String(val)}
                    onClick={() => setResponse(currentItem.id, { response_bool: val })}
                    style={{
                      flex: 1, padding: '18px',
                      border: currentResp.response_bool === val
                        ? `2px solid ${val ? '#D97706' : '#EF4444'}`
                        : '1px solid #E8E3DC',
                      borderRadius: '8px',
                      background: currentResp.response_bool === val
                        ? val ? 'rgba(217,119,6,0.08)' : 'rgba(239,68,68,0.06)'
                        : '#FAFAF9',
                      fontFamily: 'var(--font-dmsans)', fontSize: '16px', fontWeight: 600,
                      color: currentResp.response_bool === val
                        ? val ? '#D97706' : '#EF4444'
                        : '#6B5B4E',
                      cursor: 'pointer',
                    }}
                  >
                    {val ? '✓' : '✗'} {label}
                  </button>
                ))}
              </div>
            )}

            {currentItem.field_type === 'numeric' && (
              <div>
                <input
                  type="number"
                  style={{
                    fontFamily: 'var(--font-dmsans)', fontSize: '32px', fontWeight: 600,
                    color: wouldFlag(currentItem, currentResp) ? '#EF4444' : '#1C1917',
                    border: '1px solid #E8E3DC', borderRadius: '8px',
                    padding: '16px 20px', width: '100%', textAlign: 'center', outline: 'none',
                  }}
                  placeholder="0"
                  value={currentResp.response_numeric ?? ''}
                  onChange={e => setResponse(currentItem.id, { response_numeric: e.target.value ? Number(e.target.value) : '' })}
                />
                {wouldFlag(currentItem, currentResp) && (
                  <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: '12px', color: '#EF4444', marginTop: '8px', textAlign: 'center' }}>
                    ⚠ Value outside acceptable range — will be flagged
                  </p>
                )}
              </div>
            )}

            {currentItem.field_type === 'text' && (
              <textarea
                style={{
                  fontFamily: 'var(--font-dmsans)', fontSize: '14px', color: '#1C1917',
                  border: '1px solid #E8E3DC', borderRadius: '8px',
                  padding: '14px 16px', width: '100%', minHeight: '100px', resize: 'vertical', outline: 'none',
                }}
                placeholder="Enter your response..."
                value={currentResp.response_text ?? ''}
                onChange={e => setResponse(currentItem.id, { response_text: e.target.value })}
              />
            )}

            {currentItem.field_type === 'select' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(currentItem.select_options ?? []).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setResponse(currentItem.id, { response_text: opt })}
                    style={{
                      padding: '14px 20px', textAlign: 'left',
                      border: currentResp.response_text === opt ? '2px solid #D97706' : '1px solid #E8E3DC',
                      borderRadius: '8px',
                      background: currentResp.response_text === opt ? 'rgba(217,119,6,0.06)' : '#FAFAF9',
                      fontFamily: 'var(--font-dmsans)', fontSize: '15px',
                      color: currentResp.response_text === opt ? '#D97706' : '#1C1917',
                      cursor: 'pointer',
                    }}
                  >
                    {currentResp.response_text === opt ? '● ' : '○ '}{opt}
                  </button>
                ))}
              </div>
            )}

            {/* Photo capture */}
            {currentItem.photo_required && (
              <div style={{ marginTop: '20px' }}>
                <label style={{ fontFamily: 'var(--font-dmsans)', fontSize: '12px', fontWeight: 500, color: '#6B5B4E', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                  📷 Photo Proof {currentItem.photo_required ? '(Required)' : '(Optional)'}
                </label>
                {currentResp.photo_url ? (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentResp.photo_url}
                      alt="Audit photo"
                      style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: '6px', border: '1px solid #E8E3DC', objectFit: 'cover' }}
                    />
                    <button
                      onClick={() => setResponse(currentItem.id, { photo_url: undefined, photo_file: undefined })}
                      style={{ position: 'absolute', top: '-8px', right: '-8px', width: '24px', height: '24px', borderRadius: '50%', background: '#EF4444', color: '#FFFFFF', border: 'none', cursor: 'pointer', fontSize: '12px' }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label style={{
                    display: 'inline-block', padding: '10px 20px',
                    border: '1px dashed #D97706', borderRadius: '6px',
                    fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#D97706',
                    cursor: 'pointer',
                  }}>
                    + Attach Photo
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      style={{ display: 'none' }}
                      onChange={e => {
                        const f = e.target.files?.[0]
                        if (f) handlePhotoCapture(currentItem.id, f)
                      }}
                    />
                  </label>
                )}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <button
            onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
            disabled={currentIdx === 0}
            style={{
              fontFamily: 'var(--font-dmsans)', fontSize: '14px', fontWeight: 500,
              color: '#6B5B4E', background: '#FFFFFF', border: '1px solid #E8E3DC',
              borderRadius: '6px', padding: '12px 20px', cursor: currentIdx === 0 ? 'not-allowed' : 'pointer',
              opacity: currentIdx === 0 ? 0.4 : 1,
            }}
          >
            ← Previous
          </button>
          {currentIdx < items.length - 1 ? (
            <button
              onClick={() => setCurrentIdx(i => Math.min(items.length - 1, i + 1))}
              style={{
                fontFamily: 'var(--font-dmsans)', fontSize: '14px', fontWeight: 500,
                color: '#1C1917', background: '#D97706', border: 'none',
                borderRadius: '6px', padding: '12px 24px', cursor: 'pointer',
              }}
            >
              Next →
            </button>
          ) : (
            <button
              onClick={() => setCurrentIdx(0)}
              style={{
                fontFamily: 'var(--font-dmsans)', fontSize: '13px', fontWeight: 400,
                color: '#D97706', background: 'none', border: 'none', cursor: 'pointer',
              }}
            >
              Review from start
            </button>
          )}
        </div>

        {/* Notes + Submit */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E8E3DC', borderRadius: '12px', padding: '24px' }}>
          <label style={{ fontFamily: 'var(--font-dmsans)', fontSize: '11px', fontWeight: 500, color: '#6B5B4E', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
            Audit Notes (Optional)
          </label>
          <textarea
            style={{
              fontFamily: 'var(--font-dmsans)', fontSize: '14px', color: '#1C1917',
              border: '1px solid #E8E3DC', borderRadius: '6px',
              padding: '12px 14px', width: '100%', minHeight: '80px', resize: 'vertical', outline: 'none', marginBottom: '16px',
            }}
            placeholder="Add any general notes about this audit..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />

          {!allRequiredDone && (
            <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#B45309', marginBottom: '12px' }}>
              {requiredCount - completedCount} required question{requiredCount - completedCount !== 1 ? 's' : ''} still need{requiredCount - completedCount === 1 ? 's' : ''} an answer.
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={!allRequiredDone || submitting}
            style={{
              fontFamily: 'var(--font-dmsans)', fontSize: '15px', fontWeight: 600,
              color: '#1C1917',
              background: allRequiredDone && !submitting ? '#D97706' : '#E8E3DC',
              border: 'none', borderRadius: '8px',
              padding: '16px', width: '100%', cursor: allRequiredDone && !submitting ? 'pointer' : 'not-allowed',
            }}
          >
            {submitting ? 'Submitting Audit...' : 'Submit Audit'}
          </button>
        </div>
      </div>
    </main>
  )
}
