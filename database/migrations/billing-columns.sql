-- ============================================================
-- WIT-19: Stripe Billing Columns
-- Adds Stripe tracking columns and ensures subscription fields
-- exist on the organizations table.
-- Safe to run multiple times (IF NOT EXISTS guards).
-- ============================================================

-- Stripe identifiers written by the webhook handler
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS stripe_customer_id      TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id  TEXT;

-- Subscription state columns (referenced by billing page — add if missing)
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS subscription_status     TEXT    DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS subscription_tier       TEXT    DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS subscription_end_date   TIMESTAMPTZ;

-- Fast lookup by Stripe customer ID (used by subscription.deleted webhook event)
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_customer_id
  ON organizations(stripe_customer_id);
