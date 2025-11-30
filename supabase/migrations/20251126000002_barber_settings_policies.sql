-- RLS policies for barber_settings
-- Allow barbers to read/write their own settings; admins can be handled via roles if needed

-- Drop existing policies if re-running
do $$ begin
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'barber_settings' and policyname = 'barber_settings_select_own') then
    drop policy "barber_settings_select_own" on public.barber_settings;
  end if;
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'barber_settings' and policyname = 'barber_settings_upsert_own') then
    drop policy "barber_settings_upsert_own" on public.barber_settings;
  end if;
end $$;

create policy "barber_settings_select_own"
  on public.barber_settings
  for select
  using (
    exists (
      select 1 from public.barbers b
      where b.id = barber_settings.barber_id
        and b.user_id = auth.uid()
    )
  );

create policy "barber_settings_upsert_own"
  on public.barber_settings
  for insert
  with check (
    exists (
      select 1 from public.barbers b
      where b.id = barber_settings.barber_id
        and b.user_id = auth.uid()
    )
  );

-- For update, allow only if the row belongs to the authenticated barber
create policy "barber_settings_update_own"
  on public.barber_settings
  for update
  using (
    exists (
      select 1 from public.barbers b
      where b.id = barber_settings.barber_id
        and b.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.barbers b
      where b.id = barber_settings.barber_id
        and b.user_id = auth.uid()
    )
  );
