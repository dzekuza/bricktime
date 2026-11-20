-- A paid Mystery Box courier session the rules refused is refunded by
-- stripe-webhook. That outcome is recorded here so a later redelivery of the
-- same event can't turn the refunded payment into a request once the blocking
-- order has been returned. Service role only (RLS on, no policies).
--
-- Rollback: restore record_paid_mystery_courier from
-- 20261120160000_mystery_box_request_fixes.sql, then drop the table.

create table if not exists public.rejected_checkout_sessions (
  session_id text primary key,
  reason text not null,
  created_at timestamptz not null default now()
);

alter table public.rejected_checkout_sessions enable row level security;

create or replace function public.record_paid_mystery_courier(
  p_subscriber_id uuid,
  p_stripe_session_id text,
  p_amount numeric,
  p_dry_run boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sub public.subscribers;
  v_id uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_subscriber_id::text, 0));

  if not p_dry_run then
    select id into v_id from public.orders where stripe_session_id = p_stripe_session_id;
    if found then
      return v_id;
    end if;

    -- Already refused and refunded: the same refusal again, so the refund is retried.
    if exists (
      select 1 from public.rejected_checkout_sessions
      where session_id = p_stripe_session_id
    ) then
      raise exception 'This payment was refused and refunded'
        using errcode = 'check_violation';
    end if;
  end if;

  v_sub := public.check_mystery_box_request(p_subscriber_id);

  if nullif(trim(concat_ws(' ', v_sub.name, v_sub.last_name)), '') is null
     or nullif(trim(v_sub.phone), '') is null
     or nullif(trim(v_sub.street), '') is null
     or nullif(trim(v_sub.house_no), '') is null
     or nullif(trim(v_sub.city), '') is null
     or nullif(trim(v_sub.postal_code), '') is null then
    raise exception 'Home delivery needs a name, phone and full address'
      using errcode = 'check_violation';
  end if;

  if p_dry_run then
    return null;
  end if;

  insert into public.orders (
    subscriber_id, product_id, amount, start_date, due_date, status,
    is_mystery, home_delivery, delivery_name, delivery_phone,
    delivery_street, delivery_house_no, delivery_flat, delivery_city,
    delivery_postal_code, stripe_session_id
  ) values (
    p_subscriber_id, null, p_amount, current_date, current_date + 30, 'requested',
    true, true, nullif(trim(concat_ws(' ', v_sub.name, v_sub.last_name)), ''), v_sub.phone,
    v_sub.street, v_sub.house_no, v_sub.flat, v_sub.city,
    v_sub.postal_code, p_stripe_session_id
  )
  returning id into v_id;

  return v_id;
end;
$$;
