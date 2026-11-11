# SEO_ACCESSIBILITY_SECURITY — the three cross-cutting concerns

> Phase 0 deliverable · Architecture layer · Covers master spec §12. Every item here is a **release
> gate**, not a nicety, and all three concerns share one trait: they are cheap at the architecture
> stage and expensive to retrofit.

---

## 1. SEO

### 1.1 What the reference gives us for free (static HTML)
The reference's pages are fully server-rendered HTML with real Persian text — including the `.h-svc`
grid that doubles as crawlable content. Our default (Server Components, HTML-first) preserves this
exactly; client islands must not replace crawlable markup.

### 1.2 Metadata per route (`NEXTJS_APP_ROUTER.md` §5)
- `generateMetadata` per route: `title`, `description`, `openGraph`, `twitter`, `canonical`, and the
  trilingual `alternates` (`hrefLang` fa/en/ar).
- Title pattern: `«صفحه» — مرکز جراحی فوق تخصصی دکتر خیرخواه` (fa canonical) — from the reference's
  `<title>` convention.
- One H1 per page; the nastaliq slogan is the home H1 (`CONTENT_INVENTORY.md`).

### 1.3 Structured data (Phase 1 set)
| Schema | Where |
|---|---|
| `MedicalOrganization` / `Hospital` | root layout — phone `+983155154000`, address (Isfahan), opening hours 07:30–20:00, Friday closed |
| `BreadcrumbList` | `/services/<slug>` |
| `Service` ×10 | one per category page (name/description trilingual alternate) |
| `WebSite` + `SearchAction` | home (search is future; do not emit a `potentialAction` that 404s — schema must not describe nonexistent functionality) |

Only emit schemas for things that exist — no placeholder `potentialAction`, no `Offer` without prices.

### 1.4 URLs
- Slugs are the reference ids (`gen`, `gyn`, `eye`…) — ASCII, stable, permanent (`DATABASE_ARCHITECTURE.md`).
- 301s from any future rename; sitemap.xml generated from the route table; `robots.txt` allows all in
  Phase 1 (no private section exists yet — it must not reference the panels, which are out of scope).

### 1.5 Persian content + SEO
- `lang="fa"` baked server-side; the canonical `hrefLang` is fa.
- Persian titles/descriptions in metadata (not transliterated) — the reference's own SEO posture.

## 2. Accessibility

### 2.1 Baseline: WCAG 2.1 AA, Persian-first
- **Contrast AA** for all text pairs in both themes (`DESIGN_TOKENS.md` §7 step 4).
- **Keyboard:** every interactive element reachable and operable; the reference's tab list must be a
  real `role="tablist"` with arrow-key navigation, not a `div` with `click`.
- **Focus visible:** `--focus-ring` token, never `outline: none` without a replacement; the reference's
  focus state is re-implemented, not dropped.
- **Skip link** to `#main` — the reference has none; we add it (improvement list, `REFERENCE_SOURCE_ANALYSIS.md`).
- **Burger sheet focus-trapped** with `Escape` to close and focus returned to the toggle.

### 2.2 Screen-reader semantics (the reference's gaps we close)
| Reference pattern | Fix |
|---|---|
| Language switch is a bare link set | real `<button>`s with `aria-pressed` / `aria-current` |
| Category tabs simulate tabs with classes | `role="tablist"` + `aria-selected` + `aria-controls` + arrow keys |
| Live open/closed badge is visual-only text | `aria-live="polite"` region announcing "باز／بسته" changes |
| Decorative particles/glow | `aria-hidden` + `prefers-reduced-motion` end-state |
| Icon-only buttons (burger, search) | `aria-label` in the active locale |
| Sub-service cards are `<a>` with icon | visible text + `aria-label` only if the text is ambiguous |

### 2.3 Motion and animation
- `prefers-reduced-motion: reduce` → all motion lands in its final state; no infinite loops
  (`RESPONSIVE_ARCHITECTURE.md` §7).
- No content conveyed by color alone (status dots have text next to them — the reference does this).

### 2.4 RTL-specific a11y
- Focus order must follow the visual order in RTL (autonomous with logical properties, verified in the
  test matrix).
- `dirname` language hints on future inputs; `dir="auto"` on user-generated content (later phases).

### 2.5 Testing
- axe-core in the Vitest/Playwright run, zero serious findings as gate.
- Keyboard-only walkthrough of `/` and `/services` at 375px and 1440px.
- Screen-reader spot check (NVDA/fa, VoiceOver/en) on the two in-scope pages.

## 3. Security

### 3.1 Posture: no auth, no PII, no payments in Phase 1
Phase 1 is a public content site. The reference's forms (loan, club, surveys) are **out of scope**
(`SERVICES_SCOPE.md`) and are not to be rebuilt under any pretext — including as "demos".

### 3.2 What Phase 1 still must do
| Control | Rule |
|---|---|
| **Input validation** | Zod at every Route Handler boundary — even read-only endpoints validate their params (`API_ARCHITECTURE.md`) |
| **Injection** | parameterized Prisma only (no raw SQL); React escapes by default; no `dangerouslySetInnerHTML` on any content not in the reference |
| **XSS in content** | trilingual content is data, never HTML; the reference's inline HTML snippets get parsed to structured data in Phase 1 |
| **CSRF** | GET-only endpoints in Phase 1; any future POST takes a token (documented, not built) |
| **Rate limiting** | on `/api/*` from day one (cheap, prevents the obvious abuse of a public endpoint) |
| **Security headers** | `next.config` headers: CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` |
| **CSP** | strict, no `unsafe-inline` after the reference's inline scripts are removed; self-hosted fonts/images only |
| **No third-party scripts** | the reference loads none; we keep that (no analytics in Phase 1 unless the client supplies one — Q-classified in `OPEN_QUESTIONS.md`) |
| **Cookies** | the locale cookie: `SameSite=Lax`, no PII value |
| **Secrets** | `DATABASE_URL` via env only, never in code; `.env*` gitignored |

### 3.3 Data minimization (learned from the reference)
The reference's demo `localStorage` stores phone numbers (`kh-loan-leads`). **This is a live warning,
not a pattern:** when the real forms arrive, mobile numbers are PII and need consent + retention
rules. Phase 1 stores no user data at all — the only client-side persistence is the locale cookie and
the theme attribute. Documented in `TECHNICAL_RISKS.md`.

### 3.4Dependencies
- Lockfile committed; `npm audit` clean as gate; only well-maintained packages; the Jalali converter and
  React Query are the two non-trivial additions (both widely used, both justified).
- No `eval`, no dynamic `import()` of remote code, no postinstall scripts beyond the Prisma generate.

## 4. Performance (the fourth concern the spec folds into this section)

| Metric | Target |
|---|---|
| LCP (home hero) | < 2.5 s on 4G, Persian fonts self-hosted + `font-display: swap` |
| CLS | < 0.05 — all images have intrinsic aspect (`next/image`), no layout shifts from the badge |
| INP | < 200 ms — client islands are small; motion is compositor-only (transform/opacity) |
| Initial JS | the home page ships mostly RSC; the living layer is one lazy island |
| Bundle | the 65-icon sprite becomes a tree-shaken `Icon` component — the reference ships all 65 per page |

The reference performs well (no framework, no network); our target is to **not regress** its
snappiness while gaining a build step — `TECHNICAL_RISKS.md` tracks this.

## 5. Release gate checklist (consolidated)

- [ ] axe: zero serious findings, both themes, both directions
- [ ] keyboard-only pass at 375px + 1440px
- [ ] reduced-motion pass
- [ ] no horizontal overflow at 320px (en + fa)
- [ ] metadata + `hrefLang` + sitemap verified
- [ ] only real structured data emitted
- [ ] security headers + CSP verified via response inspection
- [ ] `npm audit` clean
- [ ] core-web-vitals targets measured, not assumed
