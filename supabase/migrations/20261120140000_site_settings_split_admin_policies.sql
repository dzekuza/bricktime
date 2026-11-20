-- The FOR ALL admin policy overlapped the public SELECT policy, so every read
-- evaluated both. Admin write access is split per command instead.
drop policy if exists site_settings_admin_write on public.site_settings;

create policy site_settings_admin_insert on public.site_settings
  for insert
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy site_settings_admin_update on public.site_settings
  for update
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy site_settings_admin_delete on public.site_settings
  for delete
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
