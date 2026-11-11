# API_ARCHITECTURE — Route Handlers, contracts, and error handling

> Phase 0 deliverable · Architecture layer · Rule: `route.ts` handlers are **thin**; business logic
> lives in `src/modules/*/services`.

---

## 1. Shape of a handler

```ts
// src/app/api/services/[category]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCategoryOrThrow } from "@/modules/services/services";
import { ApiError, toErrorResponse } from "@/core/errors";

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { category } = await params;
  try {
    const result = await getCategoryOrThrow(category);   // Zod-parsed, typed
    return NextResponse.json({ ok: true, data: result });
  } catch (e) {
    return toErrorResponse(e);                            // typed envelope below
  }
}
```

Handler responsibilities are exactly five: read input, call a service, map success, map error, set
cache headers. Anything else is a refactor target.

## 2. Envelope (one shape, every endpoint)

```ts
type ApiOk<T>  = { ok: true;  data: T };
type ApiErr    = { ok: false; error: { code: string; message: string; details?: unknown } };
type ApiResult<T> = ApiOk<T> | ApiErr;
```

- `code` is a stable machine identifier (`NOT_FOUND`, `VALIDATION`, `CONFLICT`, `INTERNAL`) — the client
  switches on it, never on a message string.
- `message` is display-safe and **localized server-side** using the request locale.
- `details` for validation errors: per-field issues the form layer can map.

## 3. Validation (Zod at the edges)

| Crossing | Schema |
|---|---|
| request path/query/body → handler | `src/modules/*/schemas/*Request.ts` |
| content module → app/seed | `*Content.ts` schemas (the catalog itself) |
| service → response | response schema (optional for internal, mandatory for public contract) |

Validation failure → `VALIDATION` envelope with `details`, HTTP 400. **The reference's own validation
habit is kept and generalized**: `/^09\d{9}$/` with Persian-digit tolerance (`loan.js`) becomes a shared
`phoneNumber` schema used wherever forms later land.

## 4. Phase 1 endpoints (only what the boundary needs)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/services` | catalog index (groups + categories summary) |
| GET | `/api/services/[category]` | one category with benefits + sub-services |
| GET | `/api/site-status` | open/closed computed server-side (Asia/Tehran) — SSR fallback for the badge |

No POST endpoints exist in Phase 1 because **the two home forms are out of scope** (`SERVICES_SCOPE.md`
§3). The first POST (loan lead, Phase 5) will follow this same architecture.

## 5. HTTP semantics

| Concern | Rule |
|---|---|
| Status codes | 200 ok · 400 validation · 401/403 auth (later) · 404 not found · 409 conflict (later) · 500 unexpected |
| Cache | catalog GETs: `s-maxage`, `stale-while-revalidate`; never cache the site-status route |
| IDs | slugs in URLs, never auto-increments in URLs |
| Response language | `Accept-Language` or the app locale; `message` localized, `code` not |
| Logging | structured, server-only, no PII — mobile numbers are *never* logged (they are not even published in the reference) |

## 6. What the reference taught us to avoid

- **`localStorage` as a backend.** The demo panels read/write state ad hoc with no schema, no
  concurrency, no validation beyond one regex. Our rule: any state that must survive a refresh or be
  shared between users belongs to a service + Prisma.
- **No error contracts.** Panel scripts silently catch and `return []`. Our rule: typed errors, one
  envelope, testable.
- **Duplicated digit-tolerant parsing** (two files re-implement `en()`). One shared util.

## 7. Testing the API

- Every endpoint has a handler test (Vitest + in-memory app) asserting: envelope shape, 404 for unknown
  slugs, 400 on bad input, and that the handler calls the service (logic tested separately).
- Service tests hit the **SQLite** test DB via Prisma, never PostgreSQL and never mocks of Prisma
  itself.
