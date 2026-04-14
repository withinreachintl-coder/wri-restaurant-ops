import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

// ---------------------------------------------------------------------------
// Simple edge-compatible rate limiter (in-memory, per-edge-worker instance)
// ---------------------------------------------------------------------------
type RateEntry = { count: number; resetAt: number }
const STORE = new Map<string, RateEntry>()
const MAX_STORE_SIZE = 1000
const WINDOW_MS = 60_000

const LIMITS: Record<string, number> = {
  '/api/send-summary': 10,
  '/api/create-checkout-session': 20,
  '/api/audit-pdf': 30,
  '/api/maintenance-notifications': 20,
}
const DEFAULT_LIMIT = 60

function rateLimit(ip: string, limit: number): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const entry = STORE.get(ip)

  if (!entry || now >= entry.resetAt) {
    if (!entry && STORE.size >= MAX_STORE_SIZE) {
      const oldest = STORE.keys().next().value
      if (oldest) STORE.delete(oldest)
    }
    STORE.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true, remaining: limit - 1 }
  }

  entry.count++
  const allowed = entry.count <= limit
  return { allowed, remaining: Math.max(0, limit - entry.count) }
}

// ---------------------------------------------------------------------------
// Public routes — no auth required
// ---------------------------------------------------------------------------
const PUBLIC_PATHS = new Set(['/', '/auth/login', '/auth/callback', '/auth/error'])

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true
  if (pathname.startsWith('/api/')) return true
  if (pathname.startsWith('/_next/')) return true
  if (pathname.startsWith('/icon-')) return true
  if (pathname === '/manifest.json') return true
  if (pathname === '/sw.js') return true
  if (pathname.startsWith('/workbox-')) return true
  return false
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ── Auth guard for protected page routes ────────────────────────────────
  if (!isPublicPath(pathname)) {
    const res = NextResponse.next()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return req.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              res.cookies.set(name, value, options))
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }

    return res
  }

  // ── API rate limiting (API routes only) ──────────────────────────────────
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'

  let limit = DEFAULT_LIMIT
  for (const [route, routeLimit] of Object.entries(LIMITS)) {
    if (pathname.startsWith(route)) {
      limit = routeLimit
      break
    }
  }

  const { allowed, remaining } = rateLimit(`${ip}:${pathname}`, limit)

  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait before trying again.' },
      {
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': '0',
        },
      }
    )
  }

  const res = NextResponse.next()
  res.headers.set('X-RateLimit-Limit', String(limit))
  res.headers.set('X-RateLimit-Remaining', String(remaining))
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  return res
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico|icon-|manifest.json|sw.js|workbox-).*)',
  ],
}
