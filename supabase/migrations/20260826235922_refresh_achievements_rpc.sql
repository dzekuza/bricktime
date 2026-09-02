-- =============================================================================
-- refresh_my_achievements() (2026-08-27)
-- evaluate_achievements() only ever ran from the feed_items / feed_likes
-- triggers, so metrics that aren't driven by an insert -- membership_days,
-- i.e. the "Veteranas" style unlocks -- could never fire for a member who
-- never posted. Expose a self-scoped RPC the storefront calls on page load.
-- =============================================================================

create or replace function refresh_my_achievements()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    return;
  end if;
  perform public.evaluate_achievements(auth.uid());
end;
$$;

revoke all on function refresh_my_achievements() from public;
revoke all on function refresh_my_achievements() from anon;
grant execute on function refresh_my_achievements() to authenticated;
