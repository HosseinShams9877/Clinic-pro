# RESPONSIVE_ARCHITECTURE — mobile-first, RTL-first responsive system

> Phase 0 deliverable · Architecture layer · Derived from observed reference behavior + spec §8
> ("fully responsive"). RTL and responsiveness are **one problem** in this project, not two.

---

## 1. Principles

1. **Mobile-first:** base styles are the narrow layout; each breakpoint *adds*. No `max-width` resets.
2. **RTL-first:** the base layout is RTL; LTR is the flip, not the other way round.
3. **Content parity at every width** — nothing is hidden on mobile except genuine decoration
   (particles, parallax). The reference's behavior: the static `.h-svc` grid stays, the JS layer
   upgrades it.
4. **Capability before width** — `prefers-reduced-motion` and `pointer: fine` gate enhancement
   independently of viewport (reference: `SETS` motion, magnetic/tilt on `pointer: fine` only).
5. **No zoom hacks:** no `user-scalable=no`, no `maximum-scale`. Latin/Persian text must remain
   user-resizable.

## 2. Breakpoints (reference-derived, spec-aligned)

| Token | Value | Evidence in reference |
|---|---|---|
| base | <640px | single column, burger menu, particles 14, services auto-scroll to `#sDetail` |
| `sm` | 640px | nav row appears; particles 28; card grids 2-up |
| `md` | 960px | services detail panel side-by-side; auto-scroll disabled (`innerWidth < 960` check) |
| `lg` | 1024px | spec primary desktop point |
| `xl` | 1100px | observed mid shift (header layout, hero copy width) |
| `2xl` | 1180px | container max-width neighborhood (~1180–1200px) |

Tailwind config maps all five (`DESIGN_TOKENS.md` §4). Only these five exist — a one-off media query
in a component is a review blocker (add a token or use the grid).

## 3. Layout primitives (`layout.css`)

| Primitive | Rule |
|---|---|
| `.container` | `inline-size` queries friendly; `max-width` ~1180px; gutter 16px (spec: phone gutter), 24px+ from `sm` |
| Page sections | CSS Grid with `grid-template-areas` named in **flow terms** (`hero`, `main`, `aside`), not physical sides |
| Card grids | `grid-template-columns: repeat(auto-fill, minmax(N, 1fr))` — counts emerge from width, not breakpoints |
| Service detail | `md` → two-column (`main | aside`); below `md` stacked with the reference's auto-scroll to `#sDetail` |
| Header | base = burger sheet; `sm`/`md` = full nav (reference collapses to burger below its nav threshold) |

## 4. Container queries where they matter

Cards and teaser tiles resize **independently of the page** — the reference's bento already behaves
this way (a tile reflows by its own width). Phase 1 uses `@container` on the tile/card primitives so a
component looks right whether it's in a 4-up grid or a 2-up one. Page-level layout stays on media
queries.

## 5. Responsive behavior inventory (what must be reproduced)

| Behavior | Reference | Target |
|---|---|---|
| Header collapse to burger | `main.js` burger toggle | CSS layout + client island for the sheet, focus-trapped |
| Services auto-scroll to detail | `services.js` `innerWidth < 960` | `useMediaQuery` hook + same `#sDetail` scroll, only on selection below `md` |
| Particle count 14 vs 28 | `main.js` by `innerWidth` | motion tokens: `--particles: 14` base, 28 from `sm` |
| Hero copy width | CSS at ~1100px | `xl` token |
| Footer columns | stacked → 4 columns | grid `auto-fit` |
| Table-like data (insurance, hours) | stacked cards on narrow widths | same — no horizontal page scroll at any width |

**No horizontal scrolling at 320px** is a release gate: the phone number shim, the open/closed badge,
and the nav must all survive 320px.

## 6. Images & media

- `next/image` with the 31 reference images (`ASSETS_INVENTORY.md`), `sizes` per placement, lazy below
  the fold; hero eager.
- Portrait aspect kept for doctor cards (monogram placeholder rule when `photo: ""`).
- **No video in Phase 1** — both of the reference's video controls are "coming soon" toasts, so no
  responsive media rule is needed for them (`SERVICES_SCOPE.md`).

## 7. Motion across viewports

| Capability | Gate | Fallback |
|---|---|---|
| `prefers-reduced-motion: reduce` | all motion | static end-state (counts at final value, no parallax/tilt) |
| coarse pointer (`pointer: coarse`) | magnetic buttons, 3D tilt, cursor glow | disabled |
| narrow viewport | particles, parallax intensity | reduced counts per tokens |
| `prefers-data-saver` / slow network | optional future gate | documented, not Phase 1 |

## 8. Testing matrix (release gate)

- **Widths:** 320 · 375 · 640 · 768 · 960 · 1024 · 1100 · 1180 · 1440
- **Locales × direction:** fa/RTL and en/LTR at every width; ar/RTL spot-checked at 375/1024
- **Pages:** `/` and `/services` (all 10 categories via URL), plus a 404
- **Capability matrix:** reduced-motion on/off; coarse pointer
- No horizontal overflow, no clipped focus rings, no overlapping text in Persian titles (Persian needs
  more line-height — `typography.css` carries per-locale leading values)

## 9. What the reference teaches to avoid

- Layout decisions made in JS (`innerWidth` comparisons) drift from CSS — we keep one source (tokens)
  and let JS read the same media queries via `matchMedia`.
- The reference's `vivid.css` override does not undo its mobile rules — cascade layers (see
  `GLOBAL_CSS_ARCHITECTURE.md` §2) are the structural fix.
