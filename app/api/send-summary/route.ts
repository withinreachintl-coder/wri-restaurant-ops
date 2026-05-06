import { NextResponse } from 'next/server'
import { resend } from '@/lib/resend'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// User-triggered: fires from the in-app shift-summary action.
// Service-role is used ONLY for cross-tenant Phase-3 count aggregations
// where the user's anon-client RLS view is correct but a single trusted
// read keeps the email handler simple. orgId is derived from the
// authenticated session — body-supplied orgId/ownerEmail are ignored
// (per AUDIT-ops.md RLS finding #2: the previous shape allowed arbitrary
// branded emails to arbitrary recipients with arbitrary org metadata).

// Server-side Supabase (service role) for reading org data in API route
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key)
}

type SummaryPayload = {
  checklistType: string
  completedTasks: number
  totalTasks: number
  completedBy: string
}

export async function POST(request: Request) {
  try {
    // ── 1. Require authenticated session ────────────────────────────────
    const cookieStore = await cookies()
    const authedClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Silently fail in static context
            }
          },
        },
      }
    )

    const { data: { user }, error: authError } = await authedClient.auth.getUser()
    if (authError || !user) {
      console.warn('[send-summary] unauthenticated request rejected')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ── 2. Derive orgId from session (NOT request body) ─────────────────
    const { data: callerRow } = await authedClient
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    const orgId = callerRow?.org_id
    if (!orgId) {
      console.warn('[send-summary] caller has no org_id', { userId: user.id })
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body: SummaryPayload = await request.json()
    const { checklistType, completedTasks, totalTasks, completedBy } = body

    if (!checklistType || typeof completedTasks !== 'number' || typeof totalTasks !== 'number') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // ── 3. Authoritative org lookup (name + owner_email come from DB) ───
    const supabase = getServiceClient()
    const { data: orgRow, error: orgErr } = await supabase
      .from('organizations')
      .select('name, owner_email')
      .eq('id', orgId)
      .single()

    if (orgErr || !orgRow?.owner_email || !orgRow?.name) {
      console.error('[send-summary] org lookup failed', { orgId, err: orgErr })
      return NextResponse.json({ error: 'Org not found' }, { status: 404 })
    }

    const restaurantName = orgRow.name
    const ownerEmail = orgRow.owner_email

    const completionRate = Math.round((completedTasks / totalTasks) * 100)

    // Fetch Phase 3 data server-side (fail silently if unavailable)
    let pendingAudits = 0
    let openExceptions = 0
    let openRMTickets = 0
    let staleRMTickets = 0

    try {
      const [auditRes, exceptionsRes, rmOpenRes, rmStaleRes] = await Promise.allSettled([
          supabase
            .from('audit_schedules')
            .select('id', { count: 'exact', head: true })
            .eq('org_id', orgId)
            .eq('is_active', true),
          supabase
            .from('audit_exceptions')
            .select('id', { count: 'exact', head: true })
            .eq('org_id', orgId)
            .eq('is_exception', true)
            .eq('is_resolved', false),
          supabase
            .from('r_m_tickets')
            .select('id', { count: 'exact', head: true })
            .eq('org_id', orgId)
            .not('status', 'in', '("completed","cancelled")'),
          supabase
            .from('r_m_tickets')
            .select('id', { count: 'exact', head: true })
            .eq('org_id', orgId)
            .eq('is_stale', true)
            .not('status', 'in', '("completed","cancelled")'),
        ])

      if (auditRes.status === 'fulfilled') pendingAudits = auditRes.value.count ?? 0
      if (exceptionsRes.status === 'fulfilled') openExceptions = exceptionsRes.value.count ?? 0
      if (rmOpenRes.status === 'fulfilled') openRMTickets = rmOpenRes.value.count ?? 0
      if (rmStaleRes.status === 'fulfilled') staleRMTickets = rmStaleRes.value.count ?? 0
    } catch {
      // Non-fatal: email still sends without Phase 3 data
    }

    const emailHtml = generateEmailHTML({
      checklistType,
      completedTasks,
      totalTasks,
      completedBy,
      restaurantName,
      completionRate,
      pendingAudits,
      openExceptions,
      openRMTickets,
      staleRMTickets,
    })

    const { error } = await resend.emails.send({
      from: 'WRI Ops <noreply@wireach.tools>',
      to: ownerEmail,
      subject: `${restaurantName} — ${capitalize(checklistType)} Shift Summary`,
      html: emailHtml,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending summary:', error)
    return NextResponse.json({ error: 'Failed to send summary email' }, { status: 500 })
  }
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

type EmailData = {
  checklistType: string
  completedTasks: number
  totalTasks: number
  completedBy: string
  restaurantName: string
  completionRate: number
  pendingAudits: number
  openExceptions: number
  openRMTickets: number
  staleRMTickets: number
}

function generateEmailHTML(data: EmailData): string {
  const scoreColor =
    data.completionRate === 100 ? '#10b981' : data.completionRate >= 80 ? '#D97706' : '#EF4444'
  const hasPhase3 =
    data.pendingAudits > 0 ||
    data.openExceptions > 0 ||
    data.openRMTickets > 0 ||
    data.staleRMTickets > 0
  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const alertBanner =
    data.staleRMTickets > 0 || data.openExceptions > 0
      ? `
    <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
      <div style="font-size:14px;font-weight:600;color:#DC2626;margin-bottom:6px;">⚠ Action Required</div>
      <ul style="margin:0;padding:0 0 0 16px;font-size:13px;color:#7F1D1D;line-height:1.8;">
        ${data.openExceptions > 0 ? `<li>${data.openExceptions} unresolved LP audit exception${data.openExceptions !== 1 ? 's' : ''} — <a href="https://ops.wireach.tools/audit-exceptions" style="color:#DC2626;">review now</a></li>` : ''}
        ${data.staleRMTickets > 0 ? `<li>${data.staleRMTickets} R&amp;M ticket${data.staleRMTickets !== 1 ? 's' : ''} open &gt;14 days — <a href="https://ops.wireach.tools/maintenance?stale=1" style="color:#DC2626;">view stale tickets</a></li>` : ''}
      </ul>
    </div>`
      : ''

  const phase3Section = hasPhase3
    ? `
    <div style="margin-top:24px;border-top:1px solid #E8E3DC;padding-top:24px;">
      <div style="font-size:11px;font-weight:600;color:#6B5B4E;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:14px;">Operations Overview</div>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          ${data.openExceptions > 0 ? `
          <td width="25%" style="padding-right:8px;vertical-align:top;">
            <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:14px;text-align:center;">
              <div style="font-size:22px;font-weight:700;color:#EF4444;">${data.openExceptions}</div>
              <div style="font-size:11px;color:#7F1D1D;margin-top:4px;">LP Exceptions</div>
            </div>
          </td>` : ''}
          ${data.openRMTickets > 0 ? `
          <td width="25%" style="padding-right:8px;vertical-align:top;">
            <div style="background:#FAFAF9;border:1px solid #E8E3DC;border-radius:8px;padding:14px;text-align:center;">
              <div style="font-size:22px;font-weight:700;color:#D97706;">${data.openRMTickets}</div>
              <div style="font-size:11px;color:#6B5B4E;margin-top:4px;">Open R&amp;M</div>
            </div>
          </td>` : ''}
          ${data.staleRMTickets > 0 ? `
          <td width="25%" style="padding-right:8px;vertical-align:top;">
            <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:14px;text-align:center;">
              <div style="font-size:22px;font-weight:700;color:#DC2626;">${data.staleRMTickets}</div>
              <div style="font-size:11px;color:#7F1D1D;margin-top:4px;">Stale (&gt;14d)</div>
            </div>
          </td>` : ''}
          ${data.pendingAudits > 0 ? `
          <td width="25%" style="vertical-align:top;">
            <div style="background:#FAFAF9;border:1px solid #E8E3DC;border-radius:8px;padding:14px;text-align:center;">
              <div style="font-size:22px;font-weight:700;color:#D97706;">${data.pendingAudits}</div>
              <div style="font-size:11px;color:#6B5B4E;margin-top:4px;">LP Schedules</div>
            </div>
          </td>` : ''}
        </tr>
      </table>
      <div style="margin-top:14px;">
        <a href="https://ops.wireach.tools/audit-forms" style="font-size:13px;font-weight:500;color:#D97706;text-decoration:none;margin-right:20px;">LP Audits →</a>
        <a href="https://ops.wireach.tools/maintenance" style="font-size:13px;font-weight:500;color:#D97706;text-decoration:none;">R&amp;M Tickets →</a>
      </div>
    </div>`
    : ''

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Shift Summary — ${data.restaurantName}</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#F5F0E8;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">

    <!-- Header -->
    <div style="background:#1C1917;border-radius:12px 12px 0 0;padding:24px 28px;">
      <div style="font-size:20px;font-weight:700;color:#F5F0E8;margin-bottom:2px;">${data.restaurantName}</div>
      <div style="font-size:13px;color:#A89880;">${capitalize(data.checklistType)} Shift Summary · ${dateStr}</div>
    </div>

    <!-- Body -->
    <div style="background:#FFFFFF;border-radius:0 0 12px 12px;padding:28px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">

      ${alertBanner}

      <!-- Score -->
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:52px;font-weight:700;color:${scoreColor};line-height:1;">${data.completionRate}%</div>
        <div style="font-size:14px;color:#78716C;margin-top:6px;">${data.completedTasks} of ${data.totalTasks} tasks completed</div>
        <div style="font-size:13px;color:#A89880;margin-top:4px;">Completed by <strong style="color:#1C1917;">${data.completedBy}</strong></div>
      </div>

      <!-- Progress bar -->
      <div style="height:6px;background:#E8E3DC;border-radius:3px;overflow:hidden;margin-bottom:24px;">
        <div style="height:100%;width:${data.completionRate}%;background:${scoreColor};border-radius:3px;"></div>
      </div>

      ${phase3Section}

      <!-- CTA -->
      <div style="margin-top:28px;text-align:center;">
        <a href="https://ops.wireach.tools/dashboard"
           style="display:inline-block;background:#D97706;color:#1C1917;font-weight:600;font-size:14px;padding:12px 28px;border-radius:6px;text-decoration:none;">
          View Full Dashboard →
        </a>
      </div>

    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:20px;">
      <p style="font-size:12px;color:#A89880;margin:0;">
        WRI Restaurant Operations · <a href="https://ops.wireach.tools" style="color:#A89880;text-decoration:none;">ops.wireach.tools</a>
      </p>
    </div>

  </div>
</body>
</html>`
}
