-- =============================================================================
-- Stop exposing subscriber PII to anonymous visitors (2026-09-07)
--
-- `subscribers_select_all` was `FOR SELECT USING (true)`, so anyone holding the
-- anon key — which ships inside the client JS bundle — could read every column
-- of every subscriber row: name, last_name, email, phone, street, house_no,
-- flat, city, postal_code, stripe_customer_id, stripe_subscription_id.
--
-- The policy existed because three views are `security_invoker = true` and so
-- run under the caller's RLS: community_feed, user_profile_view and
-- public_profiles all read `subscribers` to show other members' names and
-- avatars. Without a blanket SELECT policy they would return only the caller's
-- own row and the community feed would go blank.
--
-- RLS is row-level, so it cannot say "any row, but only these columns". The
-- view itself has to be the boundary: each of the three is switched to
-- security_invoker = false so it can read `subscribers` on the caller's behalf
-- while exposing only the columns it declares. That is the same pattern
-- `leaderboard` already uses.
--
-- Every storefront query against `subscribers` filters on `.eq("id", user.id)`,
-- so `subscribers_select_own` covers the app. Admins keep full access through
-- `subscribers_admin_write`, which is `FOR ALL` and therefore includes SELECT.
-- =============================================================================

drop policy if exists "subscribers_select_all" on public.subscribers;

-- Public community feed: names, avatars and plan tier are meant to be visible
-- to other members. No contact or billing column is selected.
alter view public.community_feed set (security_invoker = false);

-- Public member profile pages (/user/:id). `email` is dropped outright — the
-- page fetched it via select("*") and never rendered it, so it was pure
-- exposure. Rebuilt rather than altered because a view's column list is fixed.
drop view if exists public.user_profile_view;

create view public.user_profile_view as
  select
    s.id,
    s.name,
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

alter view public.user_profile_view set (security_invoker = false);

-- Already limited to id/name/avatar_id/avatar_bg; needs the same treatment to
-- keep working for anyone but the row's owner.
alter view public.public_profiles set (security_invoker = false);

grant select on public.community_feed to anon, authenticated;
grant select on public.user_profile_view to anon, authenticated;
grant select on public.public_profiles to anon, authenticated;
