---
tags: [architecture, codebase-map]
updated: 2026-11-16
synced_commit: a985f7f
---

# Fulfilment edge functions

### Gift card, merch, shipping and account edge functions — `supabase/functions/`

Purpose: the one-off purchases (gift cards, merch), LP EXPRESS (Unisend) parcel logistics, the Omnisend waitlist, account deletion and the admin analytics proxy. Domain terms: **gift card** (code, `amount_cents`, status `pending`/`active`/`used`/`expired`, `reserved_until` hold), **coupon** (percentage or fixed, optional duration), **terminal** (LP parcel locker), **courier** (+3 EUR delivery), **label** (outbound or return barcode and PDF), **record_merch_order**.

Interface: `POST /functions/v1/<name>`, CORS, JSON, `{ error }` on failure. Auth differs per function (see table). `lpexpress` takes `{ action, ...params }`.

Depends on: [[database-module]] (`gift_cards`, `coupons`, `coupon_holds`, `merch_items`, `orders`, `subscribers`; RPCs `claim_coupon_hold`, `record_merch_order` through the webhook), external: Stripe, LP EXPRESS / Unisend, Omnisend, Google Analytics Data API and Search Console.
Used by: [[storefront-pages]], [[storefront-shared]] (`lib/lpexpress.ts`, `TerminalPicker`, `OrderTracking`, `ReturnDialog`, `MerchDelivery`, `MerchDiscountCode`, `useDiscountCode`, `WaitlistForm`, `DeleteAccountDialog`), [[admin-module]], `pg_cron`.

<!-- auto:start module=fulfilment-edge -->
| Function / export | File:line | Signature (one line) | Does | Called from |
|---|---|---|---|---|
| `create-gift-card-checkout` | `create-gift-card-checkout/index.ts:23` | POST `{amountCents, recipientEmail, buyerEmail, message, successUrl, cancelUrl}` -> Checkout URL | Saves a `pending` gift card row, then creates the Stripe session; amount must be one of 2000, 3000, 5000, 8000, 10000, 20000. **No JWT check in the function body** | `Checkout.tsx` |
| `generateCode` | `create-gift-card-checkout/index.ts:15` | internal | Gift card code | same |
| `verify-gift-card` | `verify-gift-card/index.ts:8` | POST `{code}` -> `{valid, amountCents, code}` | Public lookup by code with service role; pending cards report "not found" | `Subscribe.tsx`, `Checkout.tsx`, `useDiscountCode.ts`, `MerchDiscountCode.tsx` |
| `create-merch-checkout` | `create-merch-checkout/index.ts:26` | POST `{itemId, size, successUrl, cancelUrl, userEmail, code, deliveryMethod, terminal}` -> Checkout URL | Prices from DB, checks size and stock, one code per order, holds gift card or `claim_coupon_hold`, decides courier fee server-side; item and courier line both carry the 21% inclusive VAT rate `getVatTaxRateId` (PR #113) | `MerchDrop.tsx` |
| `resolveDiscount`, `releaseGiftCard`, `releaseCouponHold` | `create-merch-checkout/index.ts:241,336,350` | internal | Code resolution and hold release on Stripe failure | same |
| `lpexpress` | `lpexpress/index.ts:87` | POST `{action}`: `terminals`, `tracking` (public), `create-label`, `create-return-label`, `label-pdf`, `cancel` (order owner or admin) | LP EXPRESS gateway; `requireOwnedOrder` ties the order to the caller, `isAdmin` accepts service role or `app_metadata.role = 'admin'` | `src/lib/lpexpress.ts`, `admin/src/lib/lpexpress.ts`, `admin/src/pages/Orders.tsx` |
| `getUser`, `isAdmin`, `requireOwnedOrder`, `toBase64` | `lpexpress/index.ts:45,59,72,32` | internal | auth and encoding | lpexpress |
| `lpexpress-sync` | `lpexpress-sync/index.ts:54` | POST, service role or admin | Polls tracking for `processing` orders with an outbound barcode; flips to `active` when delivered | `pg_cron` every 30 min, `admin/src/pages/Orders.tsx` ("Sync tracking") |
| `isAuthorized`, `latestState`, `eventDate` | `lpexpress-sync/index.ts:31,49,43` | internal | helpers | lpexpress-sync |
| `ltPhone` | `_shared/lpexpress.ts:32` | `(raw) => string` | Normalises LT phone numbers to `+370...` | lpexpress |
| `listTerminals`, `createLabel`, `createReturnLabel`, `getLabelPdf`, `getTracking`, `cancelShipment` | `_shared/lpexpress.ts:147,181,248,283,300,309` | typed wrappers | LP API v2 client with module-scope OAuth token cache (about 1 h) | lpexpress, lpexpress-sync |
| `omnisend-subscribe` | `omnisend-subscribe/index.ts:9` | POST `{email}` | Upserts an Omnisend contact tagged `coming-soon` (then an event call at line 68) | `WaitlistForm.tsx` |
| `delete-account` | `delete-account/index.ts:24` | POST (JWT) | Refuses while orders are not returned; cancels Stripe subscription; deletes the auth user (cascade) | `DeleteAccountDialog.tsx` |
| `delete-subscriber` | `delete-subscriber/index.ts:9` | POST (admin JWT, `app_metadata.role`) | Admin deletes an auth user and cascaded rows | `admin/src/pages/Subscribers.tsx` |
| `get-analytics` | `get-analytics/index.ts:178` | POST `{days = 28}` | Service-account JWT to Google, GA4 report and Search Console; requires only a signed-in user (no admin check in code) | `admin/src/pages/Analytics.tsx` |
| `fetchGa`, `fetchGsc`, `getAccessToken`, `pemToDer`, `base`, `toDateString` | `get-analytics/index.ts:79,125,32,23,14,75` | internal | Google API plumbing | get-analytics |
<!-- auto:end -->

Counts: 8 handlers, 6 exported LP wrappers + `ltPhone`, about 15 internal helpers.

Notes (hand-written): `supabase/config.toml:64-65` sets `verify_jwt = false` only for `stripe-webhook`; every other function keeps the gateway default (JWT required, the anon key counts), so the public-looking ones (`verify-gift-card`, `create-gift-card-checkout`, `omnisend-subscribe`, `lpexpress` read actions) are reachable with the public anon key. `process-plan-changes` authenticates by `x-cron-secret` but is not listed in config.toml, so its cron caller must also send a JWT (TODO: unknown how the live job does this). Gift card code lookup (`verify-gift-card`) is unauthenticated and uses the service role; no rate limiting is visible in code. The merch flow records the order in the webhook (`record_merch_order`), not in `create-merch-checkout`.
