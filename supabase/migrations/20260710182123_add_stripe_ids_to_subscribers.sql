alter table subscribers
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text;

comment on column subscribers.stripe_customer_id is 'Stripe customer id for billing portal and invoice sync.';
comment on column subscribers.stripe_subscription_id is 'Active Stripe subscription id for webhook reconciliation.';

create index if not exists idx_subscribers_stripe_customer_id
  on subscribers(stripe_customer_id)
  where stripe_customer_id is not null;

create index if not exists idx_subscribers_stripe_subscription_id
  on subscribers(stripe_subscription_id)
  where stripe_subscription_id is not null;
