-- =============================================================
-- Day 30 Production Launch Runbook — Phase 3
-- Run these in order in Supabase SQL Editor
-- =============================================================

-- STEP 1: LP Audit tables (if not already applied from WIT-8)
-- Verify first: SELECT COUNT(*) FROM audit_forms;
-- If that errors, run audit-forms-schema.sql

-- STEP 2: R&M Ticket tables (if not already applied from WIT-9)
-- Verify first: SELECT COUNT(*) FROM r_m_tickets;
-- If that errors, run rm-tickets-schema.sql

-- STEP 3: Feature Flags (new — required for canary release)
-- ============================================================

CREATE TABLE IF NOT EXISTS feature_flags (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL UNIQUE,
  description text,
  enabled     boolean NOT NULL DEFAULT false,
  rollout_pct integer NOT NULL DEFAULT 0 CHECK (rollout_pct BETWEEN 0 AND 100),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS feature_flag_overrides (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_name   text NOT NULL REFERENCES feature_flags(name) ON DELETE CASCADE,
  org_id      uuid NOT NULL,
  enabled     boolean NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_flag_org UNIQUE (flag_name, org_id)
);

CREATE INDEX IF NOT EXISTS idx_feature_flag_overrides_org
  ON feature_flag_overrides(org_id);

-- Seed phase3 flag at 10% canary
INSERT INTO feature_flags (name, description, enabled, rollout_pct)
VALUES (
  'phase3',
  'Phase 3 features: LP audits, R&M tracking, offline PWA',
  true,
  10
)
ON CONFLICT (name) DO NOTHING;

-- Verify:
SELECT name, enabled, rollout_pct FROM feature_flags WHERE name = 'phase3';


-- STEP 4: Ramp to 100% (run AFTER 30 min monitoring at 10%)
-- ============================================================
-- UPDATE feature_flags
-- SET rollout_pct = 100, updated_at = now()
-- WHERE name = 'phase3';

-- Verify:
-- SELECT name, enabled, rollout_pct FROM feature_flags WHERE name = 'phase3';


-- STEP 5: Emergency rollback (only if critical errors detected)
-- ============================================================
-- UPDATE feature_flags
-- SET rollout_pct = 0, updated_at = now()
-- WHERE name = 'phase3';


-- STEP 6: Force-enable for a specific org (internal testing / VIP accounts)
-- ============================================================
-- INSERT INTO feature_flag_overrides (flag_name, org_id, enabled)
-- VALUES ('phase3', '<org-uuid>', true)
-- ON CONFLICT (flag_name, org_id) DO UPDATE SET enabled = true;
