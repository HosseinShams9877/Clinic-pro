# TECH_STACK_ANALYSIS — from the reference stack to the mandatory target stack

> Phase 0 deliverable · Knowledge layer · Companion: `docs/architecture/*` holds the target designs.

---

## 1. The reference stack (as-is)

| Layer | Technology | Notes |
|---|---|---|
| Markup | Hand-authored HTML5, 22 pages | shared header/footer/nav duplicated per file |
| Styling | Hand-authored CSS, 15 files | custom-property tokens; `vivid.css` skin loaded last |
| Scripting | Vanilla JS (ES5-style IIFEs, `var`, no modules) | 24 files, 6 083 LOC |
| Icons | Inline `<symbol>` sprite duplicated per page | ~36 core + extended icons |
| Fonts | WOFF2 bundled locally | Vazirmatn Variable 100–900; NotoNastaliqUrdu Bold (slogan only) |
| Images | JPEG, local | 4 folders under `assets/img/` |
| i18n | Custom DOM-capture engine + JS dictionaries | trilingual fa/en/ar |
| Persistence | `localStorage` only | all demo data |
| Build / tooling | **none** | no package.json, no CI, no tests |
| Type safety | **none** | plain JS |
| Validation | ad-hoc regex (`/^09\d{9}$/`) | one place, two forms |

### 1.1 What the reference does well (keep the spirit, not the mechanism)

- **Content-first**: the Persian content is complete and authoritative; everything else is decoration on top.
- **Resilient by default**: works offline, without JS, on any browser.
- **Disciplined content provenance** (data-file headers, §8 of `REFERENCE_SOURCE_ANALYSIS.md`).
- **Capability-aware motion**: `prefers-reduced-motion` and `pointer: fine` both honored.
- **Trilingual with full coverage** including digit localization.

### 1.2 What it cannot do (why we rebuild)

| Limitation | Consequence | Fixed by |
|---|---|---|
| No component reuse | header/nav/footer/icon sprite copy-pasted into 22 files | React + App Router layout |
| No typing | data shapes implicit in JS arrays | TypeScript strict + Zod schemas |
| No server | any form submission is Demo-only (`localStorage`) | Route Handlers + Prisma |
| No persistence / querying | panels cannot scale beyond a demo | PostgreSQL + Prisma 6 |
| No data-fetching layer | panel scripts re-read `localStorage` ad hoc | TanStack React Query v5 |
| No build/CSS optimization | unminified CSS with an unscoped skin layer | Tailwind + Next pipeline |
| No tests, no CI | regressions undetectable | Vitest + CI in later phases |

---

## 2. The mandatory target stack (per master specification — not to be silently replaced)

| Concern | Choice | Why (one line) |
|---|---|---|
| Framework | **Next.js (App Router)** | RSC-first, streaming, file-based routing, one deploy target |
| UI | **React 18+** + **TypeScript strict** | component reuse + compile-time safety |
| Component model | **Server Components by default**; `"use client"` only when state/effects required | content pages stay crawlable & zero-JS-capable |
| API | **Route Handlers** (`src/app/api/…/route.ts`) + business logic in module services | thin endpoints, testable services |
| ORM | **Prisma 6** | type-safe data layer; single source of truth for entity shapes — **deferred past Phase 1 (REC-1)** |
| Database | **PostgreSQL** (prod) / **SQLite** (dev + test) | one schema, two drivers, local-first dev — **not wired in Phase 1** |
| Data fetching | **TanStack React Query v5** | used only where client-side server state genuinely exists: the live badge poll (REC-2) |
| Styling | **Tailwind CSS** + **centralized design tokens** + **semantic CSS variables** | utility-first, but tokens are the contract, not utilities |
| Validation | **Zod** | schema = runtime validator + TS type + API contract |
| Tests | **Vitest** | fast, Vite-native, good with Next |

**Non-negotiables from the spec that this stack must satisfy:**

- Persian-first and RTL-first by default; LTR is a locale switch, not a reversal.
- Fully responsive at the reference breakpoints **1180 / 1024 / 640** (plus observed **1100 / 960**).
- The Services section is the **final implementation boundary** — no placeholders beyond it.
- Fully static-renderable content for the in-scope pages (SEO + no-JS).

---

## 3. How each reference subsystem maps onto the target stack

| Reference | Target | Where |
|---|---|---|
| 22 duplicated headers/footers | one App Router `layout.tsx` per segment | `NEXTJS_APP_ROUTER.md` |
| `i18n.js` DOM-capture engine | Persian-canonical message dictionaries + `lang`/`dir` on `<html>` | `LOCALIZATION_AND_CALENDAR.md` |
| `services-data.js` JS array | typed content module + Zod schema (Phase 1); Prisma seeding when dynamic editing arrives (REC-1) | `SERVICES_SCOPE.md`, `API_ARCHITECTURE.md` |
| inline `<symbol>` sprite | `<Icon>` component map, one source of truth | `ASSETS_INVENTORY.md` |
| CSS custom properties | Tailwind config → `tokens.css` CSS variables → semantic aliases | `DESIGN_TOKENS.md` |
| `vivid.css` skin | removed; theme handled by tokens (light/dark) | `GLOBAL_CSS_ARCHITECTURE.md` |
| `main.js` LIVING LAYER | small client hooks (`useScrollProgress`, `useCountUp`…) gated by the same two media queries | `MODULAR_ARCHITECTURE.md` |
| `localStorage` demo stores | Route Handlers + Prisma models | `BACKEND_ARCHITECTURE.md`, `DATABASE_ARCHITECTURE.md` |
| Asia/Tehran open/closed logic | isolated `lib` util (TZ-safe, server-computed for SSR) | `MODULAR_ARCHITECTURE.md` |
| Persian/Arabic digit helpers | pure `lib` functions, UI-only localization | `LOCALIZATION_AND_CALENDAR.md` |
| count-up, reveal, tilt | client islands with `prefers-reduced-motion` bail-out | `RESPONSIVE_ARCHITECTURE.md` |

## 4. Solar Hijri calendar (spec §7) — strategy in one paragraph

- Store **all** dates internally as **ISO 8601 Gregorian UTC** (ASCII, sortable, comparable).
- Convert to **Jalali (Solar Hijri)** **only** in the UI layer via a single, centralized, well-tested
  converter (e.g. `date-fns-jalali` or a hand-written algorithm behind one module — one import boundary).
- **Never** store Jalali strings in the database, URLs, JSON payloads, or component state.
- Persian digits applied at the same render boundary, never earlier.

Rationale: the reference stores no dates at all, so we inherit no legacy; starting ASCII-clean avoids the
classic "۱۴۰۳ vs 2024 comparison" bug class. Full design in `LOCALIZATION_AND_CALENDAR.md`.

---

## 5. Versioning policy — **decided by approved Q5 + Q6; versions frozen at install**

- Exact versions pinned in the lockfile and recorded here at install time (see §5.1 below).
- Node LTS pinned in `.nvmrc`/`engines`.
- **Q5 (approved):** Next.js 15.x + React 19.x — no silent major-version upgrades.
- **Q6 (approved):** Tailwind CSS **v4** with the CSS-first configuration and cascade-layer strategy.

### 5.1 Versions as installed (recorded at Phase 1 install, 2026-11-09)

Captured from `npm ls` on the resolved tree (`package-lock.json`). The pin set:
`next@15.x`, `react@19.x`, `@tanstack/react-query@5.x`, `tailwindcss@4.x`, `zod@3.x`, `vitest@2.x`.

**Runtime (4 deps, all used):**

| Package | Resolved |
|---|---|
| next | 15.5.29 (`^15.1.0`) |
| react | 19.3.1 |
| react-dom | 19.3.1 |
| @tanstack/react-query | 5.107.1 |
| zod | 3.25.76 |

**Dev (10 deps):** typescript 5.9.3 · vitest 2.1.9 · @vitejs/plugin-react 4.7.0 ·
@testing-library/react 16.3.3 · @testing-library/jest-dom 6.9.1 · jsdom 25.0.1 ·
tailwindcss 4.3.5 · @tailwindcss/postcss 4.3.5 · @types/node 22.20.5 ·
@types/react 19.3.0 · @types/react-dom 19.3.0.

One `npm ls` anomaly: `@emnapi/runtime@1.11.3` is present in `node_modules` but marked
*extraneous* (a transitive Optimization-side artifact of jsdom's optional canvas deps, not
declared in `package.json`). No action taken — it is not imported by any application code.

Node: v26.13.0 (Windows 11). No `.nvmrc`/engines pin was written; Node on this machine is
newer than the Next.js 15 `engines` floor, and the app builds and runs against it.

> **REC-1 (Phase 1 reconciliation):** the mandatory stack is *not* replaced — Prisma 6 and
> PostgreSQL/SQLite remain the chosen ORM/DB for the project and the schema is fully designed
> (`DATABASE_ARCHITECTURE.md` §2) — but Phase 1 introduces no database dependency because its only
> data is static trilingual catalog content (master execution prompt: "Use Prisma 6 only where the
> actual Phase 1 scope requires database persistence. Do not create an unnecessary database
> dependency for static website content"). The stack's *other* seven elements are all live in Phase 1.

> **REC-2 (Phase 1 reconciliation):** React Query is installed and used for its one genuine Phase 1
> surface (live open/closed badge, 60 s visibility-gated poll of `GET /api/status`). Category
> switching is static route navigation (approved Q2), so it is deliberately *not* a query.

## 6. What is explicitly **not** chosen in Phase 0

Phase 0 selects no UI component library (shadcn/Radix vs hand-rolled), no state manager beyond React
Query + URL state, no deployment target, no CMS. Those are Phase 1 decisions, recorded as open questions
with a default recommendation each in `OPEN_QUESTIONS.md` — none is silently assumed.
