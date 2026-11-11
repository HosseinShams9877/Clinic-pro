# BACKEND_ARCHITECTURE — services, data, and runtime logic

> Phase 0 deliverable · Architecture layer · "Backend" here means: everything behind the Route
> Handler — module services, Prisma access, and pure domain logic.

---

## 1. Service layer (`src/modules/*/services`)

The one place business rules live.

```ts
// src/modules/services/services/getCategory.ts
export async function getCategoryOrThrow(slug: string): Promise<ServiceCategoryView> {
  const row = await prisma.serviceCategory.findUnique({ where: { slug }, include: { items: true } });
  if (!row) throw new NotFoundError("service_category", slug);
  return toView(row);          // mapping fn, pure, tested
}
```

Rules:
1. **Services own Prisma.** Components, hooks, and handlers never import `PrismaClient`.
2. **Services never see HTTP.** No `NextRequest`, no `NextResponse`, no headers.
3. **One fact per function** — name the function after the question it answers
   (`getCategoryOrThrow`, `isAdmissionsOpen`).
4. **Return views, not rows.** A `toView` mapper converts Prisma rows into the shape components need
   (e.g. flattening the trilingual text columns into `{ fa, en, ar }` records, or picking the active
   locale). This is what keeps components simple and the reference's flat-array style from leaking in.
5. **Errors are typed** (`NotFoundError`, `ValidationError`, …) from `core/errors`, mapped to the API
   envelope at the handler, mapped to UI states in the client.

## 2. Pure domain logic (the `lib` folders)

Everything deterministic and reusable is a pure function — independently testable:

| Function | Source behavior preserved |
|---|---|
| `isAdmissionsOpen(at: Date)` | Asia/Tehran, Friday closed, 07:30–20:00 (minutes 450–1200). Server-computed for SSR; the reference re-checks every 60 s client-side (kept). |
| `floorLabel(floor, locale)` | `-1 → طبقه زیرزمین`, `0 → همکف`, `2 → دوم`, `3 → سوم` (+ en/ar) — from `services.js`. |
| `groupedCategories(cats)` | the client-specified `ORDER.surg`/`ORDER.med` order. |
| `toPersianDigits` / `toArabicDigits` / `toLatinDigits` | the reference's SETS helpers, UI-only. |
| Persian-tolerant phone parse | `/^09\d{9}$/` after digit normalization (from `loan.js`). |

## 3. Content pipeline

```
src/modules/services/content/*.ts   (fa canonical, trilingual entries)
   ↓ Zod schema (ServiceCategoryContent)
seed.ts → Prisma (PostgreSQL prod, SQLite dev/test)
   ↓
services read (build-time for static pages, request-time for API)
   ↓ toView
React Server Components / API envelope
```

- Editing a category = editing the content file + re-running the seed (documented in the repo README).
- Content parity test asserts the seeded catalog equals the reference values captured in
  `CONTENT_INVENTORY.md` §3 (a regression net against drift).
- **Nothing is invented in this pipeline**: every value traces to the reference or carries a `TODO`
  owner (§7 of `CONTENT_INVENTORY.md`).

## 4. Locale handling server-side

- Locale resolution order: URL → cookie → `Accept-Language` → fa (default).
- The resolved locale sets `<html lang dir>` at request time: **no client flash on first paint**.
- Messages (fa canonical; en/ar siblings under the same keys) are loaded per-locale; digit and Jalali
  formatting are applied at the render boundary only (`LOCALIZATION_AND_CALENDAR.md`).

## 5. Runtime posture for Phase 1

- Node runtime for the app (no edge-only constraints needed yet).
- Static generation for `/`, `/services`, per-category routes; API routes dynamic or cached per
  `NEXTJS_APP_ROUTER.md` §7.
- Environment variables validated at boot through `core/env` (Zod) — fail fast in dev rather than at
  runtime.
- No queues, no workers, no websockets in Phase 1 (panels may need them later — `FUTURE_SCOPE.md`).

## 6. Security-relevant backend rules (full doc: `SEO_ACCESSIBILITY_SECURITY.md`)

- All inputs validated server-side regardless of client validation.
- No PII in logs; mobile numbers are treated as sensitive (the reference deliberately does not publish
  them — we keep that posture).
- Prisma parameterizes everything; no raw SQL in Phase 1.
- Secrets never appear in the client bundle (`NEXT_PUBLIC_*` audit).

## 7. When the boundary moves (later phases)

The same service pattern extends without rework: `modules/doctors/services/*` (with the
mobile/national-ID non-public rule enforced at the `toView` layer), `modules/guide/services/*` (with
the medical-approval gate as a status field), lead pipelines for loan/club (the reference's demo
shapes `{…, at, status:"new"}` become real columns), and panel surfaces with roles. Phase 1 defines the
shape; it does not build the features.
