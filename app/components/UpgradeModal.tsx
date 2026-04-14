'use client'

import { useState, useEffect, useCallback } from 'react'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
}

const PRO_FEATURES = [
  { icon: '📋', label: 'LP Audit Forms', desc: 'Daily loss prevention checklists' },
  { icon: '🔧', label: 'R&M Requests', desc: 'Track equipment repairs & vendors' },
  { icon: '📊', label: 'Audit Trends', desc: 'Score history and exception tracking' },
  { icon: '📸', label: 'Unlimited Photos', desc: 'Attach photos to any checklist item' },
  { icon: '🏢', label: 'Multi-location', desc: 'Manage up to 3 locations' },
]

export default function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Close on Escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  const handleUpgrade = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/create-checkout-session', { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Failed to start checkout')
      }
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'relative',
          background: '#1C1917',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px',
          padding: '32px',
          width: '100%',
          maxWidth: '440px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            color: '#A8A29E',
            fontSize: '20px',
            cursor: 'pointer',
            lineHeight: 1,
            padding: '4px',
          }}
        >
          ✕
        </button>

        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <p style={{
            fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
            fontSize: '12px',
            fontWeight: 500,
            color: '#D97706',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}>
            Pro Plan
          </p>
          <h2 style={{
            fontFamily: 'var(--font-playfair), "Playfair Display", serif',
            fontSize: '26px',
            fontWeight: 700,
            color: '#F5F0E8',
            marginBottom: '8px',
          }}>
            Unlock the full toolkit
          </h2>
          <p style={{
            fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
            fontSize: '14px',
            color: '#A8A29E',
            lineHeight: 1.5,
          }}>
            Everything you need to run a tighter operation — checklists, audits, maintenance, and more.
          </p>
        </div>

        {/* Features */}
        <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {PRO_FEATURES.map((f) => (
            <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '20px', flexShrink: 0, width: '28px', textAlign: 'center' }}>{f.icon}</span>
              <div>
                <div style={{
                  fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#F5F0E8',
                }}>
                  {f.label}
                </div>
                <div style={{
                  fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                  fontSize: '12px',
                  color: '#78716C',
                }}>
                  {f.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginBottom: '24px' }} />

        {/* Pricing + CTA */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <span style={{
              fontFamily: 'var(--font-playfair), "Playfair Display", serif',
              fontSize: '28px',
              fontWeight: 700,
              color: '#F5F0E8',
            }}>$99</span>
            <span style={{
              fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
              fontSize: '14px',
              color: '#78716C',
              marginLeft: '4px',
            }}>/month</span>
          </div>
          <span style={{
            fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
            fontSize: '12px',
            color: '#D97706',
            background: 'rgba(217,119,6,0.12)',
            border: '1px solid rgba(217,119,6,0.3)',
            borderRadius: '4px',
            padding: '4px 10px',
          }}>
            14-day free trial
          </span>
        </div>

        <button
          onClick={handleUpgrade}
          disabled={loading}
          style={{
            width: '100%',
            fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
            fontSize: '15px',
            fontWeight: 600,
            color: '#1C1917',
            background: loading ? '#A8A29E' : '#D97706',
            border: 'none',
            borderRadius: '6px',
            padding: '14px',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'opacity 0.15s',
          }}
        >
          {loading ? 'Starting checkout…' : 'Start Free Trial →'}
        </button>

        {error && (
          <p style={{
            fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
            fontSize: '13px',
            color: '#EF4444',
            marginTop: '12px',
            textAlign: 'center',
          }}>
            {error}
          </p>
        )}

        <p style={{
          fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
          fontSize: '12px',
          color: '#6B5B4E',
          textAlign: 'center',
          marginTop: '12px',
        }}>
          Cancel anytime. No commitment.
        </p>
      </div>
    </div>
  )
}
