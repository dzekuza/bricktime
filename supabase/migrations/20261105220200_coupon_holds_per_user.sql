-- =============================================================================
-- Coupon holds per user (2026-11-05)
-- A limited coupon's remaining uses could be drained by opening checkouts
-- anonymously, each one reserving a use for 35 minutes. Holds now belong to
-- an account, and an account gets one live hold per coupon at a time.
-- Unlimited coupons are never held (create-merch-checkout skips the call).
--
-- Rollback: remove claim_coupon_hold(text, integer, uuid), restore the
-- two-argument claim_coupon_hold from 20261105220000_merch_checkout_hardening.sql
-- and remove coupon_holds.user_id.
-- =============================================================================

alter table public.coupon_holds
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

drop function if exists public.claim_coupon_hold(text, integer);

-- Locks the coupon row so two checkouts can't both take the last use.
-- Raises own_hold_open when this user already holds a live use of the coupon.
create or replace function public.claim_coupon_hold(p_code text, p_minutes integer, p_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_coupon public.coupons%rowtype;
  v_held   integer;
  v_id     uuid;
begin
  if p_user_id is null then
    return null;
  end if;

  select * into v_coupon
    from public.coupons
   where code = upper(p_code)
     for update;

  if not found
     or not v_coupon.active
     or (v_coupon.expires_at is not null and v_coupon.expires_at <= now()) then
    return null;
  end if;

  delete from public.coupon_holds
   where coupon_code = v_coupon.code and held_until <= now();

  if exists (
    select 1 from public.coupon_holds
     where coupon_code = v_coupon.code and user_id = p_user_id
  ) then
    raise exception 'own_hold_open';
  end if;

  if v_coupon.max_uses is not null then
    select count(*) into v_held
      from public.coupon_holds
     where coupon_code = v_coupon.code;
    if v_coupon.uses_count + v_held >= v_coupon.max_uses then
      return null;
    end if;
  end if;

  insert into public.coupon_holds (coupon_code, held_until, user_id)
  values (v_coupon.code, now() + make_interval(mins => p_minutes), p_user_id)
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.claim_coupon_hold(text, integer, uuid) from public, anon, authenticated;
grant execute on function public.claim_coupon_hold(text, integer, uuid) to service_role;
