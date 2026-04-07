-- ============================================
-- WRI Restaurant Ops: LP Audit Forms Schema
-- ============================================
-- Phase 3, Week 2 (Days 8-14)
-- Creates: audit_forms, audit_schedules, audit_runs,
--          audit_items, audit_exceptions
-- Features: RLS policies, exception thresholds, trend data
-- ============================================

-- Drop existing tables if any (reverse dependency order)
DROP TABLE IF EXISTS audit_exceptions CASCADE;
DROP TABLE IF EXISTS audit_runs CASCADE;
DROP TABLE IF EXISTS audit_schedules CASCADE;
DROP TABLE IF EXISTS audit_items CASCADE;
DROP TABLE IF EXISTS audit_forms CASCADE;

-- ============================================
-- TABLE: audit_forms
-- LP audit form templates per org
-- ============================================
CREATE TABLE audit_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general'
    CHECK (category IN ('cash_handling', 'void_comp', 'waste', 'inventory', 'general')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_forms_org ON audit_forms(org_id, is_active);

ALTER TABLE audit_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org's audit forms"
  ON audit_forms FOR SELECT
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert audit forms for their org"
  ON audit_forms FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update their org's audit forms"
  ON audit_forms FOR UPDATE
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can delete their org's audit forms"
  ON audit_forms FOR DELETE
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

-- ============================================
-- TABLE: audit_items
-- Fields/questions in each audit form template
-- ============================================
CREATE TABLE audit_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES audit_forms(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'checkbox'
    CHECK (field_type IN ('text', 'numeric', 'select', 'checkbox')),
  -- For select fields: JSON array of option strings e.g. ["Pass","Fail","N/A"]
  select_options JSONB,
  -- For numeric fields: min/max threshold for exception flagging
  threshold_min NUMERIC,
  threshold_max NUMERIC,
  photo_required BOOLEAN NOT NULL DEFAULT FALSE,
  is_required BOOLEAN NOT NULL DEFAULT TRUE,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_items_form ON audit_items(form_id, order_index);

ALTER TABLE audit_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org's audit items"
  ON audit_items FOR SELECT
  USING (
    form_id IN (
      SELECT id FROM audit_forms WHERE org_id IN (
        SELECT org_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert audit items for their org"
  ON audit_items FOR INSERT
  WITH CHECK (
    form_id IN (
      SELECT id FROM audit_forms WHERE org_id IN (
        SELECT org_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update their org's audit items"
  ON audit_items FOR UPDATE
  USING (
    form_id IN (
      SELECT id FROM audit_forms WHERE org_id IN (
        SELECT org_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete their org's audit items"
  ON audit_items FOR DELETE
  USING (
    form_id IN (
      SELECT id FROM audit_forms WHERE org_id IN (
        SELECT org_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- ============================================
-- TABLE: audit_schedules
-- Recurring schedule per form + location
-- ============================================
CREATE TABLE audit_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES audit_forms(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  -- Location name (free text; maps to org's location if multi-unit)
  location_name TEXT NOT NULL DEFAULT 'Main Location',
  cadence TEXT NOT NULL CHECK (cadence IN ('daily', 'weekly', 'monthly')),
  -- Time of day (HH:MM in 24h, local restaurant time)
  time_of_day TEXT NOT NULL DEFAULT '09:00',
  -- For weekly: 0=Sunday…6=Saturday
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  -- For monthly: 1-28
  day_of_month INTEGER CHECK (day_of_month BETWEEN 1 AND 28),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_schedules_form ON audit_schedules(form_id);
CREATE INDEX idx_audit_schedules_org ON audit_schedules(org_id, is_active);

ALTER TABLE audit_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org's audit schedules"
  ON audit_schedules FOR SELECT
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert audit schedules for their org"
  ON audit_schedules FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update their org's audit schedules"
  ON audit_schedules FOR UPDATE
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can delete their org's audit schedules"
  ON audit_schedules FOR DELETE
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

-- ============================================
-- TABLE: audit_runs
-- Individual audit execution instances
-- ============================================
CREATE TABLE audit_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES audit_forms(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES audit_schedules(id) ON DELETE SET NULL,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  location_name TEXT NOT NULL DEFAULT 'Main Location',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed')),
  -- Overall audit score (0-100), computed on completion
  score NUMERIC(5, 2),
  started_by UUID REFERENCES users(id),
  submitted_by UUID REFERENCES users(id),
  started_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  -- Period this run covers (for trend tracking)
  audit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_runs_form_date ON audit_runs(form_id, audit_date DESC);
CREATE INDEX idx_audit_runs_org_date ON audit_runs(org_id, audit_date DESC);
CREATE INDEX idx_audit_runs_schedule ON audit_runs(schedule_id);

ALTER TABLE audit_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org's audit runs"
  ON audit_runs FOR SELECT
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert audit runs for their org"
  ON audit_runs FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update their org's audit runs"
  ON audit_runs FOR UPDATE
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

-- ============================================
-- TABLE: audit_exceptions
-- Item-level responses + auto-flagged exceptions
-- ============================================
CREATE TABLE audit_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES audit_runs(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES audit_items(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  -- The value submitted for this item
  response_text TEXT,
  response_numeric NUMERIC,
  response_bool BOOLEAN,
  photo_url TEXT,
  -- Whether this response triggered an exception
  is_exception BOOLEAN NOT NULL DEFAULT FALSE,
  -- Owner has reviewed and resolved this exception
  is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  resolution_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_exceptions_run ON audit_exceptions(run_id);
CREATE INDEX idx_audit_exceptions_org_unresolved ON audit_exceptions(org_id, is_exception, is_resolved)
  WHERE is_exception = TRUE AND is_resolved = FALSE;

ALTER TABLE audit_exceptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org's audit exceptions"
  ON audit_exceptions FOR SELECT
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert audit exceptions for their org"
  ON audit_exceptions FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update their org's audit exceptions"
  ON audit_exceptions FOR UPDATE
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

-- ============================================
-- FUNCTION: Compute audit run score
-- Score = (passing items / total required items) * 100
-- Exception items count as failing
-- ============================================
CREATE OR REPLACE FUNCTION compute_audit_score(p_run_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_total INTEGER;
  v_exceptions INTEGER;
  v_score NUMERIC;
BEGIN
  SELECT COUNT(*) INTO v_total
  FROM audit_exceptions
  WHERE run_id = p_run_id;

  SELECT COUNT(*) INTO v_exceptions
  FROM audit_exceptions
  WHERE run_id = p_run_id AND is_exception = TRUE;

  IF v_total = 0 THEN
    RETURN 100;
  END IF;

  v_score := ROUND(((v_total - v_exceptions)::NUMERIC / v_total) * 100, 2);
  RETURN v_score;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Seed default LP audit form for new org
-- ============================================
CREATE OR REPLACE FUNCTION seed_default_audit_form(p_org_id UUID)
RETURNS VOID AS $$
DECLARE
  v_form_id UUID;
BEGIN
  INSERT INTO audit_forms (org_id, name, description, category)
  VALUES (
    p_org_id,
    'Daily Cash Handling Audit',
    'Standard LP audit covering cash handling, void/comp review, and waste tracking.',
    'cash_handling'
  )
  RETURNING id INTO v_form_id;

  INSERT INTO audit_items (form_id, label, field_type, threshold_min, threshold_max, photo_required, order_index) VALUES
    (v_form_id, 'Opening register count matches expected ($)', 'numeric', 0, 0, FALSE, 1),
    (v_form_id, 'Safe balance reconciled', 'checkbox', NULL, NULL, FALSE, 2),
    (v_form_id, 'Void/comp total for shift ($)', 'numeric', 0, 50, FALSE, 3),
    (v_form_id, 'Any comps over $50 approved by manager?', 'select', NULL, NULL, FALSE, 4),
    (v_form_id, 'Waste log completed', 'checkbox', NULL, NULL, FALSE, 5),
    (v_form_id, 'Walk-in temp checked and in range (34-38°F)', 'numeric', 34, 38, TRUE, 6),
    (v_form_id, 'Inventory spot-check: key items counted', 'text', NULL, NULL, FALSE, 7),
    (v_form_id, 'Any discrepancies noted?', 'text', NULL, NULL, FALSE, 8);

  -- Update select_options for the approval question
  UPDATE audit_items
  SET select_options = '["Yes", "No", "N/A - No comps over $50"]'::JSONB
  WHERE form_id = v_form_id AND order_index = 4;

END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER: Auto-seed audit form on new org
-- ============================================
CREATE OR REPLACE FUNCTION trigger_seed_default_audit_form()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM seed_default_audit_form(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_org_created_seed_audit_form
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION trigger_seed_default_audit_form();
