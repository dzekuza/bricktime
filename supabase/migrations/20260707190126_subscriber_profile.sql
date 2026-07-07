-- Customer profile details (name already exists; add surname, phone, address).
alter table subscribers
  add column if not exists last_name   text,
  add column if not exists phone       text,
  add column if not exists street      text,
  add column if not exists house_no    text,
  add column if not exists flat        text,
  add column if not exists city        text,
  add column if not exists postal_code text;

comment on column subscribers.phone is 'Contact phone — used for LP EXPRESS parcel SMS codes.';
comment on column subscribers.street is 'Address for courier (to-door) delivery.';
