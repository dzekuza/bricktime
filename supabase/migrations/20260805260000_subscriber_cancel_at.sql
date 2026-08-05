-- Scheduled cancellation date synced from Stripe's `subscription.cancel_at`.
-- Null while the subscription has no cancellation scheduled.
alter table public.subscribers
  add column if not exists cancel_at timestamptz;
