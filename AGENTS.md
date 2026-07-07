# AGENTS.md

BRICKTIME storefront (`vite-app`) — customer-facing landing page + LEGO-rental subscription flow.
React 19 · Vite 7 · TS · Tailwind v4 (`@tailwindcss/vite`, no config file) · shadcn `radix-nova` · GSAP.

## Commands (pnpm)

```bash
pnpm dev          # dev server
pnpm build        # tsc -b && vite build
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint .
pnpm format       # prettier --write
```

## Layout

- `src/` — this app. `pages/`, `components/` (+ `components/ui/` shadcn), `lib/`, `hooks/`, `data/`, `contexts/`. Alias `@/` → `src/`.
- `supabase/functions/` — **Deno edge functions** (Stripe checkout, gift cards, penalties, billing portal, LP Express shipping). `supabase/migrations/` — SQL.
- `admin/` — **git submodule** (`bricktime-admin`), a separate app. Don't edit it from here unless asked.
- Ignore siblings `next-app/`, `explainer-video/`, `bricktime/` unless asked.

## Service model

LEGO rental subscription. Users pick a tier (Nano → Mega) giving a monthly **€ budget**, claim
catalog products (`/archive`) within budget, hold multiple at once (Σ value ≤ budget), and **return**
to free up budget. Products are tier-gated. Copy is **Lithuanian** — match tone, don't translate to English.

## Data & backend

- Supabase for auth/DB/payments — client in `src/lib/supabase.ts`, generated types in `src/lib/database.types.ts`.
- Payments/shipping run through the edge functions above (Stripe + LP Express/Unisend). Secrets via `Deno.env` — never hardcode.
- Some landing content is still static (`src/data/`, inline arrays).

## Design system

Bold brutalist "brick" look, light-mode only. Tokens/classes in `src/index.css`: brand colors
(`ink #001B21`, `brand-*`, `cream`), fonts (`font-display` Bricolage 800 / `font-sans` Space Grotesk /
`font-mono` JetBrains), component classes `brick-card`, `brick-card-hover`, `brick-hover-sm`, `label-mono`,
`heading-display`, `text-d-*` scale, `studs-*`. Never hardcode colors/radii/fonts. GSAP owns inline
`boxShadow`/animated `transform` — use the `brick-*` hover classes for lift, not className shadows.
