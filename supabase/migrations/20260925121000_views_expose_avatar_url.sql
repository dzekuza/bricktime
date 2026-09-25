-- Expose subscribers.avatar_url through the views that already carry avatar_id.
-- Definitions mirror the live ones; avatar_url is appended last because
-- CREATE OR REPLACE VIEW only allows new columns at the end (grants and
-- security_invoker options are preserved).

create or replace view public.community_feed as
select
  fi.id,
  fi.subscriber_id,
  fi.type,
  fi.body,
  fi.image_url,
  fi.drop_num,
  fi.achievement_id,
  fi.like_count,
  fi.created_at,
  fi.parent_id,
  fi.status,
  fi.is_hidden,
  s.name as user_name,
  s.avatar_id,
  s.avatar_bg,
  s.plan,
  (exists (
    select 1 from public.feed_likes fl
    where fl.feed_item_id = fi.id
      and fl.subscriber_id = (select auth.uid())
  )) as "likedByCurrentUser",
  s.avatar_url
from public.feed_items fi
join public.subscribers s on s.id = fi.subscriber_id;

create or replace view public.public_profiles as
select id, name, avatar_id, avatar_bg, avatar_url
from public.subscribers;

create or replace view public.leaderboard as
select
  s.id as subscriber_id,
  s.name,
  s.avatar_id,
  s.avatar_bg,
  s.plan as tier,
  ach.achievement_count,
  ach.total_points + chk.days * chk.day_points as total_points,
  ord.drops_received,
  row_number() over (
    order by (ach.total_points + chk.days * chk.day_points) desc, s.joined_at
  ) as rank,
  s.avatar_url
from public.subscribers s
cross join lateral (
  select
    count(*) as achievement_count,
    coalesce(sum(a.points) filter (where a.id <> 'daily_checkin'), 0::bigint) as total_points
  from public.user_achievements ua
  join public.achievements a on a.id = ua.achievement_id
  where ua.subscriber_id = s.id
) ach
cross join lateral (
  select
    (
      select count(distinct (fi.created_at at time zone 'Europe/Vilnius')::date)
      from public.feed_items fi
      where fi.subscriber_id = s.id and fi.type = 'checkin'::feed_event_type
    ) as days,
    coalesce(
      (select achievements.points from public.achievements where achievements.id = 'daily_checkin'),
      0
    )::bigint as day_points
) chk
cross join lateral (
  select count(*) as drops_received
  from public.orders o
  where o.subscriber_id = s.id
    and o.status = any (array['active'::order_status, 'returned'::order_status])
) ord;

create or replace view public.user_profile_view as
select
  id,
  name,
  plan,
  status,
  avatar_id,
  avatar_bg,
  joined_at,
  (
    coalesce((
      select sum(a.points)
      from public.user_achievements ua
      join public.achievements a on a.id = ua.achievement_id
      where ua.subscriber_id = s.id and a.id <> 'daily_checkin'
    ), 0::bigint)
    + (
      select count(distinct (fi.created_at at time zone 'Europe/Vilnius')::date)
      from public.feed_items fi
      where fi.subscriber_id = s.id and fi.type = 'checkin'::feed_event_type
    ) * coalesce(
      (select achievements.points from public.achievements where achievements.id = 'daily_checkin'),
      0
    )
  )::integer as total_points,
  (
    select count(*)::integer from public.user_achievements ua
    where ua.subscriber_id = s.id
  ) as achievement_count,
  (
    select count(*)::integer from public.orders o
    where o.subscriber_id = s.id
      and o.status = any (array['active'::order_status, 'returned'::order_status])
  ) as drops_received,
  avatar_url
from public.subscribers s;
