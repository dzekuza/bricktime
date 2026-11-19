-- Lines are always fetched by their order: the thank-you page lookup
-- (get_merch_order_lines_by_session) and the webhook's nested
-- merch_order_items relation both filter on order_id, which a foreign key does
-- not index by itself. Kept apart from the table migration so it can be rolled
-- back on its own.
--
-- Rollback: drop index if exists public.merch_order_items_order_id_idx;

create index if not exists merch_order_items_order_id_idx
  on public.merch_order_items (order_id);
