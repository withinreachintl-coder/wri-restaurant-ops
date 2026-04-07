import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Vercel Cron Job: runs every hour (see vercel.json)
// Creates pending audit_runs for any active audit_schedule whose cadence/day
// matches today's date and whose run for today has not yet been created.
//
// Required env vars:
//   SUPABASE_SERVICE_ROLE_KEY  — bypasses RLS to read all orgs' schedules
//   CRON_SECRET                — shared secret; Vercel sets Authorization: Bearer <secret>

export async function GET(request: NextRequest) {
  // Verify Vercel Cron secret (prevents unauthorized triggering)
  const authHeader = request.headers.get('authorization')
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: 'Missing SUPABASE_SERVICE_ROLE_KEY — add to Vercel env vars' },
      { status: 500 }
    )
  }

  // Service role client bypasses RLS so we can create runs across all orgs
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const now = new Date()
  const todayDate = now.toISOString().split('T')[0]             // YYYY-MM-DD
  const currentHour = now.getUTCHours()                        // 0–23 (UTC)
  const currentDayOfWeek = now.getUTCDay()                     // 0=Sun … 6=Sat
  const currentDayOfMonth = now.getUTCDate()                   // 1–31

  // Fetch all active schedules with their form info
  const { data: schedules, error: schedErr } = await supabase
    .from('audit_schedules')
    .select('id, form_id, org_id, location_name, cadence, time_of_day, day_of_week, day_of_month')
    .eq('is_active', true)

  if (schedErr) {
    return NextResponse.json({ error: schedErr.message }, { status: 500 })
  }

  if (!schedules || schedules.length === 0) {
    return NextResponse.json({ created: 0, message: 'No active schedules' })
  }

  const created: string[] = []
  const skipped: string[] = []
  const errors: { scheduleId: string; error: string }[] = []

  for (const schedule of schedules) {
    try {
      // Determine if this schedule fires in the current hour
      const [schedHH] = (schedule.time_of_day ?? '09:00').split(':').map(Number)
      if (schedHH !== currentHour) {
        skipped.push(schedule.id)
        continue
      }

      // Check cadence match
      const fires =
        schedule.cadence === 'daily' ||
        (schedule.cadence === 'weekly' && schedule.day_of_week === currentDayOfWeek) ||
        (schedule.cadence === 'monthly' && schedule.day_of_month === currentDayOfMonth)

      if (!fires) {
        skipped.push(schedule.id)
        continue
      }

      // Check if a run already exists for this schedule + today
      const { data: existing } = await supabase
        .from('audit_runs')
        .select('id')
        .eq('schedule_id', schedule.id)
        .eq('audit_date', todayDate)
        .limit(1)

      if (existing && existing.length > 0) {
        skipped.push(schedule.id)
        continue
      }

      // Create the pending audit run
      const { data: newRun, error: insertErr } = await supabase
        .from('audit_runs')
        .insert([{
          form_id: schedule.form_id,
          schedule_id: schedule.id,
          org_id: schedule.org_id,
          location_name: schedule.location_name,
          status: 'pending',
          audit_date: todayDate,
        }])
        .select('id')
        .single()

      if (insertErr) {
        errors.push({ scheduleId: schedule.id, error: insertErr.message })
      } else {
        created.push(newRun.id)
      }
    } catch (e: any) {
      errors.push({ scheduleId: schedule.id, error: e.message })
    }
  }

  return NextResponse.json({
    created: created.length,
    skipped: skipped.length,
    errors: errors.length,
    createdRunIds: created,
    errorDetails: errors.length > 0 ? errors : undefined,
  })
}
