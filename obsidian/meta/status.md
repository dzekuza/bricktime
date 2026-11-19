# Current status — bricks

> [!info] How to use this note
> The **live snapshot** of the project. Read it first when a session starts; rewrite
> it (don't append) whenever the state changes. History belongs in [[session-log]]
> and [[changelog]], not here.

**Last updated:** 2026-11-19

## Current focus

**Merch cart (2026-11-19, branch `feat/merch-cart`, uncommitted):** multi-item merch checkout built and browser-checked; migration `20261119100000` not applied, `create-merch-checkout` / `stripe-webhook` not deployed, no test-mode payment yet. Rental (set) cart planned, not started. See [[session-log]].

**LP shipping (2026-11-19, uncommitted, on `feat/merch-cart` working tree):** size/weight picker + "Ship together" (one parcel for several sets) in admin; `lpexpress` deployed (v11, 2026-11-19); admin UI not yet deployed. H2T pickup toggle added. Open: grouped customer returns, confirm LP honours `size`, courier pickup call.

Branch `fix/subscription-flow` (3 commits, not pushed): account profile refresh after purchase, plan-picker button, and admin Cancel reaching Stripe (`admin-cancel-subscription` v1 live). Still waiting on a real end-to-end test purchase. Uncommitted: "su PVM" note on price surfaces; the 5 leftover active test subs now carry the 21% VAT rate. See [[session-log]].

**Uncommitted TASKS.md pass (2026-11-18):** cancel-confirm dialog, courier price/delivery row + proration breakdown (needs `change-subscription` deploy), admin order address rows + LP error text, rental `returned_at`, `get-analytics` hardening (needs deploy; check GOOGLE*\* secrets), unused PlanChangeSummary/DiscountCodeField removed. Open: mystery_s credits=0 OK, returned-set budget rule question, LP*\* secrets, Stripe dashboard, e2e purchase.

## Done recently

- Live DB migrations for #98, applied 2026-11-05 via Supabase MCP `apply_migration` (recorded) unless noted: `gift_card_pending_status`, `orders_returned_at` (its backfill ran separately via `execute_sql`), `orders_delivery_snapshot` (backfill of 1 open courier order via `execute_sql`), `budget_period_and_pause`, `used_credits_timestamp_compare`, `begin_subscription_pause`, `mega_courier_rentals`, `budget_fallback_and_pause_reentry`, `courier_requires_name`. A `touch_updated_at` side effect of the returned_at backfill was undone for the 3 affected orders.
- #97's migrations `20261105220000`–`220400` applied by hand in the SQL editor (not recorded in schema_migrations).
- #96's migrations (`merch_order_stock_guard`, `_fixes`) are applied live.

## In progress

- Pre-launch test data wiped 2026-11-06 (SQL editor): all rentals, merch orders, gift cards, penalties, missing-part requests, coupons and coupon holds deleted; all 10 subscribers reset to no subscription (accounts kept); Stripe test data deleted from the dashboard. Catalog, plans and merch items untouched.

- Nothing half-written. #96, #97 and #98 are merged into main (`b48260f`, 2026-11-05).
- Edge functions match main: stripe-webhook v16, create-gift-card-checkout v8, lpexpress v6, pause-subscription v2, create-checkout v12 redeployed from `b48260f`; verify-gift-card v5, get-billing-history v7, create-merch-checkout v10, change-subscription v13 were already identical to main. Smoke test: protected functions return 401 without a user, public ones reject invalid input.

## Next up

0. Push `fix/subscription-flow`, open a PR, redeploy admin; test an admin cancel then a re-subscribe.
1. Test purchase + plan change: check lt invoice/Checkout, VAT split, welcome email ([[welcome-email]]), preview dialog.
2. Set `plans.credits` of `mystery_s` to 0 (currently 2000; owner OK pending).
3. Stripe dashboard on `acct_1TgKMU8expYbOWjJ` (not the other account id from the chat): seller VAT id (`default_account_tax_ids` is empty), invoice footer, then fix company tax id / owner verification before live. Invoice numbering is already account-wide and sequential; accountant to confirm VAT-invoice rules.
4. Cancel the leftover test subscriptions of user `4cf81f4c` (5 active) after checking the DB.

## Blockers & open questions

- "Per metus iki 3 mėnesių" pause cap is not enforced across separate pauses (each pause is max 3 months).
- Pausing blocks rentals immediately; the already-paid current month isn't refunded.
- `.claude/hooks/vault-stop-check.sh` is not registered in `.claude/settings.json` — owner's call.
- Supabase MCP declines migrations that contain data UPDATEs; backfills go through `execute_sql`.

## Environment

- **Run:** `pnpm dev` (storefront, :5173), `cd admin && pnpm dev` (admin, :5174/admin/)
- **Deploy:** Vercel (storefront + admin); edge functions + migrations on Supabase project `yzqaiqgzvlmxnehtqazq`; production https://www.bricktime.lt
- **Known issues:** see [[known-issues]] if present

**Update 2026-11-18 (late):** applied live via MCP: migration `returned_sets_free_budget_immediately` (returned sets stop counting at once; file `20261118120000_…`), `plans.credits` of `mystery_s` set to 0 (SQL, not in a migration), deployed `change-subscription` v21 and `get-analytics` v9 (CLI deploy still 403, used MCP). Still open: LP*\* secrets, GOOGLE*\* secrets, Stripe dashboard, welcome email, e2e purchase.
