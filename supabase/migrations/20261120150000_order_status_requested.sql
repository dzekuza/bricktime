-- A Mystery Box the customer has asked for but admin has not picked a set for
-- yet. Own migration: a new enum value can't be used in the transaction that adds it.
alter type public.order_status add value if not exists 'requested';
-- Rollback: not possible in place (Postgres can't drop an enum value); leave it unused.
