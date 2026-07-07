-- Returns: backfill drift (return_note column + owner UPDATE policy) and add
-- the LP EXPRESS return-shipment columns (prepaid return label: customer's
-- paštomatas → BRICKTIME door).

-- 1. return_note — decline reason shown to the customer (drift: existed on
--    remote, absent from migrations).
alter table orders
  add column if not exists return_note text;

-- 2. Return shipment (a separate parcel from the outbound lp_* columns).
alter table orders
  add column if not exists lp_return_terminal_id     text,
  add column if not exists lp_return_parcel_id        text,
  add column if not exists lp_return_barcode          text,
  add column if not exists lp_return_tracking_state   text,
  add column if not exists lp_return_label_created_at timestamptz,
  add column if not exists return_requested_at        timestamptz;

comment on column orders.lp_return_terminal_id is 'Terminal the customer drops the return parcel at.';
comment on column orders.lp_return_barcode is 'Tracking barcode of the prepaid return shipment.';

create index if not exists idx_orders_lp_return_barcode on orders(lp_return_barcode) where lp_return_barcode is not null;

-- 3. Owner UPDATE policy — customers request returns from their account
--    (drift: the update worked on remote but no policy was in migrations).
--    Restricted to their own rows; WITH CHECK keeps ownership fixed.
drop policy if exists orders_update_own on orders;
create policy orders_update_own on orders
  for update
  using (subscriber_id = auth.uid())
  with check (subscriber_id = auth.uid());
