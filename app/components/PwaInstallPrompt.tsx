'use client'

import { useEffect, useState } from 'react'

type Platform = 'android' | 'ios' | 'other'

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'other'
  const ua = navigator.userAgent
  if (/android/i.test(ua)) return 'android'
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios'
  return 'other'
}

function isInStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigator as any).standalone === true
  )
}

export default function PwaInstallPrompt() {
  const [show, setShow] = useState(false)
  const [platform, setPlatform] = useState<Platform>('other')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    // Don't show if already installed or dismissed
    if (isInStandaloneMode()) return
    if (localStorage.getItem('pwa_install_dismissed')) return

    const detected = detectPlatform()
    setPlatform(detected)

    if (detected === 'android') {
      const handler = (e: Event) => {
        e.preventDefault()
        setDeferredPrompt(e)
        setShow(true)
      }
      window.addEventListener('beforeinstallprompt', handler)
      return () => window.removeEventListener('beforeinstallprompt', handler)
    }

    if (detected === 'ios') {
      // Show iOS manual instructions after a short delay
      const t = setTimeout(() => setShow(true), 2000)
      return () => clearTimeout(t)
    }
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        localStorage.setItem('pwa_install_dismissed', '1')
      }
      setDeferredPrompt(null)
    }
    setShow(false)
  }

  const handleDismiss = () => {
    localStorage.setItem('pwa_install_dismissed', '1')
    setShow(false)
  }

  if (!show) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        background: '#1C1917',
        borderTop: '1px solid rgba(217,119,6,0.4)',
        padding: '20px 24px',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.4)',
      }}
    >
      <div style={{ maxWidth: '768px', margin: '0 auto' }}>
        <div
          style={{
            fontFamily: 'var(--font-playfair), "Playfair Display", serif',
            fontSize: '16px',
            fontWeight: 600,
            color: '#F5F0E8',
            marginBottom: '6px',
          }}
        >
          Add to Home Screen
        </div>
        <div
          style={{
            fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
            fontSize: '13px',
            fontWeight: 300,
            color: '#A89880',
            marginBottom: '16px',
            lineHeight: '1.5',
          }}
        >
          {platform === 'ios'
            ? 'Tap the Share button in Safari, then "Add to Home Screen" for offline access.'
            : 'Install the app for offline checklist access — works even without signal.'}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {platform === 'android' && (
            <button
              onClick={handleInstall}
              className="hover:opacity-90 transition-opacity"
              style={{
                flex: 1,
                fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                fontSize: '14px',
                fontWeight: 500,
                color: '#1C1917',
                background: '#D97706',
                border: 'none',
                borderRadius: '4px',
                padding: '12px 20px',
                cursor: 'pointer',
              }}
            >
              Install App
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="hover:opacity-80 transition-opacity"
            style={{
              flex: platform === 'ios' ? 1 : undefined,
              fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
              fontSize: '13px',
              fontWeight: 400,
              color: '#6B5B4E',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '4px',
              padding: '12px 20px',
              cursor: 'pointer',
            }}
          >
            {platform === 'ios' ? 'Got it' : 'Not now'}
          </button>
        </div>
      </div>
    </div>
  )
}
