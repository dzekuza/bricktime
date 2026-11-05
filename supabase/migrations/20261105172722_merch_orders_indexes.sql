-- Admin list sorts newest first and filters by status.
-- Rollback: drop index if exists public.idx_merch_orders_status_created;
--           drop index if exists public.idx_merch_orders_user;
create index idx_merch_orders_status_created on public.merch_orders (status, created_at desc);
create index idx_merch_orders_user on public.merch_orders (user_id) where user_id is not null;
