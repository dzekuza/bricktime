-- =============================================================================
-- Gift card checkout reservation (2026-11-05)
-- A gift card was only checked when a Checkout Session was created and only
-- marked used once payment completed, so one card could discount several
-- open checkouts at once. create-merch-checkout now claims the card with a
-- single conditional UPDATE that sets `reserved_until`; a second checkout is
-- refused until the hold lapses. The hold outlives the 30-minute session, so
-- an abandoned checkout frees the card on its own — no expiry webhook needed.
--
-- Rollback:
--   alter table public.gift_cards drop column if exists reserved_until;
-- =============================================================================

alter table public.gift_cards
  add column if not exists reserved_until timestamptz;

comment on column public.gift_cards.reserved_until is
  'Set while an open Checkout Session holds this card; the card cannot be applied elsewhere until this time passes.';
