---
paths:
  - "src/**/*.tsx"
  - "src/**/*.css"
  - "src/components/**"
  - "src/pages/**"
---

# Design System — vite-app (BRICKTIME storefront)

Bold, brutalist "brick" aesthetic. Hard offset shadows, thick ink borders, chunky
display type, LEGO stud textures. **Light mode only** — `html/body/#root` are always
white; do not add `dark:` variants here.

All tokens live in `src/index.css` (`@theme inline` + `:root`). **Never hardcode a raw
color, radius, or font** in a component — reference the token or the component class.

## Color tokens

| Token | Value | Use |
|---|---|---|
| `ink` | `#001B21` | text, borders, shadows — the one dark |
| `paper` | `#FFFFFF` | backgrounds |
| `cream` | `#F5F1EB` | soft section fills, on-ink text |
| `brand-indigo` | `#5C4ADE` | primary accent / studs |
| `brand-sky` | `#4DA2FF` | accent |
| `brand-mint` | `#5DDB9C` | accent / success |
| `brand-orange` | `#FB4903` | accent / CTAs |
| `brand-pink` | `#FFAEE7` | accent |
| `brand-yellow` | `#FFD731` | `accent` semantic token — highlights |

Use as Tailwind classes: `bg-brand-indigo`, `text-ink`, `border-ink`, `bg-cream`.
shadcn semantic tokens (`--primary` = ink, `--accent` = yellow) are mapped to the brand
in `:root` — prefer brand tokens for storefront UI, semantic tokens inside `ui/` primitives.

## Fonts

- **Display**: Bricolage Grotesque (weight 800), self-hosted `public/BricolageGrotesque.ttf` → `font-display`
- **Body**: Space Grotesk → `font-sans` (default, 17px base)
- **Mono**: JetBrains Mono → `font-mono` (labels, meta)

## Component classes — prefer these over raw Tailwind strings

| Class | What it gives |
|---|---|
| `brick-card` | `border-2 border-ink rounded-2xl md:rounded-3xl shadow-[6px_6px_0_#001B21]` |
| `brick-card-hover` | lift on hover (translate -3,-3 + `10px_10px_0` shadow) |
| `brick-hover-sm` | small lift for buttons/nav (translate -2,-2 + `4px_4px_0`) |
| `label-mono` | `font-mono text-[11px] tracking-[.22em] uppercase` — section/tile labels |
| `heading-display` | display font, 800, uppercase, tight leading `.88`, tracking `-0.01em` |
| `font-display` | Bricolage at weight 800 |

**Display type scale** (pair with `heading-display`/`font-display`):
`text-d-hero` · `text-d-xl` · `text-d-lg` · `text-d-md` · `text-d-sm` · `text-d-xs` (fluid `clamp()`).

**Textures**: `studs-indigo`, `studs-orange`, `studs-light`, `studs-sm`, `grid-overlay`.

## GSAP contract (critical)

GSAP owns inline styles on animated nodes. Getting this wrong causes flicker/jank.

- **Never** set `boxShadow` or an animated `transform` via `className` — GSAP writes these
  directly to the style attribute. Use `brick-card-hover` / `brick-hover-sm` (CSS hover)
  for hover lift; use GSAP only for scripted/scroll animation.
- Scroll reveal is CSS-driven: add `.reveal` (→ `.reveal.visible` via `src/hooks/useReveal.ts`).
- GSAP `spanRef` elements must keep their `style` prop intact — GSAP owns it.
- Respect `prefers-reduced-motion` (already handled for `.reveal`/marquee in CSS).

## Conventions

- shadcn primitives in `src/components/ui/` (style `radix-nova`); add via `pnpm dlx shadcn@latest add <c>`.
- `cn()` from `src/lib/utils.ts` for conditional classes.
- Path alias `@/` → `src/`.
- Copy is **Lithuanian** — match existing tone; don't translate strings to English.
- New section components follow the pattern: `label-mono` eyebrow → `heading-display` title
  (often with a highlighted brand-colored span) → content in `brick-card`s.
