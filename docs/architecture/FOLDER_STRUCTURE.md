# FOLDER_STRUCTURE — the target `src/` layout

> Phase 0 deliverable · Architecture layer · This is the **proposed** layout from the master
> specification, refined against everything the reference inspection surfaced.

---

## 1. The tree

```
clinic-pro/
├─ docs/                       ← this documentation set (Phase 0 output)
├─ پلتفرم/                      ← the untouched reference project (read-only, forever)
├─ public/
│  ├─ fonts/                   ← Vazirmatn-Variable.woff2, NotoNastaliqUrdu-Bold.woff2 (copied, never hotlinked)
│  └─ img/                     ← only in-scope images (home, services), copied from the reference
├─ prisma/                     ← NOT created in Phase 1 (REC-1); schema stays documented in
│                              ← DATABASE_ARCHITECTURE.md §2 until a phase adds dynamic editing
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx            ← root layout: <html lang dir>, fonts, `import "./globals.css"`
│  │  ├─ globals.css           ← `@import "../styles/globalCss/index.css"` — RELATIVE path
│                              ← (postcss-loader does not resolve the "@/@" alias; see
│                              ← GLOBAL_CSS_ARCHITECTURE.md §1 Phase 1 correction)
│  │  ├─ page.tsx              ← home
│  │  ├─ services/
│  │  │  ├─ page.tsx           ← services section root (group landing, both groups)
│  │  │  └─ [category]/page.tsx ← per-category route — approved Q2 = path segments
│  │  ├─ api/                  ← Route Handlers only (route.ts, thin)
│  │  │  └─ status/route.ts    ← open/closed badge source (the sole Phase 1 handler — REC-2)
│  │  ├─ sitemap.ts
│  │  └─ robots.ts
│  ├─ modules/
│  │  ├─ services/
│  │  │  ├─ components/        ← ServiceCategoryTabs, ServiceDetailPanel, SubServiceGrid …
│  │  │  ├─ hooks/             ← client hooks (live badge consumers)
│  │  │  ├─ lib/               ← pure helpers (floor labels, group order)
│  │  │  ├─ services/          ← getServiceCategories, getServiceCategory (pure reads over content — no Prisma)
│  │  │  ├─ schemas/           ← Zod: ServiceCategorySchema, SubServiceSchema
│  │  │  ├─ types/             ← TS types derived from schemas
│  │  │  ├─ constants/         ← SERVICE_GROUPS order, FLOORS map
│  │  │  ├─ queries/           ← React Query keys + hooks (live badge — REC-2)
│  │  │  └─ content/           ← trilingual catalog data (fa canonical), Zod-validated at the module boundary
│  │  ├─ home/                 ← hero, stats, bento, CTA composition
│  │  └─ i18n/                 ← locale contract, messages, digit/Jalali utils
│  ├─ core/
│  │  ├─ i18n/                 ← locale resolution, <html lang dir>, message loading
│  │  ├─ api/                  ← shared API client + error envelope
│  │  ├─ errors/               ← typed domain errors
│  │  └─ env/                  ← validated environment (Zod-parsed)
│  ├─ components/
│  │  ├─ ui/                   ← primitives (Button, Tabs, Badge, Card) — tokens only
│  │  ├─ shared/               ← LanguageSwitcher, Icon, Logo, LiveStatus
│  │  ├─ layout/               ← SiteHeader, SiteFooter, Container, BurgerNav
│  │  └─ feedback/             ← Toast, Skeleton, EmptyState, ErrorBoundary
│  ├─ styles/
│  │  └─ globalCss/
│  │     ├─ tokens.css         ← palette, typography, spacing, radii, shadows, motion
│  │     ├─ themes.css         ← light/dark + (optional) vivid variant
│  │     ├─ typography.css     ← Persian type rules, nastaliq scope, digit handling
│  │     ├─ layout.css         ← containers, grids, breakpoints
│  │     ├─ utilities.css      ← hand-written utilities only when Tailwind can't
│  │     └─ index.css          ← @import order (imported by app/globals.css)
│  ├─ types/                   ← app-wide ambient types
│  ├─ hooks/                   ← cross-module hooks (useMediaQuery, useReducedMotion)
│  └─ config/                  ← site.config.ts (name, phone, hours, nav), env flags
├─ tests/ or per-file *.test   ← Vitest, co-located by default
├─ vitest.config.ts
├─ tailwind.config.ts          ← wires tokens.css variables into the theme
├─ next.config.ts
├─ tsconfig.json               ← strict, path aliases @/*
└─ package.json
```

## 2. Why this shape

| Property | How the layout enforces it |
|---|---|
| **Feature cohesion** | `src/modules/<feature>` owns components, hooks, lib, services, schemas, types, constants, queries, content — one folder per deliverable feature. The reference's flat `assets/js` (24 files, no boundaries) is the counter-example. |
| **Server-first** | `app/` holds only routes and layouts; everything with logic lives in `modules/*/services` and is callable from RSC without an HTTP hop. |
| **Thin handlers** | `app/api/**/route.ts` imports a module service, parses with Zod, maps errors; no business logic. |
| **One visual contract** | `components/ui` consumes only semantic variables from `styles/globalCss`; raw palette values appear nowhere but `tokens.css`. |
| **Persian-first** | `modules/i18n` treats fa as canonical; the `core/i18n` layer resolves the locale and sets `<html lang dir>`. |
| **Testability** | services and lib are pure; `schemas` are tested independently of rendering; Vitest co-locates tests with modules. |
| **Proportional foundation** | Only modules the in-scope boundary needs exist (services, home, i18n). Doctors/guide/clinics modules appear in later phases, each following the same template. |

## 3. Rules that keep it from rotting

1. **No cross-module component imports.** Module A uses Module B only through B's `services` or
   `queries`. Shared UI goes to `components/*`.
2. **`core` depends on nothing app-specific.** Modules may depend on `core`; never the reverse.
3. **Content lives in `modules/*/content`**, not in `app/` and not in the DB exclusively — the DB is
   seeded from it, and it remains the edit-target for content owners (one file, one command).
4. **`src/config/site.config.ts` is the single home for site constants** (name, phone, hours, nav
   map) — the reference's copy-paste of phone/hours into 22 files is exactly what we are removing.
5. **Path alias `@/*`** for every non-relative import.
6. **File naming:** components `PascalCase.tsx`, everything else `kebab-case.ts`; one component per file.

## 4. What is deliberately absent in Phase 1

- No `modules/doctors|guide|clinics|assistant|…` (out of scope).
- No `app/(panel)` or auth layer (panels are out of scope).
- No `modules/loan` or `modules/club` (home forms out of scope).
- No storybook, no e2e harness (Phase 2 evaluation, `MASTER_ROADMAP.md`).

## 5. Mapping reference → target (cheat sheet)

| Reference | Target |
|---|---|
| 22 × duplicated `<header>` | `components/layout/SiteHeader.tsx` in root `layout.tsx` |
| 22 × duplicated `<footer>` | `components/layout/SiteFooter.tsx` |
| inline `<symbol>` sprite ×22 | `components/shared/Icon.tsx` + registry |
| `assets/css/{style,vivid,…}.css` | `styles/globalCss/*` + Tailwind |
| `assets/js/services-data.js` | `modules/services/content/*` + `schemas` + Prisma seed |
| `assets/js/services.js` | `modules/services/components/*` (client island) + server routes |
| `assets/js/main.js` i18n engine | `core/i18n` + `modules/i18n` |
| `assets/js/main.js` LIVING LAYER | `hooks/` + small client components, same capability gates |
| `localStorage["kh-lang"]` | locale cookie/URL + client persistence |
| per-page `<title>`/meta | `app/*/page.tsx` metadata API |
