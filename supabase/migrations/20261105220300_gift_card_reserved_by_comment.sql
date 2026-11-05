-- The reserved_by comment from 20261105220000 promised an owner re-hold that
-- 20261105220200 removed: a live hold now blocks its own holder too.
-- Rollback: restore the comment text from 20261105220000_merch_checkout_hardening.sql.
comment on column public.gift_cards.reserved_by is
  'Account whose open Checkout Session holds this card. Releasing a hold is limited to this account; while reserved_until is in the future nobody, this account included, can claim the card again.';
