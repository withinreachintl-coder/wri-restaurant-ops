import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Vercel cron: runs daily at 8 AM UTC
// vercel.json: { "path": "/api/rm-daily-digest", "schedule": "0 8 * * *" }
//
// Service-role is required because this iterates ALL orgs to send each
// owner their own digest — no single user has cross-org visibility.
// The endpoint is gated by CRON_SECRET (Vercel auto-sets the bearer
// header on cron-triggered requests). Pattern copied from
// app/api/audit-schedule-trigger/route.ts.
//
// Required env vars:
//   SUPABASE_SERVICE_ROLE_KEY  — bypasses RLS to read all orgs' tickets
//   CRON_SECRET                — shared secret; Vercel sends Authorization: Bearer <secret>

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const URGENCY_LABELS: Record<string, string> = {
  safety: 'SAFETY',
  urgent: 'Urgent',
  routine: 'Routine',
}

const URGENCY_COLORS: Record<string, string> = {
  safety: '#DC2626',
  urgent: '#EA580C',
  routine: '#78716C',
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key)
}

async function runDigest(request: NextRequest) {
  // Verify Vercel Cron secret (prevents unauthorized triggering / cross-tenant leak)
  const authHeader = request.headers.get('authorization')
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    console.warn('[rm-daily-digest] unauthorized request rejected', { hasHeader: !!authHeader })
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const resendKey = process.env.RESEND_API_KEY

  if (!supabaseUrl || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Missing env vars' }, { status: 500 })
  }

  const supabase = getServiceClient()

  // Iterate ALL active orgs server-side — no caller-supplied org override
  // (per AUDIT-ops.md RLS finding #3: orgId override allowed open-endpoint
  //  ticket-data leak to any owner email)
  const { data: orgs, error: orgsError } = await supabase
    .from('organizations')
    .select('id, name, owner_email')
  if (orgsError || !orgs || orgs.length === 0) {
    return NextResponse.json({ sent: 0, skipped: 'no orgs' })
  }

  let sent = 0

  for (const org of orgs) {
    if (!org.owner_email) continue

    // Fetch open/assigned/in_progress tickets for this org
    const { data: tickets } = await supabase
      .from('r_m_tickets')
      .select('id, title, urgency, status, location_name, equipment_tag, created_at, is_stale, vendor_contacts(name)')
      .eq('org_id', org.id)
      .not('status', 'in', '("completed","cancelled")')
      .order('urgency', { ascending: true })
      .order('created_at', { ascending: true })

    if (!tickets || tickets.length === 0) continue

    const staleCount = tickets.filter((t) => t.is_stale).length
    const safetyCount = tickets.filter((t) => t.urgency === 'safety').length
    const urgentCount = tickets.filter((t) => t.urgency === 'urgent').length
    const routineCount = tickets.filter((t) => t.urgency === 'routine').length

    if (!resendKey) {
      console.log(`[rm-daily-digest] Would send digest to ${org.owner_email} for org ${org.id}: ${tickets.length} open tickets`)
      continue
    }

    const html = buildDigestHtml({
      restaurantName: org.name,
      tickets,
      staleCount,
      safetyCount,
      urgentCount,
      routineCount,
    })

    const subject = staleCount > 0
      ? `⚠ R&M Alert: ${staleCount} stale ticket${staleCount !== 1 ? 's' : ''} — ${org.name}`
      : `R&M Daily Digest: ${tickets.length} open ticket${tickets.length !== 1 ? 's' : ''} — ${org.name}`

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendKey}` },
        body: JSON.stringify({
          from: 'noreply@wireach.tools',
          to: org.owner_email,
          subject,
          html,
        }),
      })
      if (res.ok) {
        sent++
        console.log(`[rm-daily-digest] Sent digest to ${org.owner_email}: ${tickets.length} tickets`)
      } else {
        const err = await res.text()
        console.error(`[rm-daily-digest] Resend error for ${org.owner_email}:`, err)
      }
    } catch (err) {
      console.error(`[rm-daily-digest] Failed for ${org.owner_email}:`, err)
    }
  }

  return NextResponse.json({ sent, orgs: orgs.length })
}

// Vercel Cron uses GET by default; keep POST for parity with the prior
// route shape so any historical manual-invocation tooling still works
// (it will now be subject to CRON_SECRET like the cron path).
export async function GET(request: NextRequest) {
  return runDigest(request)
}

export async function POST(request: NextRequest) {
  return runDigest(request)
}

type DigestTicket = {
  id: string
  title: string
  urgency: string
  status: string
  location_name: string
  equipment_tag: string | null
  created_at: string
  is_stale: boolean
  vendor_contacts: { name: string }[] | { name: string } | null
}

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
}

function buildDigestHtml(params: {
  restaurantName: string
  tickets: DigestTicket[]
  staleCount: number
  safetyCount: number
  urgentCount: number
  routineCount: number
}): string {
  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const alertBanner = params.staleCount > 0 || params.safetyCount > 0
    ? `<div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
        <div style="font-size:14px;font-weight:600;color:#DC2626;margin-bottom:8px;">⚠ Action Required</div>
        <ul style="margin:0;padding:0 0 0 16px;font-size:13px;color:#7F1D1D;line-height:2;">
          ${params.safetyCount > 0 ? `<li>${params.safetyCount} safety-level ticket${params.safetyCount !== 1 ? 's' : ''} still open</li>` : ''}
          ${params.staleCount > 0 ? `<li>${params.staleCount} ticket${params.staleCount !== 1 ? 's' : ''} open &gt;14 days without progress</li>` : ''}
        </ul>
      </div>`
    : ''

  const ticketRows = params.tickets.map(ticket => {
    const age = daysSince(ticket.created_at)
    const urgencyColor = URGENCY_COLORS[ticket.urgency] ?? '#78716C'
    const urgencyLabel = URGENCY_LABELS[ticket.urgency] ?? ticket.urgency
    const statusLabel = STATUS_LABELS[ticket.status] ?? ticket.status
    const vendorName = (ticket.vendor_contacts as any)?.name ?? null

    return `
      <tr style="border-bottom:1px solid #F0EBE3;">
        <td style="padding:12px 16px;vertical-align:top;">
          <div style="font-size:11px;font-weight:600;color:${urgencyColor};letter-spacing:0.04em;text-transform:uppercase;margin-bottom:4px;">${urgencyLabel}${ticket.is_stale ? ' · <span style="color:#DC2626;">STALE</span>' : ''}</div>
          <div style="font-size:14px;font-weight:500;color:#1C1917;margin-bottom:3px;">${ticket.title}</div>
          <div style="font-size:12px;color:#78716C;">${ticket.location_name}${ticket.equipment_tag ? ` — ${ticket.equipment_tag}` : ''}</div>
          ${vendorName ? `<div style="font-size:12px;color:#6B5B4E;margin-top:2px;">Vendor: ${vendorName}</div>` : ''}
        </td>
        <td style="padding:12px 16px;text-align:right;vertical-align:top;white-space:nowrap;">
          <div style="font-size:12px;font-weight:500;color:#1C1917;">${statusLabel}</div>
          <div style="font-size:11px;color:${age > 14 ? '#DC2626' : '#9CA3AF'};margin-top:3px;">${age === 0 ? 'Today' : `${age}d ago`}</div>
        </td>
      </tr>`
  }).join('')

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
    <div style="background:#1C1917;border-radius:12px 12px 0 0;padding:24px 28px;">
      <div style="font-size:12px;color:#A89880;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:6px;">${params.restaurantName}</div>
      <div style="font-size:20px;font-weight:700;color:#F5F0E8;margin-bottom:2px;">R&amp;M Daily Digest</div>
      <div style="font-size:13px;color:#A89880;">${dateStr}</div>
    </div>

    <div style="background:#FFFFFF;border-radius:0 0 12px 12px;padding:28px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
      ${alertBanner}

      <!-- Summary chips -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
        <tr>
          <td style="padding-right:8px;">
            <div style="background:#FAFAF9;border:1px solid #E8E3DC;border-radius:8px;padding:14px;text-align:center;">
              <div style="font-size:24px;font-weight:700;color:#D97706;">${params.tickets.length}</div>
              <div style="font-size:11px;color:#6B5B4E;margin-top:3px;">Total Open</div>
            </div>
          </td>
          ${params.safetyCount > 0 ? `
          <td style="padding-right:8px;">
            <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:14px;text-align:center;">
              <div style="font-size:24px;font-weight:700;color:#DC2626;">${params.safetyCount}</div>
              <div style="font-size:11px;color:#7F1D1D;margin-top:3px;">Safety</div>
            </div>
          </td>` : ''}
          ${params.urgentCount > 0 ? `
          <td style="padding-right:8px;">
            <div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:8px;padding:14px;text-align:center;">
              <div style="font-size:24px;font-weight:700;color:#EA580C;">${params.urgentCount}</div>
              <div style="font-size:11px;color:#9A3412;margin-top:3px;">Urgent</div>
            </div>
          </td>` : ''}
          ${params.staleCount > 0 ? `
          <td>
            <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:14px;text-align:center;">
              <div style="font-size:24px;font-weight:700;color:#DC2626;">${params.staleCount}</div>
              <div style="font-size:11px;color:#7F1D1D;margin-top:3px;">Stale &gt;14d</div>
            </div>
          </td>` : ''}
        </tr>
      </table>

      <!-- Ticket list -->
      <div style="font-size:11px;font-weight:600;color:#6B5B4E;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:12px;">Open Tickets</div>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #E8E3DC;border-radius:8px;overflow:hidden;">
        ${ticketRows}
      </table>

      <div style="margin-top:24px;text-align:center;">
        <a href="https://ops.wireach.tools/maintenance"
           style="display:inline-block;background:#D97706;color:#1C1917;font-weight:600;font-size:14px;padding:12px 28px;border-radius:6px;text-decoration:none;">
          Manage Tickets →
        </a>
      </div>
    </div>

    <p style="text-align:center;margin-top:20px;font-size:12px;color:#A89880;">
      WRI Restaurant Ops · <a href="https://ops.wireach.tools" style="color:#A89880;text-decoration:none;">ops.wireach.tools</a>
    </p>
  </div>
</body>
</html>`
}
