---
tags: [architecture]
updated: 2026-11-16
---

# Environment Variables

Names only, never values. Sources: `import.meta.env.*` in `src/` and `admin/src/`, `Deno.env.get` in `supabase/functions/`. `.env.local` files were not opened.

## Rules

- Secrets are **server-only** (edge function secrets, set with `supabase secrets set`); this is a Vite app, so the client prefix is `VITE_`, not `NEXT_PUBLIC_`. Anything `VITE_*` ships in the browser bundle.
- Never hardcode URLs or keys in source.
- `.env.example` must stay in sync. **There is no `.env.example` in the repo root or in `admin/`** (only `.env.local` files, gitignored); this violates the global rule, see [[deepening-candidates]] and the report.
- Never log or print an env var value.
- The `.env*` files are edited by the project owner, not by agents.

## Variables

### Storefront (client, `VITE_*`)

| Name | Scope | Required | Read in | Purpose |
|------|-------|----------|---------|---------|
| `VITE_SUPABASE_URL` | client | yes | `src/lib/supabase.ts`, `src/lib/media.ts` | Supabase project URL, storage base for site media |
| `VITE_SUPABASE_ANON_KEY` | client | yes | `src/lib/supabase.ts` | anon key (RLS applies) |
| `VITE_SITE_ACCESS_CODE` | client | no | `src/hooks/useSiteAccess.ts` | pre-launch access gate; when unset the gate is open. Visible in the bundle, so not a secret |
| `VITE_GA_MEASUREMENT_ID` | client | no | `src/lib/analytics.ts` | Google Analytics, loaded only after consent |
| `VITE_META_PIXEL_ID` | client | no | `src/lib/analytics.ts` | Meta Pixel, loaded only after consent |

### Admin (client)

| Name | Scope | Required | Read in | Purpose |
|------|-------|----------|---------|---------|
| `VITE_SUPABASE_URL` | client | yes | `admin/src/lib/supabase.ts` | same Supabase project |
| `VITE_SUPABASE_ANON_KEY` | client | yes | `admin/src/lib/supabase.ts` | anon key |
| `VITE_ADMIN_EMAIL` | client | no | `admin/src/context/AuthContext.tsx` | UI gate: only this email sees the dashboard; falls back to a hardcoded default in source. Server-side admin checks use `app_metadata.role = 'admin'` instead |

### Edge functions (server, Deno secrets)

| Name | Required | Read in | Purpose |
|------|----------|---------|---------|
| `SUPABASE_URL` | yes (auto-injected) | nearly every function | project URL |
| `SUPABASE_ANON_KEY` | yes (auto-injected) | functions that act as the caller (`change-subscription`, `create-checkout`, `lpexpress`, ...) | verify the caller JWT |
| `SUPABASE_SERVICE_ROLE_KEY` | yes (auto-injected) | all functions that write | privileged client; also used as the bearer for admin/cron calls |
| `STRIPE_SECRET_KEY` | yes | `stripe-webhook`, `create-*checkout`, `change-subscription`, `cancel-subscription`, `pause-subscription`, `process-plan-changes`, `create-billing-portal`, `get-billing-history`, `delete-account` | Stripe API |
| `STRIPE_WEBHOOK_SECRET` | yes | `stripe-webhook` | signature verification |
| `OMNISEND_API_KEY` | no (skips push when absent in webhook) | `stripe-webhook`, `omnisend-subscribe` | Omnisend contacts and events |
| `LP_API_BASE` | no (defaults to LP test host) | `_shared/lpexpress.ts` | LP EXPRESS / Unisend base URL (test vs prod) |
| `LP_USERNAME`, `LP_PASSWORD` | yes for shipping | `_shared/lpexpress.ts` | Unisend business account |
| `LP_SENDER_NAME`, `LP_SENDER_PHONE`, `LP_SENDER_EMAIL`, `LP_SENDER_LOCALITY`, `LP_SENDER_POSTCODE`, `LP_SENDER_STREET`, `LP_SENDER_BUILDING` | yes for courier labels | `_shared/lpexpress.ts` | sender address on labels |
| `LP_SENDER_FLAT`, `LP_SENDER_COUNTRY` | no (country defaults `LT`) | `_shared/lpexpress.ts` | sender address |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | yes for analytics | `get-analytics` | service account for GA4 and Search Console |
| `GA4_PROPERTY_ID`, `GSC_SITE_URL` | yes for analytics | `get-analytics` | which property and site |

### Database-side secrets (not env vars)

| Name | Where | Purpose |
|------|-------|---------|
| `project_url`, `service_role_key` | Supabase Vault (`vault.decrypted_secrets`), created by the operator | read by the `lpexpress-delivery-sync` cron job |
| `plan_changes` row | `public.cron_secrets` table | shared secret compared in `process-plan-changes` against header `x-cron-secret` |

## Access

No typed accessor. Storefront and admin read `import.meta.env` inline; edge functions call `Deno.env.get` at module scope (`_shared/lpexpress.ts` uses a throwing `env()` helper). Add a new var by setting the secret, reading it in the function, and adding its name here.

## Related

[[api-architecture]] · [[tech-stack]] · [[integrations]]
