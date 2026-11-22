-- Audit trail for changes made through the admin AI assistant. The browser
-- writes one row per executed (or failed) change under the admin's own
-- session; rows can't be edited or deleted afterwards.
-- Rollback: remove the table public.admin_assistant_actions.

create table public.admin_assistant_actions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null default auth.uid(),
  admin_email text,
  tool text not null,
  args jsonb not null default '{}'::jsonb,
  summary text not null,
  status text not null check (status in ('executed', 'failed')),
  error text,
  created_at timestamptz not null default now()
);

create index admin_assistant_actions_created_idx
  on public.admin_assistant_actions (created_at desc);

alter table public.admin_assistant_actions enable row level security;
revoke all on public.admin_assistant_actions from public, anon, authenticated;
grant select, insert on public.admin_assistant_actions to authenticated;

create policy admin_assistant_actions_admin_select
  on public.admin_assistant_actions
  for select to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

-- An admin can only log under their own id.
create policy admin_assistant_actions_admin_insert
  on public.admin_assistant_actions
  for insert to authenticated
  with check (
    ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
    and admin_id = (select auth.uid())
  );
