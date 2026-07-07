# CLAUDE.md

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
- `admin/` — **git submodule** (`bricktime-admin`), a separate app with its own `.claude/`. Don't edit it from here unless asked. Also ignore siblings `next-app/`, `explainer-video/`, `bricktime/`.

## Service model

LEGO rental subscription. Users pick a tier (Nano → Mega) giving a monthly **€ budget**, claim
catalog products (`/archive`) within budget, hold multiple at once (Σ value ≤ budget), and **return**
to free up budget. Products are tier-gated. Copy is **Lithuanian** — match tone, don't translate to English.

## Data & backend

- Supabase for auth/DB/payments — client in `src/lib/supabase.ts`, generated types in `src/lib/database.types.ts`.
- Payments/shipping run through the edge functions above (Stripe + LP Express/Unisend). Secrets via `Deno.env` — never hardcode.
- Some landing content is still static (`src/data/`, inline arrays).

## Design system

Bold brutalist "brick" look, light-mode only — full token/class/GSAP reference in `.claude/rules/design.md` (auto-loads when editing `src/`). Never hardcode colors/radii/fonts; use the brand tokens and `brick-*` component classes.
