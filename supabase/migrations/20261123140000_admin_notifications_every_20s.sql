-- Drain the admin alert outbox every 20 seconds instead of every minute, so an
-- alert reaches the admin within about 20 s. Overlapping runs stay safe: each
-- row is claimed with a compare-and-swap on `attempts` before it is sent.
--
-- Rollback: select cron.alter_job(
--   (select jobid from cron.job where jobname = 'send-admin-notifications'),
--   schedule := '* * * * *');

select cron.alter_job(
  (select jobid from cron.job where jobname = 'send-admin-notifications'),
  schedule := '20 seconds'
);
