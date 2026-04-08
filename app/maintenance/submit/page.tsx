'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  getCategories,
  createTicket,
  uploadTicketPhoto,
  type RMCategory,
  type TicketUrgency,
} from '@/lib/maintenance'

const URGENCY_OPTIONS: { value: TicketUrgency; label: string; desc: string; color: string }[] = [
  { value: 'safety', label: 'Safety', desc: 'Immediate risk to staff or guests', color: '#DC2626' },
  { value: 'urgent', label: 'Urgent', desc: 'Affects operations today', color: '#EA580C' },
  { value: 'routine', label: 'Routine', desc: 'Schedule when convenient', color: '#78716C' },
]

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

export default function SubmitTicketPage() {
  const [categories, setCategories] = useState<RMCategory[]>([])
  const [form, setForm] = useState({
    title: '',
    description: '',
    urgency: 'routine' as TicketUrgency,
    location_name: 'Main Location',
    category_id: '' as string | null,
    equipment_tag: '',
    photo_url: null as string | null,
  })
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {})
  }, [])

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('Photo must be under 5 MB. Please compress before uploading.')
      e.target.value = ''
      return
    }
    setPhotoFile(file)
    const url = URL.createObjectURL(file)
    setPhotoPreview(url)
  }

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      setError('Please add a title describing the issue.')
      return
    }
    setSaving(true)
    setError('')
    try {
      let photoUrl: string | null = null
      if (photoFile) {
        photoUrl = await uploadTicketPhoto(photoFile)
      }

      await createTicket({
        title: form.title.trim(),
        description: form.description.trim() || null,
        urgency: form.urgency,
        location_name: form.location_name || 'Main Location',
        category_id: form.category_id || null,
        equipment_tag: form.equipment_tag.trim() || null,
        photo_url: photoUrl,
      })

      setSuccess(true)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (success) {
    return (
      <main className="min-h-screen" style={{ background: '#FAFAF9' }}>
        <div style={{ maxWidth: '768px', margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: '48px', marginBottom: '16px' }}>✓</div>
          <h2 style={{ fontFamily: 'var(--font-playfair), "Playfair Display", serif', fontSize: '26px', fontWeight: 700, color: '#1C1917', marginBottom: '12px' }}>
            Ticket Submitted
          </h2>
          <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: '15px', color: '#78716C', marginBottom: '32px' }}>
            Your request has been logged. A manager will review and assign it shortly.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => {
                setSuccess(false)
                setForm({ title: '', description: '', urgency: 'routine', location_name: 'Main Location', category_id: null, equipment_tag: '', photo_url: null })
                setPhotoFile(null)
                setPhotoPreview(null)
              }}
              style={{ fontFamily: 'var(--font-dmsans)', fontSize: '14px', fontWeight: 500, color: '#1C1917', background: '#D97706', borderRadius: '4px', padding: '12px 24px', border: 'none', cursor: 'pointer' }}
            >
              Submit another
            </button>
            <Link
              href="/maintenance"
              style={{ fontFamily: 'var(--font-dmsans)', fontSize: '14px', color: '#6B5B4E', background: 'none', border: '1px solid #E8E3DC', borderRadius: '4px', padding: '12px 24px', textDecoration: 'none' }}
            >
              View queue
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen" style={{ background: '#FAFAF9', color: '#1C1917' }}>
      {/* Header */}
      <div style={{ background: '#1C1917', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: '768px', margin: '0 auto', padding: '24px' }}>
          <div className="flex items-center gap-4">
            <Link
              href="/maintenance"
              style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#A89880', textDecoration: 'none' }}
            >
              ← Queue
            </Link>
            <div>
              <h1
                style={{
                  fontFamily: 'var(--font-playfair), "Playfair Display", serif',
                  fontSize: '26px',
                  fontWeight: 700,
                  color: '#F5F0E8',
                }}
              >
                Submit Ticket
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '768px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E8E3DC', borderRadius: '8px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '6px', padding: '12px 16px', fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#991B1B' }}>
              {error}
            </div>
          )}

          {/* Urgency selector */}
          <div>
            <label style={LABEL_STYLE}>Urgency</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {URGENCY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setForm(p => ({ ...p, urgency: opt.value }))}
                  style={{
                    flex: 1,
                    fontFamily: 'var(--font-dmsans)',
                    fontSize: '13px',
                    fontWeight: form.urgency === opt.value ? 500 : 400,
                    color: form.urgency === opt.value ? '#FFFFFF' : '#6B5B4E',
                    background: form.urgency === opt.value ? opt.color : '#FAFAF9',
                    border: form.urgency === opt.value ? `1px solid ${opt.color}` : '1px solid #E8E3DC',
                    borderRadius: '6px',
                    padding: '12px 10px',
                    cursor: 'pointer',
                    textAlign: 'center' as const,
                  }}
                >
                  <div style={{ fontWeight: 500 }}>{opt.label}</div>
                  <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}>{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label style={LABEL_STYLE}>Issue Title *</label>
            <input
              style={INPUT_STYLE}
              placeholder="e.g. Walk-in cooler not holding temp"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            />
          </div>

          {/* Description */}
          <div>
            <label style={LABEL_STYLE}>Description</label>
            <textarea
              style={{ ...INPUT_STYLE, minHeight: '88px', resize: 'vertical' }}
              placeholder="Describe what's wrong, when it started, what you've tried..."
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            />
          </div>

          {/* Category & Equipment */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={LABEL_STYLE}>Equipment Type</label>
              <select
                style={{ ...INPUT_STYLE, cursor: 'pointer' }}
                value={form.category_id ?? ''}
                onChange={e => setForm(p => ({ ...p, category_id: e.target.value || null }))}
              >
                <option value="">Select category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={LABEL_STYLE}>Equipment Tag (optional)</label>
              <input
                style={INPUT_STYLE}
                placeholder="e.g. Walk-in #2, Fryer A"
                value={form.equipment_tag}
                onChange={e => setForm(p => ({ ...p, equipment_tag: e.target.value }))}
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label style={LABEL_STYLE}>Location</label>
            <input
              style={INPUT_STYLE}
              placeholder="Main Location"
              value={form.location_name}
              onChange={e => setForm(p => ({ ...p, location_name: e.target.value }))}
            />
          </div>

          {/* Photo */}
          <div>
            <label style={LABEL_STYLE}>Photo Proof (optional)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoChange}
              style={{ display: 'none' }}
            />
            {photoPreview ? (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img
                  src={photoPreview}
                  alt="Preview"
                  style={{ width: '160px', height: '120px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #E8E3DC' }}
                />
                <button
                  onClick={() => { setPhotoFile(null); setPhotoPreview(null) }}
                  style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    background: '#EF4444',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  fontFamily: 'var(--font-dmsans)',
                  fontSize: '13px',
                  color: '#6B5B4E',
                  background: '#FAFAF9',
                  border: '1px dashed #D1C9C0',
                  borderRadius: '6px',
                  padding: '20px 24px',
                  cursor: 'pointer',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: '18px' }}>📷</span>
                Tap to take or upload a photo
              </button>
            )}
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={saving || !form.title.trim()}
            style={{
              fontFamily: 'var(--font-dmsans)',
              fontSize: '15px',
              fontWeight: 500,
              color: '#1C1917',
              background: saving || !form.title.trim() ? '#B45309' : '#D97706',
              borderRadius: '4px',
              padding: '14px 24px',
              border: 'none',
              cursor: saving || !form.title.trim() ? 'not-allowed' : 'pointer',
              width: '100%',
              opacity: saving || !form.title.trim() ? 0.7 : 1,
            }}
          >
            {saving ? 'Submitting...' : 'Submit Ticket'}
          </button>
        </div>
      </div>
    </main>
  )
}
