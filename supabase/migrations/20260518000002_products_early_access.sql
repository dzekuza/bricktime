alter table products
  add column if not exists early_access_tiers text[] not null default '{}',
  add column if not exists early_access_hours integer not null default 48;
