-- Gift card codes were readable by anyone holding the public anon key
-- ("Read gift card by code" used `using (true)`), exposing every redeemable
-- code plus buyer/recipient emails.
--   * Code lookups go through the verify-gift-card edge function (service role).
--   * Signed-in users may read only cards sent to or bought by their own email
--     (Account page); admins may read all.
-- Rollback: re-create "Read gift card by code" as `for select using (true)`.

drop policy if exists "Read gift card by code" on public.gift_cards;

create policy "gift_cards_select" on public.gift_cards for select to authenticated
using (
  ((((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin')
  or lower(recipient_email) = lower((select auth.jwt()) ->> 'email')
  or lower(buyer_email) = lower((select auth.jwt()) ->> 'email')
);
