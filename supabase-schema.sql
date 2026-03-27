-- Checklist Tasks Table
-- Run this in your Supabase SQL editor to create the table

CREATE TABLE IF NOT EXISTS checklist_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  photoRequired BOOLEAN DEFAULT false,
  photoUrl TEXT,
  completedBy TEXT,
  completedAt TEXT,
  checklistType TEXT NOT NULL CHECK (checklistType IN ('opening', 'closing')),
  "order" INTEGER NOT NULL,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_checklist_tasks_type ON checklist_tasks(checklistType);
CREATE INDEX IF NOT EXISTS idx_checklist_tasks_order ON checklist_tasks("order");

-- Enable Row Level Security (RLS)
ALTER TABLE checklist_tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for now (adjust based on your auth needs)
CREATE POLICY "Allow all access to checklist_tasks" ON checklist_tasks
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updatedAt = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updatedAt
CREATE TRIGGER update_checklist_tasks_updated_at
  BEFORE UPDATE ON checklist_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
