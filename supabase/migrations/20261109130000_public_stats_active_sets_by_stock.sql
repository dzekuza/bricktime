-- =============================================================================
-- public_stats.active_sets counts copies, not catalog rows (2026-11-09)
-- It counted products with status <> 'sold_out', so a set we own twice counted
-- once. products.stock is the number of physical copies (rented ones included;
-- availability is derived from orders), so the landing-page figure is now the
-- sum of stock over sets that are not sold out.
--
-- Rollback: re-run the public_stats definition from
-- 20260907160000_product_reviews_and_public_stats.sql.
-- =============================================================================

create or replace view public.public_stats as
  select
    (select count(*) from public.subscribers where status = 'active')::integer
      as active_subscribers,
    (select count(*) from public.orders
      where status = any (array['active'::order_status, 'returned'::order_status]))::integer
      as sets_sent,
    (select coalesce(sum(stock), 0) from public.products where status <> 'sold_out')::integer
      as active_sets,
    (select round(avg(rating)::numeric, 1) from public.product_reviews where approved)
      as average_rating,
    (select count(*) from public.product_reviews where approved)::integer
      as review_count;

alter view public.public_stats set (security_invoker = false);

grant select on public.public_stats to anon, authenticated;
