-- Outbox for WhatsApp admin notifications. Producers (the Stripe webhook, DB
-- triggers) only insert a row; the `send-admin-notifications` edge function
-- drains it every minute, so a WhatsApp outage never fails a Stripe webhook or
-- a signup. `dedupe_key` makes a repeated Stripe delivery a no-op.
-- Rollback: select cron.unschedule('send-admin-notifications');
--           drop trigger subscribers_notify_admin on public.subscribers;
--           drop function public.notify_admin_new_subscriber();
--           drop table public.admin_notifications;
--           delete from public.site_settings where key = 'admin_whatsapp';

create table public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  payload jsonb not null default '{}'::jsonb,
  dedupe_key text not null unique,
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'failed', 'skipped')),
  attempts int not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index admin_notifications_pending_idx
  on public.admin_notifications (created_at)
  where status = 'pending';

alter table public.admin_notifications enable row level security;
revoke all on public.admin_notifications from public, anon, authenticated;
grant select on public.admin_notifications to authenticated;

-- Admins can read the log; nobody but the service role writes.
create policy admin_notifications_admin_select on public.admin_notifications
  for select to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

-- Off until an admin turns it on. `kinds` holds per-kind overrides; a kind
-- missing from it is on while `enabled` is true.
insert into public.site_settings (key, value)
values ('admin_whatsapp', '{"enabled": false, "kinds": {}}'::jsonb)
on conflict (key) do nothing;

create or replace function public.notify_admin_new_subscriber()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.admin_notifications (kind, payload, dedupe_key)
  values (
    'new_subscriber',
    jsonb_build_object('name', new.name, 'email', new.email),
    'new_subscriber:' || new.id
  )
  on conflict (dedupe_key) do nothing;
  return new;
exception when others then
  -- A notification problem must never block signup, but it must leave a trace
  -- in the database logs so a lost alert can be found and repaired.
  raise warning 'notify_admin_new_subscriber failed for %: %', new.id, sqlerrm;
  return new;
end;
$$;

revoke all on function public.notify_admin_new_subscriber() from public, anon, authenticated;

create trigger subscribers_notify_admin
  after insert on public.subscribers
  for each row execute function public.notify_admin_new_subscriber();

select cron.schedule(
  'send-admin-notifications',
  '* * * * *',
  $cmd$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
             || '/functions/v1/send-admin-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 30000
    );
  $cmd$
);
