# PRISMA_6_STRATEGY — how we use Prisma in this project

> Phase 0 deliverable · Architecture layer · Engine policy and schema are in `DATABASE_ARCHITECTURE.md`;
> this doc covers the *usage* strategy.

---

## 1. Version & posture

- **Prisma 6** (exact patch pinned at Phase 1 install). The 6.x line is the current GA generation with
  the same `schema.prisma` shape we rely on.
- Client instantiation: a single `lib/prisma.ts` per the standard pattern (global-cached in dev to avoid
  exhausting connections during HMR), imported **only by module services**.
- No Prisma in client bundles — enforced by import boundary (review + ESLint rule in Phase 1).

## 2. What Prisma is used for (and what it is not)

**Used for:**
- the authoritative, typed entity layer (Phase 1: services catalog; later: doctors, guide, leads,
  survey, panel entities);
- migrations (`migrate`) and seeds (`db seed`);
- engine-agnostic querying across PostgreSQL (prod) and SQLite (dev/test).

**Not used for:**
- validation that belongs to Zod — Prisma guarantees storage shape, Zod guarantees data meaning. The
  catalog is validated by Zod before it ever reaches Prisma.
- business rules — those live in services; Prisma is storage.
- locale formatting — the `Json` trilingual columns leave rendering to `toView`.

## 3. The `Json` trilingual pattern

Schema: `name Json` etc. Service layer:

```ts
const LocaleTextSchema = z.object({ fa: z.string(), en: z.string(), ar: z.string() });

type LocaleText = z.infer<typeof LocaleTextSchema>;

function toLocalized(text: unknown, locale: Locale): string {
  return LocaleTextSchema.parse(text)[locale];
}
```

Rules:
- Every `Json` field has a Zod sibling schema; parse on read (cheap, and it is the type guarantee).
- Failures to parse = a 500 with a structured log (a corrupted JSON column is a bug, not a user error).
- Never `as` cast JSON columns to a type without parsing.

## 4. Query style

- Explicit `select`/`include` — no `findMany()` returning whole rows; the catalog view shape is stable.
- Relations ordered with `orderBy: { order: asc }` (order is data, per the client-specified group order).
- Filters by `slug` (stable, URL-safe), never by id in URLs.
- Transactions only where multi-row writes need atomicity (not Phase 1 — upserts are single-row).

## 5. Seeding workflow

```
edit src/modules/services/content/*.ts   (fa canonical)
   ↓
pnpm prisma db seed                      (idempotent upserts by slug)
   ↓
content-parity test                      (seeded catalog == reference transcription)
```

- Seed reads content files only — never fetches, never the network.
- In CI: run migrations on SQLite, seed, run tests.
- Production seeding happens at deploy (documented runbook in Phase 1).

## 6. Multi-engine checklist (before every migration is merged)

- [ ] no provider-specific column types or `@db` mappings
- [ ] default values supported by both engines
- [ ] migration applies cleanly on SQLite (`prisma migrate dev`)
- [ ] migration reviewed for PostgreSQL (index strategy, JSON usage)
- [ ] seed + parity test green on both engines

(PostgreSQL-only optimizations like GIN indexes on `Json` can arrive later, gated by a measured need —
the catalog is ~50 rows in Phase 1 and needs no such tuning.)

## 7. Testing

- Unit tests never mock Prisma internals; they use the SQLite test DB (per-test transaction or
  truncated state).
- Service tests run against a seeded SQLite fixture; the parity test runs against the seed itself.
- Handler tests use the same services — no separate API-level DB.

## 8. Known risks & mitigations

| Risk | Mitigation |
|---|---|
| JSON column drift (missing locale key) | Zod parse on read + seed-time schema validation + parity test |
| SQLite/PostgreSQL behavior differences (e.g. `Json` sorting) | no engine-dependent ordering; order is an explicit `Int` column |
| Connection storms in dev HMR | global-cached client singleton |
| Migration drift between engines | CI runs both; checklist §6 |
| Prisma 6 breaking-change surprises | exact version pin; upgrade only in a dedicated task with migration notes |
