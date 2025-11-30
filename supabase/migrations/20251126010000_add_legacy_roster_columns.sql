-- Non-destructive compatibility migration for rosters table
-- Adds legacy columns expected by older edge functions without changing existing data

alter table if exists public.rosters
  add column if not exists week_key text,
  add column if not exists week_dates jsonb,
  add column if not exists schedules jsonb,
  add column if not exists published_at timestamptz;

-- Optional indexes for potential lookups
create index if not exists idx_rosters_week_key on public.rosters(week_key);

-- Refresh PostgREST schema cache so edge functions see new columns
notify pgrst, 'reload schema';
