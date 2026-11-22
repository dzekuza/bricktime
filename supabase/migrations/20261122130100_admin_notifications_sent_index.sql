-- The drain function counts the capped alert kinds sent in the last 24 hours on
-- every run; this keeps that read cheap as the outbox grows. Only the capped
-- kinds are indexed (paid alerts are not counted), so the index stays small.
-- The kind list must match DAILY_CAPS in
-- supabase/functions/send-admin-notifications/index.ts; a kind added there
-- needs a new migration that rebuilds this index. Kept in its own migration so
-- it rolls back on its own.
-- Rollback: drop index public.admin_notifications_sent_kind_idx;

create index admin_notifications_sent_kind_idx
  on public.admin_notifications (kind, sent_at)
  where status = 'sent'
    and kind in (
      'new_subscriber', 'rental_order', 'mystery_request',
      'return_requested', 'missing_part_request', 'product_review', 'test'
    );
