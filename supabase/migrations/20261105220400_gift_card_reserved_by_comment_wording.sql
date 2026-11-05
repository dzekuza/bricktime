-- Rewords the reserved_by comment from 20261105220300: only create-merch-checkout
-- releases a hold by account (its own, when Stripe fails); other paths clear
-- reserved_until without an owner check. A live hold blocks every claim.
-- Rollback: restore the comment text from 20261105220300_gift_card_reserved_by_comment.sql.
comment on column public.gift_cards.reserved_by is
  'Account whose open merch Checkout Session holds this card. While reserved_until is in the future nobody, this account included, can claim the card. create-merch-checkout releases only its own hold (on a Stripe failure); other checkout paths clear reserved_until without checking this column.';
