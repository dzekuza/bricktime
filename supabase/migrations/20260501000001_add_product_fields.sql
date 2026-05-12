-- Add build_time, value, and faq columns to products table
alter table products
  add column if not exists build_time  text,
  add column if not exists value       numeric(10,2),
  add column if not exists faq         jsonb         not null default '[]';
