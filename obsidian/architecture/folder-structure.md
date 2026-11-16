---
tags: [architecture]
updated: 2026-11-16
---

# Folder Structure

Where everything lives and what belongs where (verified with `git ls-files` at `7e98519`). Ignored for documentation: `.claude/worktrees/`, `node_modules/`, `dist/`, `next-app/`, `explainer-video/`, `grabbed-assets/`.

```
/                      storefront app ("vite-app"), React 19 + Vite 7
├── index.html, vite.config.ts, vercel.json, components.json
├── src/
│   ├── main.tsx, App.tsx      ← providers + flat <Routes> (22 routes)
│   ├── pages/                 ← one file per route (+ HelpPages.tsx with 4 pages)
│   ├── components/            ← feature components; ui/ = 13 shadcn primitives;
│   │   account/ checkout/ coming-soon/ community/ merch/ reviews/
│   ├── contexts/              ← Auth, Subscriptions (plans), Consent, Breadcrumb
│   ├── hooks/                 ← data hooks (credits, discount code, check-in, ...)
│   ├── lib/                   ← supabase client, db types, LP Express client, analytics, pdf
│   └── data/                  ← static content (faq, socials, merch, community seed)
├── supabase/
│   ├── functions/<name>/index.ts  ← 18 Deno edge functions
│   ├── functions/_shared/         ← coupon, vat, plan-change, plan-schedule, downgrade-guard, lpexpress
│   ├── migrations/                ← 108 SQL files (see [[database-module]])
│   └── config.toml
├── admin/                     ← separate Vite app, plain dir (not a submodule here), own package.json
│   └── src/{pages,components,context,data,lib}
├── emails/                    ← gift-card Omnisend HTML
├── migration/                 ← scripts for moving the Supabase project (dump/restore/storage/verify)
├── docs/superpowers/          ← coupon, gift card, missing parts specs/plans
├── obsidian/                  ← this vault
└── .claude/ .agents/ .codex/ .superpowers/ .playwright-mcp/   ← agent tooling, not product code
```

## Rules

- **kebab-case** is the stated convention (CLAUDE.md global), but most storefront files are PascalCase (`Account.tsx`, `ProductCard.tsx`); hooks are camelCase (`useCredits.ts`). Follow the neighbouring files.
- `database.types.ts` is generated (`supabase gen types`) and **duplicated** in `admin/src/lib/` and `supabase/database.types.ts`; never hand-edit, enum aliases go in `src/lib/db-enums.ts`.
- New SQL goes in a new `supabase/migrations/` file; check for timestamp collisions first (CLAUDE.md).
- Admin has no dependency on `src/`; shared logic (`series.ts`, `heading-markup.ts`, `lpexpress.ts`, `vilnius-time.ts`) is copied.

## Related

[[routing]] · [[component-conventions]] · [[codebase-map]]
