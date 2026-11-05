-- =============================================================================
-- Gift card pending status (2026-11-05)
-- create-gift-card-checkout inserted a bought card as 'active' as soon as the
-- Checkout Session existed, so an unpaid card could be redeemed. A card is
-- now 'pending' until stripe-webhook sees the purchase paid.
--
-- Rollback: update gift_cards set status = 'expired' where status = 'pending';
-- then restore the check with ('active', 'used', 'expired').
-- =============================================================================

alter table public.gift_cards drop constraint if exists gift_cards_status_check;

alter table public.gift_cards
  add constraint gift_cards_status_check
  check (status in ('pending', 'active', 'used', 'expired'));
