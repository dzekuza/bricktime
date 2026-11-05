# Current status — bricks

> [!info] How to use this note
> The **live snapshot** of the project. Read it first when a session starts; rewrite
> it (don't append) whenever the state changes. History belongs in [[session-log]]
> and [[changelog]], not here.

**Last updated:** 2026-11-05

## Current focus

Merch sales end to end: recording paid orders, discount codes / gift cards at
merch checkout, and fulfilment from the admin.

## Done recently

- Gift cards are held for 35 min when applied at any checkout (merch + subscription) — closes a double-spend gap. Live: create-checkout v9, create-merch-checkout v7, stripe-webhook v13.
- Merch checkout accepts one discount code or gift card, priced server-side.
- `merch_orders` table + webhook handling: paid merch is recorded, per-size stock decremented, Omnisend `merch order placed` event pushed.
- Storefront `/merch/aciu` thank-you page (real order lookup); admin Orders page has a Merch tab with ship/tracking.
- Admin: grouped sidebar; merch editor has a Description field.

## In progress

- Nothing half-written in code. Storefront changes (thank-you page, code field) are committed but not yet deployed to production.

## Next up

1. Deploy the storefront so shoppers get `/merch/aciu` and the code field.
2. Create the Omnisend automation for the `merch order placed` event (no confirmation email until then).
3. Delete test order #1003 (`stripe_session_id = 'cs_test_claude_preview'`).
4. One real gift-card purchase to exercise the hold end to end.
5. Backfill merch payments taken before 2026-11-05 from Stripe (needs Stripe MCP auth).

## Blockers & open questions

- Gift cards are single-use: value above the item/first-invoice price is lost. A balance would need a schema change — undecided.
- Supabase CLI token here lacks deploy/db privileges; deploys and migrations go through the Supabase MCP.

## Environment

- **Run:** `pnpm dev` (storefront, :5173), `cd admin && pnpm dev` (admin, :5174/admin/)
- **Deploy:** Vercel (storefront + admin); edge functions + migrations on Supabase project `yzqaiqgzvlmxnehtqazq`; production https://www.bricktime.lt
- **Known issues:** see [[known-issues]] if present
