-- Auto-activate LP EXPRESS orders on delivery.
-- Schedules a background poll (pg_cron → pg_net → the `lpexpress-sync` Edge Function)
-- that flips orders from 'processing' to 'active' once the parcel is delivered.
--
-- One-time operator setup — add the two Vault secrets the cron job reads (kept out of
-- git; run once per environment in the SQL editor):
--   select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
--   select vault.create_secret('<service-role-key>',                'service_role_key');
--
-- Rollback: select cron.unschedule('lpexpress-delivery-sync');

create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    return;
  end if;

  if exists (select 1 from cron.job where jobname = 'lpexpress-delivery-sync') then
    perform cron.unschedule('lpexpress-delivery-sync');
  end if;

  perform cron.schedule(
    'lpexpress-delivery-sync',
    '*/30 * * * *',
    $cron$
      select net.http_post(
        url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
               || '/functions/v1/lpexpress-sync',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
        ),
        body := '{}'::jsonb
      );
    $cron$
  );
end;
$$;
