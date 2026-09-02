-- =============================================================================
-- Fix leaderboard point fan-out (2026-08-27)
-- The aggregate has joined user_achievements AND orders off subscribers since
-- the initial schema. count(distinct ...) survived that, but `sum(a.points)`
-- did not: each achievement row is duplicated once per order, so a member's
-- points were multiplied by their order count. Observed on live data --
-- 210 real points reported as 840 (4 orders), 10 reported as 30 (3 orders).
--
-- Aggregate each side in its own lateral instead, so neither can multiply the
-- other. Column names, order and types are unchanged.
-- =============================================================================

create or replace view leaderboard as
  select
    s.id                as subscriber_id,
    s.name,
    s.avatar_id,
    s.avatar_bg,
    s.plan              as tier,
    ach.achievement_count,
    ach.total_points,
    ord.drops_received,
    row_number() over (order by ach.total_points desc) as rank
  from subscribers s
    cross join lateral (
      select
        count(*)::bigint                      as achievement_count,
        coalesce(sum(a.points), 0)::bigint    as total_points
      from user_achievements ua
        join achievements a on a.id = ua.achievement_id
      where ua.subscriber_id = s.id
    ) ach
    cross join lateral (
      select count(*)::bigint as drops_received
      from orders o
      where o.subscriber_id = s.id
        and o.status = any (array['active'::order_status, 'returned'::order_status])
    ) ord
  where s.status = 'active'::subscriber_status;
