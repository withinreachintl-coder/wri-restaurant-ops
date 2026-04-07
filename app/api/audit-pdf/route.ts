import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Returns a minimal HTML document that the browser can print as PDF.
// Usage: GET /api/audit-pdf?runId=<uuid>
// The client opens this in a new tab; user prints/saves via browser print dialog.
// A future iteration can use Puppeteer or a headless PDF library for server-side generation.

export async function GET(request: NextRequest) {
  const runId = request.nextUrl.searchParams.get('runId')
  if (!runId) {
    return NextResponse.json({ error: 'runId is required' }, { status: 400 })
  }

  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
      },
    }
  )

  // Fetch run
  const { data: run, error: runError } = await supabase
    .from('audit_runs')
    .select('*, audit_forms(name, category, description)')
    .eq('id', runId)
    .single()

  if (runError || !run) {
    return NextResponse.json({ error: 'Run not found' }, { status: 404 })
  }

  // Fetch responses with item details
  const { data: responses, error: respError } = await supabase
    .from('audit_exceptions')
    .select('*, audit_items(label, field_type, threshold_min, threshold_max)')
    .eq('run_id', runId)
    .order('created_at', { ascending: true })

  if (respError) {
    return NextResponse.json({ error: 'Failed to load responses' }, { status: 500 })
  }

  const formName = run.audit_forms?.name ?? 'LP Audit'
  const auditDate = new Date(run.audit_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const submittedAt = run.submitted_at
    ? new Date(run.submitted_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : '—'
  const score = run.score ?? 0
  const scoreColor = score >= 90 ? '#059669' : score >= 70 ? '#D97706' : '#EF4444'
  const exceptionCount = (responses ?? []).filter((r: any) => r.is_exception).length

  const responseRows = (responses ?? []).map((r: any) => {
    const item = r.audit_items
    let responseText = '—'
    if (r.response_bool !== null && r.response_bool !== undefined) responseText = r.response_bool ? 'Pass' : 'Fail'
    else if (r.response_numeric !== null && r.response_numeric !== undefined) responseText = String(r.response_numeric)
    else if (r.response_text) responseText = r.response_text

    const flagged = r.is_exception
    return `
      <tr style="background:${flagged ? '#FFF5F5' : '#FFFFFF'}; border-bottom: 1px solid #E8E3DC;">
        <td style="padding: 10px 14px; font-size: 13px; color: #1C1917;">${item?.label ?? '—'}</td>
        <td style="padding: 10px 14px; font-size: 13px; color: ${flagged ? '#EF4444' : '#1C1917'}; font-weight: ${flagged ? '600' : '400'};">
          ${responseText}${flagged ? ' ⚠' : ''}
        </td>
        <td style="padding: 10px 14px; font-size: 12px; color: #6B5B4E;">
          ${item?.threshold_min != null || item?.threshold_max != null
            ? `${item.threshold_min ?? '—'} – ${item.threshold_max ?? '—'}`
            : ''}
        </td>
        <td style="padding: 10px 14px;">
          ${r.photo_url
            ? `<img src="${r.photo_url}" style="max-width:80px; max-height:60px; border-radius:4px; object-fit:cover;" />`
            : ''}
        </td>
      </tr>
    `
  }).join('')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${formName} — ${auditDate}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'DM Sans', sans-serif; color: #1C1917; background: #FFFFFF; padding: 40px; max-width: 800px; margin: 0 auto; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none !important; }
    }
    .header { border-bottom: 3px solid #D97706; padding-bottom: 24px; margin-bottom: 32px; }
    .form-title { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 700; color: #1C1917; margin-bottom: 8px; }
    .meta { font-size: 14px; color: #6B5B4E; line-height: 1.8; }
    .score-circle { display: inline-block; width: 80px; height: 80px; border-radius: 50%; border: 3px solid ${scoreColor}; text-align: center; line-height: 74px; font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 700; color: ${scoreColor}; float: right; }
    .section-title { font-size: 11px; font-weight: 600; color: #6B5B4E; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; }
    thead th { font-size: 11px; font-weight: 600; color: #6B5B4E; letter-spacing: 0.04em; text-transform: uppercase; text-align: left; padding: 10px 14px; border-bottom: 2px solid #E8E3DC; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .badge-ok { background: rgba(5,150,105,0.1); color: #059669; }
    .badge-warn { background: rgba(239,68,68,0.1); color: #EF4444; }
    .notes-box { background: #F5F0E8; border-radius: 6px; padding: 16px; font-size: 13px; color: #1C1917; line-height: 1.6; }
    .footer { border-top: 1px solid #E8E3DC; margin-top: 40px; padding-top: 16px; font-size: 12px; color: #9CA3AF; }
    .print-btn { position: fixed; bottom: 24px; right: 24px; background: #D97706; color: #1C1917; border: none; padding: 12px 24px; border-radius: 6px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; }
  </style>
</head>
<body>
  <div class="header">
    <div class="score-circle">${score}%</div>
    <div class="form-title">${formName}</div>
    <div class="meta">
      <strong>Date:</strong> ${auditDate}<br>
      <strong>Location:</strong> ${run.location_name}<br>
      <strong>Submitted:</strong> ${submittedAt}<br>
      <strong>Exceptions:</strong>
      <span class="badge ${exceptionCount > 0 ? 'badge-warn' : 'badge-ok'}">
        ${exceptionCount > 0 ? `${exceptionCount} flagged` : 'None'}
      </span>
    </div>
  </div>

  ${run.notes ? `
  <div style="margin-bottom: 28px;">
    <div class="section-title">Audit Notes</div>
    <div class="notes-box">${run.notes}</div>
  </div>
  ` : ''}

  <div style="margin-bottom: 28px;">
    <div class="section-title">Responses</div>
    <table>
      <thead>
        <tr>
          <th>Question</th>
          <th>Response</th>
          <th>Threshold</th>
          <th>Photo</th>
        </tr>
      </thead>
      <tbody>
        ${responseRows}
      </tbody>
    </table>
  </div>

  <div class="footer">
    Generated by WRI Restaurant Ops · ops.wireach.tools · Run ID: ${runId}
  </div>

  <button class="print-btn no-print" onclick="window.print()">Print / Save PDF</button>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
