/**
 * offline-store.ts
 * IndexedDB-backed offline queue for checklist submissions and photos.
 * Uses idb-keyval with named stores for isolation.
 */

import { createStore, get, set, del, keys, clear } from 'idb-keyval'

// ── Store definitions ────────────────────────────────────────────────────────

const submissionsStore = createStore('wri-offline', 'pendingSubmissions')
const photosStore = createStore('wri-offline', 'pendingPhotos')
const templatesStore = createStore('wri-offline', 'cachedTemplates')
const metaStore = createStore('wri-offline', 'syncMeta')

// ── Types ────────────────────────────────────────────────────────────────────

export type PendingSubmission = {
  id: string // local UUID
  checklistId: string
  orgId: string
  staffName: string
  checklistType: 'opening' | 'closing'
  tasks: OfflineTask[]
  clientTimestamp: string // ISO 8601 — used for conflict resolution
  syncAttempts: number
}

export type OfflineTask = {
  id: string
  text: string
  completed: boolean
  completedBy?: string
  completedAt?: string
  photoRequired: boolean
  photoKey?: string // key into photosStore if photo captured offline
}

export type PendingPhoto = {
  taskId: string
  submissionId: string
  blob: Blob
  mimeType: string
  capturedAt: string
}

export type CachedTemplate = {
  checklistId: string
  orgId: string
  checklistType: 'opening' | 'closing'
  tasks: Array<{
    id: string
    text: string
    photoRequired: boolean
    orderIndex: number
  }>
  cachedAt: string
}

// ── Pending Submissions ──────────────────────────────────────────────────────

export async function queueSubmission(sub: PendingSubmission): Promise<void> {
  await set(sub.id, sub, submissionsStore)
}

export async function getPendingSubmissions(): Promise<PendingSubmission[]> {
  const allKeys = await keys(submissionsStore)
  const subs = await Promise.all(allKeys.map((k) => get<PendingSubmission>(k, submissionsStore)))
  return subs.filter(Boolean) as PendingSubmission[]
}

export async function removeSubmission(id: string): Promise<void> {
  await del(id, submissionsStore)
}

export async function updateSubmission(sub: PendingSubmission): Promise<void> {
  await set(sub.id, sub, submissionsStore)
}

export async function clearAllSubmissions(): Promise<void> {
  await clear(submissionsStore)
}

// ── Pending Photos ───────────────────────────────────────────────────────────

/** Key format: `{submissionId}:{taskId}` */
export function photoKey(submissionId: string, taskId: string): string {
  return `${submissionId}:${taskId}`
}

export async function queuePhoto(key: string, photo: PendingPhoto): Promise<void> {
  await set(key, photo, photosStore)
}

export async function getPendingPhoto(key: string): Promise<PendingPhoto | undefined> {
  return get<PendingPhoto>(key, photosStore)
}

export async function getPendingPhotos(): Promise<Array<{ key: string; photo: PendingPhoto }>> {
  const allKeys = await keys(photosStore)
  const photos = await Promise.all(
    allKeys.map(async (k) => {
      const photo = await get<PendingPhoto>(k as string, photosStore)
      return photo ? { key: k as string, photo } : null
    })
  )
  return photos.filter(Boolean) as Array<{ key: string; photo: PendingPhoto }>
}

export async function removePhoto(key: string): Promise<void> {
  await del(key, photosStore)
}

// ── Cached Templates ─────────────────────────────────────────────────────────

/** Cache key: `{orgId}:{checklistType}` */
export function templateKey(orgId: string, type: 'opening' | 'closing'): string {
  return `${orgId}:${type}`
}

export async function cacheTemplate(key: string, template: CachedTemplate): Promise<void> {
  await set(key, template, templatesStore)
}

export async function getCachedTemplate(key: string): Promise<CachedTemplate | undefined> {
  return get<CachedTemplate>(key, templatesStore)
}

// ── Sync Meta ────────────────────────────────────────────────────────────────

export async function getLastSyncTime(): Promise<string | undefined> {
  return get<string>('lastSync', metaStore)
}

export async function setLastSyncTime(iso: string): Promise<void> {
  await set('lastSync', iso, metaStore)
}
