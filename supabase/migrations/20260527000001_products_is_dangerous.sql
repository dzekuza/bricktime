alter table products
  add column if not exists "isDangerous" boolean not null default false;
