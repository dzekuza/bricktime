-- The drain function counts sent new-member alerts of the last 24 hours on
-- every run to enforce its daily cap; this keeps that count cheap while the
-- outbox grows. Kept in its own migration so it rolls back on its own.
-- Rollback: drop index public.admin_notifications_signup_sent_idx;

create index admin_notifications_signup_sent_idx
  on public.admin_notifications (sent_at)
  where kind = 'new_subscriber' and status = 'sent';
