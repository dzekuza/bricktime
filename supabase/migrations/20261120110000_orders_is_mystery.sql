-- Set at creation for orders placed on a Mystery Box plan; the storefront keeps
-- the set hidden (blurred) until it has been delivered.
alter table public.orders
  add column if not exists is_mystery boolean not null default false;
