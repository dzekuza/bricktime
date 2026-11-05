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

- Live DB migrations (applied via Supabase MCP 2026-11-05): `gift_card_pending_status`, `orders_returned_at` (+ backfill), `orders_delivery_snapshot` (+ backfill of 1 open courier order), `budget_period_and_pause`, `used_credits_timestamp_compare`.
- fix/billing-safety commits: no second subscription on upgrade (Checkout uses change-subscription; create-checkout 409s; webhook ignores non-stored subs), gift cards pending until paid, delivery shown as included / fake order amount removed, rental history with dates, courier address snapshot + admin labels, budget frees at next Stripe period (`used_credits`), billing history shows credit applied + swap rollback restores credit, subscription pause (new `pause-subscription`).
- #97: card-only payment while a merch code is held.

## In progress

- Nothing half-written. Edge functions on fix/billing-safety and #97 are NOT deployed.

## Next up

1. Merge #96, then #97, then the fix/billing-safety PR (retarget to main).
2. Deploy edge functions: create-checkout, stripe-webhook, change-subscription, create-gift-card-checkout, verify-gift-card, lpexpress, get-billing-history, create-merch-checkout, pause-subscription (new).
3. In Stripe: find customers with more than one live subscription (Justinas at least) and cancel/refund the extra; check gift cards bought before today whose session was never paid (still `active`).
4. Budget rule needs `current_period_start` — filled by the next subscription/invoice webhook per member; backfill from Stripe for active members if it shouldn't wait.
5. Deploy the storefront and admin; real test purchase (upgrade, courier rental, pause).

## Blockers & open questions

- "Per metus iki 3 mėnesių" pause cap is not enforced across separate pauses (each pause is max 3 months).
- Pausing blocks rentals immediately; the already-paid current month isn't refunded.
- `.claude/hooks/vault-stop-check.sh` is not registered in `.claude/settings.json` — owner's call.
- Supabase MCP declines migrations that contain data UPDATEs; backfills go through `execute_sql`.

## Environment

- **Run:** `pnpm dev` (storefront, :5173), `cd admin && pnpm dev` (admin, :5174/admin/)
- **Deploy:** Vercel (storefront + admin); edge functions + migrations on Supabase project `yzqaiqgzvlmxnehtqazq`; production https://www.bricktime.lt
- **Known issues:** see [[known-issues]] if present
