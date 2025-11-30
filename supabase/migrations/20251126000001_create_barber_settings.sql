-- Create table to store per-barber availability configuration (hidden hours)
create table if not exists public.barber_settings (
  barber_id uuid primary key references public.barbers(id) on delete cascade,
  hidden_hours text[] not null default '{}'::text[],
  updated_at timestamptz not null default now()
);

-- Basic RLS setup (optional depending on your current policies)
alter table public.barber_settings enable row level security;

-- Allow service role full access (edge functions use service role key)
-- Policies for authenticated barbers to update their own settings can be added separately.
