import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  assigned: 'Assigned to Vendor',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const URGENCY_LABELS: Record<string, string> = {
  safety: 'SAFETY',
  urgent: 'Urgent',
  routine: 'Routine',
}

export async function POST(request: Request) {
  try {
    const { ticketId, action } = await request.json()

    if (!ticketId || !action) {
      return NextResponse.json({ error: 'ticketId and action are required' }, { status: 400 })
    }

    // Use service role key server-side to bypass RLS for notification lookups
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase env vars for notifications')
      return NextResponse.json({ success: true, skipped: true })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch ticket with submitter user info
    const { data: ticket, error: ticketError } = await supabase
      .from('r_m_tickets')
      .select(`
        id, title, description, urgency, status, location_name,
        equipment_tag, follow_up_date,
        submitted_by,
        r_m_categories(name),
        vendor_contacts(name, company, phone)
      `)
      .eq('id', ticketId)
      .single()

    if (ticketError || !ticket) {
      console.error('Ticket not found for notification:', ticketError)
      return NextResponse.json({ success: true, skipped: true })
    }

    // Fetch submitter email
    let submitterEmail: string | null = null
    if (ticket.submitted_by) {
      const { data: userData } = await supabase
        .from('users')
        .select('email')
        .eq('id', ticket.submitted_by)
        .single()
      submitterEmail = userData?.email ?? null
    }

    // Fetch org manager email (org owner)
    const { data: orgData } = await supabase
      .from('organizations')
      .select('owner_email, name')
      .limit(1)
      .single()

    const managerEmail = orgData?.owner_email ?? null
    const restaurantName = orgData?.name ?? 'Your Restaurant'

    const resendKey = process.env.RESEND_API_KEY
    const newStatusLabel = STATUS_LABELS[action] ?? action

    // Send submitter notification (on every status change)
    if (submitterEmail && resendKey) {
      const subject = `R&M Ticket Update: ${ticket.title}`
      const html = buildStatusEmailHtml({
        ticketTitle: ticket.title,
        urgency: URGENCY_LABELS[ticket.urgency] ?? ticket.urgency,
        newStatus: newStatusLabel,
        locationName: ticket.location_name,
        equipmentTag: ticket.equipment_tag,
        vendorName: (ticket.vendor_contacts as any)?.name ?? null,
        vendorPhone: (ticket.vendor_contacts as any)?.phone ?? null,
        followUpDate: ticket.follow_up_date,
        restaurantName,
        isForSubmitter: true,
      })

      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendKey}` },
          body: JSON.stringify({
            from: 'noreply@wireach.tools',
            to: submitterEmail,
            subject,
            html,
          }),
        })
        if (!res.ok) {
          const err = await res.text()
          console.error('Resend submitter notification error:', err)
        }
      } catch (err) {
        console.error('Failed to send submitter notification:', err)
      }
    }

    // Send manager digest on completion (if manager email configured)
    if (managerEmail && resendKey && action === 'completed') {
      const subject = `R&M Ticket Completed: ${ticket.title}`
      const html = buildStatusEmailHtml({
        ticketTitle: ticket.title,
        urgency: URGENCY_LABELS[ticket.urgency] ?? ticket.urgency,
        newStatus: newStatusLabel,
        locationName: ticket.location_name,
        equipmentTag: ticket.equipment_tag,
        vendorName: (ticket.vendor_contacts as any)?.name ?? null,
        vendorPhone: (ticket.vendor_contacts as any)?.phone ?? null,
        followUpDate: ticket.follow_up_date,
        restaurantName,
        isForSubmitter: false,
      })

      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendKey}` },
          body: JSON.stringify({
            from: 'noreply@wireach.tools',
            to: managerEmail,
            subject,
            html,
          }),
        })
        if (!res.ok) {
          const err = await res.text()
          console.error('Resend manager notification error:', err)
        }
      } catch (err) {
        console.error('Failed to send manager notification:', err)
      }
    }

    // Log even if emails not configured
    console.log(`[R&M] Notification: ticket=${ticketId} action=${action} submitter=${submitterEmail ?? 'none'}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Maintenance notifications error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

function buildStatusEmailHtml(params: {
  ticketTitle: string
  urgency: string
  newStatus: string
  locationName: string
  equipmentTag: string | null
  vendorName: string | null
  vendorPhone: string | null
  followUpDate: string | null
  restaurantName: string
  isForSubmitter: boolean
}): string {
  const urgencyColor = params.urgency === 'SAFETY' ? '#DC2626' : params.urgency === 'Urgent' ? '#EA580C' : '#78716C'

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>R&M Ticket Update</title>
</head>
<body style="margin:0;padding:0;background:#f9f7f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <div style="background:#1C1917;border-radius:8px 8px 0 0;padding:24px 28px;">
      <p style="margin:0;font-size:12px;color:#A89880;letter-spacing:0.06em;text-transform:uppercase;">
        ${params.restaurantName}
      </p>
      <h1 style="margin:8px 0 0;font-size:22px;color:#F5F0E8;font-weight:700;">
        R&amp;M Ticket Update
      </h1>
    </div>
    <div style="background:#FFFFFF;border:1px solid #E8E3DC;border-top:none;border-radius:0 0 8px 8px;padding:28px;">
      <div style="margin-bottom:20px;">
        <span style="display:inline-block;padding:3px 10px;border-radius:4px;font-size:11px;font-weight:600;color:${urgencyColor};background:${urgencyColor}18;text-transform:uppercase;letter-spacing:0.04em;">
          ${params.urgency}
        </span>
      </div>
      <h2 style="margin:0 0 6px;font-size:18px;color:#1C1917;font-weight:600;">${params.ticketTitle}</h2>
      <p style="margin:0 0 20px;font-size:14px;color:#78716C;">${params.locationName}${params.equipmentTag ? ` &mdash; ${params.equipmentTag}` : ''}</p>

      <div style="background:#F5F0E8;border-radius:6px;padding:16px;margin-bottom:20px;">
        <p style="margin:0;font-size:13px;color:#6B5B4E;letter-spacing:0.04em;text-transform:uppercase;font-weight:600;">Status</p>
        <p style="margin:6px 0 0;font-size:18px;color:#D97706;font-weight:700;">${params.newStatus}</p>
      </div>

      ${params.vendorName ? `
      <div style="margin-bottom:16px;">
        <p style="margin:0 0 4px;font-size:12px;color:#6B5B4E;text-transform:uppercase;font-weight:600;letter-spacing:0.04em;">Assigned Vendor</p>
        <p style="margin:0;font-size:14px;color:#1C1917;">${params.vendorName}${params.vendorPhone ? ` &mdash; <a href="tel:${params.vendorPhone}" style="color:#D97706;text-decoration:none;">${params.vendorPhone}</a>` : ''}</p>
      </div>
      ` : ''}

      ${params.followUpDate ? `
      <div style="margin-bottom:16px;">
        <p style="margin:0 0 4px;font-size:12px;color:#6B5B4E;text-transform:uppercase;font-weight:600;letter-spacing:0.04em;">Follow-up Date</p>
        <p style="margin:0;font-size:14px;color:#1C1917;">${params.followUpDate}</p>
      </div>
      ` : ''}

      <div style="margin-top:24px;padding-top:20px;border-top:1px solid #E8E3DC;">
        <a href="https://ops.wireach.tools/maintenance"
           style="display:inline-block;padding:12px 24px;background:#D97706;color:#1C1917;text-decoration:none;border-radius:4px;font-weight:600;font-size:14px;">
          View Ticket
        </a>
      </div>
    </div>
    <p style="margin:20px 0 0;text-align:center;font-size:12px;color:#9CA3AF;">
      WRI Restaurant Ops &mdash; <a href="https://ops.wireach.tools" style="color:#D97706;text-decoration:none;">ops.wireach.tools</a>
    </p>
  </div>
</body>
</html>
  `
}
