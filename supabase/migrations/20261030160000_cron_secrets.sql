-- Shared secret for pg_cron -> edge function calls (process-plan-changes).
-- Generated here so it never appears in source or chat: the cron job reads it
-- at run time and the function compares against the same row. RLS is on with
-- no policies and every API role is revoked, so only the service role and the
-- database owner can read it.
-- Rollback: drop table public.cron_secrets (and unschedule the cron job).

create table if not exists public.cron_secrets (
  name text primary key,
  secret text not null,
  created_at timestamptz not null default now()
);

alter table public.cron_secrets enable row level security;
revoke all on public.cron_secrets from public, anon, authenticated;

insert into public.cron_secrets (name, secret)
values ('plan_changes', encode(extensions.gen_random_bytes(32), 'hex'))
on conflict (name) do nothing;
