-- =============================================================================
-- Harden exposed RPC functions (2026-09-23)
-- Advisor findings: SECURITY DEFINER functions were executable by anon, and
-- toggle_like trusted a caller-supplied subscriber id.
--   * toggle_like: caller must be the subscriber (auth.uid()), anon revoked.
--   * evaluate_achievements, trigger functions, handle_new_auth_user,
--     assert_product_available: only ever run from triggers / other definer
--     functions, so no API role needs EXECUTE.
--   * redeem_coupon: not called by the storefront (service role only).
--   * refresh_my_achievements: signed-in users only.
--   * Pin search_path on functions that had a mutable one.
-- Rollback: grant execute back to public/anon/authenticated on the functions
-- below and re-create toggle_like from 20260430000001 (no auth check).
-- =============================================================================

create or replace function public.toggle_like(p_feed_item_id uuid, p_subscriber_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_subscriber_id is distinct from (select auth.uid()) then
    raise exception 'not_allowed';
  end if;

  if exists (
    select 1 from public.feed_likes
    where feed_item_id = p_feed_item_id
      and subscriber_id = p_subscriber_id
  ) then
    delete from public.feed_likes
    where feed_item_id = p_feed_item_id
      and subscriber_id = p_subscriber_id;
    update public.feed_items
    set like_count = greatest(0, like_count - 1)
    where id = p_feed_item_id;
  else
    insert into public.feed_likes (feed_item_id, subscriber_id)
    values (p_feed_item_id, p_subscriber_id);
    update public.feed_items
    set like_count = like_count + 1
    where id = p_feed_item_id;
  end if;
end;
$$;

revoke execute on function public.toggle_like(uuid, uuid) from public, anon;
grant execute on function public.toggle_like(uuid, uuid) to authenticated;

revoke execute on function public.refresh_my_achievements() from public, anon;
grant execute on function public.refresh_my_achievements() to authenticated;

revoke execute on function public.toggle_like_anon(uuid, uuid) from public;
grant execute on function public.toggle_like_anon(uuid, uuid) to anon, authenticated;

revoke execute on function public.evaluate_achievements(uuid) from public, anon, authenticated;
revoke execute on function public.trigger_evaluate_achievements_feed_items() from public, anon, authenticated;
revoke execute on function public.trigger_evaluate_achievements_feed_likes() from public, anon, authenticated;
revoke execute on function public.handle_new_auth_user() from public, anon, authenticated;
revoke execute on function public.assert_product_available() from public, anon, authenticated;
revoke execute on function public.redeem_coupon(text) from public, anon, authenticated;

alter function public.redeem_coupon(text) set search_path = '';
alter function public.enforce_checkin_once_per_day() set search_path = public, pg_temp;
alter function public.set_feed_item_status() set search_path = public, pg_temp;
