-- Feature flags for Phase 3 canary release (Day 28)
-- Canary strategy: 10% of orgs get Phase 3 features first.
-- Rollout controlled by `rollout_pct` (0–100).

create table if not exists feature_flags (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  description text,
  enabled     boolean not null default false,
  rollout_pct integer not null default 0 check (rollout_pct between 0 and 100),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Override table: per-org force-enable or force-disable
create table if not exists feature_flag_overrides (
  id          uuid primary key default gen_random_uuid(),
  flag_name   text not null references feature_flags(name) on delete cascade,
  org_id      uuid not null,
  enabled     boolean not null,
  created_at  timestamptz not null default now(),
  constraint uq_flag_org unique (flag_name, org_id)
);

create index if not exists idx_feature_flag_overrides_org on feature_flag_overrides(org_id);

-- Seed Phase 3 flag at 10% canary
insert into feature_flags (name, description, enabled, rollout_pct)
values ('phase3', 'Phase 3 features: LP audits, R&M tracking, offline PWA', true, 10)
on conflict (name) do nothing;
