-- =============================================================================
-- leaderboard: materialized view -> plain view (2026-08-27)
-- The matview's only refresh was a pg_cron job scheduled behind
-- `if exists (select 1 from pg_extension where extname = 'pg_cron')` in
-- 20260512000001 -- the extension wasn't installed at that point, so the job
-- was never created and the snapshot has been frozen since the April seed.
-- Every real member therefore read as 0 points and was missing from the
-- rankings entirely.
--
-- The aggregate is small and read on a single page, so a live view is both
-- correct and cheap -- and it makes newly-earned points show up immediately
-- instead of on the next (never-arriving) refresh.
--
-- NOT security_invoker: user_achievements is restricted to
-- `auth.uid() = subscriber_id`, so an invoker-rights view would report 0
-- points for everyone except the caller. The matview it replaces ignored RLS
-- for the same reason -- a leaderboard is public aggregate data by design, and
-- exposes only name/avatar/tier/points, never contact details.
-- =============================================================================

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron')
     and exists (select 1 from cron.job where jobname = 'refresh-leaderboard') then
    perform cron.unschedule('refresh-leaderboard');
  end if;
end;
$$;

-- Drop whichever kind is present: the matview on a from-scratch rebuild, the
-- view itself when this is re-run against a database that already has it.
do $$
begin
  if exists (
    select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'leaderboard' and c.relkind = 'm'
  ) then
    execute 'drop materialized view leaderboard';
  elsif exists (
    select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'leaderboard' and c.relkind = 'v'
  ) then
    execute 'drop view leaderboard';
  end if;
end;
$$;

create view leaderboard as
  select
    s.id                                       as subscriber_id,
    s.name,
    s.avatar_id,
    s.avatar_bg,
    s.plan                                     as tier,
    count(distinct ua.achievement_id)          as achievement_count,
    coalesce(sum(a.points), 0::bigint)         as total_points,
    count(distinct o.id) filter (
      where o.status = any (array['active'::order_status, 'returned'::order_status])
    )                                          as drops_received,
    row_number() over (
      order by coalesce(sum(a.points), 0::bigint) desc
    )                                          as rank
  from subscribers s
    left join user_achievements ua on ua.subscriber_id = s.id
    left join achievements a on a.id = ua.achievement_id
    left join orders o on o.subscriber_id = s.id
  where s.status = 'active'::subscriber_status
  group by s.id, s.name, s.avatar_id, s.avatar_bg, s.plan;

comment on view leaderboard is
  'Live public leaderboard. Owner-rights on purpose: user_achievements is RLS-scoped to the owner, so invoker rights would zero out every other member.';

grant select on leaderboard to anon, authenticated;
