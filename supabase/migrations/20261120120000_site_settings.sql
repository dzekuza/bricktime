-- Key/value site switches. Public read so the storefront can check them before
-- login; only admins write. `coming_soon_gate` turns the password gate on/off.
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

create policy site_settings_select on public.site_settings
  for select using (true);

create policy site_settings_admin_write on public.site_settings
  for all
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

insert into public.site_settings (key, value)
values ('coming_soon_gate', 'true'::jsonb)
on conflict (key) do nothing;
