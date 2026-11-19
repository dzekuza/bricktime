-- The admin loads a cart's orders by cart_id. Partial, since most orders (single
-- sets and everything before 2026-11-19) have none. Kept apart from the column
-- migration so it can be rolled back on its own.
--
-- Rollback: drop index if exists public.orders_cart_id_idx;

create index if not exists orders_cart_id_idx
  on public.orders (cart_id)
  where cart_id is not null;
