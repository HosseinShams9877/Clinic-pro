# NEXTJS_APP_ROUTER — routing, layouts, and rendering strategy

> Phase 0 deliverable · Architecture layer · Scope: the in-scope routes only (home + services).

---

## 1. Route table (Phase 1)

| Route | Rendering | Notes |
|---|---|---|
| `/` | static + RSC | home; sections per `WEBSITE_WORKFLOWS.md` WF-3 |
| `/services` | static + RSC | landing on the first group (surgical), full catalog available |
| `/services/<category>` | static + RSC, **Q2 = path segments (approved)** | one route per category, statically generated from the catalog |
| `/api/status` | Route Handler GET | the open/closed badge's only data source; Zod-validated params, rate-limited |
| `/sitemap.xml`, `/robots.txt` | generated | in-scope routes only |

**Out of scope:** every other public page and all panels. Do not create empty route shells.

> **`/api/services` dropped (REC-2).** An earlier draft listed a catalog Route Handler "for
> client-side category switching". With Q2 = path segments, category switching is plain route
> navigation between statically generated routes — no client fetch exists, so the handler would be
> dead code. It is not created in Phase 1. React Query's only Phase 1 consumer is the live badge
> polling `/api/status` (`REACT_QUERY_V5_STRATEGY.md`). Legacy hash/query category URLs
> (`services.html#gen`, `?cat=gyn`) redirect to the canonical path, loop-free. **Phase 1 note
> (observed):** Next.js `redirects` with `permanent: true` emits **308**, not 301 (308 is the
> semantically correct permanent redirect that preserves the method). The acceptance text's
> "301" criterion is recorded in `PHASE_1_REPORT.md` as met by 308.

## 2. Root layout (`src/app/layout.tsx`) — the four things it owns

1. **`<html lang="fa" dir="rtl">`** as the default; the locale layer updates `lang`/`dir` on switch
   (never a client-only flash — the cookie/URL decides at request time).
2. **Font loading** — self-hosted Vazirmatn Variable + Noto Nastaliq (slogan-only scope), preloaded,
   `font-display: swap`, no external requests.
3. **The global CSS entry** — `import "./globals.css"` in `layout.tsx`, and inside that file
   `@import "../styles/globalCss/index.css"`. **Phase 1 correction (observed at build time):**
   the CSS `@import` runs through postcss-loader, which does **not** resolve the tsconfig `@/`
   alias — the alias form `@import "@/styles/globalCss/index.css"` fails the production build
   with "Can't resolve '@/styles/globalCss/index.css'". Use the relative path. And the import
   in `layout.tsx` is load-bearing: the App Router emits a stylesheet only if some component
   imports a CSS file, so the architecture only reaches the browser because the layout
   imports it.
4. **Shared chrome** — `SiteHeader` + `SiteFooter` + skip-to-content link + the scroll-progress element.

The layout must **not** become a client component. Locale context propagates through context providers
in a thin client wrapper if needed.

## 3. Rendering model — Server Components by default

| Content | Where it renders | Why |
|---|---|---|
| Home sections (hero, stats, bento, teasers, contact) | Server Components | crawlable, zero-JS-complete |
| Services catalog (groups, categories, detail, sub-services) | Server Components | the same; SEO-critical |
| Category switching, tabs, mobile nav | client island wrapping server-rendered content | interaction only |
| Motion (count-up, reveal, particles, parallax) | client island, capability-gated | enhancement only |
| Language switcher | client component (changes global state) | must feel instant |

**Rule:** if a component can be a Server Component, it is one. Converting requires a written reason at
the top of the file (state / effect / browser API / perf).

## 4. Category URL strategy — **decided: path segments (approved Q2)**

Chosen: **`/services/<slug>`**, with `/services` as the group landing and `#surgical`/`#medical` kept as
**in-page anchors** only. Rationale: per-category SEO metadata, canonical shareable URLs, static
generation per route. Old hash/query forms (`services.html#gen`, `services.html?cat=gyn`) are handled
with one-time permanent redirects that never loop. (Next.js emits 308 for `permanent: true` —
see the note in §2 above.)

## 5. Metadata

- Per-route `metadata` object (title, description, canonical, OG, Twitter, alternates per language).
- Titles/descriptions are **content** — sourced from the trilingual content module, never hardcoded in
  `app/`.
- The reference's home `<meta description>` and page titles are captured in `PAGE_INVENTORY.md`;
  they must be re-captured verbatim at Phase 1 (the fa source) and translated for en/ar.
- `alternates.languages` emits fa/en/ar canonical variants (locale scheme: approved Q7 — hand-rolled,
  fa canonical).

## 6. Data flow in a request

```
request → App Router matches route
  → Server Component calls module service (services/lib, pure)
    → service reads content module (or cached Prisma read)
      → Zod-parses → returns typed domain object
  → component renders trilingual strings for the active locale
  → HTML streamed; client island hydrates for interaction
client-side category switch (Q2 = route navigation)
  → next/link navigation to /services/<slug> (statically generated; no fetch)
live open/closed badge
  → React Query polls GET /api/status every 60 s while visible
    → Route Handler → core/openHours (pure) → validated JSON
```

## 7. Caching & revalidation (Phase 1 posture)

- Catalog is static: generate at build, `revalidate` on content change (tag-based revalidation from a
  future admin action — not Phase 1).
- API routes for the catalog: `Cache-Control` conservative, `stale-while-revalidate` for the client.
- No ISR tuning beyond defaults in Phase 1; measure first (`MASTER_ROADMAP.md` Phase 1 exit).

## 8. Head/edge concerns

- **No third-party scripts** in Phase 1 (no analytics until consent plumbing exists — `SEO_ACCESSIBILITY_SECURITY.md`).
- Self-host everything; the reference's offline property is worth keeping.
- `next.config.ts`: strict image domains (all local), no remote patterns in Phase 1.
