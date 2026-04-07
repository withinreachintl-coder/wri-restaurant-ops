import { NextRequest, NextResponse } from 'next/server'

// ---------------------------------------------------------------------------
// Simple edge-compatible rate limiter (in-memory, per-edge-worker instance)
// For production scale: replace with @upstash/ratelimit + Upstash Redis.
// ---------------------------------------------------------------------------

type RateEntry = { count: number; resetAt: number }

// Store up to 1000 unique IPs; oldest entries evicted when full.
const STORE = new Map<string, RateEntry>()
const MAX_STORE_SIZE = 1000
const WINDOW_MS = 60_000 // 1-minute sliding window

// Per-route limits: requests per minute
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
    // Evict oldest if at capacity
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
// Allowed file extensions for uploads
// ---------------------------------------------------------------------------
const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
])

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Only apply to API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Derive client IP (Vercel sets x-forwarded-for)
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'

  // Route-specific or default limit
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

  // Security headers on all responses
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  return res
}

export const config = {
  matcher: '/api/:path*',
}
