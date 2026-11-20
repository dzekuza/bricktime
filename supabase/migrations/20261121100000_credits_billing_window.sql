-- Credits come back at the next charge, not the moment a set is returned
-- (client decision, 2026-11-20).
--
-- A set uses credits while the member still holds it, and for the rest of the
-- billing window in which it shipped, even if it is returned. Returned sets
-- therefore free their credits at the next window start, i.e. the next charge
-- (monthly anniversary on annual plans, see billing_window). An order that
-- never shipped (admin cancelled it by marking it returned) frees them at once.
-- Admins can reset a member's window by hand with subscribers.credits_reset_at.
--
-- Rollback: restore used_credits from 20261118120000_returned_sets_free_budget_immediately.sql,
-- billing_window from 20261120150100_mystery_box_requests.sql and
-- guard_subscriber_billing_columns from its previous migration; drop
-- credits_pending_reset; then drop subscribers.credits_reset_at.

alter table public.subscribers
  add column if not exists credits_reset_at timestamptz;

-- A member must not be able to reset their own window.
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

-- Same window as before, but never earlier than an admin's manual reset.
create or replace function public.billing_window(p_subscriber_id uuid)
returns table (window_start timestamptz, window_end timestamptz)
language sql
stable
set search_path = ''
as $$
  select
    greatest(
      case
        when s.current_period_start is null then now() - interval '1 month'
        when s.current_period_end is not null
         and s.current_period_end - s.current_period_start > interval '40 days' then coalesce(
          (
            select max(step_start)
              from generate_series(0, 11) as m
             cross join lateral (
               select ((s.current_period_start at time zone 'UTC') + make_interval(months => m)) at time zone 'UTC' as step_start
             ) step
             where step_start <= now()
          ),
          s.current_period_start
        )
        else s.current_period_start
      end,
      s.credits_reset_at
    ),
    case
      when s.current_period_start is not null
       and s.current_period_end is not null
       and s.current_period_end - s.current_period_start > interval '40 days' then coalesce(
        (
          select min(step_start)
            from generate_series(1, 12) as m
           cross join lateral (
             select ((s.current_period_start at time zone 'UTC') + make_interval(months => m)) at time zone 'UTC' as step_start
           ) step
           where step_start > now()
        ),
        s.current_period_end
      )
      else s.current_period_end
    end
  from public.subscribers s
  where s.id = p_subscriber_id;
$$;

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
         and o.created_at >= coalesce(
           (select window_start from public.billing_window(p_subscriber_id)),
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
     and o.created_at >= coalesce(
       (select window_start from public.billing_window(p_subscriber_id)),
       now() - interval '1 month'
     );
$$;

grant execute on function public.credits_pending_reset(uuid) to authenticated;
