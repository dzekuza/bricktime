-- The drain function counts the capped alert kinds sent in the last 24 hours on
-- every run; this keeps that read cheap as the outbox grows. Kept in its own
-- migration so it rolls back on its own.
-- Rollback: drop index public.admin_notifications_sent_kind_idx;

create index admin_notifications_sent_kind_idx
  on public.admin_notifications (kind, sent_at)
  where status = 'sent';
