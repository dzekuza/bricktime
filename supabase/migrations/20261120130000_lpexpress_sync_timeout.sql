-- The sync polls LP tracking once per processing order, which regularly takes
-- longer than pg_net's 5 s default; those runs were logged as timed out. Give
-- the call a minute. cron.schedule replaces the existing job of the same name.
select cron.schedule(
  'lpexpress-delivery-sync',
  '*/30 * * * *',
  $cmd$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
             || '/functions/v1/lpexpress-sync',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 60000
    );
  $cmd$
);
