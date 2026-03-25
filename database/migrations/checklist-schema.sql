-- ============================================
-- WRI Restaurant Ops: Editable Checklist Schema
-- ============================================
-- Creates: checklists, checklist_items, checklist_completions
-- Features: Auto-seeding, RLS policies, free tier limits
-- ============================================

-- Drop existing tables if any
DROP TABLE IF EXISTS checklist_completions CASCADE;
DROP TABLE IF EXISTS checklist_items CASCADE;
DROP TABLE IF EXISTS checklists CASCADE;

-- ============================================
-- TABLE: checklists
-- One opening + one closing checklist per org
-- ============================================
CREATE TABLE checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('opening', 'closing')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, type)
);

-- Index for fast lookups
CREATE INDEX idx_checklists_org_type ON checklists(org_id, type);

-- RLS policies
ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org's checklists"
  ON checklists FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their org's checklists"
  ON checklists FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM users WHERE id = auth.uid()
    )
  );

-- ============================================
-- TABLE: checklist_items
-- Custom items with ordering and photo requirements
-- ============================================
CREATE TABLE checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  photo_required BOOLEAN DEFAULT FALSE,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast ordered lookups
CREATE INDEX idx_checklist_items_checklist ON checklist_items(checklist_id, order_index);

-- RLS policies
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org's checklist items"
  ON checklist_items FOR SELECT
  USING (
    checklist_id IN (
      SELECT id FROM checklists WHERE org_id IN (
        SELECT org_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert items to their org's checklists"
  ON checklist_items FOR INSERT
  WITH CHECK (
    checklist_id IN (
      SELECT id FROM checklists WHERE org_id IN (
        SELECT org_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update their org's checklist items"
  ON checklist_items FOR UPDATE
  USING (
    checklist_id IN (
      SELECT id FROM checklists WHERE org_id IN (
        SELECT org_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete their org's checklist items"
  ON checklist_items FOR DELETE
  USING (
    checklist_id IN (
      SELECT id FROM checklists WHERE org_id IN (
        SELECT org_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- ============================================
-- TABLE: checklist_completions
-- Daily sign-offs with photos
-- ============================================
CREATE TABLE checklist_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES checklist_items(id) ON DELETE CASCADE,
  completed_by UUID NOT NULL REFERENCES users(id),
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  photo_url TEXT,
  notes TEXT
);

-- Index for fast lookups by date
CREATE INDEX idx_completions_checklist_date ON checklist_completions(checklist_id, completed_at);

-- RLS policies
ALTER TABLE checklist_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org's completions"
  ON checklist_completions FOR SELECT
  USING (
    checklist_id IN (
      SELECT id FROM checklists WHERE org_id IN (
        SELECT org_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert completions to their org's checklists"
  ON checklist_completions FOR INSERT
  WITH CHECK (
    checklist_id IN (
      SELECT id FROM checklists WHERE org_id IN (
        SELECT org_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- ============================================
-- FUNCTION: Seed default checklists for new org
-- ============================================
CREATE OR REPLACE FUNCTION seed_default_checklists(p_org_id UUID)
RETURNS VOID AS $$
DECLARE
  v_opening_id UUID;
  v_closing_id UUID;
BEGIN
  -- Create Opening checklist
  INSERT INTO checklists (org_id, name, type)
  VALUES (p_org_id, 'Opening Checklist', 'opening')
  RETURNING id INTO v_opening_id;

  -- Insert Opening checklist items (12 items)
  INSERT INTO checklist_items (checklist_id, text, photo_required, order_index) VALUES
    (v_opening_id, 'Check walk-in cooler temperature (38°F or below)', true, 1),
    (v_opening_id, 'Check freezer temperature (0°F or below)', true, 2),
    (v_opening_id, 'Verify prep station setup and cleanliness', true, 3),
    (v_opening_id, 'Test all cooking equipment (ovens, fryers, grills)', false, 4),
    (v_opening_id, 'Check hand wash stations (soap, towels, hot water)', false, 5),
    (v_opening_id, 'Verify first aid kit is stocked', false, 6),
    (v_opening_id, 'Count and verify register cash (starting balance)', false, 7),
    (v_opening_id, 'Check and restock to-go supplies', false, 8),
    (v_opening_id, 'Verify floor is clean and dry', false, 9),
    (v_opening_id, 'Check bathrooms (stocked, clean)', false, 10),
    (v_opening_id, 'Confirm staff assignments for the shift', false, 11),
    (v_opening_id, 'Review any notes or alerts from previous shift', false, 12);

  -- Create Closing checklist
  INSERT INTO checklists (org_id, name, type)
  VALUES (p_org_id, 'Closing Checklist', 'closing')
  RETURNING id INTO v_closing_id;

  -- Insert Closing checklist items (15 items)
  INSERT INTO checklist_items (checklist_id, text, photo_required, order_index) VALUES
    (v_closing_id, 'Count and verify register cash (closing balance)', false, 1),
    (v_closing_id, 'Run end-of-day sales report', false, 2),
    (v_closing_id, 'Shut down and clean all cooking equipment (ovens, fryers, grills)', true, 3),
    (v_closing_id, 'Clean and sanitize all prep surfaces', true, 4),
    (v_closing_id, 'Wrap, label, and date all food items', true, 5),
    (v_closing_id, 'Check and record walk-in cooler temperature', true, 6),
    (v_closing_id, 'Check and record freezer temperature', true, 7),
    (v_closing_id, 'Empty and clean all trash cans — replace liners', false, 8),
    (v_closing_id, 'Sweep and mop all floors', false, 9),
    (v_closing_id, 'Clean and sanitize bathrooms', false, 10),
    (v_closing_id, 'Restock napkins, condiments, and to-go supplies for next day', false, 11),
    (v_closing_id, 'Turn off all non-essential lights and equipment', false, 12),
    (v_closing_id, 'Check all windows and doors are locked', false, 13),
    (v_closing_id, 'Set alarm', false, 14),
    (v_closing_id, 'Manager sign-off', false, 15);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER: Auto-seed checklists on new org
-- ============================================
CREATE OR REPLACE FUNCTION trigger_seed_default_checklists()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM seed_default_checklists(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_org_created_seed_checklists
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION trigger_seed_default_checklists();

-- ============================================
-- OPTIONAL: Seed existing test organizations
-- ============================================
-- Uncomment and run if you have existing orgs that need checklists:
--
-- DO $$
-- DECLARE
--   org_record RECORD;
-- BEGIN
--   FOR org_record IN SELECT id FROM organizations LOOP
--     PERFORM seed_default_checklists(org_record.id);
--   END LOOP;
-- END $$;
