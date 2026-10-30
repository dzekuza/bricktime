-- gift_cards_select matched the JWT email, so an account signed up with an
-- unconfirmed address could read that address's gift cards. Require a confirmed
-- email; authenticated cannot read auth.users, hence the definer helper.
-- Rollback: drop the new policy and function, then re-create gift_cards_select
-- from 20261030120000 (without the auth_email_confirmed() condition).

create or replace function public.auth_email_confirmed()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from auth.users u
    where u.id = (select auth.uid()) and u.email_confirmed_at is not null
  );
$$;

revoke execute on function public.auth_email_confirmed() from public, anon;
grant execute on function public.auth_email_confirmed() to authenticated;

drop policy if exists "gift_cards_select" on public.gift_cards;

create policy "gift_cards_select" on public.gift_cards for select to authenticated
using (
  ((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin')
  or (
    (select public.auth_email_confirmed())
    and (
      lower(recipient_email) = lower((select auth.jwt()) ->> 'email')
      or lower(buyer_email) = lower((select auth.jwt()) ->> 'email')
    )
  )
);
