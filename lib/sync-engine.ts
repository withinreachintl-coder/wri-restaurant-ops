/**
 * sync-engine.ts
 * Flush the offline queue to Supabase on reconnect.
 * Conflict strategy: last-write-wins based on server timestamp.
 */

import { supabase } from './supabase'
import {
  getPendingSubmissions,
  removeSubmission,
  updateSubmission,
  getPendingPhotos,
  removePhoto,
  setLastSyncTime,
  PendingSubmission,
} from './offline-store'

// ── Conflict resolution ──────────────────────────────────────────────────────

/**
 * Returns true if the local submission should overwrite the server record.
 * Server wins on tie (equal timestamps).
 */
function localWins(localIso: string, serverIso: string | null): boolean {
  if (!serverIso) return true
  return new Date(localIso).getTime() > new Date(serverIso).getTime()
}

// ── Photo flush ──────────────────────────────────────────────────────────────

async function flushPhotos(): Promise<Map<string, string>> {
  const photoMap = new Map<string, string>() // photoKey → public URL
  const pending = await getPendingPhotos()
  if (pending.length === 0) return photoMap

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return photoMap

  for (const { key, photo } of pending) {
    try {
      const path = `${user.id}/${photo.submissionId}/${photo.taskId}-${Date.now()}`
      const { error: uploadError } = await supabase.storage
        .from('checklist-photos')
        .upload(path, photo.blob, { contentType: photo.mimeType, upsert: true })

      if (uploadError) {
        console.warn('[sync] photo upload failed:', key, uploadError.message)
        continue
      }

      const { data: urlData } = supabase.storage.from('checklist-photos').getPublicUrl(path)
      if (urlData?.publicUrl) {
        photoMap.set(key, urlData.publicUrl)
        await removePhoto(key)
      }
    } catch (err) {
      console.warn('[sync] photo flush error:', key, err)
    }
  }

  return photoMap
}

// ── Submission flush ─────────────────────────────────────────────────────────

async function flushSubmissions(photoMap: Map<string, string>): Promise<void> {
  const pending = await getPendingSubmissions()
  if (pending.length === 0) return

  for (const sub of pending) {
    try {
      await syncOneSubmission(sub, photoMap)
    } catch (err) {
      console.warn('[sync] submission flush error:', sub.id, err)
      // Increment attempt counter and leave in queue for next sync
      await updateSubmission({ ...sub, syncAttempts: sub.syncAttempts + 1 })
    }
  }
}

async function syncOneSubmission(
  sub: PendingSubmission,
  photoMap: Map<string, string>
): Promise<void> {
  // Check for an existing server-side checklist_run for this checklist+date+staff
  const datePrefix = sub.clientTimestamp.slice(0, 10)
  const { data: existing } = await supabase
    .from('checklist_runs')
    .select('id, completed_at')
    .eq('checklist_id', sub.checklistId)
    .eq('staff_name', sub.staffName)
    .gte('completed_at', `${datePrefix}T00:00:00Z`)
    .lte('completed_at', `${datePrefix}T23:59:59Z`)
    .maybeSingle()

  if (existing) {
    if (!localWins(sub.clientTimestamp, existing.completed_at)) {
      // Server record is newer — discard local copy
      console.log('[sync] server wins conflict for submission', sub.id)
      await removeSubmission(sub.id)
      return
    }
    // Local wins — update existing run
    await supabase
      .from('checklist_runs')
      .update({
        completed_at: sub.clientTimestamp,
        tasks_snapshot: buildTasksSnapshot(sub, photoMap),
        synced_from_offline: true,
      })
      .eq('id', existing.id)
  } else {
    // No existing record — insert new run
    const { error } = await supabase.from('checklist_runs').insert({
      checklist_id: sub.checklistId,
      org_id: sub.orgId,
      staff_name: sub.staffName,
      checklist_type: sub.checklistType,
      completed_at: sub.clientTimestamp,
      tasks_snapshot: buildTasksSnapshot(sub, photoMap),
      synced_from_offline: true,
    })
    if (error) throw error
  }

  await removeSubmission(sub.id)
  console.log('[sync] flushed submission', sub.id)
}

function buildTasksSnapshot(
  sub: PendingSubmission,
  photoMap: Map<string, string>
): object {
  return sub.tasks.map((t) => ({
    id: t.id,
    text: t.text,
    completed: t.completed,
    completedBy: t.completedBy,
    completedAt: t.completedAt,
    photoRequired: t.photoRequired,
    photoUrl: t.photoKey ? (photoMap.get(t.photoKey) ?? null) : null,
  }))
}

// ── Public API ───────────────────────────────────────────────────────────────

let syncing = false

export async function startSync(): Promise<void> {
  if (syncing || !navigator.onLine) return
  syncing = true

  try {
    console.log('[sync] starting sync')
    const photoMap = await flushPhotos()
    await flushSubmissions(photoMap)
    await setLastSyncTime(new Date().toISOString())
    console.log('[sync] complete')
  } catch (err) {
    console.error('[sync] error during sync:', err)
  } finally {
    syncing = false
  }
}

/**
 * Register online/focus listeners so sync triggers automatically.
 * Call once from a client component on mount.
 */
export function registerSyncListeners(): () => void {
  const onOnline = () => startSync()
  const onFocus = () => {
    if (navigator.onLine) startSync()
  }

  window.addEventListener('online', onOnline)
  window.addEventListener('focus', onFocus)

  return () => {
    window.removeEventListener('online', onOnline)
    window.removeEventListener('focus', onFocus)
  }
}
