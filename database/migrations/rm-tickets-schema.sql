-- ============================================
-- WRI Restaurant Ops: R&M Ticket Tracking Schema
-- ============================================
-- Phase 3, Week 3 (Days 15-21)
-- Creates: r_m_categories, vendor_contacts,
--          r_m_tickets, ticket_history
-- Features: RLS policies, stale ticket escalation,
--           photo proof, urgency tiers
-- ============================================

-- Drop existing tables if any (reverse dependency order)
DROP TABLE IF EXISTS ticket_history CASCADE;
DROP TABLE IF EXISTS r_m_tickets CASCADE;
DROP TABLE IF EXISTS vendor_contacts CASCADE;
DROP TABLE IF EXISTS r_m_categories CASCADE;

-- ============================================
-- TABLE: r_m_categories
-- Equipment categories per org (e.g. HVAC, Refrigeration)
-- ============================================
CREATE TABLE r_m_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rm_categories_org ON r_m_categories(org_id, is_active);

ALTER TABLE r_m_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org's R&M categories"
  ON r_m_categories FOR SELECT
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert R&M categories for their org"
  ON r_m_categories FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update their org's R&M categories"
  ON r_m_categories FOR UPDATE
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can delete their org's R&M categories"
  ON r_m_categories FOR DELETE
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

-- ============================================
-- TABLE: vendor_contacts
-- Vendor contacts organized by equipment category
-- ============================================
CREATE TABLE vendor_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  category_id UUID REFERENCES r_m_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  email TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vendor_contacts_org ON vendor_contacts(org_id, is_active);
CREATE INDEX idx_vendor_contacts_category ON vendor_contacts(category_id);

ALTER TABLE vendor_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org's vendor contacts"
  ON vendor_contacts FOR SELECT
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert vendor contacts for their org"
  ON vendor_contacts FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update their org's vendor contacts"
  ON vendor_contacts FOR UPDATE
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can delete their org's vendor contacts"
  ON vendor_contacts FOR DELETE
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

-- ============================================
-- TABLE: r_m_tickets
-- Repair & Maintenance request tickets
-- ============================================
CREATE TABLE r_m_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  -- Ticket metadata
  title TEXT NOT NULL,
  description TEXT,
  urgency TEXT NOT NULL DEFAULT 'routine'
    CHECK (urgency IN ('safety', 'urgent', 'routine')),
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'assigned', 'in_progress', 'completed', 'cancelled')),
  -- Location / equipment context
  location_name TEXT NOT NULL DEFAULT 'Main Location',
  category_id UUID REFERENCES r_m_categories(id) ON DELETE SET NULL,
  equipment_tag TEXT,
  -- Photo proof
  photo_url TEXT,
  -- Vendor assignment
  vendor_id UUID REFERENCES vendor_contacts(id) ON DELETE SET NULL,
  -- Follow-up scheduling
  follow_up_date DATE,
  -- Stale escalation: auto-flagged if open > 14 days without progress
  is_stale BOOLEAN NOT NULL DEFAULT FALSE,
  -- Submitter and assignment
  submitted_by UUID REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  completed_by UUID REFERENCES users(id),
  -- Resolution
  resolution_notes TEXT,
  completed_at TIMESTAMPTZ,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rm_tickets_org_status ON r_m_tickets(org_id, status);
CREATE INDEX idx_rm_tickets_org_urgency ON r_m_tickets(org_id, urgency, status);
CREATE INDEX idx_rm_tickets_stale ON r_m_tickets(org_id, is_stale) WHERE is_stale = TRUE;
CREATE INDEX idx_rm_tickets_submitted_by ON r_m_tickets(submitted_by);
CREATE INDEX idx_rm_tickets_vendor ON r_m_tickets(vendor_id);
CREATE INDEX idx_rm_tickets_created_at ON r_m_tickets(org_id, created_at DESC);

ALTER TABLE r_m_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org's R&M tickets"
  ON r_m_tickets FOR SELECT
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert R&M tickets for their org"
  ON r_m_tickets FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update their org's R&M tickets"
  ON r_m_tickets FOR UPDATE
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

-- ============================================
-- TABLE: ticket_history
-- Status change audit trail per ticket
-- ============================================
CREATE TABLE ticket_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES r_m_tickets(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  -- What changed
  previous_status TEXT,
  new_status TEXT NOT NULL,
  -- Who changed it and when
  changed_by UUID REFERENCES users(id),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ticket_history_ticket ON ticket_history(ticket_id, created_at ASC);
CREATE INDEX idx_ticket_history_org ON ticket_history(org_id, created_at DESC);

ALTER TABLE ticket_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org's ticket history"
  ON ticket_history FOR SELECT
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert ticket history for their org"
  ON ticket_history FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

-- ============================================
-- FUNCTION: Mark stale tickets (>14 days open without progress)
-- Call this via a cron job or Supabase scheduled function
-- ============================================
CREATE OR REPLACE FUNCTION mark_stale_rm_tickets()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE r_m_tickets
  SET is_stale = TRUE, updated_at = NOW()
  WHERE
    status IN ('open', 'assigned')
    AND is_stale = FALSE
    AND created_at < NOW() - INTERVAL '14 days';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Seed default R&M categories for new org
-- ============================================
CREATE OR REPLACE FUNCTION seed_default_rm_categories(p_org_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO r_m_categories (org_id, name, description) VALUES
    (p_org_id, 'Refrigeration', 'Walk-ins, reach-ins, ice machines, freezers'),
    (p_org_id, 'HVAC', 'Heating, ventilation, and air conditioning'),
    (p_org_id, 'Cooking Equipment', 'Ovens, fryers, grills, ranges, steamers'),
    (p_org_id, 'Plumbing', 'Sinks, drains, dishwasher, grease trap'),
    (p_org_id, 'Electrical', 'Lighting, outlets, breakers, POS systems'),
    (p_org_id, 'General Maintenance', 'Floors, walls, fixtures, pest control');
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER: Auto-seed R&M categories on new org
-- ============================================
CREATE OR REPLACE FUNCTION trigger_seed_default_rm_categories()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM seed_default_rm_categories(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_org_created_seed_rm_categories
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION trigger_seed_default_rm_categories();
