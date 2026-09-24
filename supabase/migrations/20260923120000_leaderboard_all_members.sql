-- =============================================================================
-- Leaderboard ranks every member (2026-09-23)
-- Paused and cancelled members keep their earned points, but the view only
-- listed 'active' subscribers, so their points vanished from the community
-- leaderboard. The status filter is dropped. Columns and types are unchanged.
-- =============================================================================

create or replace view leaderboard as
  select
    s.id                as subscriber_id,
    s.name,
    s.avatar_id,
    s.avatar_bg,
    s.plan              as tier,
    ach.achievement_count,
    ach.total_points + chk.days * chk.day_points as total_points,
    ord.drops_received,
    row_number() over (
      order by ach.total_points + chk.days * chk.day_points desc, s.joined_at asc
    ) as rank
  from subscribers s
    cross join lateral (
      select
        count(*)::bigint                   as achievement_count,
        coalesce(sum(a.points) filter (where a.id <> 'daily_checkin'), 0)::bigint as total_points
      from user_achievements ua
        join achievements a on a.id = ua.achievement_id
      where ua.subscriber_id = s.id
    ) ach
    cross join lateral (
      select
        (select count(distinct (fi.created_at at time zone 'Europe/Vilnius')::date)
           from feed_items fi
          where fi.subscriber_id = s.id and fi.type = 'checkin')::bigint as days,
        coalesce((select points from achievements where id = 'daily_checkin'), 0)::bigint as day_points
    ) chk
    cross join lateral (
      select count(*)::bigint as drops_received
      from orders o
      where o.subscriber_id = s.id
        and o.status = any (array['active'::order_status, 'returned'::order_status])
    ) ord;
