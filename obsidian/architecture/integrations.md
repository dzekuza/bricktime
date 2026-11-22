---
tags: [architecture, integrations]
updated: 2026-11-22
---

# Integrations

External services, the module that talks to each, env var names and webhooks. Module links: [[codebase-map]]. Names only; no values.

| Service | Used for | Module | Env var names |
|---|---|---|---|
| Supabase | Auth, Postgres, RLS, edge functions, pg_cron + vault, auth email templates | whole app; client `src/lib/supabase.ts` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| Stripe | subscriptions, one-off Checkout (merch, gift cards, penalties, courier fee incl. Mystery Box requests via `create-mystery-courier-checkout`, metadata `type: mystery_courier`; checkout is idempotent per user and 10-minute bucket, return URLs are allow-listed, refused payments are refunded and recorded in `rejected_checkout_sessions`), invoices, portal, schedules, 21% inclusive VAT, `locale: "lt"` | Billing functions, One-off checkouts, Stripe webhook, `_shared/` | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| LP Express (Unisend) | parcel lockers, shipping and return labels, tracking, cancel | LP Express module | `LP_API_BASE`, `LP_USERNAME`, `LP_PASSWORD`, `LP_SENDER_*` |
| Omnisend | waitlist contacts, `subscription started` event that triggers the welcome email ([[welcome-email]]) | `omnisend-subscribe`, `stripe-webhook` (`pushOmnisendEvent`) | `OMNISEND_API_KEY` |
| WhatsApp (Meta Cloud API or Twilio) | admin alerts for 12 kinds (members, subscriptions, failed payments, orders, requests, gift cards, reviews, test) through template `admin_alert` ("BRICKTIME: {{1}}") on Meta (Graph `v21.0`) or Twilio; provider picked by `WHATSAPP_PROVIDER` or presence of `TWILIO_ACCOUNT_SID`. Not live yet: Meta app, template and secrets pending (from status, 2026-11-22, unverified) | Admin notifications (`_shared/whatsapp.ts`, fan-out in `_shared/alert-channels.ts`) | `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `ADMIN_WHATSAPP_TO`, optional `WHATSAPP_TEMPLATE_NAME`, `WHATSAPP_TEMPLATE_LANG`, `WHATSAPP_PROVIDER`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`, `TWILIO_CONTENT_SID` |
| Telegram Bot API | second admin-alert channel; an alert counts as sent when either channel delivers | Admin notifications (`_shared/telegram.ts`) | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` |
| Google Analytics 4 and Search Console | admin analytics (server read through a service account) | `get-analytics` | `GA4_PROPERTY_ID`, `GSC_SITE_URL`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` |
| GA4 and Meta Pixel (browser) | page views, loaded after consent | `src/lib/analytics.ts`, `ConsentContext` | `VITE_GA_MEASUREMENT_ID`, `VITE_META_PIXEL_ID` |
| Vercel | hosting of the SPA and `/admin` rewrite | `vercel.json` | none read by code (`VERCEL_OIDC_TOKEN` is in `.env.example` only) |
| Geoapify | address autocomplete in the profile dialog (browser call to `api.geoapify.com/v1/geocode/autocomplete`, per-country filter); key is bundled into the client | `src/lib/geoapify.ts` | `VITE_GEOAPIFY_KEY` (optional; feature off when unset) |
| Google Fonts / Maps | fonts in `src/index.css`, map link in Contacts | UI | none |

## Webhooks and inbound calls

| Direction | Route | Caller | Notes |
|---|---|---|---|
| in | `stripe-webhook` (Supabase function URL) | Stripe | `verify_jwt = false` (`supabase/config.toml:65`); events `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `customer.subscription.created/updated/deleted`, `invoice.paid`, `invoice.upcoming` (Omnisend reminder event), `invoice.payment_failed` (admin alert plus Omnisend event) |
| in (cron) | `process-plan-changes` | pg_cron | header `x-cron-secret` compared with `public.cron_secrets` (`name = 'plan_changes'`); the `cron.schedule` call is not in migrations: TODO: unknown |
| in (cron) | `send-admin-notifications` | pg_cron job of the same name, every minute | `supabase/migrations/20261122120000_admin_notifications.sql`; service-role JWT from vault secret `service_role_key`; function checks `role = service_role` |
| in (cron) | `lpexpress-sync` | pg_cron job `lpexpress-delivery-sync`, every 30 min | `supabase/migrations/20260707192807_lpexpress_delivery_activation.sql:25`; URL taken from vault secret `project_url` |
| out | `https://api.omnisend.com/v5/contacts`, `/v5/events` | `omnisend-subscribe`, `stripe-webhook` | |
| out | LP Express API at `LP_API_BASE` | `_shared/lpexpress.ts` | token fetched in `getToken` |
| out | `https://graph.facebook.com/v21.0/<phone number id>/messages` | `_shared/whatsapp.ts` | template message; 429 and 5xx are retried |
| out | Omnisend events `subscription payment upcoming`, `subscription payment failed` | `stripe-webhook` | `pushOmnisendEvent`; a rate limit (429) or server error (5xx) returns 500 so Stripe retries; other 4xx are logged and the webhook still returns 200 |
| out | Stripe API | every Stripe function | `stripe@14.21.0`, API `2024-06-20` |

Merch cart (2026-11-19): `create-merch-checkout` now sends several Stripe line items per session; `checkout.session.completed` still reaches `handleMerchCheckout` (stripe-webhook `index.ts:171`), which writes `merch_order_items` via `record_merch_cart_order`. No new env vars found in the diff.

## Not found in code
Shopify, Klaviyo, Resend, Hostinger: no references in `src/` or `supabase/functions/`.
