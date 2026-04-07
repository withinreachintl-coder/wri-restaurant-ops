'use client'

import { useEffect, useState } from 'react'
import { registerSyncListeners, startSync } from '@/lib/sync-engine'

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [justSynced, setJustSynced] = useState(false)

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine)

    const handleOnline = async () => {
      setIsOnline(true)
      setSyncing(true)
      await startSync()
      setSyncing(false)
      setJustSynced(true)
      setTimeout(() => setJustSynced(false), 3000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setJustSynced(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Register background sync listeners
    const cleanup = registerSyncListeners()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      cleanup()
    }
  }, [])

  if (isOnline && !syncing && !justSynced) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: isOnline ? (syncing ? '#92400E' : '#065F46') : '#92400E',
        padding: '10px 24px',
        textAlign: 'center',
        fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
        fontSize: '13px',
        fontWeight: 500,
        color: '#FEF9F0',
        transition: 'background 0.3s',
      }}
    >
      {!isOnline && '📵 Offline — your progress is saved locally'}
      {isOnline && syncing && '🔄 Syncing offline progress...'}
      {isOnline && justSynced && !syncing && '✓ All offline work synced'}
    </div>
  )
}
