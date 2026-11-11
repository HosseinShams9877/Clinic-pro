# PHASE_1_REPORT — the public website (home through the complete Services section)

> Phase 1 deliverable · Reports layer · Covers `docs/roadmap/PHASES/PHASE_1.md` items P1-01…P1-15,
> the master execution prompt's Parts E (quality/testing/verification), F (documentation) and
> G (stop condition). Every status, number, and result below is the **observed** state as of
> 2026-11-10; nothing is marked from intention. Where a check could not be observed, the four
> mandated fields (check · reason · command attempted · blocking impact) are given in §8.

---

## 1. Executive summary

Phase 1 is **implemented and verified as a production build of the public website from the home
page through the complete Services section**, in all three locales, Persian-first and RTL-first,
on the mandatory stack. The implementation boundary was held exactly: no page, route, form, or
link beyond it exists, and the read-only reference `پلتفرم/` is untouched (mtime probe at the
gate: 0 of 114 files changed).

**Verification was performed against a running `next start` production server** (`next build`
output, port 3137) plus a real-browser measurement harness (system Edge over CDP, Node built-ins
only) — because the 320 px no-overflow release gate is a layout property that Vitest's jsdom
environment cannot measure (jsdom has no layout engine).

- `tsc --noEmit` — clean. **160 tests / 19 files pass.** `next build` — success, 17 routes.
- **No horizontal overflow at 320 px: 36/36** measurements (12 routes × fa/en/ar); also 36/36 at
  640 / 960 / 1024 / 1100 / 1180 px.
- **Zero console errors, zero exceptions, zero failed or 4xx/5xx asset loads** across all 12 routes
  (this is also the executable proof the new CSP does not break any page).
- Anchor boundary audit: **PASS** on all 12 routes (no out-of-scope navigation, no dead links).
- Two defects of substance were found and fixed during verification, both latent enough to have
  shipped silently: **the entire site was rendering with no CSS** (nothing imported
  `globals.css`), and the CSS `@import` used the tsconfig `@/` alias, which postcss-loader does
  not resolve. Both are fixed, documented, and back-propagated into the architecture docs so the
  Phase 0 specifications no longer describe a build that cannot compile.
- One security release-gate item was still missing at first measurement (CSP) and has been added
  and verified in this reporting pass (§8, E-group security headers).

**Final status: COMPLETED WITH DOCUMENTED LIMITATIONS.** The limitations are real and recorded,
not rounded down: `npm audit` is not clean (9 advisories; every fix requires an unapproved
breaking major upgrade), and three §5 release-gate items — the automated axe scan, the
keyboard-only pass, and Core Web Vitals measurement — were **not executed** (no tooling present;
honest non-observation, not a claimed pass). See §9 and §10. Phase 2 has **not** been started.

---

## 2. Scope

In scope (per `SERVICES_SCOPE.md` and the master execution prompt): **the public website from the
start through the complete Services section, inclusive** — `/`, `/services`, and the ten
category detail routes, plus the machinery they need (`/api/status` for the live open/closed
badge, sitemap, robots, middleware locale handling).

| Surface | Routes | State |
|---|---|---|
| Home | `/` | implemented; 8 content sections; no forms |
| Services landing | `/services` | implemented; both groups, 10 categories |
| Category detail | `/services/{gen,plastic,ortho,uro,eye,ent,gyn,aes,anes,endo}` | implemented; 10 routes, SSG |
| Status API | `GET /api/status` | implemented; the live badge's only data source |
| SEO machinery | `/sitemap.xml`, `/robots.ts`, per-route metadata, JSON-LD | implemented |
| Legacy URLs | `/services.html`, `/index.html` | 308-redirect to canonical paths |
| Locale | `?lang=fa\|en\|ar` (+ cookie + Accept-Language) | implemented; `lang`/`dir` server-rendered |

**Out of scope and absent** (verified, not merely unlinked): doctors, guides, booking, panels,
loan and club surfaces, any `<form>` element anywhere (0 found on `/`, `/services`,
`/services/gen`, `/services/gyn`), any stub page, fake button, or "coming soon" placeholder, and
any database dependency (REC-1). `Grep "prisma" src/` returns no matches.

---

## 3. Q1–Q9 decisions (registered answers and how they were implemented)

All nine were answered and approved before implementation (`OPEN_QUESTIONS.md` `**Answer:**`
lines); the table records the decision as **implemented**, and where implementation imposed a
detail the answer did not pin down, that detail is named here and carried to §10.

| Q | Approved decision | As implemented |
|---|---|---|
| **Q1** Booking CTA in scope | Phone CTA `tel:+983155154000` alone; visiting-hours link only if real in-scope content exists | Every category detail page's single CTA is `tel:+983155154000` (verified in the rendered HTML). No visiting-hours link exists because no in-scope page does; the CTA is therefore used alone, exactly as approved. |
| **Q2** URL shape | Path segments canonical; legacy hash/query redirected, loop-free | `/services/<id>` for all 10; `/services.html` and `/index.html` → 308 (single hop; see the 301→308 note in §9). Browsers never send the fragment, so `services.html#gen` resolves through the same redirect and lands on `/services`. |
| **Q3** Home demo forms | Out; no fake replacement | 0 `<form>` elements in the whole in-scope surface; no localStorage demo behavior; no loan/club markup (`ln.*`, `cb.*` absent from the source). |
| **Q4** Header/footer links | Show only implemented in-scope destinations; no dead/fake links | Header nav = خانه · خدمات (+2 group sublinks) · تماس با ما · language switcher · burger; footer = brand + about + social + hours + in-scope links only. Verified by `scripts/link-audit.mjs` over all 12 routes; the only externals are the two reference-sanctioned ones (Google Maps directions search, instagram.com), both checked verbatim against `پلتفرم/index.html`. |
| **Q5** Versions | Next 15.x / React 19.x, pinned in the lockfile, documented; no silent major upgrades | next 15.5.29, react/react-dom 19.3.1, @tanstack/react-query 5.107.1, zod 3.25.76; recorded in `TECH_STACK_ANALYSIS.md` §5.1. **Not upgraded** in response to `npm audit` — that would be exactly the silent major-version upgrade Q5 forbids (§10, R-2). |
| **Q6** Tailwind v4 CSS-first | v4 + cascade layers; v3-style examples updated | No `tailwind.config.ts` exists; `postcss.config.mjs` uses `@tailwindcss/postcss` only; `@layer base, components, utilities` is declared before `@import "tailwindcss" layer(utilities)`. Erroneous v3-shaped/alias-based snippets in the architecture docs were corrected (§4). |
| **Q7** i18n approach | Hand-rolled catalog, fa canonical, en/ar siblings, no i18n dependency | `src/modules/i18n/messages/{fa,en,ar}.ts` with fa canonical; key-completeness enforced by a Vitest gate; `<html lang dir>` resolved server-side from `?lang=` → `lang` cookie → `Accept-Language` → fa. Zero i18n packages in `package.json`. |
| **Q8** Content storage | Structured module content files + key-completeness checks; no CMS | `src/modules/services/content/categories.ts`, Zod-validated at the module boundary; completeness and parity gates in the test suite. |
| **Q9** The "vivid" skin | Drop the unscoped override; allow only a scoped `[data-theme="vivid"]` later | Not ported. Light/dark themes live inside `themes.css` as scoped selectors; there is no appended skin file. |

**Registration confirmation:** Q1–Q9 were all registered with approved answers in Phase 0
(`OPEN_QUESTIONS.md`), and this phase implemented them as written. No decision was silently
reversed; the three places where implementation added a necessary detail beyond the answer's
letter (the 308-vs-301 status, the CSP inline escapes, the 61 s vs 60 s poll interval) are
recorded here and in §4/§5.

---

## 4. Architecture

Implemented per `docs/architecture/*`, with three corrections discovered by the build and
back-propagated into the spec (Part F: "update architecture documents if implementation revealed
a necessary correction").

### 4.1 The stack as built

Next.js 15 App Router, React 19, TypeScript strict, Server Components by default (only thin
client islands are `"use client"`: providers, language switcher, mobile menu, live badge,
scroll progress, particles, floating actions), Route Handlers for the single API endpoint,
Tailwind v4 CSS-first with cascade layers, Zod at the module/API boundaries, TanStack React
Query v5 for exactly one surface (REC-2), Vitest. **No Prisma, no database** (REC-1: Phase 1's
only data is static trilingual catalog content; the master prompt forbids an unnecessary database
dependency for static content). Layering rule held: `src/modules/*/services` are the only
consumers of data access (there is no Prisma to import, so the rule holds trivially and is
unblocked for later phases).

### 4.2 Folder anatomy (as it exists on disk)

```
src/
├─ app/            layout.tsx (root, server) · page.tsx (home) · providers.tsx (client tree)
│                  services/page.tsx · services/[category]/page.tsx · api/status/route.ts
│                  sitemap.ts · robots.ts · globals.css · middleware.ts (locale)
├─ assets/fonts/   self-hosted Vazirmatn Variable + Noto Nastaliq Bold
├─ components/{layout,shared}/
├─ config/         site.config.ts (single source of site identity)
├─ core/           i18n (digits, jalali, getLocale, locales) · openHours · rateLimit · query
├─ hooks/          useReducedMotion, useMediaQuery (the two reference capability gates)
├─ modules/        i18n/messages · services/{components,content,lib,queries,schemas,services,constants,types} · seo/{content,lib,schemas}
└─ styles/globalCss/{tokens,themes,typography,layout,utilities,index}.css
scripts/           overflow-probe.mjs · link-audit.mjs · console-check.mjs (the release-gate harness)
```

### 4.3 Corrections made to the Phase 0 specifications (all three documented in place)

1. **`globals.css` must be imported by `layout.tsx`.** The App Router emits a stylesheet only if
   some component imports a CSS file; the file existing on disk is not enough. This was not
   hypothetical — it happened: the first working build shipped the **entire site with zero
   application CSS** (only next/font's 977 B font-face file), which surfaced as a 12/12 failure
   of the 320 px gate with every `<img>` at natural width. Fixed with one import line in
   `layout.tsx`; the built stylesheet went 977 B → **30,401 B**. Corrected in
   `NEXTJS_APP_ROUTER.md` §2 and `GLOBAL_CSS_ARCHITECTURE.md` §1.
2. **CSS `@import` must not use the `@/` alias.** `@import "@/styles/globalCss/index.css"` fails
   `next build` ("Can't resolve '@/styles/globalCss/index.css'") because postcss-loader does not
   resolve the tsconfig alias. The implemented form is the relative
   `@import "../styles/globalCss/index.css"`. Corrected in the same two docs and in
   `FOLDER_STRUCTURE.md`.
3. **Next.js `permanent: true` emits 308, not 301.** The Phase 0 text said "301-redirect".
   Observed: 308, which is the method-preserving permanent redirect. Recorded in
   `NEXTJS_APP_ROUTER.md` §2/§4 and treated in §9 as meeting the intent of the redirect criterion.

### 4.4 Security headers (release gate, added during this verification pass)

`next.config.ts` `headers()` now emits `Content-Security-Policy` alongside the four headers it
already had. The policy is strict everywhere except the two inline escapes the App Router needs
without nonce middleware: `script-src 'self' 'unsafe-inline'` (the RSC payload
`self.__next_f.push` fragments and the inline JSON-LD blob) and `style-src 'self' 'unsafe-inline'`
(next/font's variable class and inline React styles). Every external subresource load is blocked;
the site has no third-party script, font, or image. Verified live: the header is present on every
route, and `scripts/console-check.mjs` reports **zero blocked resources / zero console errors on
all 12 routes**, which is the executable proof the policy breaks nothing. HSTS is deliberately
absent: the local verification origin is plain HTTP (HSTS on HTTP is invalid); it must be added
at the HTTPS deploy (§10, R-4).

### 4.5 Verification harness (why the gates are real)

`scripts/` holds three zero-dependency gate runners using the system Edge over CDP (Node's
built-in `WebSocket` + `fetch`):

- **`overflow-probe.mjs`** — emulates a viewport, navigates, waits for load, measures
  `document.documentElement.scrollWidth` vs the layout viewport, and dumps every offending
  element plus 4 ancestor levels. Asserts `innerWidth === width` per route and reports a route as
  **INVALID, never pass**, if the emulation did not hold or the evaluation returned no value.
  Covers the 12 routes × 3 locales.
- **`link-audit.mjs`** — crawls the 12 routes, extracts only `<a href>` (head `canonical` /
  `hreflang` / `_next` `link`s are not navigation), and asserts each is internal, `tel:`/`mailto:`,
  or one of the two reference-sanctioned externals.
- **`console-check.mjs`** — collects `Runtime.consoleAPICalled(error|warning)`,
  `Runtime.exceptionThrown`, `Log.entryAdded(error)`, `Network.responseReceived ≥ 400`, and
  `Network.loadingFailed`, deduplicates, and fails on any.

Two Edge-headless quirks are documented in each script's header so the probes cannot be "fixed"
into a false pass: (a) a `Runtime.evaluate` value is nested **two** levels
(`response.result.result.value`) — reading one level short silently yields `undefined`, whose
`?? "{}"` fallback would turn a broken measurement into a fake PASS; (b)
`Emulation.setDeviceMetricsOverride` with `mobile: true` does **not** pin `innerWidth` in this
build (it stays at the 1280 default while `screen.width` moves) — `mobile: false` holds and
survives navigation and reload. Without (a) and (b), jsdom's lack of a layout engine makes the
320 px gate unmeasurable, which is precisely how a false pass would have looked.

---

## 5. Implemented features

Everything below is built, and (unless noted) verified by a test or a live check listed in §8.

**Home (`/`)** — hero (with the reference's hero image), the four verified stats (۷ اتاق عمل،
+۶۰ پزشک، ۴۰ تخت، از سال ۱۳۹۹), help section, an 8-tile services bento (the reference's
`clinics.html#anesthesia` tile retargeted to the real in-scope `/services/anes` route), the care
banner, patient steps, why-us, and contact. **No loan surface, no club surface, no form** — the
reference's two demo forms are excluded per Q3, and their absence is asserted in the source.

**Services landing (`/services`)** — both groups in the reference's exact order (surgical ×7,
then medical ×3), group headings and subtitles localized, 10 category cards with images and floor
labels, sub-service grids. No doctor cross-links (REC-3: `«پزشکان این بخش»` appears nowhere).

**Category detail (`/services/<slug>`, 10 routes)** — name, description, exactly the reference's
three benefit points, sub-service items, floor label, and a single `tel:` CTA (Q1). Statically
generated (`generateStaticParams` + SSG).

**Header / footer / navigation** — full RTL Persian nav with the language switcher and a burger,
footer with brand, about, social and working-hours copy; every link inside the boundary (Q4),
audited programmatically.

**Live open/closed badge** — `GET /api/status` returns a Zod-validated `{ open, closeMinutes }`
payload; the predicate is **not Friday and minutes ∈ [450, 1200) in Asia/Tehran** (the reference's
`main.js:157` / `home.js:18` rule), unit-tested against boundary fixtures (450, 1200, Friday,
Saturday 07:31). The client polls with **React Query every 61 s while the page is visible** and
stops when hidden (61 s rather than 60 s so the poll does not synchronize with the minute boundary
and miss a state change — a detail beyond the answer's letter, recorded here). The badge announces
through an `aria-live` region with the trilingual countdown strings from `home.js:9–11`. The
endpoint is rate-limited (`src/core/rateLimit.ts`).

**Living layer** — particles, scroll progress, count-up and reveal islands, each gated on the
reference's own two capability queries (`prefers-reduced-motion`, `pointer: fine`) via
`useReducedMotion` / `useMediaQuery`. All content is server-rendered and complete without them.

**SEO** — per-route metadata generated from the trilingual content module (titles, descriptions,
canonical, alternates, Open Graph); `sitemap.ts` emits exactly the 12 canonical URLs with
hrefLang alternates and no `lastModified` (see decision D-SEO-3); `robots.ts` allows all and
points at the sitemap; JSON-LD on every route — a `MedicalClinic` organization document (with the
reference's machine-readable telephone) rather than a `MedicalOrganization`, and **no
`SearchAction`** (none of Phase 1's routes could serve a site search, so it would 404 — decision
D-SEO-2). No `og:image` is emitted yet because no verified in-scope brand social image exists in
the reference (decision D-SEO-1; see §10, R-5). No schema spam: only real structured data.

**Deliberately not implemented** (boundary, not gap): doctor pages, guides, booking, panels,
loan/club, CMS, database, dark-mode toggle wiring beyond the token architecture, and any
Phase 2 surface.

### Decisions made during implementation (all benign, all recorded)

- **D-SEO-1** no `og:image` until a verified social image exists.
- **D-SEO-2** no `SearchAction` in JSON-LD (would 404 in Phase 1).
- **D-SEO-3** sitemap carries no `lastModified` (content is static and undated in the reference).
- **D-SEO-4** `MedicalClinic` `@type` from the reference's own data; machine-readable `telephone`.
- **D-POLL-1** 61 s poll interval (see above).
- **D-CSP-1** `script-src`/`style-src` `'unsafe-inline'` for the App Router without nonce
  middleware; see §4.4 and the residual risk R-3 in §10.
- **D-REDIR-1** 308 accepted as meeting the permanent-redirect intent (§4.3.3).
- **D-SPELL-1** the reference home's patient-steps block (`h.g4`) had a 4th step pointing at the
  out-of-scope booking surface; it is dropped rather than faked (Q3/Q4 boundary logic).
- **D-I18N-1** a missing localized key on a services field is a build-time test failure, not a
  runtime fallback to fa — the reference's English/Arabic visitors must never silently receive
  Persian. (Fix applied during implementation to `ServiceGroupSection`.)
- **D-FONT-1** fonts are copied into `src/assets/fonts` and served via `next/font/local`
  (`../assets/fonts/…`), never hotlinked into the read-only reference.

---

## 6. Design and localization

**Persian-first, RTL-first.** The default render is `<html lang="fa" dir="rtl">`; `?lang=en`
yields `lang="en" dir="ltr"`; `?lang=ar` yields `lang="ar" dir="rtl"` — all server-rendered
(verified in the response HTML), so there is no client-side direction flash. The locale resolves
from `?lang=` (mirrored to a cookie by `src/middleware.ts`) → the `lang` cookie → `Accept-Language`
→ fa.

**Tokens, not utilities, are the contract.** `tokens.css` carries the reference `:root` values
byte-identical to `style.css:12–37`; `themes.css` scopes light/dark; the Tailwind v4 `@theme`
bridge reads the semantic variables so utilities compose against the same identity. Cascade layers
(`base, components, utilities`, declared **before** the Tailwind import) make the reference's
appended-`vivid.css` failure mode structurally impossible (Q9). **No `tailwind.config.ts`.**

**Typography and digits.** Vazirmatn Variable (100–900) self-hosted for everything, Noto Nastaliq
Bold scoped to the slogan only — matching the reference's font roles. Persian/Arabic digit
localization happens at the render boundary via pure helpers in `src/core/i18n/digits.ts`
(round-trip tested fa↔en↔ar); Jalali conversion lives in `src/core/i18n/jalali.ts` behind one
module, anchored on ۱۳۹۹↔2020, and dates are stored and compared as ISO-8601 Gregorian with
Jalali rendered only at the boundary.

**Key-completeness.** fa is canonical; en and ar must cover every key the in-scope surface renders,
enforced by test (not by convention).

**Responsive matrix.** Measured, not assumed: 12 routes × 3 locales at 320 / 640 / 960 / 1024 /
1100 / 1180 px — **no horizontal overflow in any of the 216 measurements** (§8).

---

## 7. Assets

| Class | Detail | Provenance |
|---|---|---|
| Fonts | `Vazirmatn-Variable.woff2`, `NotoNastaliqUrdu-Bold.woff2` | copies in `src/assets/fonts/`, served self-hosted via `next/font/local`; zero external font requests; built output = 2 font files, 268 KB media |
| Images | 19 JPEGs: `building`, `corridor-wide`, `help-bg`, `or-hero`, `guide/v-doctor`, `guide/v-or`, 8 service sub-images, 4 category tiles | copied into `public/img/…`; every one is referenced by source (cross-checked, so no out-of-scope asset copy sits unused) and all 10 category images map to the reference's category set |
| CSS | `styles/globalCss/` (6 files) + `app/globals.css` | reference `:root` byte-identical; built bundle **30,401 B** (was 977 B before the import fix) |
| Icons | the reference's inline sprite, re-implemented as one `<Icon>` component map | single source of truth, no per-page duplication |
| External subresources | **none** | CSP blocks every cross-origin load; the only external URLs anywhere are two `<a>` navigations (maps search, instagram), which are link targets, not subresources |

No invented imagery or copy: every string, number, hour, and image traces to the reference, and
the two sanctioned externals were verified verbatim in `پلتفرم/index.html`.

**Reference preservation at the gate:** the `پلتفرم/` probe returns **114 files / 10 dirs, 0 files
newer than the Phase 0 session start (newest mtime 2026-11-09 09:29)** — identical to the
`REFERENCE_PRESERVATION_REPORT.md` baseline. Nothing in the reference was read-and-written; image
and font copies used it as a read-only source.

---

## 8. Testing

### 8.1 The Part E checklist — every item, observed

| # | Check | Command run | Observed |
|---|---|---|---|
| E1 | Dependencies installed | `npm install` (lockfile-resolved) | complete; tree recorded in `TECH_STACK_ANALYSIS.md` §5.1 |
| E2 | Lockfile consistency | `npm ls` (against `package-lock.json`) | consistent; one anomaly noted: `@emnapi/runtime@1.11.3` present but *extraneous* (a transitive jsdom canvas artifact, imported by nothing) |
| E3 | TypeScript | `npx tsc --noEmit` | **clean**, exit 0 |
| **E4** | **Linting** | `npm run lint` · `ls .eslintrc* eslint.config.*` · `ls node_modules/.bin/eslint` | **BLOCKED — see §8.3** |
| E5 | Unit tests | `npx vitest run` | **19 files / 160 tests passed** (incl. content parity 10 categories × 3 locales, i18n completeness, digit round-trip, Jalali anchor, open-hours boundary fixtures, sitemap/robots, SEO metadata, rate limit) |
| E6 | Production build | `npm run build` | **success**: 17 routes — `/` `ƒ`, `/_not-found` `ƒ`, `/api/status` `ƒ`, `/robots.txt` `○`, `/services` `ƒ`, all 10 `/services/[category]` `●` SSG, `/sitemap.xml` `○`; First Load JS shared 103 kB; middleware 34.8 kB |
| E7 | Main routes | `curl` status codes | `/`, `/services` → 200 |
| E8 | Category routes | `curl` × 10 | all ten `/services/<id>` → **200** |
| E9 | Approved phone CTA | `curl /services/gen \| grep -o 'tel:[+0-9]*'` | `tel:+983155154000` present |
| E10 | No out-of-scope navigation | `node scripts/link-audit.mjs` | **PASS** — 12/12 routes, 0 out-of-scope anchors |
| E11 | Home demo forms absent | `curl / \| grep -c '<form'` (and `/services`, `/services/gen`, `/services/gyn`) | **0** on all four |
| E12 | Persian RTL layout | response-HTML inspection | `<html lang="fa" dir="rtl">` server-rendered |
| E13 | en/ar locale handling | response-HTML inspection | `?lang=en` → `lang="en" dir="ltr"`; `?lang=ar` → `lang="ar" dir="rtl"` |
| E14 | Responsive behavior | `node scripts/overflow-probe.mjs http://localhost:3137 <w>` | **PASS 36/36** at each of 320, 640, 960, 1024, 1100, 1180 px (12 routes × fa/en/ar); `innerWidth` verified equal to the target on every measurement |
| E15 | Broken assets + console errors | `node scripts/console-check.mjs` | **PASS 12/12** — zero console errors/warnings, zero exceptions, zero failed or 4xx/5xx loads (also proves the CSP blocks nothing) |
| E16 | Broken internal links | unique-anchor fetch over the 12 routes | all unique internal anchors resolve 200 |
| E17 | Legacy redirects | `curl -I` | `/services.html` → **308** → `/services`; `/index.html` → **308** → `/`; both single-hop, loop-free (hash forms resolve through the same redirect since browsers never send fragments) |
| E18 | Content completeness | content-parity suite + rendered-HTML inspection | all 10 categories × 3 locales match the reference values; 4 stats, group headings, floor labels present |

### 8.2 Release-gate checklist (`SEO_ACCESSIBILITY_SECURITY.md` §5)

| Gate | Status | Evidence |
|---|---|---|
| no horizontal overflow at 320 px (en + fa) | **PASS** | 36/36 at 320 px across fa/en/ar (E14) |
| metadata + hrefLang + sitemap verified | **PASS** | built pages carry localized metadata + alternates; `sitemap.xml` = exactly the 12 canonical URLs with hrefLang; `robots.txt` correct |
| only real structured data emitted | **PASS** | `MedicalClinic` JSON-LD on every route; no `SearchAction`; asserted in tests |
| security headers + CSP verified via response inspection | **PASS (CSP added this pass)** | all five headers present on every response incl. `/services/gen` (§4.4) |
| reduced-motion pass | **PASS (closed 2026-11-10, Part A Decision B)** | interactive 24/24 page-runs (12 routes × {reduce, no-preference}); under reduce `fx=false`, all 19 reveals visible, 0 particles, 0 running animations; under no-preference `fx=true` + 16 hidden + 28 particles — `docs/reports/reduced-motion-pass.log` |
| `npm audit` clean | **FAIL (documented, not downgraded)** | 9 advisories — **4 moderate, 3 high, 2 critical**: zod <4.6.6 (high), postcss ≤8.5.22 (high, via next), tinypool ≤2.1.1 (critical, via vitest), esbuild ≤0.24.2 (moderate, via vite), @vitest/mocker ≤4.1.11 (moderate), vite ≤6.4.3 (moderate), vite-node ≤2.2.0 (moderate), plus the dependents next/vitest themselves. **Every** fix requires a breaking major (zod 4, next 16, vitest 5) — forbidden by Q5 without client approval. Recorded as R-2 in §10; ACCEPTED per owner decision 2026-11-10 (R-2); no vulnerability was hidden and no criterion was reworded. |
| axe: zero serious findings, both themes, both directions | **PASS (closed 2026-11-10, Part A Decision B)** | 72/72 page-runs (12 routes × fa/en/ar × light/dark) — serious=0 critical=0 moderate=0 minor=0; before = 144 serious contrast findings, fixed in source; `docs/reports/a11y-scan-after.log` |
| keyboard-only pass at 375 px + 1440 px | **PASS (closed 2026-11-10, Part A Decision B)** | 24/24 page-runs (12 routes × 2 widths) — skip link first, Enter/Space activation, full Tab coverage in DOM order, no lost focus, visible focus ring on every focusable element incl. disclosure sub-menus; `docs/reports/keyboard-pass.log` |
| core-web-vitals targets measured | **NOT VERIFIED** | §8.3 |

### 8.3 Blocked / not-observable checks (Part E disclosure format)

**1. Linting (Part E item E4).**
- *Check:* run the project linter over the codebase.
- *Reason:* ESLint is neither installed nor configured in this project — `package.json` has no
  `lint` script (scripts are `dev`, `build`, `start`, `typecheck`, `test`, `test:watch`), no
  `.eslintrc*` / `eslint.config.*` file exists, and there is no `node_modules/.bin/eslint`.
  `next build` runs its own type validation and completed successfully, but no lint pass exists.
- *Command attempted:* `npm run lint` → missing script; `ls .eslintrc* eslint.config.*` → none;
  `ls node_modules/.bin/eslint` → none.
- *Blocking impact:* **not blocking for Phase 1 completion.** None of the P1-01…P1-15 acceptance
  criteria is defined in terms of a lint run; the criteria that do exist (typecheck, tests, build,
  parity, gates) all ran and passed or are explicitly recorded here. It **is** carried into §10
  (R-1) as a Phase 2 prerequisite.

**2. Automated accessibility scan (axe).**
- *Check:* axe scan, zero serious findings, both themes, both directions.
- *Reason:* no axe tooling is installed or configured, and adding a dev dependency mid-phase was
  outside the approved Phase 1 dependency set; the environment also has no headed browser for an
  interactive pass. Static a11y structure was verified instead (skip link first, landmarks,
  `aria-live`, `lang`/`dir`, contrast inherited from the reference's own token palette).
- *Command attempted:* none possible — tooling absent (equivalent static checks listed in §8.1/§8.2).
- *Blocking impact:* **recorded, not silently passed.** It does not contradict any P1-01…P1-15
  criterion, but it leaves the §5 a11y gate unmeasured, and it is the main reason the final status
  is COMPLETED WITH DOCUMENTED LIMITATIONS (§12). Phase 2 action R-6.

**3. Keyboard-only pass (375 px + 1440 px).**
- *Check:* full keyboard-only navigation and operation pass.
- *Reason:* requires interactive human-scale browser driving not available in this environment;
  automated structure checks were run (focus order prerequisites, skip link, no keyboard traps
  from the living layer).
- *Command attempted:* static inspection of the rendered DOM for focusable order and landmarks.
- *Blocking impact:* same treatment as axe — unmeasured §5 gate, recorded, not passed by proxy. R-6.

**4. Core Web Vitals (LCP/INP/CLS) targets.**
- *Check:* CWV measurement against targets.
- *Reason:* no Lighthouse/CWV runner present; no such runner was in the approved Phase 1 toolset.
  Proxy evidence was gathered instead: 103 kB shared First Load JS, 30.4 kB CSS, all fonts and
  images self-hosted, no third-party requests, SSG for the ten category pages, `font-display:
  swap`, and zero console/load errors.
- *Command attempted:* `next build` bundle report (observed above); no CWV runner available.
- *Blocking impact:* unmeasured §5 gate; recorded as R-7 for Phase 2 (measure at first HTTPS
  deploy).

**5. `npm audit` clean (#8 in §8.2).**
- *Check:* `npm audit` zero vulnerabilities.
- *Reason:* 9 advisories present; **every** remediation requires a breaking major-version upgrade
  (zod 4.6.7, next 16.4.6, vitest 5.1.0) that Q5 explicitly forbids without client approval.
  zod is the only runtime-high advisory (GHSA-mrhx-c7xc-m3w5, memory exhaustion validating oversized
  constrained collections — not reachable by Phase 1 data: the catalog is a fixed ~10-record set
  validated server-side at module load, never from untrusted input at scale); the rest are
  dev/build-time only (vitest/vite/esbuild/tinypool/postcss).
- *Command attempted:* `npm audit` (full output reproduced in §8.2); `npm audit fix --force`
  **deliberately not run** — it would silently break the version freeze.
- *Blocking impact:* a failed §5 release-gate item, disclosed rather than downgraded. It does not
  fail any P1-01…P1-15 criterion, and it is Phase 2 decision R-2 (approve the major upgrades, or
  accept and document the dev-only exposure).

---

## 9. Acceptance criteria — every Phase 1 criterion, pass / fail / blocked

Row IDs map to `PHASE_1_CHECKLIST.md` (and `PHASE_1.md`). Full evidence in §8; statuses here are
the verdicts.

| ID | Criterion (abridged) | Verdict |
|---|---|---|
| P1-01 | scaffold boots; `tsc --noEmit` clean; engines pinned; versions recorded | **PASS** — build + typecheck green; `engines: node >=20.19.0` declared; versions recorded in `TECH_STACK_ANALYSIS.md` §5.1 (minor deviation: no `.nvmrc` pin file — R-8) |
| P1-02 | `:root` byte-identical to `style.css:12–37`; layers before the tailwind import; no tailwind.config.ts | **PASS** — diffed and confirmed; `Glob **/tailwind.config.*` finds none; build emits no layer-order warning |
| P1-03 | fa canonical; en/ar complete for every in-scope key; gate fails the build on a missing key | **PASS** — key-completeness suite in the 160 passing tests |
| P1-04 | `<html lang="fa" dir="rtl">` server-rendered; fonts preloaded locally; no client root layout | **PASS** — verified in response HTML; only self-hosted font files linked; root layout is an async Server Component |
| P1-05 | exact nav/footer composition; **zero links to unimplemented destinations** | **PASS** — `link-audit.mjs` PASS on 12/12 |
| P1-06 | digit round-trip; Jalali anchor ۱۳۹۹↔2020; pure, no DOM | **PASS** — in the 160 passing tests |
| P1-07 | 10 categories verbatim; Zod parses; every locale key present | **PASS** — parity suite + boundary validation pass |
| P1-08 | group order exactly as the reference `ORDER`; trilingual floor labels; pure services, no Prisma | **PASS** — order test green; `grep -rn "prisma" src/` → no matches |
| P1-09 | all 10 categories; both group headings + subtitles; zero doctor cross-links | **PASS** — rendered `/services` verified; forbidden string absent |
| P1-10 | 10 SSG routes; name/desc/benefits×3/items/floor; `tel:`-only CTA; legacy forms permanent-redirect, loop-free | **PASS with a documented deviation** — all satisfied except the redirect status is **308** (Next.js `permanent: true`), not the literal "301"; 308 is the method-preserving permanent redirect and the intent is met (D-REDIR-1) |
| P1-11 | the 4 verified stats; bento retargeted to `/services/anes`; **no loan/club markup at all** | **PASS** — strings asserted in the rendered home; `ln.*`/`cb.*` absent from source |
| P1-12 | content complete without JS; gates reference the two capability queries exactly | **PASS** (test-level) — hooks unit-tested; server-rendered HTML verified complete via curl; **interactive reduced-motion pass not executed** (§8.3, item 3) |
| P1-13 | open-hours predicate exact; Zod; rate-limited; poll stops when hidden; `aria-live`; trilingual countdown | **PASS** — boundary fixtures green; endpoint returns the Zod-shaped `{ open, closeMinutes }`; 61 s visibility-gated poll; `aria-live` region present |
| P1-14 | metadata from the content module; sitemap = exactly the 12 URLs; JSON-LD validates; no 404-ing SearchAction | **PASS** — all four verified live and in tests |
| P1-15 | every §5 gate run: observed-passing or recorded with reason + command + blocking impact | **PASS as specified** — the criterion requires *running or recording* each gate, and every one of the nine is either observed-passing (4), partially/substitutively verified with disclosure (2), or recorded with all four fields (3: axe, keyboard, CWV; plus `npm audit` as FAIL). This row was not marked from a clean bill of health: it is marked because the disclosure protocol was followed in full |

**No Phase 1 acceptance criterion is marked pass without a corresponding observation in §8.** The
one literal mismatch (301 → 308) and the four unmeasurable gates are disclosed in place.

---

## 10. Remaining issues

Ordered by what the next phase must decide, with severity and why it stays open.

| ID | Issue | Severity | Why open / who decides |
|---|---|---|---|
| R-1 | No ESLint in the project | medium | Phase 2 prerequisite; adds a dev dependency and config (Part E disclosed, non-blocking) |
| R-2 | `npm audit` not clean — 9 advisories (zod, postcss/next, vitest/vite/esbuild/tinypool) | medium (zod) / low (rest) | **ACCEPTED (owner decision 2026-11-10)** — the 9 advisories are recorded as known technical debt: all but zod are dev/build-time-only (vitest/vite/esbuild/tinypool/postcss), and the single runtime-high advisory (zod, GHSA-mrhx-c7xc-m3w5) is not reachable by Phase 1 data — the catalog is a fixed ~10-record set validated at module load, never from untrusted input at scale. No major upgrade was performed and `npm audit fix --force` was **not** run (Q5 version freeze preserved). Revisit at the next phase boundary where breaking majors are legitimate. |
| R-3 | CSP uses `'unsafe-inline'` for script/style | medium | required by the App Router without nonce middleware; mitigate later by generating per-request nonces in middleware |
| R-4 | No HSTS | medium | invalid on plain HTTP; add `Strict-Transport-Security` at the HTTPS deploy |
| R-5 | No `og:image` / verified social image | low | waiting on a brand social image the reference sanctions (D-SEO-1) |
| R-6 | a11y unmeasured: axe scan, keyboard-only pass, interactive reduced-motion pass | ~~high~~ **CLOSED (2026-11-10, Part A Decision B)** | **Closed with evidence, not by proxy.** Part A added `axe-core@4.14.0` as a devDependency only and three zero-dependency CDP harness passes in the existing `scripts/` style: axe 72/72 page-runs zero findings (`a11y-scan-after.log`; before = 144 serious contrast findings, fixed in source), keyboard 24/24 (`keyboard-pass.log`), reduced motion 24/24 (`reduced-motion-pass.log`). One real defect chain was found and fixed in source on the way: hero particles kept animating under `prefers-reduced-motion: reduce`, the reduce media query did not cover them, and the SSR-safe hook's default-false first render armed the motion layer for a frame — fixed in `layout.css`/`HeroParticles.tsx`/`LivingEffects.tsx` (see the Part A note in §12.1). |
| R-7 | Core Web Vitals unmeasured | medium | no runner available; measure at first HTTPS deploy against the documented targets |
| R-8 | no `.nvmrc` pin (only `engines >=20.19.0`) | low | dev machines and CI should pin an exact Node (e.g. 22 LTS) — one-line Phase 2 fix |
| R-9 | `@emnapi/runtime@1.11.3` extraneous in `node_modules` | negligible | a transitive jsdom canvas artifact, imported by nothing; no action taken, recorded only |
| R-10 | Jalali calendar conversion is implemented and unit-tested but **no in-scope surface renders a Jalali date yet** | informational | the capability exists per the spec, with no Phase 1 surface to show it; not a defect |

**Content gaps:** none for the in-scope surface — the reference's catalog, stats, hours, contact
channels, and copy are fully transcribed; the two sanctioned externals and the phone number are
verified verbatim. The only content adjacent to the boundary that was deliberately dropped is the
reference home's 4th patient step (booking) and the loan/club surfaces — boundary decisions Q3/Q4,
recorded as D-SPELL-1.

**Classified summary of Part F statuses:** *completed* — P1-01…P1-15 implementation, all 18 Part E
items (15 observed passing, 3 blocked/unmeasurable and so recorded), documentation
synchronization, this report; *partially completed* — P1-12 (test-level only, interactive pass
missing) and P1-10 (308 vs the literal 301); *blocked* — E4 linting (tooling absent), axe /
keyboard / CWV (tooling absent), `npm audit` (advisories require unapproved major upgrades);
*not applicable* — Prisma/DB work (REC-1), CMS (Q8), any Phase 2 surface (Part G).

---

## 11. Phase 2 readiness

Phase 1 leaves a clean substrate for the next phase — this section identifies prerequisites and
recommendations **without executing any of them** (Part G).

**What is genuinely ready:** the token/design system and cascade layers extend by addition; the
module architecture (`modules/<domain>/{components,content,lib,queries,schemas,services,types}`)
is the template for every future domain; the locale pipeline picks up new message keys with a
build-time completeness gate; the SEO machinery (metadata from content, sitemap from the route
catalog, JSON-LD) generalizes; the zero-dependency CDP harness (`scripts/*.mjs`) is reusable
for any future gate that needs a real browser; and the stack is fully wired except the deferred
database layer, whose schema design already exists in `DATABASE_ARCHITECTURE.md` §2.

**Recommended Phase 2 entry order (from the evidence above):** (1) R-6 + R-1 — install ESLint
and an a11y harness and clear the backlog of unmeasured §5 gates before adding surface area;
(2) R-2 — decide the major-upgrade question (zod 4, next 16, vitest 5) at the phase boundary,
where breaking changes are legitimate; (3) R-3/R-4 — nonce-based CSP and HSTS with the HTTPS
deploy; (4) the database layer (Prisma + SQLite/PostgreSQL) when the first dynamic surface is
approved, reusing the designed schema.

**Carryover that must not be lost:** the two CSS plumbing rules (§4.3) and the two Edge-headless
probe quirks (§4.5) — each of them once produced a silent false pass or a real defect, and each
is now documented in the script headers and architecture docs.

---

## 12. Final status

## **COMPLETED WITH DOCUMENTED LIMITATIONS**

Phase 1 is complete: the public website through the full Services section is implemented on the
mandatory stack, in all three locales, Persian-first and RTL-first, and every Part E item was
either observed passing or disclosed with the four required fields. The limitations that keep this
from an unqualified COMPLETED are real and named, not minimized: the §5 gates for axe, the
keyboard-only pass, and Core Web Vitals were **not executed** (tooling absent — unmeasured, never
claimed), and `npm audit` is **not clean** (9 advisories whose fixes are unapproved breaking major
upgrades, disclosed rather than downgraded). None of the fifteen P1 acceptance criteria failed;
the single literal deviation (301 → 308 redirects) is documented and intent-equivalent.

### 12.1 Review acceptance (2026-11-10, Part A of the Phase 2 directive)

Phase 1 was reviewed and accepted by the owner on 2026-11-10, with the two Part A decisions applied:

- **R-2 (`npm audit`) — ACCEPTED as known technical debt.** No major upgrade, no `npm audit fix
  --force`; Q5's version freeze preserved. Recorded in §10.
- **R-6 (a11y) — CLOSED with observed evidence.** Part A added `axe-core@4.14.0` as a
  **devDependency only** (the sole `package.json` change in this closure; runtime dependencies
  untouched) and executed three real browser passes on the built site, reusing the project's
  zero-dependency CDP harness pattern in `scripts/`:

  | Pass | Before | After (saved log) |
  |---|---|---|
  | axe (12 routes × fa/en/ar × light/dark) | 144 serious contrast findings | 72/72 page-runs, **serious=0 critical=0 moderate=0 minor=0** — `docs/reports/a11y-scan-after.log` |
  | keyboard-only (12 routes × 375 px + 1440 px) | unmeasured | **24/24** — skip link first, Enter/Space activation, full Tab coverage in DOM order, no lost focus, visible focus ring on every focusable element including disclosure sub-menus — `docs/reports/keyboard-pass.log` |
  | reduced motion (12 routes × reduce + no-preference) | unmeasured | **24/24** — under reduce `fx=false`, all 19 reveals visible, 0 particles, 0 running animations; under no-preference `fx=true` + 16 hidden + 28 particles, proving the gate responds to the preference rather than being disabled — `docs/reports/reduced-motion-pass.log` |

  **Defects found while measuring, fixed in source, re-measured:** closing R-6 was not a
  paperwork exercise — the interactive passes exposed a real reduced-motion failure chain on the
  home page: (1) the CSS reduced-motion media query covered `.fx [data-reveal]` but **not**
  `.hero-particles i`, whose `kh-rise` animation ran *unconditionally* — 28 elements kept
  animating under reduce; (2) `HeroParticles`'s effect early-returned under reduce **without
  clearing its mounted state**, so the field persisted once armed; (3) `useReducedMotion` starts
  at its SSR default (`false`) and syncs one tick after mount, which armed `.fx` and mounted the
  particles for a first frame even under reduce. Fixed together in
  `src/styles/globalCss/layout.css` (the reduce block now drops the particle layer entirely, adds
  the canonical reduced-motion reset — animation/transition durations to 0s and `scroll-behavior:
  auto`, valid unlayered above Tailwind's `utilities` layer — and disables smooth scrolling),
  `src/components/shared/HeroParticles.tsx` (reads the live query at effect time and clears
  mounted state under reduce), and `src/components/shared/LivingEffects.tsx` (same live read, so
  `.fx` is never armed under reduce). The reduced-motion pass went 23/24 → 24/24, and all three
  passes, `tsc --noEmit`, the full 160-test suite, and `next build` were re-run clean against the
  final build.

  **Two CDP harness lessons worth keeping for Phase 2 item 10:** `Input.dispatchKeyEvent`
  synthesizes a button *click* only when the keydown carries a `text` field (`"\r"` for Enter) —
  without it, keydown/keyup arrive but the default action never fires, silently producing a
  keyboard pass that tested nothing (documented in `scripts/keyboard-pass.mjs`). And
  `document.querySelector("button[aria-expanded]")` matches the *first* such button in DOM order —
  the language-switcher opener, not the burger — so harnesses select by `aria-controls` now.

**Status after Part A:** Phase 1 stands **ACCEPTED WITH DOCUMENTED LIMITATIONS** — R-2 accepted by
owner decision, R-6 closed with evidence, R-7 (CWV) remaining as the only unmeasured §5 gate
(scheduled for Phase 2 item 11, measured at the local-HTTP origin with the HSTS/HTTPS deferral
disclosed to R-4).

**Reference untouched. Single agent throughout. No Phase 2 work started.**
