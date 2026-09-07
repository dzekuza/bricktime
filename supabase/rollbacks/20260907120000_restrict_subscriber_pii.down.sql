-- =============================================================================
-- ROLLBACK for 20260907120000_restrict_subscriber_pii.sql
--
-- ⚠️  Applying this RE-EXPOSES customer PII. It restores
-- `subscribers_select_all` (FOR SELECT USING (true)), after which anyone
-- holding the anon key — which ships inside the client JS bundle — can read
-- every subscriber's name, last_name, email, phone, street, house_no, flat,
-- city, postal_code, stripe_customer_id and stripe_subscription_id.
--
-- Only run this to unblock a regression you cannot fix forward, and treat it
-- as a live data-exposure window until the forward migration is re-applied.
--
-- Not applied automatically — see supabase/rollbacks/README.md.
-- =============================================================================

begin;

-- 1. Restore the three views to security_invoker, so they read `subscribers`
--    under the caller's RLS again.
alter view public.community_feed set (security_invoker = true);
alter view public.public_profiles set (security_invoker = true);

-- 2. Rebuild user_profile_view with the `email` column the forward migration
--    removed. Dropped and recreated because a view's column list is fixed.
drop view if exists public.user_profile_view;

create view public.user_profile_view as
  select
    s.id,
    s.name,
    s.email,
    s.plan,
    s.status,
    s.avatar_id,
    s.avatar_bg,
    s.joined_at,
    coalesce((
      select sum(a.points)
      from user_achievements ua
      join achievements a on a.id = ua.achievement_id
      where ua.subscriber_id = s.id
    ), 0::bigint)::integer as total_points,
    (
      select count(*)::integer
      from user_achievements ua
      where ua.subscriber_id = s.id
    ) as achievement_count,
    (
      select count(*)::integer
      from orders o
      where o.subscriber_id = s.id
        and o.status = any (array['active'::order_status, 'returned'::order_status])
    ) as drops_received
  from subscribers s;

alter view public.user_profile_view set (security_invoker = true);

grant select on public.user_profile_view to anon, authenticated;

-- 3. Restore the blanket SELECT policy the views depend on in invoker mode.
--    This is the line that re-opens the PII.
drop policy if exists "subscribers_select_all" on public.subscribers;
create policy "subscribers_select_all" on public.subscribers
  for select to public
  using (true);

commit;

-- Afterwards, so the forward migration can be re-applied:
--   delete from supabase_migrations.schema_migrations
--    where version = '20260907120000';
