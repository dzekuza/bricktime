-- The `subscribers.status` default was 'active', so `handle_new_auth_user()`
-- (which inserts a subscribers row without specifying plan/status) gave every
-- brand-new signup a live "active" subscription on the `nano` (Mėgėjas
-- €24.99) plan before they ever paid. `useCredits()` on the storefront grants
-- the full plan budget whenever status = 'active', so new members got free
-- rental credit with no subscription. Default to 'paused' instead — the same
-- status Stripe webhooks and admin already use for "not currently billed" —
-- so a new member has 0 credits and the Account page shows no subscription
-- until they actually check out.
alter table public.subscribers
  alter column status set default 'paused';
