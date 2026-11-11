# DESIGN_TOKENS — the visual identity, extracted from the reference

> Phase 0 deliverable · Architecture layer · **Extraction note:** the reference encodes its palette in
> CSS custom properties in `assets/css/style.css`'s `:root` block. Phase 0 did **not** copy those
> values — the exact `:root` block must be transcribed verbatim in Phase 1 as the authoritative seed of
> `tokens.css`. What follows is the *structure* of the token system plus what the reference's usage
> establishes about each dimension.

---

## 1. Token taxonomy (what exists, and who consumes it)

| Group | Contents | Consumed by |
|---|---|---|
| **Palette** (raw) | teal (the reference's `--c-gold` = `#1C9AA0`), ink/surface neutrals, line color, status colors | `themes.css` only |
| **Semantic surfaces** | `--bg`, `--bg-elevated`, `--fg`, `--fg-muted`, `--border`, `--accent` | components |
| **Typography** | font families (Vazirn; Nastaliq scoped), size scale, weights, line-heights, letter-spacing | `typography.css` + components |
| **Spacing** | 4px-based scale | layout + components |
| **Radii** | small/medium/large/pill | components |
| **Shadows** | elevation levels (+ glow) | components |
| **Motion** | durations, easing, "living layer" parameters | client islands |
| **Breakpoints** | 640/960/1024/1100/1180 | layout + utilities |
| **Z-index** | header, menu, modal, toast | layered UI |

## 2. What the reference establishes about the identity

- **Teal accent — despite the variable name `--c-gold`:** the reference's accent variable is declared
  `--c-gold:#1C9AA0` (a teal), the rising particles are `#BFE9EA` with a `#1C9AA0` glow, and the
  living layer is pale-teal-on-dark. So the identity is **teal**, and the word "gold" in the reference's
  variable names and CSS comments (e.g. `@keyframes goldFlow`, "Kheirkhah palette (navy · teal ·
  gold)") refers to *that teal.* Phase 1 names the raw token honestly (`--color-teal-…` / semantic
  `--accent`), never "gold". The accent is decorative, not informational.
- **Dark, quiet surfaces:** the hero and panel chrome are dark; cards are elevated surfaces with subtle
  borders — the identity is "premium/medical, dark-leaning hero, light content canvas."
- **Iconography is line-style** (stroke-based SVGs at small sizes), 65 icons — a coherent set, not
  mixed families.
- **Persian typography leads:** large weights on Persian headings, the nastaliq slogan as the single
  decorative face.
- **Status semantics:** open/closed live badge (green/red dot via `.live-dot.off`), limited-status
  insurance (amber-coded in the assistant) — so status colors are a real token group, not an afterthought.

## 3. Naming contract

```
raw:      --color-<name>-<500>            (raw scale, themes.css-only)
semantic: --bg, --bg-elevated, --fg, --fg-muted, --border,
          --accent, --accent-fg, --status-ok, --status-warn, --status-bad
motion:   --motion-<fast|base|slow>, --ease-<out|in-out|spring>
space:    --space-<1..10>  (4px base)
radius:   --radius-<sm|md|lg|pill>
shadow:   --shadow-<1|2|3>, --shadow-glow
z:        --z-<header|menu|modal|toast>
```

Semantic variables are the only ones components may name. A variable that exists but is unnamed
semantically (e.g. `--color-gold-500` used directly in `.tsx`) is a review blocker.

## 4. Tailwind bridge (one source, two consumers) — **Tailwind v4 CSS-first (approved Q6)**

v4 has no JS config by default; the bridge is declared in CSS with `@theme`, reading the same CSS
variables the semantic layer defines:

```css
/* src/styles/globalCss/index.css — after the layer import (see GLOBAL_CSS_ARCHITECTURE.md §2) */
@import "tailwindcss" layer(utilities);

@theme {
  --color-background: var(--bg);
  --color-foreground: var(--fg);
  --color-accent: var(--accent);
  --color-muted: var(--fg-muted);
  --color-border: var(--border);
  --font-sans: var(--font-vazirmatn), ui-sans-serif, system-ui, sans-serif;
  --breakpoint-sm: 640px;
  --breakpoint-md: 960px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1100px;
  --breakpoint-2xl: 1180px;
}
```

Whatever variable the component resolves — `bg-background` utility or `var(--bg)` — the value comes
from the same declaration. There is deliberately **no `tailwind.config.ts`**; adding one is the
review-blocker that reintroduces the two-sources problem.

## 5. Themes (`themes.css`)

- Default theme = light (reference's content canvas); the dark theme redefines semantics only.
- `prefers-color-scheme: dark` applies automatically; `data-theme` overrides when a user chooses
  (persisted like the reference persists `kh-lang`).
- Optional vivid variant: `[data-theme="vivid"]` — only if the client asks (Q9). Never an extra file.

## 6. Motion tokens (so the "living layer" is tunable)

```
--motion-fast 140ms --motion-base 220ms --motion-slow 400ms
--ease-out cubic-bezier(.2,.8,.3,1)
--tilt-max 10deg --magnetic-x .18 --magnetic-y .30
particles: 14 (<640px) / 28
count-up: 1600ms (≤1000), 1400ms (>1000), cubic ease-out
```

All motion consumers must accept `prefers-reduced-motion: reduce` → static end-state
(§3 of `WEBSITE_WORKFLOWS.md`).

## 7. Phase 1 extraction procedure (do not improvise)

1. Open `assets/css/style.css`, copy its **entire `:root` block** into `tokens.css` as raw values.
2. Add the semantic layer per §3.
3. Build the Tailwind bridge (§4) and verify with a token-parity test: every semantic variable renders
   a value in both themes.
4. Verify dark mode at AA contrast for text pairs.
5. Audit that no component references a raw value.
