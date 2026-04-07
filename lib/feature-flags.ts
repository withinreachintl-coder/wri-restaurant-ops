import { supabase } from './supabase'

// ---------------------------------------------------------------------------
// Feature Flag helpers
//
// Canary rollout: Phase 3 at 10% of orgs initially, scaling to 100%.
// Override table allows force-enable/disable per org for testing.
// ---------------------------------------------------------------------------

/**
 * Deterministic bucket assignment: maps orgId to 0–99 using a cheap hash.
 * Same org always lands in the same bucket, so the flag is stable per session.
 */
function orgBucket(orgId: string): number {
  let hash = 0
  for (let i = 0; i < orgId.length; i++) {
    hash = (hash * 31 + orgId.charCodeAt(i)) >>> 0
  }
  return hash % 100
}

export type FlagName = 'phase3'

/**
 * Returns true if `flagName` is enabled for `orgId`.
 * Check order:
 *   1. Per-org override (force-enable or force-disable)
 *   2. Global flag disabled → false
 *   3. rollout_pct bucketing
 */
export async function isFlagEnabled(flagName: FlagName, orgId: string): Promise<boolean> {
  try {
    // Check for per-org override first
    const { data: override } = await supabase
      .from('feature_flag_overrides')
      .select('enabled')
      .eq('flag_name', flagName)
      .eq('org_id', orgId)
      .maybeSingle()

    if (override !== null) return override.enabled

    // Fall through to global flag
    const { data: flag } = await supabase
      .from('feature_flags')
      .select('enabled, rollout_pct')
      .eq('name', flagName)
      .maybeSingle()

    if (!flag || !flag.enabled) return false

    // 100% rollout = everyone
    if (flag.rollout_pct >= 100) return true

    return orgBucket(orgId) < flag.rollout_pct
  } catch {
    // Fail open for checklist, fail closed for Phase 3 features
    return false
  }
}

/**
 * Force-enable a flag for a specific org (e.g. internal testing).
 */
export async function setFlagOverride(
  flagName: FlagName,
  orgId: string,
  enabled: boolean
): Promise<void> {
  const { error } = await supabase
    .from('feature_flag_overrides')
    .upsert({ flag_name: flagName, org_id: orgId, enabled }, { onConflict: 'flag_name,org_id' })

  if (error) throw error
}

/**
 * Update rollout percentage for a flag (admin use).
 */
export async function setRolloutPct(flagName: FlagName, pct: number): Promise<void> {
  if (pct < 0 || pct > 100) throw new Error('pct must be 0–100')

  const { error } = await supabase
    .from('feature_flags')
    .update({ rollout_pct: pct, updated_at: new Date().toISOString() })
    .eq('name', flagName)

  if (error) throw error
}
