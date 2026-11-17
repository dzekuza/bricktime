---
tags: [architecture, integrations]
updated: 2026-11-18
---

# Integrations

External services, the module that talks to each, env var names and webhooks. Module links: [[codebase-map]]. Names only; no values.

| Service | Used for | Module | Env var names |
|---|---|---|---|
| Supabase | Auth, Postgres, RLS, edge functions, pg_cron + vault, auth email templates | whole app; client `src/lib/supabase.ts` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| Stripe | subscriptions, one-off Checkout (merch, gift cards, penalties, courier fee), invoices, portal, schedules, 21% inclusive VAT, `locale: "lt"` | Billing functions, One-off checkouts, Stripe webhook, `_shared/` | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| LP Express (Unisend) | parcel lockers, shipping and return labels, tracking, cancel | LP Express module | `LP_API_BASE`, `LP_USERNAME`, `LP_PASSWORD`, `LP_SENDER_*` |
| Omnisend | waitlist contacts, `subscription started` event that triggers the welcome email ([[welcome-email]]) | `omnisend-subscribe`, `stripe-webhook` (`pushOmnisendEvent`) | `OMNISEND_API_KEY` |
| Google Analytics 4 and Search Console | admin analytics (server read through a service account) | `get-analytics` | `GA4_PROPERTY_ID`, `GSC_SITE_URL`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` |
| GA4 and Meta Pixel (browser) | page views, loaded after consent | `src/lib/analytics.ts`, `ConsentContext` | `VITE_GA_MEASUREMENT_ID`, `VITE_META_PIXEL_ID` |
| Vercel | hosting of the SPA and `/admin` rewrite | `vercel.json` | none read by code (`VERCEL_OIDC_TOKEN` is in `.env.example` only) |
| Google Fonts / Maps | fonts in `src/index.css`, map link in Contacts | UI | none |

## Webhooks and inbound calls

| Direction | Route | Caller | Notes |
|---|---|---|---|
| in | `stripe-webhook` (Supabase function URL) | Stripe | `verify_jwt = false` (`supabase/config.toml:65`); events `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `customer.subscription.created/updated/deleted`, `invoice.paid`, `invoice.payment_failed` |
| in (cron) | `process-plan-changes` | pg_cron | header `x-cron-secret` compared with `public.cron_secrets` (`name = 'plan_changes'`); the `cron.schedule` call is not in migrations: TODO: unknown |
| in (cron) | `lpexpress-sync` | pg_cron job `lpexpress-delivery-sync`, every 30 min | `supabase/migrations/20260707192807_lpexpress_delivery_activation.sql:25`; URL taken from vault secret `project_url` |
| out | `https://api.omnisend.com/v5/contacts`, `/v5/events` | `omnisend-subscribe`, `stripe-webhook` | |
| out | LP Express API at `LP_API_BASE` | `_shared/lpexpress.ts` | token fetched in `getToken` |
| out | Stripe API | every Stripe function | `stripe@14.21.0`, API `2024-06-20` |

## Not found in code
Shopify, Klaviyo, Resend, Hostinger: no references in `src/` or `supabase/functions/`.
