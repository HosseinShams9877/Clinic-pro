# MODULAR_ARCHITECTURE — the feature-module contract

> Phase 0 deliverable · Architecture layer · The folder layout is in `FOLDER_STRUCTURE.md`; this doc
> is the **contract** that makes modules behave like modules.

---

## 1. The module template

Every feature (services in Phase 1; doctors, guide, clinics, home later — home is a composition
module) has the same internal shape:

```
src/modules/<feature>/
├─ components/   React components for this feature only
├─ hooks/        client hooks (use*, React Query optional)
├─ lib/          pure functions — the feature's domain logic
├─ services/     async server-facing logic; the ONLY Prisma importer
├─ schemas/      Zod schemas (content, request, response)
├─ types/        TS types, derived from schemas where possible
├─ constants/    non-changing facts (orders, key maps, floors)
├─ queries/      React Query keys + hooks (used by hooks/ as needed)
└─ content/      trilingual content (fa canonical) where the feature is content-driven
```

A module may omit a folder it doesn't need, but it may not invent new ones without a note in this doc.

## 2. Dependency rules (enforced in review, later by ESLint)

```
app/  ──▶ modules/* ──▶ core/* ──▶ (nothing app-specific)
components/* ◀── modules (shared UI only)
modules/* ──▶ components/*  (shared UI)
modules/* ✗──▶ modules/* (any cross-module import goes through services or core)
modules/*/components ──▶ components/ui + own primitives only
anywhere ✗──▶ prisma (except modules/*/services)
```

| Rule | Rationale |
|---|---|
| No module-to-module imports | each feature is independently replaceable; a doctor module rewrite must not touch services |
| `core` depends on nothing app-specific | the i18n/api/error/env primitives stay stable |
| Only `services` touch Prisma | storage is behind one seam (see `BACKEND_ARCHITECTURE.md`) |
| Components in a module never import another module's components | duplication is preferred to coupling at this scale |

## 3. The `services` module (Phase 1 exemplar)

The catalog module demonstrates every part of the contract at once:

| File | Responsibility |
|---|---|
| `content/*.ts` | the 10 trilingual categories, fa canonical — a content owner can edit this without reading code |
| `schemas/serviceCategory.ts` | Zod for `ServiceCategoryContent` (group, floor, name/desc, benefits ×3, items, order) |
| `types.ts` | `LocaleText`, `ServiceCategoryView`, derived from schemas |
| `constants.ts` | `SERVICE_GROUPS` order, `FLOOR_LABELS` map (trilingual), icon registry keys |
| `lib/floorLabel.ts` · `lib/groupOrder.ts` | pure, fully unit-tested |
| `services/getCategories.ts` · `getCategoryOrThrow.ts` | pure reads over the Zod-validated content module (no Prisma in Phase 1 — REC-1) |
| `queries/serviceCategories.ts` | React Query keys + hooks (live badge only in Phase 1 — REC-2) |
| `hooks/useCategorySwitch.ts` | URL-synced category state (route navigation, per approved Q2) + a11y announcement |
| `components/ServiceCategoryTabs.tsx` | client island: tabs (role=tablist), keyboard operable |
| `components/ServiceDetailPanel.tsx` | crumb, name, desc, floor, benefits — no doctors link (REC-3), no video control |
| `components/SubServiceGrid.tsx` | server-renderable grid; each card CTA = `tel:` |

## 4. Module API surface ("public" files)

A module exposes:
- its `components/*` (root index re-exports what `app/` may use),
- its `queries/*` hooks (client),
- its `services/*` functions (server),
- its `types`,
- nothing else. `content/`, `schemas/`, `lib/`, `constants/` are internal — import them only from within
  the module.

## 5. What the reference taught us here

The reference's 24 flat JS files have no seams: `services.js` reads `window.SERVICE_CATS` from
`services-data.js`, `doctors.js` reads `doctors-data.js`, and `main.js` touches everything. It works at
24 files and collapses at 40 — that is the exact failure mode the module contract prevents.

Its good habits, kept:
- **Data separated from logic** (`*-data.js` ≈ `content/`).
- **One owner per concern** (i18n engine alone touches translations).
- **Progressive enhancement decided per feature**, not globally — we keep that by making the
  server-rendered path the feature's default and enhancement explicit (a client island component).

## 6. Home as a composition module

`modules/home` owns no service logic; it composes `services`' components (the bento teaser) plus its own
presentational sections (hero, stats, help, care banner, patient steps, why-us, contact). This keeps the
home page honest about the boundary: **it displays a teaser of the services catalog and nothing beyond
it** (`SERVICES_SCOPE.md` §3). The loan and club sections are not composed at all (REC-7).

## 7. Adding a future module — the checklist

When doctors/guide/etc. arrive: copy the template, fill the eight folders, add the two dependency edges
(`app` → module, module → `core`), add content-parity test if content-driven, add the provenance rule
from `CONTENT_INVENTORY.md` §7 to the `toView`/review process. No architectural discussion needed —
that uniformity is the point.
