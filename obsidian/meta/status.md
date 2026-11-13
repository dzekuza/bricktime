# Current status — bricks

> [!info] How to use this note
> The **live snapshot** of the project. Read it first when a session starts; rewrite
> it (don't append) whenever the state changes. History belongs in [[session-log]]
> and [[changelog]], not here.

**Last updated:** 2026-11-10

## Current focus

All of PRs #102–#105 are merged (VAT, lt locale, welcome event, merch delivery, plan-change confirmation). Waiting on a real end-to-end test purchase. See [[session-log]].

## Done recently

- Live DB migrations for #98, applied 2026-11-05 via Supabase MCP `apply_migration` (recorded) unless noted: `gift_card_pending_status`, `orders_returned_at` (its backfill ran separately via `execute_sql`), `orders_delivery_snapshot` (backfill of 1 open courier order via `execute_sql`), `budget_period_and_pause`, `used_credits_timestamp_compare`, `begin_subscription_pause`, `mega_courier_rentals`, `budget_fallback_and_pause_reentry`, `courier_requires_name`. A `touch_updated_at` side effect of the returned_at backfill was undone for the 3 affected orders.
- #97's migrations `20261105220000`–`220400` applied by hand in the SQL editor (not recorded in schema_migrations).
- #96's migrations (`merch_order_stock_guard`, `_fixes`) are applied live.

## In progress

- Pre-launch test data wiped 2026-11-06 (SQL editor): all rentals, merch orders, gift cards, penalties, missing-part requests, coupons and coupon holds deleted; all 10 subscribers reset to no subscription (accounts kept); Stripe test data deleted from the dashboard. Catalog, plans and merch items untouched.

- Nothing half-written. #96, #97 and #98 are merged into main (`b48260f`, 2026-11-05).
- Edge functions match main: stripe-webhook v16, create-gift-card-checkout v8, lpexpress v6, pause-subscription v2, create-checkout v12 redeployed from `b48260f`; verify-gift-card v5, get-billing-history v7, create-merch-checkout v10, change-subscription v13 were already identical to main. Smoke test: protected functions return 401 without a user, public ones reject invalid input.

## Next up

1. Test purchase + plan change: check lt invoice/Checkout, VAT split, welcome email ([[welcome-email]]), preview dialog.
2. Set `plans.credits` of `mystery_s` to 0 (currently 2000; owner OK pending).
3. Stripe dashboard: seller details, VAT id, invoice numbering (accountant to confirm the invoice meets VAT-invoice rules).

## Blockers & open questions

- "Per metus iki 3 mėnesių" pause cap is not enforced across separate pauses (each pause is max 3 months).
- Pausing blocks rentals immediately; the already-paid current month isn't refunded.
- `.claude/hooks/vault-stop-check.sh` is not registered in `.claude/settings.json` — owner's call.
- Supabase MCP declines migrations that contain data UPDATEs; backfills go through `execute_sql`.

## Environment

- **Run:** `pnpm dev` (storefront, :5173), `cd admin && pnpm dev` (admin, :5174/admin/)
- **Deploy:** Vercel (storefront + admin); edge functions + migrations on Supabase project `yzqaiqgzvlmxnehtqazq`; production https://www.bricktime.lt
- **Known issues:** see [[known-issues]] if present
