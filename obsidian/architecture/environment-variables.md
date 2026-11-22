---
tags: [architecture]
updated: 2026-11-22
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
| `VITE_GEOAPIFY_KEY` | client | optional | `src/lib/geoapify.ts`; address search disabled when unset; exposed in the bundle, restrict the key by domain in Geoapify. `.env.example` not read on this run: TODO: unknown whether listed |
| `VITE_SITE_ACCESS_CODE` | client | optional | `src/hooks/useSiteAccess.ts`, coming-soon gate; bundled into the client, so a soft gate, not a secret |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | server (edge, injected) | yes | every edge function |
| `SUPABASE_SERVICE_ROLE_KEY` | server | yes | 20 functions (admin writes) |
| `STRIPE_SECRET_KEY` | server | yes | all Stripe functions, `stripe-webhook` |
| `STRIPE_WEBHOOK_SECRET` | server | yes | `stripe-webhook` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | client | needed for the on-page Apple Pay / Google Pay button (hidden when unset); must match the environment of `STRIPE_SECRET_KEY` | `src/lib/stripe.ts` |
| `CHECKOUT_RETURN_ORIGINS` | server | optional, comma-separated; default `https://www.bricktime.lt,https://bricktime.lt`. Origins a wallet checkout may return to | `_shared/stripe-elements.ts` |
| `OMNISEND_API_KEY` | server | yes | `omnisend-subscribe`, `stripe-webhook` |
| `LP_API_BASE`, `LP_USERNAME`, `LP_PASSWORD` | server | yes | `_shared/lpexpress.ts` (`LP_USERNAME`/`LP_PASSWORD` read through the `env()` helper, not a literal `Deno.env.get`) |
| `LP_SENDER_*` (NAME, EMAIL, PHONE, STREET, BUILDING, LOCALITY, POSTCODE, COUNTRY, FLAT) | server | yes | sender party in `_shared/lpexpress.ts` |
| `GA4_PROPERTY_ID`, `GSC_SITE_URL`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | server | yes for admin analytics | `get-analytics` |
| `ADMIN_WHATSAPP_TO` | server | required for WhatsApp alerts | `_shared/whatsapp.ts:24` |
| `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` | server | required for the Meta provider | `_shared/whatsapp.ts:33` |
| `WHATSAPP_PROVIDER` | server | optional; else Twilio when `TWILIO_ACCOUNT_SID` is set, otherwise Meta | `_shared/whatsapp.ts:18` |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM` | server | required for the Twilio provider; `TWILIO_CONTENT_SID` optional | `_shared/whatsapp.ts:27,123-125` |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | server | required for Telegram alerts (rows stay pending when no channel is configured) | `_shared/telegram.ts:12` |
| `WHATSAPP_TEMPLATE_NAME`, `WHATSAPP_TEMPLATE_LANG` | server | optional (defaults `admin_alert`, `lt`) | `_shared/whatsapp.ts:108-109` |

Listed in `.env.example` but not read by any code found: `DATABASE_URL`, `VERCEL_OIDC_TOKEN`. Read by code but not in `.env.example`: `VITE_META_PIXEL_ID`, `GA4_PROPERTY_ID`, `GSC_SITE_URL`, `GOOGLE_SERVICE_ACCOUNT_*`, `LP_SENDER_FLAT`, `LP_SENDER_COUNTRY`.

## Access

No typed accessor. Client reads `import.meta.env.VITE_*` directly; functions call `Deno.env.get("NAME")!`. Add a name in both the secret store and `.env.example`, and the owner sets the value.

## Related
[[api-architecture]] · [[tech-stack]] · [[integrations]]
