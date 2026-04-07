'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

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
