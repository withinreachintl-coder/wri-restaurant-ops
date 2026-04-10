'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

type NavItem = {
  href: string
  label: string
  icon: string
  activePattern?: RegExp
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: '⊞', activePattern: /^\/dashboard/ },
  { href: '/checklist', label: 'Checklist', icon: '✓', activePattern: /^\/checklist/ },
  { href: '/audit-forms', label: 'LP Audit', icon: '⚑', activePattern: /^\/audit/ },
  { href: '/maintenance', label: 'R&M', icon: '⚙', activePattern: /^\/maintenance/ },
]

export default function BottomNav() {
  const pathname = usePathname()
  const [isProTier, setIsProTier] = useState(false)

  useEffect(() => {
    const fetchSubscriptionTier = async () => {
      try {
        const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
        
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) return
        
        const { data: userRecord } = await supabase
          .from('users')
          .select('org_id')
          .eq('id', userData.user.id)
          .single()
        
        if (!userRecord?.org_id) return
        
        const { data: org } = await supabase
          .from('organizations')
          .select('subscription_status, subscription_tier')
          .eq('id', userRecord.org_id)
          .single()
        
        const isPro = org?.subscription_status === 'active' && org?.subscription_tier === 'pro'
        setIsProTier(isPro)
      } catch (err) {
        console.error('Failed to fetch subscription tier:', err)
      }
    }

    fetchSubscriptionTier()
  }, [])

  // Don't render on auth/welcome/billing pages
  if (/^\/(auth|welcome|billing)/.test(pathname)) return null

  return (
    <nav
      aria-label="Main navigation"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: '#1C1917',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
      className="md:hidden"
    >
      {NAV_ITEMS.map((item) => {
        const isActive = item.activePattern
          ? item.activePattern.test(pathname)
          : pathname === item.href

        // Check if this item should be disabled (Pro tier only)
        const isProOnly = item.label === 'LP Audit' || item.label === 'R&M'
        const isDisabled = isProOnly && !isProTier

        if (isDisabled) {
          return (
            <div
              key={item.href}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px 4px 12px',
                gap: '4px',
                color: '#78716C',
                minHeight: '60px',
                minWidth: '44px',
                opacity: 0.4,
                cursor: 'not-allowed',
                pointerEvents: 'none',
              }}
            >
              <span style={{ fontSize: '20px', lineHeight: 1 }}>{item.icon}</span>
              <span
                style={{
                  fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                  fontSize: '10px',
                  fontWeight: 400,
                  letterSpacing: '0.02em',
                }}
              >
                {item.label}
              </span>
            </div>
          )
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px 4px 12px',
              gap: '4px',
              textDecoration: 'none',
              color: isActive ? '#D97706' : '#78716C',
              transition: 'color 0.15s',
              minHeight: '60px',
              // Thumb-zone: generous tap target
              minWidth: '44px',
            }}
            aria-current={isActive ? 'page' : undefined}
          >
            <span style={{ fontSize: '20px', lineHeight: 1 }}>{item.icon}</span>
            <span
              style={{
                fontFamily: 'var(--font-dmsans), "DM Sans", sans-serif',
                fontSize: '10px',
                fontWeight: isActive ? 600 : 400,
                letterSpacing: '0.02em',
              }}
            >
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
