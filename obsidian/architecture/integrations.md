---
tags: [architecture, integrations]
updated: 2026-11-16
synced_commit: a985f7f
---

# Integrations

Every external service the code talks to, verified in code at `a985f7f`. Env var names are in [[environment-variables]]; owning modules in [[codebase-map]].

| Service | Used for | Talking module | Env var names |
|---|---|---|---|
| Supabase | Auth, Postgres, Storage (`site-content`, `site-media`, `products`, `community-images`), Edge Functions, `pg_cron`, `pg_net`, Vault | every module; client `src/lib/supabase.ts`, `admin/src/lib/supabase.ts`; project ref `yzqaiqgzvlmxnehtqazq` per `meta/status.md` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| Stripe | Subscription Checkout (mode `subscription`), one-off Checkout (merch, gift cards, penalties, the 3 EUR rental courier fee), refunds of a courier fee the webhook refuses, invoices and gap invoices on plan swaps, subscription schedules for scheduled downgrades, coupons, tax rate (21% inclusive LT VAT), billing portal, refunds, customer records | [[billing-edge]] (`stripe@14.21.0`, API `2024-06-20`); one-offs in [[fulfilment-edge]] | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| LP EXPRESS (Unisend) | Parcel terminals list, outbound and return labels, label PDF, tracking, shipment cancel, delivery auto-activation | `_shared/lpexpress.ts` via `lpexpress` and `lpexpress-sync` in [[fulfilment-edge]]; browser wrappers in [[storefront-shared]] | `LP_API_BASE`, `LP_USERNAME`, `LP_PASSWORD`, `LP_SENDER_*` |
| Omnisend | Waitlist contact tagged `coming-soon`, events `coming soon subscribed`, `subscription started`, `gift card purchased`, `merch order placed`; the emails are built in the Omnisend account (see [[welcome-email]]) | `omnisend-subscribe`, `stripe-webhook` | `OMNISEND_API_KEY` |
| Google Analytics 4 (Data API) and Search Console | Admin analytics page, read-only | `get-analytics` in [[fulfilment-edge]], consumed by [[admin-module]] | `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`, `GA4_PROPERTY_ID`, `GSC_SITE_URL` |
| Google Analytics (gtag) and Meta Pixel (browser) | Pageview tracking after cookie consent | `src/lib/analytics.ts`, `ConsentContext` | `VITE_GA_MEASUREMENT_ID`, `VITE_META_PIXEL_ID` |
| Vercel | Hosting of storefront and admin (one build; `vercel.json` rewrites) | build config only | none read in code |
| esm.sh | Deno imports of `stripe@14.21.0` and `@supabase/supabase-js@2` (unpinned) | all edge functions | none |
| Hostinger | No reference found in code | n/a | TODO: unknown (task prompt mentions it as a typical service; not used here) |

## Webhooks and scheduled calls in

| Route | Caller | Auth | Notes |
|---|---|---|---|
| `POST /functions/v1/stripe-webhook` | Stripe | `stripe-signature` verified with `STRIPE_WEBHOOK_SECRET`; `verify_jwt = false` in `supabase/config.toml` | events handled (unchanged at `a985f7f`; `rental_courier` sessions are routed by `metadata.type`): `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `customer.subscription.created/updated/deleted`, `invoice.paid`, `invoice.payment_failed`. Not handled: `checkout.session.async_payment_failed`, `checkout.session.expired` (referenced in vault notes as configured on the endpoint; code ignores them) |
| `POST /functions/v1/create-rental-courier-checkout` | browser (`Checkout.tsx`) | member JWT (gateway default) | opens the courier-fee Checkout; the paid session returns to `/checkout?product=<id>&courier_paid=true&session_id=<id>`; webhook then creates the rental |
| `POST /functions/v1/lpexpress-sync` | `pg_cron` job `lpexpress-delivery-sync` every 30 min via `pg_net` | bearer service-role key from Vault | also admin "Sync tracking" |
| `POST /functions/v1/process-plan-changes` | `pg_cron` (schedule not in repo) | header `x-cron-secret` vs `public.cron_secrets` row `plan_changes` | TODO: unknown live schedule |

## Webhooks and calls out

| Target | From | Purpose |
|---|---|---|
| `https://api.omnisend.com/v5/events` | `stripe-webhook` (`pushOmnisendEvent`, line 66), `omnisend-subscribe` | automation triggers |
| `https://api.omnisend.com/v5/contacts` | `omnisend-subscribe` | waitlist upsert |
| LP EXPRESS API (`LP_API_BASE`, default test host `api-manosiuntostst.post.lt`, prod `api-manosiuntos.post.lt`) | `_shared/lpexpress.ts` | logistics |
| `oauth2.googleapis.com/token`, `analyticsdata.googleapis.com/v1beta`, Search Console API | `get-analytics` | analytics |
| Stripe redirect (Checkout and billing portal URLs) | browser | payment |

Note: the LP base URL defaults to the **test** host when `LP_API_BASE` is unset, so a missing secret silently targets the sandbox.
