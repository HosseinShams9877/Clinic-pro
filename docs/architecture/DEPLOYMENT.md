# DEPLOYMENT — runtime posture, hosting, and the database boundary

> Phase 2 deliverable (item 12) · Architecture layer · Answers the spec row:
> *"Deployment story (static vs Node, PG provisioning)"* — cross-references
> `BACKEND_ARCHITECTURE.md` §5 (runtime posture for Phase 1).
>
> **Status: documented only.** Nothing below requires code changes to the delivered
> build — the runtime decision recorded in §3 is a hosting choice the owner makes
> before the first public deploy, and the PostgreSQL posture of §7 is a runbook for
> the phase that first needs persistence. Prisma is **not installed** and is not
> installed by this item (Phase 2 prohibition: *"No Prisma/database install for
> static content"… "DATABASE_ARCHITECTURE.md schema design may be documented under
> item 12, but not implemented"*). See §7.

---

## 1. What is actually being deployed

The delivered surface (`/` through the complete Services section + the item-4
404 page, fa/en/ar, RTL-first) is a **Next.js App Router** application:

| Route | Render mode | Source of data |
|---|---|---|
| `/` | dynamic `ƒ` (locale-resolved per request) | typed content modules (`src/modules/*/content`) |
| `/services` | dynamic `ƒ` | content modules |
| `/services/[category]` × 10 | **SSG** `●` (statically generated at build) | content modules |
| `/_not-found` (the fa 404 page) | dynamic `ƒ` | content modules |
| `/api/status` | Route Handler (dynamic) | pure domain function, no store |
| `/robots.txt`, `/sitemap.xml` | static `○` | route catalog |
| everything else | the 404 page | — |

Content is **static, typed, and Zod-validated at module load** — not read from a
database at request time. `grep -rn "prisma" src/` finds zero imports (the single
hit is a comment citing REC-1). The whole public surface therefore boots with
**no environment variables and no external datastore**: `grep -rn "process.env" src/`
returns nothing.

## 2. Why the server (Node) posture is load-bearing

Five behaviors of the delivered build require a running Next.js server. Each was
verified live against the production build at `http://localhost:3137`; the evidence
citations are the Phase 1/2 logs.

| # | Behavior | Why it needs the server | Observed evidence |
|---|---|---|---|
| 1 | **`next/image` optimization** | the `/_next/image` optimizer runs server-side with the bundled `sharp`; it encodes AVIF/WebP on demand and derives the srcset. A static export disables the optimizer entirely and serves the unoptimized source file. | item 8: or-hero AVIF `w=640` = **21,013 B vs the 332,365 B source JPEG (94% smaller)**, WebP fallback 41,324 B, `Vary: Accept`, 16-entry srcset, sizes honored (384 w @393 px, 640 w @1280 px); warm LCP 64–100 ms (item 11, `docs/reports/cwv-audit.log`) with a one-time cold per-width encode of 312–528 ms |
| 2 | **`/api/status` Route Handler** | the LiveStatus client island polls `GET /api/status` every 61 s (visibility-gated) for the admissions-open state; the handler Zod-parses its own response at the edge | item 9 live check: badge SSRs + hydrates + polls with zero console errors; contract payload `{"open":false,"opensInMinutes":564,"dayLabel":"tomorrow"}` |
| 3 | **Middleware (locale override)** | `src/middleware.ts` mirrors a valid `?lang=` value into the `lang` cookie on both request and response, so `<html lang dir>` honors the query override on the very same render | verified `?lang=en` → `lang="en" dir="ltr"`, `?lang=ar` → `lang="ar" dir="rtl"` (E13); the 34.8 kB middleware bundle is in the build output |
| 4 | **Security headers + CSP** | `next.config.ts` `headers()` emits `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` on `/(.*)` — applied by the server, not by a file on disk | all five headers present on every response incl. `/services/gen` (§4.4 of the Phase 1 report; E15 proves the CSP blocks nothing real) |
| 5 | **Legacy redirects** | `/services.html` → `/services` and `/index.html` → `/` are `permanent: true` (308, method-preserving) redirects from the server | single-hop, loop-free (E17) |

Items 3–5 could technically be re-housed in a front web server (nginx/Caddy) for a
static deployment, and item 4 must be, wherever the TLS terminates. Items 1–2
cannot: **item 1 is the image pipeline the whole visual identity rides on, and
replacing it means running a separate image-resizing service or shipping 675 KB
unoptimized JPEGs per page** — the reference's own weight problem, which item 8
removed (67 KB vs 675 KB, 10×, and responsive/AVIF).

**Recommended posture: Node, `next start` behind a TLS-terminating reverse proxy.**
This is exactly the posture every gate in Phase 1 and Phase 2 was measured against
(`npm run build && npm run start --port 3137`), so the checked-in evidence
transfers 1:1 to the deployed origin apart from the network path.

## 3. Runtime requirements (Node host)

- **Node ≥ 20.19.0** — declared in `package.json` `engines`. No `.nvmrc` exists yet
  (Phase 1 issue R-8); pin the exact Node (e.g. the 20.x or 22.x LTS in use) on the
  host and in CI so the runtime does not drift. One-line fix, deliberately left to
  the deploy task.
- **Process model:** one Node process. No queues, no workers, no websockets in this
  scope (`BACKEND_ARCHITECTURE.md` §5). `next start` suffices; run it under a
  supervisor (systemd unit, PM2, or the platform's equivalent) so it restarts and
  survives log rotation.
- **Disk:** the image optimizer caches encoded variants under
  `.next/cache/images`. The catalog is 15 reference-copied images, so the cache is
  small (per route × width × format — observed: a handful of variants); still,
  provision disk so the cache is writable, and do **not** wipe it on every restart
  or every cold load pays the encode again (item 8's cold LCP finding).
- **Memory/CPU:** the build needs sharp's encode pass (observed 312–528 ms per
  cold variant at dev-machine speed); the running server serves cached variants.
  No load data exists yet — there has been no real traffic; size on first
  production measurement, not on these local numbers.
- **No environment variables are required by the delivered app** (§1). The only
  runtime knobs are the port (`next start -p <port>`) and, when persistence
  arrives, `DATABASE_URL` (§7).

### 3.1 TLS, HSTS, and the risk numbering

Every Phase 1/2 gate was measured at a **plain-HTTP local origin**, which is why
`Strict-Transport-Security` is deliberately absent from `next.config.ts`: HSTS is
invalid over HTTP. Add it at the HTTPS deploy, at the proxy:

```
Strict-Transport-Security: max-age=63072000; includeSubDomains
```

This is **R-4 in the Phase 1 report's risk table** (`docs/reports/PHASE_1_REPORT.md`
§10) — *not* R-4 of `docs/reports/TECHNICAL_RISKS.md`, which is the CSS
override-pattern risk (`vivid.css` lesson). The two documents both use an `R-4`
id for unrelated items; until one is renumbered, always say **which** R-4. The
audit scripts (`scripts/cwv-audit.mjs`, its log) say "deferred to R-4" meaning the
Phase 1 HSTS row. *(This collision is recorded here rather than silently
renumbered: renumbering either risk register would orphan the citations already
checked in across reports and scripts.)*

The performance budgets are origin-independent — only TTFB gains a TLS handshake
on a real origin; the rest (FCP, LCP, CLS, INP) is measured after the connection
is established. `SEO_ACCESSIBILITY_SECURITY.md` §4's perf targets and the item-11
budget both transfer unchanged.

The two other Phase 1 security residues carry over verbatim: R-3 (CSP uses
`'unsafe-inline'` for script/style, required by the App Router without nonce
middleware — a per-request nonce in middleware is the documented later mitigation)
and R-5 (no `og:image`; waiting on a brand social image the reference sanctions).

## 4. Rejected alternative: `output: "export"` (static-only)

Next.js can emit a fully static tree (`output: "export"`). It was evaluated and
**rejected for this site**, on the load-bearing evidence of §2:

| Capability | Node posture (delivered) | Static export |
|---|---|---|
| Image optimization | AVIF/WebP on demand, srcset, `Vary: Accept` (94% smaller hero) | **disabled** — unoptimized sources served as-is |
| `/api/status` | Route Handler, Zod at the edge | **not exportable** — needs an external endpoint |
| Locale middleware | `?lang=` mirrored to cookie in the same render | **not exportable** — locale must be client-side only |
| Security headers | applied by the server on every response | must all be configured on the web server |
| Legacy redirects | 308 from the server | must be re-declared on the web server |
| SSG pages | pre-rendered at build (10 category routes) | identical — this part *is* static either way |

The export path trades away the achieved image pipeline and adds two external
services (an image resizer, a status endpoint) to save one Node process. It is
recorded as **considered and rejected**, not as a silent omission — it stays the
fallback if the only available hosting cannot run Node, in which case §2's items
1–2 must be re-provisioned explicitly before the visual and live-status behavior
is re-verified.

## 5. Hosting options (owner decision required)

| Option | What it is | What it changes vs the verified posture | Residual questions for the owner |
|---|---|---|---|
| **A. Node host behind a reverse proxy** (VPS / container; nginx or Caddy for TLS) | `npm run build`, then `npm run start` under a supervisor; the proxy terminates TLS and serves HSTS | **nothing functional** — this is the posture every gate was measured against | who operates the host (patching, restarts, log rotation, backups); TLS certificate renewal |
| **B. Managed Next.js platform** | a vendor that runs `next start` for you | same runtime, but the origin, headers, and image cache are the vendor's; the checked-in CI workflow (`.github/workflows/cwv-budget.yml`) assumes a self-run runner | vendor lock-in, data-residency and reachability of a clinic audience in ایران, and whether the `'unsafe-inline'` CSP posture remains accurate on the platform's runtime |
| **C. Static export + CDN** | §4's rejected posture | loses image optimization and the status endpoint unless re-provisioned | only if Node hosting genuinely cannot be arranged |

**Recommendation: Option A.** Every checked-in gate log was produced on exactly
that shape, so the deploy is a re-host, not a re-verification. Option B is viable
but introduces a vendor relationship and at least one re-verify pass (headers,
image cache behavior, CSP) on a runtime this project has not measured. Option C is
the fallback with known losses.

The **owner decision required before deploy** is which option (§5). This is the
last undecided Phase 2 decision: item 7's vivid skin (Q9) is already resolved as
drop-confirmed, so the Phase 2 report's "owner decisions still required" section
reduces to this one.

## 6. Release gates at deploy time

The same five gates the CI workflow runs (`.github/workflows/cwv-budget.yml`),
in order — all were run by hand against the delivered build; the workflow is
ready-wired for the moment a runner is attached:

1. `npm run typecheck` — `tsc --noEmit` clean
2. `npm test` — the full Vitest suite
3. `npm run build` — production build success
4. `npm run a11y:scan` — axe zero serious/critical (R-6 gate; 78/78 page-runs at the last run)
5. `npm run cwv` — the CWV budget (item 11); warm-gated, exits non-zero on breach

Then, at the deployed origin (once, by hand): re-check the security headers
including the new HSTS, confirm the sitemap/robots resolve at the real domain, and
(recommended) re-run `npm run cwv` with `CWV_ORIGIN=https://<domain>` so the first
field-shaped numbers are on the real TLS path. The workflow file documents why the
local origin is HTTP.

## 7. PostgreSQL provisioning (documented, NOT implemented)

### 7.1 Why it is not running yet

The Phase 0 architecture specifies **PostgreSQL in production, SQLite in dev and
test** (`DATABASE_ARCHITECTURE.md` §1, and CLAUDE.md's mandatory stack). Phase 1
**deliberately did not install it**: REC-1 keeps the static catalog in typed
content modules seeded from the reference via `scripts/seed-content.mjs` (item 2's
single data-entry path), so the public surface has zero database dependency —
proven above (§1). The Phase 2 prohibition confirms this: no Prisma install for
static content. **`package.json` carries no `prisma`, no `@prisma/client`, no
database driver**; the only package added in all of Phase 2 was the dev-only
`axe-core` (Part A).

The schema design already exists and is **not** re-created here:
`DATABASE_ARCHITECTURE.md` §2 (the `ServiceGroup` / `ServiceCategory` /
`ServiceItem` models with `Json` trilingual columns) and §4 (the documented future
entities). Item 12 documents the *provisioning* posture only.

### 7.2 Which surface first requires the database

Per the Phase 1 report's entry-order recommendation and the Phase 0 futurity docs:
the first **dynamic** surface — forms with server-side persistence (Phase 4's
lead/club flows, whose PII rules `TECHNICAL_RISKS.md` R3 pins down), or the panel
surfaces (Phase 5). The currently approved boundary (public site through Services)
needs none of it. **Do not provision PG before such a surface is approved** — a
database installed with no reader is unmonitored attack surface and version drift.

### 7.3 Provisioning runbook (when the phase arrives)

1. **Create the database** and a dedicated role with schema rights only — not the
   postgres superuser. Record the DSN as `DATABASE_URL`.
2. **`DATABASE_URL` must flow through the Zod environment validation at boot**
   (`BACKEND_ARCHITECTURE.md` §5: env validated at boot, fail fast in dev) — the
   app must refuse to start with a missing/ malformed DSN rather than failing per
   request. (There is no `core/env` module yet because there is nothing to
   validate; it arrives with the first env var.)
3. **Use the engine split exactly as specified**: PG in production, SQLite for dev
   and test. Do not run production on SQLite "for now" — the engine-portability
   constraints in `DATABASE_ARCHITECTURE.md` §1 (no provider-specific types, no
   `@db.*` mappings) exist so the same schema runs on both; every migration must
   pass the six-item checklist of `PRISMA_6_STRATEGY.md` §6 before merge.
4. **Release-time migrations only**: `prisma migrate deploy` (never `migrate dev`
   against production), then `prisma db seed` (item 2's idempotent upserts by
   slug — never destructive deletes on a running environment). Both run at deploy,
   not at runtime.
5. **Connections:** one `PrismaClient` singleton with the dev global cache
   (`PRISMA_6_STRATEGY.md` §1); size the PG `max_connections` against the Node
   process count, and enable TLS to the database — the clinic eventually holds
   PII (R3), so the DB connection must not be plaintext.
6. **Backups + restore drill** before any PII lands. A backup nobody has restored
   is not a backup.
7. **Keep the boundary rule**: only `modules/*/services` import `PrismaClient`
   (`BACKEND_ARCHITECTURE.md` §1, `MODULAR_ARCHITECTURE.md`'s boundary-rules content still
   flows through Zod before Prisma; the content-parity test remains a merge gate.

Until that phase, the deploy is a **static-content Node deploy** — build, start,
proxy, certificate — with no datastore to operate.

## 8. Provenance and honesty notes

- Every performance number cited here is the **observed** value from the cited
  logs, measured against the production build at the local-HTTP origin; none are
  projections. The local origin and the absent TLS are named, not hidden (§3.1).
- No capability was claimed that was not run: the hosting options of §5 are
  documented options with a recommendation, not executed deploys; the PG runbook
  of §7 is a runbook, not a performed provisioning.
- `پلتفرم/` remains read-only and was only ever read.
