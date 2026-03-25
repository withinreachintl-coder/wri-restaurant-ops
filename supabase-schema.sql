-- Daily Ops Database Schema
-- Combined: Checklists + Communication + Schedules + Food Cost

-- ===============================================
-- Core: Organizations & Users
-- ===============================================

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_email TEXT NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan TEXT DEFAULT 'basic', -- basic, premium, complete
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'staff', -- owner, manager, staff
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, email)
);

-- ===============================================
-- Module 1: Communication & Schedules
-- ===============================================

-- Channels (announcements, general, schedule-changes)
CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'general', -- announcements, general, schedule-changes
  admin_only BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  requires_read_receipt BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Read receipts (who read what)
CREATE TABLE message_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- Schedules
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  week_start DATE NOT NULL, -- Monday of the week
  created_by UUID REFERENCES users(id),
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, week_start)
);

-- Shifts
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  shift_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  role TEXT, -- server, cook, bartender, manager
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shift swap requests
CREATE TABLE shift_swaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID REFERENCES shifts(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES users(id),
  to_user_id UUID REFERENCES users(id),
  status TEXT DEFAULT 'pending', -- pending, approved, denied
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id)
);

-- ===============================================
-- Module 2: Digital Checklists
-- ===============================================

CREATE TABLE checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- opening, closing, mid-shift
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE checklist_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID REFERENCES checklists(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  photo_required BOOLEAN DEFAULT false,
  order_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE checklist_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID REFERENCES checklists(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  shift_date DATE NOT NULL
);

CREATE TABLE task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  completion_id UUID REFERENCES checklist_completions(id) ON DELETE CASCADE,
  task_id UUID REFERENCES checklist_tasks(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  photo_url TEXT,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(completion_id, task_id)
);

-- ===============================================
-- Module 3: Food Cost & Waste (Phase 2)
-- ===============================================

CREATE TABLE ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unit TEXT NOT NULL, -- lb, oz, kg, each
  cost_per_unit DECIMAL(10,2),
  supplier TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT, -- appetizer, entree, dessert
  selling_price DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id),
  quantity DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE waste_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id),
  quantity DECIMAL(10,2) NOT NULL,
  reason TEXT, -- spoiled, overcooked, dropped
  photo_url TEXT,
  logged_by UUID REFERENCES users(id),
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===============================================
-- Indexes for Performance
-- ===============================================

CREATE INDEX idx_messages_channel ON messages(channel_id, created_at DESC);
CREATE INDEX idx_message_reads_user ON message_reads(user_id, message_id);
CREATE INDEX idx_shifts_schedule ON shifts(schedule_id, shift_date);
CREATE INDEX idx_shifts_user ON shifts(user_id, shift_date);
CREATE INDEX idx_shift_swaps_status ON shift_swaps(status, requested_at DESC);
CREATE INDEX idx_waste_logs_date ON waste_logs(org_id, logged_at DESC);

-- ===============================================
-- Row Level Security (RLS)
-- ===============================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_swaps ENABLE ROW LEVEL SECURITY;

-- Users can only see data from their organization
CREATE POLICY users_org_access ON users
  FOR ALL USING (
    org_id IN (
      SELECT org_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY channels_org_access ON channels
  FOR ALL USING (
    org_id IN (
      SELECT org_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY messages_org_access ON messages
  FOR ALL USING (
    channel_id IN (
      SELECT id FROM channels WHERE org_id IN (
        SELECT org_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Managers can create announcements, staff can only read
CREATE POLICY messages_create_policy ON messages
  FOR INSERT WITH CHECK (
    CASE 
      WHEN (SELECT admin_only FROM channels WHERE id = channel_id) THEN
        (SELECT role FROM users WHERE id = auth.uid()) IN ('owner', 'manager')
      ELSE true
    END
  );
