-- Credits come back at the next charge, not the moment a set is returned
-- (client decision, 2026-11-20).
--
-- A set uses credits while the member still holds it, and for the rest of the
-- billing window in which it shipped, even if it is returned. Returned sets
-- therefore free their credits at the next window start, i.e. the next charge
-- (monthly anniversary on annual plans, see billing_window). An order that
-- never shipped (admin cancelled it by marking it returned, or its label was
-- cancelled) frees them at once. "Shipped" = a label exists that was not
-- cancelled; the window test uses the label time, so a request created earlier
-- and assigned later is judged by when it was sent.
-- Admins can reset a member's credits by hand (reset_member_credits, logged);
-- the reset only affects credits, not the Mystery Box once-per-period rule.
--
-- Rollback: restore used_credits from 20261118120000_returned_sets_free_budget_immediately.sql
-- and guard_subscriber_billing_columns from its previous migration; drop
-- reset_member_credits, credits_reset_log, credits_pending_reset,
-- credits_window_start; drop subscribers.credits_reset_at.

alter table public.subscribers
  add column if not exists credits_reset_at timestamptz;

-- A member must not be able to reset their own credits.
create or replace function public.guard_subscriber_billing_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user not in ('anon', 'authenticated')
    or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.plan is distinct from 'nano'::public.plan_tier
      or new.status is distinct from 'paused'::public.subscriber_status
      or new.penalty_amount is not null
      or new.penalty_reason is not null
      or new.stripe_customer_id is not null
      or new.stripe_subscription_id is not null
      or new.home_delivery is true
      or new.cancel_at is not null
      or new.pending_plan is not null
      or new.pending_home_delivery is not null
      or new.pending_schedule_id is not null
      or new.cancel_requested is true
      or new.current_period_start is not null
      or new.current_period_end is not null
      or new.paused_until is not null
      or new.credits_reset_at is not null
      or new.email is distinct from (select auth.jwt() ->> 'email')
    then
      raise exception 'subscribers billing columns are read-only for members'
        using errcode = '42501';
    end if;
  elsif new.plan is distinct from old.plan
    or new.status is distinct from old.status
    or new.penalty_amount is distinct from old.penalty_amount
    or new.penalty_reason is distinct from old.penalty_reason
    or new.stripe_customer_id is distinct from old.stripe_customer_id
    or new.stripe_subscription_id is distinct from old.stripe_subscription_id
    or new.home_delivery is distinct from old.home_delivery
    or new.cancel_at is distinct from old.cancel_at
    or new.pending_plan is distinct from old.pending_plan
    or new.pending_home_delivery is distinct from old.pending_home_delivery
    or new.pending_schedule_id is distinct from old.pending_schedule_id
    or new.cancel_requested is distinct from old.cancel_requested
    or new.current_period_start is distinct from old.current_period_start
    or new.current_period_end is distinct from old.current_period_end
    or new.paused_until is distinct from old.paused_until
    or new.credits_reset_at is distinct from old.credits_reset_at
    or (
      new.email is distinct from old.email
      and new.email is distinct from (select auth.jwt() ->> 'email')
    )
  then
    raise exception 'subscribers billing columns are read-only for members'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

-- billing_window is also what the Mystery Box limit reads, so it stays as it is.
revoke all on function public.billing_window(uuid) from public, anon;
grant execute on function public.billing_window(uuid) to authenticated;

-- Where the credit window starts: the billing window, but never before an admin's reset.
create or replace function public.credits_window_start(p_subscriber_id uuid)
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select greatest(w.window_start, s.credits_reset_at)
    from public.subscribers s
   cross join lateral public.billing_window(s.id) w
   where s.id = p_subscriber_id;
$$;

revoke all on function public.credits_window_start(uuid) from public, anon;
grant execute on function public.credits_window_start(uuid) to authenticated;

create or replace function public.used_credits(p_subscriber_id uuid)
returns numeric
language sql
stable
set search_path = ''
as $$
  select coalesce(sum(p.value), 0)
    from public.orders o
    join public.products p on p.id = o.product_id
   where o.subscriber_id = p_subscriber_id
     and (
       o.status <> 'returned'
       or (
         o.lp_barcode is not null
         and o.lp_tracking_state is distinct from 'LABEL_CANCELLED'
         and coalesce(o.lp_label_created_at, o.created_at) >= coalesce(
           public.credits_window_start(p_subscriber_id),
           now() - interval '1 month'
         )
       )
     );
$$;

-- Credits that come back at the next reset: returned sets still counted in this window.
create or replace function public.credits_pending_reset(p_subscriber_id uuid)
returns numeric
language sql
stable
set search_path = ''
as $$
  select coalesce(sum(p.value), 0)
    from public.orders o
    join public.products p on p.id = o.product_id
   where o.subscriber_id = p_subscriber_id
     and o.status = 'returned'
     and o.lp_barcode is not null
     and o.lp_tracking_state is distinct from 'LABEL_CANCELLED'
     and coalesce(o.lp_label_created_at, o.created_at) >= coalesce(
       public.credits_window_start(p_subscriber_id),
       now() - interval '1 month'
     );
$$;

revoke all on function public.credits_pending_reset(uuid) from public, anon;
grant execute on function public.credits_pending_reset(uuid) to authenticated;

-- Who reset whose credits, and what it freed.
create table if not exists public.credits_reset_log (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid not null references public.subscribers(id) on delete cascade,
  reset_by uuid,
  freed_credits numeric not null,
  created_at timestamptz not null default now()
);

alter table public.credits_reset_log enable row level security;

create policy credits_reset_log_admin_select on public.credits_reset_log
  for select using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

-- Admin reset with the database clock, so a skewed browser can't shift the cutoff.
create or replace function public.reset_member_credits(p_subscriber_id uuid)
returns numeric
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_freed numeric;
begin
  if (select auth.jwt() -> 'app_metadata' ->> 'role') is distinct from 'admin' then
    raise exception 'Only admins can reset credits' using errcode = '42501';
  end if;

  v_freed := public.credits_pending_reset(p_subscriber_id);

  update public.subscribers
     set credits_reset_at = now()
   where id = p_subscriber_id;
  if not found then
    raise exception 'Subscriber not found' using errcode = 'no_data_found';
  end if;

  insert into public.credits_reset_log (subscriber_id, reset_by, freed_credits)
  values (p_subscriber_id, auth.uid(), v_freed);

  return v_freed;
end;
$$;

revoke all on function public.reset_member_credits(uuid) from public, anon;
grant execute on function public.reset_member_credits(uuid) to authenticated;
