# DATABASE_ARCHITECTURE — data model for the in-scope content and the shape of the future

> Phase 0 deliverable · Architecture layer · Engines: **PostgreSQL** in production, **SQLite** in dev
> and test (spec-mandated). Schema is engine-agnostic (Prisma).

---

## 1. Engine policy

| Environment | Engine | Why |
|---|---|---|
| production | PostgreSQL | durability, types, JSON for trilingual text if needed |
| development | SQLite | zero setup, offline dev (matches the reference's offline spirit) |
| test | SQLite (file or in-memory) | fast, isolated per run |

Constraints this puts on the schema:
- no engine-specific column types (no ` jsonb`-only features, no SQLite-only pragmas *in the schema*);
- no `@db.*` native-type mappings unless gated per provider;
- all features checked against **both** engines before a migration is merged (a CI job runs the
  migration on SQLite and PostgreSQL — Phase 1 or 2).

## 2. Phase 1 entities (only what the services boundary needs)

```
model ServiceGroup {
  id        String   @id @default(cuid())
  slug      String   @unique            // "surgical" | "medical"
  order     Int                          // client-specified group order
  name      Json                          // { fa, en, ar }
  createdAt DateTime @default(now())
  categories ServiceCategory[]
}

model ServiceCategory {
  id          String   @id @default(cuid())
  slug        String   @unique           // "gen" | "gyn" | … (reference ids kept)
  groupId     String
  group       ServiceGroup @relation(fields: [groupId], references: [id])
  order       Int                        // ORDER.surg / ORDER.med as published
  icon        String                     // icon registry key, e.g. "i-scalpel"
  image       String?                    // /img/services/*.jpg | null → fallback
  floor       Int                        // -1 | 0 | 2 | 3  (physical building location)
  name        Json                       // { fa, en, ar }
  description Json                       // { fa, en, ar }
  benefits    Json                       // [{ icon, text:{fa,en,ar} }]  ×3
  doctorCat   String                     // reference "doc" key for the doctors cross-link
  items       ServiceItem[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model ServiceItem {
  id          String   @id @default(cuid())
  categoryId  String
  category    ServiceCategory @relation(fields: [categoryId], references: [id])
  order       Int
  icon        String?
  image       String?
  name        Json                       // { fa, en, ar }
  description Json                       // { fa, en, ar }
}
```

Design notes:
- **`slug` = the reference's id** (`gen`, `gyn`, …). Kept identical so URLs, history, and the content
  parity test line up 1:1 with the reference catalog.
- **`floor` is a first-class field**, not a string — the reference treats it as data and renders
  trilingual labels from a map; we keep that purity.
- **`Json` trilingual columns** with a typed `toView` mapper in the service layer: `{ fa, en, ar }`
  enforced by Zod on write/seed, typed as `LocaleText` in TS. (Alternative: a `Locale` table with
  rows-per-locale — rejected for Phase 1: 3 locale rows × 30+ fields of catalog content is over-modeling;
  revisit only if locales are edited at runtime by an admin.)
- **No prices, durations, or availability** anywhere — the reference has none, so we invent none
  (`CONTENT_INVENTORY.md` §7).

## 3. Seed & content parity

- Seed source: `src/modules/services/content/*` (fa canonical), Zod-parsed.
- A **content-parity test** compares the seeded catalog against the reference values transcribed in
  `CONTENT_INVENTORY.md` §3 (10 categories, group order, floors, counts of items/benefits).
- Re-seed is idempotent: `prisma.serviceCategory.upsert` by slug, never destructive deletes in a
  running env (Phase 1 can reset dev freely).

## 4. Future entities (documented, not created)

Provenance and rules carried forward from the reference:

| Model | Notes |
|---|---|
| `Doctor` | 66 records; `photo` optional → monogram; specialty category reference; **mobile & national ID never published (enforced in `toView`)**; extended profile fields with a `TODO → confirm before go-live` status. |
| `DoctorProfile` | hero image, floor, tag, lead, about — only officially published facts. |
| `GuideArticle` | category, pre/post checklists (`GUIDE_COMMON` 4+4); **status: draft / medical-approved / published** — approval is a release gate. |
| `Insurer` | statuses active/limited/none; tariffs & percentages — **all values entered by the center's insurance officer**, never authored by us. |
| `LoanLead` | `{ mobile, name, op, src, status: "new" }` (the reference's demo shape becomes real columns) — Phase 5. |
| `ClubMember` | `{ mobile, topics, birthMonth, tier }` — Phase 5. |
| `SurveyResponse` | 8 surgery sections / 4 lab sections schema from `survey-data.js` — Phase 4/5. |
| Panel entities | users/roles, surgery requests, work logs, invoices, payments, shifts, messages — per `FUTURE_SCOPE.md`; the 6 cross-panel flows imply explicit relations (e.g. Request→OR, Survey→Quality). |

## 5. Migrations

- Created exclusively via `prisma migrate dev` (dev) / `prisma migrate deploy` (prod).
- Never hand-edited; every migration is reviewed against both engines.
- Seed scripts (`prisma db seed`) are versioned with the schema.

## 6. Rules to keep the data layer honest

1. **Only services import Prisma** (`FOLDER_STRUCTURE.md`, `BACKEND_ARCHITECTURE.md`).
2. **No read/write of the DB from components or client islands.** Client data needs → API.
3. **No engine-specific SQL until proven engine-portable.**
4. **No PII columns that the reference deliberately omits** (doctor mobile/national ID stay out of the
   public model; if the panels later need them, separate private fields + access control).
5. **ContentParity test green** is a merge requirement for anything touching the catalog.
