-- =============================================================================
-- product_reviews: only renters can review, and never self-approve (2026-10-29)
--
-- The insert policy only checked `subscriber_id = auth.uid()`, so a member could
-- insert a review with approved = true (skipping moderation) for a set they
-- never rented. Insert now requires approved = false and an order for that set
-- that has left 'processing' (shipped, active, overdue or returned).
-- Admins keep full insert rights.
-- =============================================================================

drop policy if exists "product_reviews_insert" on public.product_reviews;
drop policy if exists "product_reviews_insert_own" on public.product_reviews;

create policy "product_reviews_insert" on public.product_reviews
  for insert to authenticated
  with check (
    (
      subscriber_id = (select auth.uid())
      and not approved
      and exists (
        select 1
        from public.orders o
        where o.subscriber_id = (select auth.uid())
          and o.product_id = product_reviews.product_id
          and o.status <> 'processing'
      )
    )
    or (((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin'
  );

-- NOTE: rollback is re-creating "product_reviews_insert" with
-- `with check (subscriber_id = (select auth.uid()) or <admin check>)`, the
-- definition from 20260923205559_merge_permissive_policies.sql.
