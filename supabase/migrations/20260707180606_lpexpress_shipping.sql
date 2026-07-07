-- LP EXPRESS (UNISEND) shipping integration
-- Stores the selected parcel terminal and the shipment identifiers returned
-- by the LP EXPRESS API v2 (parcel id, barcode, tracking state, label PDF).

alter table orders
  add column if not exists lp_terminal_id     text,
  add column if not exists lp_terminal_name   text,
  add column if not exists lp_parcel_id       text,
  add column if not exists lp_barcode         text,
  add column if not exists lp_tracking_state  text,
  add column if not exists lp_label_created_at timestamptz;

comment on column orders.lp_terminal_id is 'LP EXPRESS parcel terminal (paštomatas) id chosen at checkout — null for courier / to-door delivery.';
comment on column orders.lp_parcel_id is 'LP EXPRESS parcel id returned by POST /api/v2/parcel.';
comment on column orders.lp_barcode is 'Tracking barcode assigned after POST /api/v2/shipping/initiate.';
comment on column orders.lp_tracking_state is 'Latest public tracking state (LABEL_CREATED, ON_THE_WAY, PARCEL_DELIVERED, ...).';

create index if not exists idx_orders_lp_barcode on orders(lp_barcode) where lp_barcode is not null;
