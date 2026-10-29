-- =============================================================================
-- product_reviews: updates must keep the rental gate (2026-10-29)
--
-- 20261029140000 gated INSERT on having rented the set, but the UPDATE policy
-- only checked ownership and `not approved`. A member could insert a review for
-- a set they rented, then UPDATE its product_id to any other set and so review
-- products they never had. The update check now applies the same rental test to
-- the row's new product_id. Admins are unrestricted.
-- =============================================================================

drop policy if exists "product_reviews_update" on public.product_reviews;

create policy "product_reviews_update" on public.product_reviews
  for update to authenticated
  using (
    subscriber_id = (select auth.uid())
    or (((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin'
  )
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

-- NOTE: rollback is re-creating "product_reviews_update" with the check from
-- 20260923205559_merge_permissive_policies.sql (owner and `not approved`, or admin).
