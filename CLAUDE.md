# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo Structure

This repo contains two independent Vite apps under `/Users/rysardgvozdovic/Desktop/projects/bricks/`:

- **`vite-app/`** — Customer-facing landing page and rental flow
- **`admin/`** — Admin dashboard (products, subscribers, orders, plans, settings)

Both apps share the same stack but are completely separate projects with their own `package.json`, `node_modules`, and `vite.config.ts`. Run commands from within each app's directory.

## Commands

```bash
# Development
pnpm dev          # start dev server (run from vite-app/ or admin/)
pnpm build        # tsc -b && vite build
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint .
pnpm format       # prettier --write "**/*.{ts,tsx}"
pnpm preview      # serve production build
```

## Stack

Both apps: **React 19 + Vite 7 + TypeScript + Tailwind CSS v4 + shadcn/ui**

- shadcn style: `radix-nova`, CSS variables, Lucide icons — configured via `components.json`
- Path alias: `@/` → `src/`
- **admin only**: TanStack Table v8 (via shared `DataTable` component), Recharts

## vite-app Architecture

**Landing page + customer flow.** No backend — all data is static/mocked.

Routes in `App.tsx`:
- `/` → `Home` — assembles all landing sections (Nav, Hero, Marquee, HowItWorks, WhatsInside, Plans, Testimonials, FAQ, BigCTA, Footer, FloatingVideoWidget)
- `/archive` → products listing
- `/plans` → subscription plans page (full page with comparison table, FAQ, trust tiles)
- `/community` → leaderboard + activity feed (data in `src/data/community.ts`)
- `/drop` → individual product drop detail page
- `/account` → account with LEGO-head avatar picker (`public/avatars/`)
- `/subscribe`, `/checkout` → subscription/rental flow pages

**Animations**: GSAP is used throughout. `src/hooks/useReveal.ts` handles scroll-reveal. Section components use GSAP hover animations with highlighted heading spans.

**Fonts**:
- Body: Space Grotesk + JetBrains Mono (Google Fonts, loaded in `index.css`)
- Display: Bricolage Grotesque variable font (self-hosted at `public/BricolageGrotesque.ttf`)
- Brand logo SVG: `public/bricktime.svg`

## Admin Architecture

**Internal dashboard.** No backend — mock data lives in `src/data/` (orders.ts, products.ts, subscribers.ts).

All routes nest under `AppLayout` (sidebar + layout shell via `AppSidebar`).

Key components:
- `DataTable.tsx` — shared TanStack Table wrapper used by Products, Subscribers, Orders pages
- `ProductEditDialog.tsx` — tabbed sheet supporting both add and edit modes
- `OrderDetailSheet.tsx` — slide-over with live status sync
- `SubscriberProfileSheet.tsx` — subscriber detail with account info

## UI Conventions

- shadcn components live in `src/components/ui/` — add new ones via `pnpm dlx shadcn@latest add <component>`
- Tailwind v4 is configured via the `@tailwindcss/vite` plugin (no `tailwind.config.js` file)
- `src/lib/utils.ts` exports the `cn()` helper (clsx + tailwind-merge)

### CSS Component Classes (`src/index.css`)

Prefer these over repeating raw Tailwind strings:

| Class | What it does |
|---|---|
| `brick-card` | `border-2 border-ink rounded-2xl md:rounded-3xl shadow-[6px_6px_0_#001B21]` |
| `brick-card-hover` | `transition-all hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[10px_10px_0_#001B21]` |
| `brick-hover-sm` | `transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#001B21]` |
| `label-mono` | `font-mono text-[11px] tracking-[.22em] uppercase` |
| `heading-display` | `font-display uppercase leading-[.88] tracking-[-0.01em]` — use for all display headings |
| `font-display` | Sets Bricolage Grotesque at weight 800 |

### Display Type Scale (`src/index.css`)

Fluid sizes for display text — pair with `heading-display` or `font-display`:

| Class | Size |
|---|---|
| `text-d-hero` | `clamp(52px, 7vw, 104px)` |
| `text-d-xl` | `clamp(42px, 5vw, 80px)` |
| `text-d-lg` | `clamp(36px, 4vw, 68px)` |
| `text-d-md` | `clamp(28px, 3.5vw, 52px)` |
| `text-d-sm` | `clamp(24px, 2.8vw, 40px)` |
| `text-d-xs` | `clamp(18px, 2vw, 28px)` |

### GSAP

- Never set `boxShadow` or animated `transform` via className — GSAP writes these directly to the style attribute
- `src/hooks/useReveal.ts` — scroll-reveal via `.reveal` / `.reveal.visible` CSS classes
- GSAP spanRef elements must keep their `style` prop intact (GSAP owns it)

## Data

- **vite-app**: all data is static/mocked — lives in `src/data/` (`community.ts`) and inline arrays in component files
- **admin**: mock data in `src/data/` (`orders.ts`, `products.ts`, `subscribers.ts`)
- Supabase is integrated for auth/DB (client configured in `src/lib/supabase.ts`)
