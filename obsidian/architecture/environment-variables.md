---
tags: [architecture]
updated: 2026-11-18
---

# Environment Variables

Names only. Sources: `.env.example` (names), `import.meta.env` in `src/`, `Deno.env.get` in `supabase/functions/`. `.env*` files were not opened.

## Rules

- Secrets are **server-only**: edge function secrets via `Deno.env`, never `VITE_*`.
- Never hardcode URLs or keys in source.
- `.env.example` must stay in sync with the table below (see gaps).
- Never log or print an env var value.
- The `.env*` files are edited by the project owner, not by agents.

## Variables

| Name | Scope | Required | Purpose / where read |
|------|-------|----------|---------|
| `VITE_SUPABASE_URL` | client | yes | `src/lib/supabase.ts` and one more use in `src/` |
| `VITE_SUPABASE_ANON_KEY` | client | yes | `src/lib/supabase.ts` |
| `VITE_GA_MEASUREMENT_ID` | client | optional | `src/lib/analytics.ts` |
| `VITE_META_PIXEL_ID` | client | optional | `src/lib/analytics.ts`; **missing from `.env.example`** |
| `VITE_SITE_ACCESS_CODE` | client | optional | `src/hooks/useSiteAccess.ts`, coming-soon gate; bundled into the client, so a soft gate, not a secret |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | server (edge, injected) | yes | every edge function |
| `SUPABASE_SERVICE_ROLE_KEY` | server | yes | 20 functions (admin writes) |
| `STRIPE_SECRET_KEY` | server | yes | all Stripe functions, `stripe-webhook` |
| `STRIPE_WEBHOOK_SECRET` | server | yes | `stripe-webhook` |
| `OMNISEND_API_KEY` | server | yes | `omnisend-subscribe`, `stripe-webhook` |
| `LP_API_BASE`, `LP_USERNAME`, `LP_PASSWORD` | server | yes | `_shared/lpexpress.ts` (`LP_USERNAME`/`LP_PASSWORD` read through the `env()` helper, not a literal `Deno.env.get`) |
| `LP_SENDER_*` (NAME, EMAIL, PHONE, STREET, BUILDING, LOCALITY, POSTCODE, COUNTRY, FLAT) | server | yes | sender party in `_shared/lpexpress.ts` |
| `GA4_PROPERTY_ID`, `GSC_SITE_URL`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | server | yes for admin analytics | `get-analytics` |

Listed in `.env.example` but not read by any code found: `VITE_STRIPE_PUBLISHABLE_KEY`, `DATABASE_URL`, `VERCEL_OIDC_TOKEN`. Read by code but not in `.env.example`: `VITE_META_PIXEL_ID`, `GA4_PROPERTY_ID`, `GSC_SITE_URL`, `GOOGLE_SERVICE_ACCOUNT_*`, `LP_SENDER_FLAT`, `LP_SENDER_COUNTRY`.

## Access

No typed accessor. Client reads `import.meta.env.VITE_*` directly; functions call `Deno.env.get("NAME")!`. Add a name in both the secret store and `.env.example`, and the owner sets the value.

## Related
[[api-architecture]] · [[tech-stack]] · [[integrations]]
