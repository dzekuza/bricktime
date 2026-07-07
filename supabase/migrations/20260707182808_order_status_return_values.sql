-- Backfill order_status enum values that exist on the remote DB but were never
-- captured in a migration (schema drift). Idempotent — no-op where present.
-- Kept in its own migration: ALTER TYPE ... ADD VALUE must not share a
-- transaction with statements that use the new value.

alter type order_status add value if not exists 'return_requested';
alter type order_status add value if not exists 'return_declined';
