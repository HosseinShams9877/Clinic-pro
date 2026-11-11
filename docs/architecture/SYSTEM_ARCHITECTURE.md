# SYSTEM_ARCHITECTURE — the target system, end to end

> Phase 0 deliverable · Architecture layer · Companion specs: `FOLDER_STRUCTURE.md`,
> `NEXTJS_APP_ROUTER.md`, `API_ARCHITECTURE.md`, `BACKEND_ARCHITECTURE.md`, `DATABASE_ARCHITECTURE.md`.

---

## 1. One-paragraph design

A **Next.js App Router** application, Persian-first and RTL-first, that renders the public website as
**React Server Components** by default. Content lives in typed, Zod-validated modules seeded into
**PostgreSQL** through **Prisma 6** (SQLite in dev/test). Every mutation and every query the client
cannot do statically goes through **Route Handlers** (`src/app/api/**/route.ts`) whose logic lives in
module-level services — handlers stay thin. Client-side server-state (catalog revalidations, eventual
form submissions) is managed by **TanStack React Query v5**. Styling is **Tailwind** driven by a
centralized token system (`tokens.css` → semantic CSS variables) so the visual language is a contract,
not a convention. Validation is **Zod** at the edge of every data crossing (content files → app, API
request → service). Tests run on **Vitest**.

## 2. Layers (top to bottom)

```
┌──────────────────────────────────────────────────────────────┐
│  Browser (fa/en/ar · rtl default)                            │
│  ┌────────────────────────┐  ┌───────────────────────────┐   │
│  │ Server Components       │  │ Client islands            │   │
│  │ (content, layout, SEO)  │  │ (tabs, motion, lang)      │   │
│  └────────────────────────┘  └───────────┬───────────────┘   │
│           ▲ static/RSC payload           │ React Query v5    │
├───────────┼──────────────────────────────┼───────────────────┤
│           │          Next.js (Node runtime, App Router)        │
│  Route Handlers (route.ts) ◄─────────────┘                   │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ module services (src/modules/*/services)             │    │
│  │   - business rules, no HTTP, no Prisma import leaks  │    │
│  │   - Zod-parse at entry, throw typed errors           │    │
│  └───────────────────────┬──────────────────────────────┘    │
│  ┌───────────────────────▼──────────────────────────────┐    │
│  │ Prisma Client 6 (schema = single source of truth)    │    │
│  └───────────────────────┬──────────────────────────────┘    │
│  ┌───────────────────────▼──────────────────────────────┐    │
│  │ PostgreSQL (prod) · SQLite (dev + test)              │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
   content modules (src/modules/*/content, trilingual, fa-canonical)
   ─ seed the catalog via a script; also the SSR source of truth
```

## 3. Principles (each is enforceable in review)

1. **Server-first.** A component becomes a client component only when it needs state, effects, or
   browser-only APIs — and the reason is written in a code comment at the top.
2. **Persian-first.** Defaults: `lang="fa"`, `dir="rtl"`, fa messages, Jalali formatting. EN/AR are
   locales you switch *to*; nothing about them is the default.
3. **Content is typed and validated.** Nothing reaches the render tree that did not pass a Zod schema.
4. **Thin handlers, rich services.** A `route.ts` that contains business logic is a review blocker.
5. **Tokens are the visual contract.** Components consume semantic variables; raw palette values never
   appear in components.
6. **No content invention.** Every content value traces to `docs/knowledge/CONTENT_INVENTORY.md` or is
   marked `TODO` with an owner (the doctor, the insurance officer, the medical team, or the client).
7. **Resilience is a feature.** The in-scope pages must render complete content with JS disabled.
8. **Motion is opt-in by capability.** `prefers-reduced-motion` and `pointer: fine` gate all motion.

## 4. The two concrete subsystems the architecture must serve

### 4.1 The services catalog (the whole Phase 1 boundary)
- Data shape mirrors the reference's `SERVICE_CATS` (group, floor, trilingual name/desc, 3 benefits,
  3–5 items) with one change: **IDs are stable slugs used both as DB ids and URL segments**.
- Served statically at build (Server Components read via the content module or a cached Prisma read —
  decision in `REACT_QUERY_V5_STRATEGY.md` §4), switchable client-side.
- No JS fallback = the server-rendered HTML itself (not a second copy).

### 4.2 The i18n + locale subsystem
- `<html lang dir>` driven by the active locale; Persian canonical messages; en/ar dictionaries
  generated from the same keys; **digit localization and Jalali conversion happen only at the render
  boundary.** Full design in `LOCALIZATION_AND_CALENDAR.md`.

## 5. Boundaries and contracts

| Boundary | Contract | Enforced by |
|---|---|---|
| content file → app | Zod schema per content type | module `schemas/`, unit tests |
| client → server | Zod request schema + typed response | `api` schemas + Vitest |
| service → Prisma | only `services` import `PrismaClient` | ESLint boundary rule (Phase 1) |
| tokens → components | semantic CSS variables only | Tailwind config + review |
| app → reference content | values match `CONTENT_INVENTORY.md` | content-parity test |

## 6. Non-functional targets (Phase 1 commitments)

- **Performance:** Lighthouse Performance ≥ 90 on `/` and `/services` on mobile (target, re-measured at
  Phase 1 exit); no layout shift from fonts (self-hosted WOFF2 + `font-display: swap`).
- **Accessibility:** axe-clean, WCAG 2.1 AA contrast, full keyboard operation, Persian/RTL focus order.
- **SEO:** static HTML for every in-scope route; per-route title/description/canonical/OG; sitemap.
- **Maintainability:** any Persian-speaking front-end developer can add a service category by editing
  one content file + one seed command — no code changes.
- **Security:** no secrets in client bundles; CSP-ready; inputs validated server-side (the two home
  forms are out of scope, but the pattern establishes the rule).

## 7. Open architectural decisions (all filed in `OPEN_QUESTIONS.md`)

Q1 booking CTA target · Q2 category URL shape (hash vs path) · Q3 the two home forms · Q4 header/footer
links to excluded pages · Q5 Next 15/React 19 · Q6 Tailwind v4 vs v3 · Q7 i18n library · Q8 CMS later.
