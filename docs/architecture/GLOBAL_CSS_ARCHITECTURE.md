# GLOBAL_CSS_ARCHITECTURE — the styling system

> Phase 0 deliverable · Architecture layer · Rule: **Tailwind for composition, tokens for identity.**
> The reference's appended-`vivid.css` approach is explicitly *not* replicated.

---

## 1. The entry chain (spec-mandated)

```
src/app/globals.css         ← imported by src/app/layout.tsx (load-bearing; see note below)
  └─ @import "../styles/globalCss/index.css";
       ├─ tokens.css        ← palette, type, spacing, radii, shadows, motion, breakpoints
       ├─ themes.css        ← light/dark + optional vivid variant
       ├─ typography.css    ← Persian type rules, nastaliq scope, digits
       ├─ layout.css        ← containers, grids, breakpoint utilities
       └─ utilities.css     ← hand-written utilities, only where Tailwind can't
```

`globals.css` does nothing but the import — per the master specification.

> **Phase 1 correction (observed at build time).** Two facts the Phase 0 text above did not pin
> down, both of which broke the production build when violated:
> 1. The `@import` inside `globals.css` must use a **relative** path (`../styles/globalCss/index.css`).
>    CSS `@import` is resolved by postcss-loader, which does **not** resolve the tsconfig `@/`
>    alias — `@import "@/styles/globalCss/index.css"` fails `next build` with
>    "Can't resolve '@/styles/globalCss/index.css'".
> 2. `globals.css` must be imported from `src/app/layout.tsx` (`import "./globals.css"`). The
>    App Router emits a stylesheet only if some component imports a CSS file; the file merely
>    existing on disk is not enough, and the whole site otherwise ships unstyled.


## 2. Layer order (CSS cascade layers, so the "vivid problem" cannot recur)

```css
/* index.css */
@import "tokens.css";
@import "themes.css";
@import "typography.css";

@layer base, components, utilities;
@import "tailwindcss";   /* Tailwind v4 CSS-first (approved Q6) — NOT wrapped, see warning below */
@import "layout.css" layer(base);
@import "utilities.css" layer(utilities);
```

Because **everything sits in an explicit layer**, a later stylesheet can never silently win by mere
source order — the reference's core failure mode (an unscoped `vivid.css` overriding an entire design
by being last). Any theme variant now lives *inside* `themes.css` under a selector, not as an appended
file.

> **The Tailwind import must NOT be wrapped in `layer(...)` (P2 item 6, 2026-11-10).**
> Tailwind v4's compiled output opens with its own `@layer theme, base, components, utilities;`.
> Wrapping the import in `layer(utilities)` nests *all four* of those internal layers inside the root
> `utilities` layer — including preflight (`*{margin:0;padding:0;border:0}`), which then sorts
> **after** the project's `@layer components`. Cascade-layer order beats specificity, so every
> components-layer rule was silently dead: `.container` lost its 20px gutters (content sat flush with
> the viewport edge at 393px) and `.section` lost its 88px/56px block rhythm. Imported unlayered,
> Tailwind's layer statement merges at the root: preflight lands in `base` (before `components`) and
> its utilities stay in `utilities` (after `components`) — the intended order, verified live
> (`containerPadding` 0px → 20px, `sectionPaddingBlock` 0px → 88px, Tailwind utilities still applied).

**Tailwind v4 notes (Q6 approved):** v4 resolves `@import "tailwindcss"` itself; no JS config file is
used. The theme bridge lives in the same CSS file as `@theme { … }` reading the semantic variables
(`DESIGN_TOKENS.md` §4). The `@layer` statements above must stay *before* the tailwind import so the
layer order is the project's, not the library's.

## 3. Tokens (the contract)

`tokens.css` defines **raw palette** and **semantic variables**:

```css
:root {
  /* raw — the reference's accent is TEAL: --c-gold:#1C9AA0 (misleading name; see DESIGN_TOKENS.md §2) */
  --color-teal-500: #1C9AA0;
  --color-ink-900:  #101722;
  /* semantic */
  --bg:        var(--color-surface-0);
  --bg-elevated: var(--color-surface-1);
  --fg:        var(--color-ink-900);
  --fg-muted:  var(--color-ink-600);
  --border:    var(--color-line);
  --accent:    var(--color-teal-500);
  --accent-fg: #fff;
  --focus-ring: 2px solid var(--accent);
  /* motion */
  --motion-fast: 140ms;  --motion-base: 220ms;
  --ease-out: cubic-bezier(.2,.8,.3,1);
  /* radii, shadows, spacing scale (4px base), breakpoints: 640 / 960 / 1024 / 1100 / 1180 */
}
```

`themes.css` redefines the **semantic** variables under `[data-theme="dark"]` and
`@media (prefers-color-scheme: dark)`.

**Rules:**
1. Components consume **semantic** variables only (`bg-[var(--bg)]`, or a Tailwind theme alias such as
   `bg-background` mapped to the variable). Raw palette values in a component = review blocker.
2. Adding a color = adding it to `tokens.css` first, then using it through a semantic alias.
3. The Tailwind theme **reads the variables** via `@theme` (`DESIGN_TOKENS.md` §4) so utilities and
   tokens can never disagree — one source, two consumers.

## 4. Typography (`typography.css`)

- **Vazirmatn Variable** everywhere (self-hosted, 100–900); Persian-first metrics and line-height.
- **Nastaliq scoping rule (kept from the reference):** `html[lang="fa"] .h-slogan { font-family: …Nastaliq… }`
  — one selector, one place. It never leaks into body text (decorative face, small-size illegible).
- Digits: font-agnostic; localization is done in code (`toPersianDigits`) at render time, so this file
  carries no digit hacks.
- RTL-aware logical properties throughout (`ps`/`pe`, `ms`/`me`, never `left`/`right` in CSS that must
  flip).

## 5. Breakpoints (reference-derived)

| Token | Value | Observed in reference as |
|---|---|---|
| `sm` | 640px | particle count 14 vs 28; nav collapse |
| `md` | 960px | services auto-scroll to detail on `<960px` |
| `lg` | 1024px | spec primary |
| `xl` | 1100px | mid layout shift (observed) |
| `2xl` | 1180px | spec primary — container max-width neighborhood |

Mobile-first: base styles are the narrow layout; each breakpoint *adds*. Container max-width ~1180–1200px.

## 6. Dark mode

- Attribute `data-theme="dark|light"` on `<html>` + `@media (prefers-color-scheme)` default.
- No `dark:` class duplication in components — the same semantic variables flip.
- Motion and glow effects must remain visible in dark mode (they are teal-on-dark in the reference).

## 7. The "vivid" skin — **dropped per approved Q9**

The reference ships a vivid gradient skin appended last; it is **not ported**. If a future phase
requests it, it becomes a *theme variant inside `themes.css`* (`[data-theme="vivid"]`), never an extra
stylesheet, never a second cascade.

## 8. Utilities discipline

- Tailwind covers composition; `utilities.css` only gets something Tailwind cannot express
  (e.g. a keyframes set, an RTL-safe `text-balance` fallback).
- No `@layer utilities` pile-up: each addition has a comment explaining why Tailwind could not do it.

## 9. Linting/review checklist for styles

- [ ] no raw palette values outside `tokens.css`
- [ ] no physical left/right in flippable layouts
- [ ] every new utility justifies itself
- [ ] dark-mode contrast ≥ AA at both themes
- [ ] no per-override appended files — everything is in the layer system
