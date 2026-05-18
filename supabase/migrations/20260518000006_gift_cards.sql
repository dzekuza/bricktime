create table gift_cards (
  id                  uuid primary key default gen_random_uuid(),
  code                text unique not null,
  amount_cents        int not null,
  recipient_email     text not null,
  buyer_email         text not null,
  message             text,
  status              text not null default 'active'
                        check (status in ('active', 'used', 'expired')),
  stripe_session_id   text,
  redeemed_by_user_id uuid references auth.users(id),
  redeemed_at         timestamptz,
  expires_at          timestamptz not null default (now() + interval '1 year'),
  created_at          timestamptz not null default now()
);

alter table gift_cards enable row level security;

create policy "Read gift card by code"
  on gift_cards for select
  using (true);

create policy "Service role insert"
  on gift_cards for insert
  with check (false);

create policy "Service role update"
  on gift_cards for update
  using (false);
