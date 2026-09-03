-- merch_items.stock was a single total across all sizes; switch to a
-- jsonb map of size -> quantity so stock is tracked per variant.
alter table public.merch_items
  drop constraint merch_items_stock_check,
  alter column stock drop default,
  alter column stock type jsonb using '{}'::jsonb,
  alter column stock set default '{}'::jsonb,
  add constraint merch_items_stock_is_object check (jsonb_typeof(stock) = 'object');

comment on column public.merch_items.stock is 'Per-size stock, e.g. {"S": 4, "M": 0, "L": 2}. Keys should match `sizes`.';
