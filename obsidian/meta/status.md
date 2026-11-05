# Current status — bricks

> [!info] How to use this note
> The **live snapshot** of the project. Read it first when a session starts; rewrite
> it (don't append) whenever the state changes. History belongs in [[session-log]]
> and [[changelog]], not here.

**Last updated:** 2026-11-05

## Current focus

Merch checkout hardening across two open PRs that touch the same edge functions:
dzekuza/bricktime#96 (`fix/merch-payment-hardening`: paid-only order recording,
stock guard, card-only payment with gift cards) and dzekuza/bricktime#97
(`feat/merch-orders-and-fixes`: login-bound gift card holds, per-user coupon holds,
owner-only order lookup, plus briksiai/plan-summary/analytics fixes).

## Done recently

- #97's migrations (20261105220000–220300) are applied live and verified: `gift_cards.reserved_by`, `coupon_holds` (RLS, index, per-user), 3-arg `claim_coupon_hold` (service role only), order lookup hides buyer details for guest orders older than 1h.
- #96's migrations (`merch_order_stock_guard`, `_fixes`) are applied live; `merch_orders.stock_short` exists.
- Database types regenerated in both apps from the live schema.
- Gift cards held for 35 min at any checkout. Live before #97: create-checkout v9, create-merch-checkout v7, stripe-webhook v13.

## In progress

- #97 addressing cubic review: delayed payments keep coupon/gift card holds for 14 days (new `checkout.session.async_payment_failed` handler releases them), coupon hold kept if `redeem_coupon` fails, briksiai warning waits for the plan to load, downgrade wording fixes.

## Next up

1. Merge #96 first, then rebase #97 onto main and resolve the overlap in `create-merch-checkout`, `stripe-webhook`, `change-subscription`.
2. Deploy `create-merch-checkout`, `stripe-webhook`, `change-subscription` after both merge, and enable `checkout.session.async_payment_failed` on the Stripe webhook endpoint.
3. Deploy the storefront (`/merch/aciu`, code field, briksiai and summary fixes).
4. Omnisend automation for `merch order placed`; delete test order #1003; one real gift-card purchase end to end.
5. Backfill merch payments taken before 2026-11-05 from Stripe (needs Stripe MCP auth).

## Blockers & open questions

- `.claude/hooks/vault-stop-check.sh` is not registered in `.claude/settings.json`, so it never runs. Register it under `hooks.Stop` or remove it — owner's call.
- Gift cards are single-use: value above the item/first-invoice price is lost. A balance would need a schema change — undecided.
- Supabase CLI token here lacks deploy/db privileges; the Supabase MCP declines `apply_migration`, so migrations go through the SQL editor by hand.

## Environment

- **Run:** `pnpm dev` (storefront, :5173), `cd admin && pnpm dev` (admin, :5174/admin/)
- **Deploy:** Vercel (storefront + admin); edge functions + migrations on Supabase project `yzqaiqgzvlmxnehtqazq`; production https://www.bricktime.lt
- **Known issues:** see [[known-issues]] if present
