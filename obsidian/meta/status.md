# Current status — bricks

> [!info] How to use this note
> The **live snapshot** of the project. Read it first when a session starts; rewrite
> it (don't append) whenever the state changes. History belongs in [[session-log]]
> and [[changelog]], not here.

**Last updated:** 2026-11-05

## Current focus

Tester (Justinas) feedback round on billing, rentals and shipping — branch
`fix/billing-safety`, stacked on dzekuza/bricktime#97 (`feat/merch-orders-and-fixes`),
which overlaps dzekuza/bricktime#96.

## Done recently

- Live DB migrations for #98, applied 2026-11-05 via Supabase MCP `apply_migration` (recorded) unless noted: `gift_card_pending_status`, `orders_returned_at` (its backfill ran separately via `execute_sql`), `orders_delivery_snapshot` (backfill of 1 open courier order via `execute_sql`), `budget_period_and_pause`, `used_credits_timestamp_compare`, `begin_subscription_pause`, `mega_courier_rentals`, `budget_fallback_and_pause_reentry`. A `touch_updated_at` side effect of the returned_at backfill was undone for the 3 affected orders.
- #97's migrations `20261105220000`–`220400` applied by hand in the SQL editor (not recorded in schema_migrations).
- #96's migrations (`merch_order_stock_guard`, `_fixes`) are applied live.

## In progress

- Edge functions deployed 2026-11-05 ~19:05 UTC from local branch `deploy/combined` = merge of #96 `5325a36`, #97 `d376cd7` and #98 at `0cb2214`: stripe-webhook v15, verify-gift-card v5, create-gift-card-checkout v7, get-billing-history v7, lpexpress v5, create-merch-checkout v10, create-checkout v11, change-subscription v13, pause-subscription v1. Smoke test: all boot; protected functions return 401 without a user, public ones (verify-gift-card, create-gift-card-checkout, lpexpress, create-merch-checkout, stripe-webhook) reject invalid input with 400/404.
- NOT live yet — #98 review fixes after `0cb2214`: create-checkout, stripe-webhook, create-gift-card-checkout, lpexpress, pause-subscription need redeploying (the migrations they rely on are already live).

## Next up

1. Redeploy create-checkout, stripe-webhook, create-gift-card-checkout, lpexpress, pause-subscription from #98 head (merged with #96/#97 as before).
2. Merge #96, then #97, then #98 (retarget to main). Resolve the #96/#97 overlap as in `deploy/combined`: create-merch-checkout keeps #96's whole-unit stock check and #97's generic gift-card error; stripe-webhook keeps the async gift-card activation; types from the live schema.
3. In Stripe: cancel/refund duplicate live subscriptions (Justinas at least); check gift cards bought before 2026-11-05 whose session was never paid (still `active`).
4. Backfill `current_period_start/end` from Stripe for active members (until then used_credits counts returned sets rented in the last month).
5. Deploy storefront and admin; real test purchase (upgrade, courier rental, pause).

## Blockers & open questions

- "Per metus iki 3 mėnesių" pause cap is not enforced across separate pauses (each pause is max 3 months).
- Pausing blocks rentals immediately; the already-paid current month isn't refunded.
- `.claude/hooks/vault-stop-check.sh` is not registered in `.claude/settings.json` — owner's call.
- Supabase MCP declines migrations that contain data UPDATEs; backfills go through `execute_sql`.

## Environment

- **Run:** `pnpm dev` (storefront, :5173), `cd admin && pnpm dev` (admin, :5174/admin/)
- **Deploy:** Vercel (storefront + admin); edge functions + migrations on Supabase project `yzqaiqgzvlmxnehtqazq`; production https://www.bricktime.lt
- **Known issues:** see [[known-issues]] if present
