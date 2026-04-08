'use client'

import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { isFlagEnabled } from './feature-flags'

/**
 * Hook: resolves the phase3 feature flag for the authenticated org.
 * Returns { enabled: boolean | null, loading: boolean }.
 * null means still loading; false means not enabled; true means enabled.
 */
export function usePhase3Flag(): { enabled: boolean | null; loading: boolean } {
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function check() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          if (!cancelled) { setEnabled(false); setLoading(false) }
          return
        }

        // Org id is stored in user metadata (set at sign-up / org creation)
        const orgId: string | undefined =
          user.user_metadata?.org_id ?? user.app_metadata?.org_id

        if (!orgId) {
          // No org yet — allow access (new account onboarding path)
          if (!cancelled) { setEnabled(true); setLoading(false) }
          return
        }

        const result = await isFlagEnabled('phase3', orgId)
        if (!cancelled) { setEnabled(result); setLoading(false) }
      } catch {
        // Fail open: if flag check errors, allow access so users aren't locked out
        if (!cancelled) { setEnabled(true); setLoading(false) }
      }
    }

    check()
    return () => { cancelled = true }
  }, [])

  return { enabled, loading }
}
