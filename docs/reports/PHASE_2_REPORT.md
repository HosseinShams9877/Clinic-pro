# PHASE_2_REPORT — content operations, hardening, handover polish

> Phase 2 deliverable (item 15 of 15). Scope authority: `docs/roadmap/PHASES/PHASE_2.md`
> (15 items), approved by the owner 2026-11-10. Phase 3 is **NOT approved**; this
> report ends at the Phase 2 boundary and does not start Phase 3.
>
> **Delivered 2026-11-11. Status: all 15 items complete; every spec-mandated gate
> observed green on the delivered build; 1 item incomplete-with-disclosure
> (item 10's fa screen-reader pass — unobservable on this machine, gate passed on
> its machine-checkable substitutes); 1 owner decision still open (item 12 hosting
> posture).**

---

## 1. Executive summary

Phase 2 took the Phase 1 website (home through the complete Services section) and
made it **operable by a content owner, hardened against drift, and ready to hand
over** — without adding a single runtime dependency and without touching the
read-only reference.

What that means concretely:

- **Content operations.** The trilingual editing workflow is documented
  (`CONTENT_EDITING_WORKFLOW.md`), the catalog has a single mechanical data-entry
  path from the reference (`seed-content.mjs`), and catalog parity with the
  read-only reference is now **proven by a test that executes the reference
  itself** — 10 categories × 3 locales, field by field (item 3). A non-developer
  content owner now has a Persian-primary guide that tells them honestly what a
  request can and cannot change (item 13).
- **Hardening.** Real, scoped print CSS (item 5); a dark-mode audit that found and
  fixed a cascade-layer bug silently killing every components-layer rule, plus
  36 focus-ring clipping sites (item 6); the full image pipeline through
  `next/image` with measured box parity vs the reference render (item 8); a
  bundle audit that found the Zod runtime shipping to the home page and moved the
  schema to the server while *strengthening* the edge contract (item 9); an a11y
  round 2 that found and fixed the footer heading outline (item 10); a measured,
  gate-failing CWV budget over Google's Good thresholds (item 11); and the
  regression suite **frozen as the Phase 3 baseline** — an enforceable artifact
  that makes silent test-weakening impossible even without git history (item 14).
- **Handover polish.** 404/error pages in fa/RTL (item 4), the deployment story
  with a PostgreSQL runbook documented-not-implemented (item 12), and the
  content-owner guide (item 13).

**Final status (all observed, none claimed):**

| Gate | Command | Observed result |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | exit 0 |
| Test suite | `npx vitest run` | **29 files / 222 tests, all passing** |
| Production build | `npx next build` | success; 17 routes (10 SSG category pages); `/` 5.18 kB / 134 kB First Load; shared 103 kB; middleware 34.8 kB |
| Accessibility | `npm run a11y:scan` | **78/78 page-runs PASS — serious=0 critical=0 moderate=0 minor=0** (13 routes × 3 locales × 2 themes, fa/RTL) |
| CWV budget | `npm run cwv` | **8/8 warm page-runs in budget** (ttfb 11–17, fcp 64–100, lcp 64–100, cls 0.000, inp 40–48 ms) |
| Runtime dependencies | diff `package.json` | **unchanged** — the only addition in all of Phase 2 is the Part-A `axe-core` devDependency |
| Reference preservation | mtime probe | **114/114 files at mtime 2026-11-09; 0 modified during Phase 1 or Phase 2** |
| Phase 3 containment | file search | no Phase 3 work exists; `PHASE_3.md`/`PHASE_4.md` are untouched Phase 0 planning docs |

**Disclosed, not hidden:** one a11y check could not be run (no fa screen reader on
this machine — item 10, four mandated disclosure fields in §2.10); Lighthouse was
deliberately not installed (item 11); one transient CWV reading was observed and
did not reproduce (§1.1 below).

### 1.1 The one non-reproduced transient (on record, not silently dropped)

The first CWV sweep of the final verification (2026-11-11) reported
`/nonexistent-page @393px` warm **INP 365 ms** vs the 200 ms budget — the only
breach in 24 warm page-runs across the three sweeps run that day. The immediate
re-run and a third captured run both reported that page at **43 ms**, and all
other 23 warm runs held 40–48 ms. The reading arrived on the one page-run where
Edge's Event Timing API happened to emit entries — the same instrumentation that
item 11 documented as unreliable ("durations … contradict page-side timing of the
same gesture by ~5×" during calibration). This is treated exactly like the item-8
cold CLS 0.119 transient: **stays on record, source unattributed, bounded by the
gate** (a reproducing breach fails the gate and the deploy; a non-reproducing
one-time spike on a local origin does not). Logs: `docs/reports/cwv-audit.log`
(item 11 calibration), `docs/reports/cwv-audit-final.log` (final verification, 3rd
sweep).

---

## 2. Per-item record (1–15)

Each entry: **what / where / verification / residual gap**. Items 8–14 have their
full evidence in `PHASE_2_NOTES.md` and `PHASE_2_BASELINE.md`; this section is the
complete index, not a duplicate of the raw logs.

### 1. Trilingual content editing workflow — DONE

- **What:** the document that makes a three-locale edit a defined procedure
  instead of an act of care: fa is canonical, en/ar must arrive in the same
  change, per-locale digits, and the gates that enforce it.
- **Where:** `docs/architecture/CONTENT_EDITING_WORKFLOW.md`.
- **Verification:** the workflow's rules are machine-enforced by item 3's parity
  test and `src/modules/i18n/messages/index.test.ts` (the fa key set is the
  contract; en/ar must declare exactly it, no empty values) — the documented
  procedure is what the passing suite already demands.
- **Residual gap:** the document describes a developer-mediated workflow; item 13
  then carries it to the non-developer content owner in Persian.

### 2. Seed/reseed scripts as the single data-entry path — DONE

- **What:** `seed-content.mjs` executes the read-only reference catalog
  (`پلتفرم/assets/js/services-data.js`) in a VM — never writing to it — applies
  the documented transcription, and either **checks** the app's typed content file
  against the reference-derived catalog (default) or **rewrites** it (`--write`).
  The transcription (ORDER/group baking, `doc` dropped per REC-3, `img` rebased to
  `/img/...`, field aliases n/d/t → name/description/title) is identical to what
  item 3's test asserts and what the generated file header records.
- **Where:** `scripts/seed-content.mjs` (npm `seed` / `seed:write`).
- **Verification:** the parity gate (item 3) is itself the proof the seed path
  produces a matching catalog; the suite is green.
- **Residual gap:** the script is a check-first tool — a rewrite (`--write`) is a
  developer action that then must pass the same suite.

### 3. Content-parity test, 10 categories × 3 locales — DONE

- **What:** the test that keeps the app's catalog a *copy* of the reference: it
  executes the reference IIFE (which sets `window.SERVICE_CATS`) inside the jsdom
  environment exactly as a browser would, then compares **all 10 categories × 3
  locales field by field**. Sanctioned deviations, and only those: `img` rebasing
  `assets/` → `/`, the reference `doc` field dropped (out-of-scope doctor pages),
  and the n/d/t field aliases.
- **Where:** `src/modules/services/content/categories.test.ts` (6 tests; 10×3 =
  one test per category asserting all three locales).
- **Verification:** green in the final 29-file/222-test run; it runs the reference
  **read-only** (the VM executes, nothing writes back — consistent with the
  lifetime read-only rule, confirmed again by the §1 mtime probe).
- **Residual gap:** parity is *to the reference*; a catalog text fix is therefore
  always "update the reference first" (recorded for the owner in item 13's guide).
  An eleventh category is impossible until the reference defines one — by design,
  not by accident.

### 4. 404 / error pages in fa/RTL — DONE

- **What:** in-scope, Persian, RTL 404 and error surfaces with the site chrome
  (not the framework default), a way back to the navigation, and the same token
  discipline as the rest of the site.
- **Where:** `src/app/not-found.tsx`, `src/app/error.tsx`; tests
  `src/app/not-found.test.tsx` (4), `src/app/error.test.tsx` (4).
- **Verification:** tests green; the route is inside the a11y scan as a real 13th
  route (`/nonexistent-page`) and passed all 78 page-runs; served live at
  http://localhost:3137/nonexistent-page (200) with `<h2>` outlines (item 10's
  fix verified here too).
- **Residual gap:** none known. (Out-of-scope 5xx copy is the framework boundary;
  `error.tsx` handles it with the same surface.)

### 5. Print stylesheet — DONE

- **What:** real, scoped print CSS — every rule lives inside `@media print`, so
  the file **cannot change a single pixel of the on-screen rendering**. It
  flattens the tinted surface to paper white, drops shadows and decorative
  backgrounds, keeps the accent bands legible in grayscale, and expands the
  service content so it reads on paper.
- **Where:** `src/styles/globalCss/print.css` (imported unlayered, fully inside
  `@media print` — noted in `index.css`); gate `src/styles/globalCss/print.test.ts`
  (6 tests).
- **Verification:** 6 tests green, including the scoping guarantee; a live CDP
  print probe produced PDFs of `/` and `/services/gen` (working artifacts at the
  time, since cleaned up) confirming the on-screen render was byte-identical
  before/after the file landed.
- **Residual gap:** print was verified against the Chromium print pipeline; real
  printer output depends on the reader's hardware, which no gate here can cover.

### 6. Dark-mode audit + token re-tuning — DONE

- **What:** an audit of the site against a dark OS scheme found three real
  defects and fixed all three:
  1. **Native chrome stayed light in dark mode** — the live probe reported
     `colorScheme "normal"`, i.e. no declaration anywhere, so UA scrollbars/form
     controls/dialogs ignored the OS. `themes.css` now declares the supported
     schemes so native chrome follows.
  2. **A cascade-layer bug silently killing the components layer** — wrapping the
     Tailwind import in `layer(utilities)` moved Tailwind's internal `@layer base`
     (preflight) into the root `utilities` layer, which sorts *after* `components`;
     layer order beats specificity, so every components-layer rule (`.container`
     gutters, `.section` rhythm) was silently dead. The Tailwind import is now
     unlayered (root layer statement merges as intended) — `index.css` carries the
     full explanation so the "fix" is never reverted by mistake.
  3. **Focus rings clipped in 36 places** — `overflow: hidden` on sub-menu and
     dropdown containers clipped the 2px/offset-3px focus ring of the links
     inside; the corner radius now lives on the first/last link instead. A live
     CDP geometry probe (4 routes × 2 widths, fa/RTL) reported 0 failures after.
- **Where:** `src/styles/globalCss/themes.css`, `src/styles/globalCss/index.css`,
  `src/components/layout/SiteHeader.tsx`, `src/components/layout/LanguageSwitcher.tsx`;
  gates `themes.test.ts` (4 — dark-scheme token flipping + the self-flipping
  focus-indicator pair), `cascade.test.ts` (6 — the layer order), and
  `src/components/layout/focus-ring-clip.test.tsx` (5 — no `overflow-hidden` up
  any focusable subtree).
- **Verification:** all 15 tests green; live dark-mode evidence (a DOM contrast
  walk in dark on four routes and a focus-ring probe in light and dark) observed
  in the browser during the item; the a11y scan's dark-theme runs passed
  (item 10, 78/78).
- **Residual gap:** dark mode is token-driven and now structurally guaranteed;
  what is not covered is *aesthetic* dark-mode judgement by a human reviewer —
  the gate proves the surfaces flip, not that someone likes the palette.

### 7. vivid skin (Q9) — DONE (drop confirmed)

- **What:** the reference's appended `unscoped-vivid.css` skin is **not ported**.
  Q9 was resolved as drop: the CLAUDE.md cascade-layer/semantic-token rule exists
  precisely because of that failure mode (an unscoped appended skin overriding
  the cascade), and the reference identity is carried by the verbatim tokens in
  `tokens.css` instead.
- **Where:** `docs/reports/OPEN_QUESTIONS.md` Q9; `themes.css` header ("the vivid
  skin variant was rejected (approved Q9)"); `index.css` cascade order comment.
- **Verification:** the cascade gate (`cascade.test.ts`) pins the layer order that
  makes the failure mode impossible to reintroduce silently.
- **Residual gap:** **none — this decision is resolved.** (Listed in the owner
  decision summary of §4 only to close it explicitly, as the Phase 2 directive
  named it.)

### 8. Image pipeline pass — DONE

- **What:** every image site routed through `next/image` in `fill` mode inside a
  reserved-aspect wrapper; AVIF+WebP declared (`next.config.ts`), so the browser
  gets a modern format at the width it actually renders.
- **Where:** `app/page.tsx`, `app/services/page.tsx`,
  `modules/services/components/{ServiceCategoryCard,SubServiceGrid,ServiceDetailPanel}.tsx`;
  `next.config.ts` (`images.formats: ["image/avif","image/webp"]`); gate
  `src/modules/services/components/image-pipeline.test.ts` (7 tests — no raw
  `<img>`, every `<Image>` has `sizes`, reserved aspect boxes, `priority` on both
  heroes and not below the fold).
- **Verification:** live CDP evidence (fa/RTL, production build): hero AVIF w=640
  = **21,013 B vs the 332,365 B source JPEG (94% smaller)**; WebP fallback
  41,324 B; `Vary: Accept` honored; 16-entry srcset; sizes honored (384w @393px,
  640w @1280px); **box parity vs the raw-`<img>` baseline EXACT (0 mismatches
  across /, /services, /services/gen × 393/1280px)**; LCP element = the hero
  picture on all three routes; warm LCP 64–100 ms. Only reference-copied
  `/img/*` imagery — nothing invented.
- **Residual gap (disclosed, by design):** a **cold** first load pays a one-time
  per-width AVIF encode (312–528 ms, `next/image` generates on demand) — warm
  numbers are the headline and the CWV gate is warm-gated for exactly this
  reason. Cold-cache behavior on a fresh deploy is covered by the deploy-time
  gate list (item 12 §6).

### 9. Bundle/JS audit vs the reference — DONE

- **What:** a wire-bytes audit (CDP `Network.loadingFinished`
  `encodedDataLength`, cold load, fa/RTL) against the reference's own payload —
  and one real fix: the LiveStatus client island imported `queries/statusQueries`,
  which held the Zod schema, so **the whole Zod runtime shipped to the home page**
  (chunk 700: 64.5 KB raw / 15.5 KB gzip; the Route Handler never ran the parse).
  The schema moved server-side, the Route Handler now `statusResponseSchema.parse`s
  its own payload (**"Zod at every API edge" is now enforced at the edge,
  stronger than before**), and the client gets a zero-dependency mirror whose
  agreement with the Zod schema is *proven*.
- **Where:** new `modules/services/schemas/{statusSchema,statusClientGuard}.ts`
  and `schemas/statusEquivalence.test.ts` (3 tests over 7 valid payloads + 27
  malformed mutants); changed `queries/statusQueries.ts`, `app/api/status/route.ts`,
  and 2 test imports.
- **Verification:** `/` First Load JS 146 → **134 kB** (build output), wire JS
  164.9 → 152.3 KB; zod identifier absent from every rebuilt client chunk;
  `/services` routes unchanged (the chunk was home-only); live: badge SSRs
  correctly ("پذیرش هم‌اکنون بسته است / بازگشایی فردا ساعت ۷:۳۰"), hydrates, polls
  `/api/status`, zero console errors, and `/api/status` still returns the
  contract payload (`{"open":false,"opensInMinutes":564,"dayLabel":"tomorrow"}`).
- **Comparison (accepted, not hidden):** JS is ~3.3× the reference's gzip payload
  (152 KB vs 46 KB) — the mandated Next.js + React hydration runtime vs the
  reference's hand-written vanilla JS (and ours is non-blocking/module-based; the
  reference's 7 scripts are all render-blocking). Everything else is lighter:
  CSS 10.9 vs 24.0 KB gz (2.2×), images 67 vs 675 KB (10×), HTML 33.6 vs 45.2 KB
  raw.
- **Residual gap (recorded, not applied):** `polyfills-*.js` (112.6 KB raw / 39.5
  KB gz) ships to every cold load because no browserslist config overrides Next's
  default targets. Narrowing targets would cut ~39 KB gz but drops older-browser
  support; a clinic's audience is heterogeneous, so the default is kept
  **deliberately** — an owner-visible decision, recorded here and in the notes.

### 10. Accessibility audit round 2 — DONE, with one disclosed gap

- **What:** a second full a11y pass over the four in-scope routes, this time
  including the platform accessibility tree itself (`Accessibility.getFullAXTree`
  over CDP — the exact representation AT clients consume) and an axe scan extended
  with the `best-practice` tag (so `heading-order` and similar structural rules are
  inside the audit). It found and fixed one real defect: the two footer section
  headings were `<h4>`s, putting every route's outline out of level sequence
  (`/` had `H1 → … → H2 → H4`; `/nonexistent-page` had a three-level `H1 → H4`
  jump). They are top-level page sections, so `h2` is correct, and the explicit
  `text-[15px] font-extrabold` class keeps the visual size byte-identical.
- **Where:** fix `src/components/layout/SiteFooter.tsx` (two `<h4>` → `<h2>` with
  a comment documenting why); scanner `scripts/a11y-scan.mjs` (npm `a11y:scan`);
  logs `docs/reports/a11y-scan-round2.log`, `a11y-axtree-round2.log`,
  `a11y-scan-final.log`.
- **Verification (all observed):** the **a11y scan: 78/78 page-runs PASS —
  serious=0 critical=0 moderate=0 minor=0** across 13 routes × 3 locales × 2
  themes, including the 404 route and with `best-practice` enabled. Heading
  outlines now strictly sequential on all four routes:
  `/` `H1, H2×8`; `/services` `H1, H2, H3×7, H2, H3×3, H2, H2`;
  `/services/gen` `H1, H2, H3×5, H2, H2`; `/nonexistent-page` `H1, H2, H2`.
  AX-tree: `lang=fa dir=rtl` + a Persian title on every route, exactly one h1 per
  page, all landmarks present (`banner`, `main`, `contentinfo`, `navigation`,
  `breadcrumb` on `/services*`, a labelled `region` on `/`), **every image has an
  accessible name** (0 unnamed of 1/11/6/0 — the item-8 conversion dropped no alt
  text), **0 unnamed interactive elements** on every route, and the badge's
  `role=status` live region carries the open/closed text (a screen reader gets it
  on load and on every 61 s poll). `tsc` exit 0, suite green, build success, and
  the served 404 page carries `<h2>` where it had `<h4>`.
- **The disclosed gap — the fa screen-reader pass could NOT be run. The four
  mandated disclosure fields:**

  | field | record |
  |---|---|
  | **check** | fa screen-reader pass over the four in-scope routes (NVDA preferred, Narrator fallback) |
  | **reason** | No screen reader capable of speaking Persian exists on this machine. NVDA is **not installed** (no `HKLM:\…\Uninstall` entry, no `C:\Program Files\NVDA`, no `C:\Program Files (x86)\NVDA`). The only installed SAPI voices are `Microsoft David Desktop [en-US]` and `Microsoft Zira Desktop [en-US]` — **no Persian voice**. `Narrator.exe` exists but is voiceless for fa: it would read the Persian DOM with an English phonology, which is not evidence of anything. |
  | **command attempted** | `Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*' \| Where-Object { $_.DisplayName -like '*NVDA*' }` → NONE; `Test-Path 'C:\Program Files\NVDA'` → False; `Add-Type -AssemblyName System.Speech; (New-Object System.Speech.Synthesis.SpeechSynthesizer).GetInstalledVoices()` → exactly the two en-US voices above. |
  | **blocking impact** | A genuine fa screen-reader pass is **unobservable here** — nothing about the live read-out (pronunciation, landmark announcements, heading-navigation cadence) was verified by ear. This does **not** block Phase 2's gate: the release gate is the axe scan (`SEO_ACCESSIBILITY_SECURITY.md` §5/§8.2), which was re-run and passes. The gap is re-listed as a **pre-Phase-3 action** in `PHASE_3_GO_NO_GO.md`. |

- **Residual gap:** the fa screen-reader pass above, plus the honest note that the
  OS-level UIA pass from PowerShell could not reach the page body either
  (Chromium exposes text via TextPattern, which PowerShell cannot drive) — so the
  OS-level AT pass stays inside the disclosed gap, not inside the evidence.

### 11. Lighthouse/CWV budget + CI enforcement — DONE (Lighthouse half declined, recorded)

- **What:** a CWV budget that is **measured, enforced, and gate-failing**:
  `ttfb ≤ 300, fcp ≤ 1200, lcp ≤ 1500, cls ≤ 0.100, inp ≤ 200` (every value at or
  inside Google's Good rating, pinned by test), with pure aggregators
  (session-window CLS with 1 s gap / 5 s cap, INP longest-per-interaction
  grouping) and `GOOD_THRESHOLDS` so the budget can never drift past "Good"
  unnoticed. The CDP audit harness measures the four in-scope routes × 393/1280 px
  in fa/RTL against the production build; **warm-gated, cold reported** (the item-8
  cold AVIF encode is real and ungated on purpose), exits non-zero on any warm
  breach. CI wiring (`typecheck → test → build → a11y:scan → cwv`) is checked in.
- **Where:** `scripts/cwv-budget.mjs` + `scripts/cwv-budget.d.mts` (the TS surface
  so the test type-checks without loosening `allowJs: false`),
  `scripts/cwv-audit.mjs` (npm `cwv`), `.github/workflows/cwv-budget.yml`;
  **the mandated new test** `tests/cwv-budget.test.ts` (18 cases: hand-computed
  session-window expectations, INP grouping corners, the gate on every metric
  including the CLS 0.1004/0.1005 rounding edge, and the Good-threshold
  invariant). Two npm scripts added, **zero packages added**.
- **Verification:** final sweep **8/8 warm runs in budget** (see §1 table; full
  log `docs/reports/cwv-audit-final.log`). The **gate was proven to fail**: with
  the LCP budget temporarily set to 50 ms (then restored) the audit reported
  `FAIL: 8 warm page-runs (8 breaching)` and exited 1. The item-8 cold CLS 0.119
  transient was chased across 3 full sweeps + 2 focused probes (5 cold loads of
  `/` @393, 8 @1280) — cold CLS never exceeded 0.061; it stays on record as
  non-reproducible and is now *bounded by the gate* rather than merely observed.
- **INP measurement — a disclosed proxy, and why:** Chrome's Event Timing API does
  not reliably emit `event` entries for CDP-dispatched input in this Edge build
  (empty on 6 of 8 calibration page-runs; on the other 2, durations contradicted
  page-side timing by ~5×). Gating on that would have gated on noise. The gate
  therefore measures the gesture directly (pointerdown → first rAF after click
  handlers, ≈ INP's processing + presentation segments, from inside the page). It
  does not capture the OS→browser input hop of real hardware, and it is the
  longest of the audit's own three gestures per page, not a field p98 — both
  stated in the audit's own output.
- **Lighthouse — deliberately not installed (recorded, per item):**

  | field | record |
  |---|---|
  | **check** | a Lighthouse lab run at the local HTTP origin |
  | **reason** | Lighthouse 13.6.0 is not installed and installing it was declined: its Performance score is a lab-weighted *derivative* of exactly the five signals the CDP harness measures directly at the same origin (LCP/CLS/INP are the CWV set; fcp/ttfb feed the score), measured on the real production render rather than a throttled simulation; and adding a ~300 MB devDependency tree would introduce new `npm audit` advisories against owner Decision A (R-2: no new major dependency trees, document what exists). |
  | **command attempted** | `npx --no-install lighthouse --version` → `npx canceled due to missing packages and no YES option: ["lighthouse@13.6.0"]` |
  | **blocking impact** | No Lighthouse score number appears in this report. The field-relevant metrics are present, measured, and gated; the missing piece is the lab-condition scorecard, which the owner may still request — the harness covers it without new dependencies the day a runner exists. |

- **Residual gap:** the CI workflow file itself was **never executed** (this repo
  has no git history and no runner attached) — it is provided ready-wired; the
  gates it invokes were run by hand against the same origin, with their observed
  output checked in.

### 12. Deployment story (static vs Node, PG provisioning) — DONE (documented; one owner decision carried)

- **What:** the deployment document that decides the runtime posture on observed
  evidence and records PostgreSQL provisioning as a runbook, not an
  implementation. Key content:
  - **The Node posture is load-bearing**, on observed (not projected) evidence:
    `/_next/image` + sharp (item 8's 94% smaller hero, warm LCP 64–100 ms), the
    `/api/status` Route Handler the LiveStatus island polls, the `?lang=`→cookie
    locale middleware, the five security headers + CSP, and the two legacy 308
    redirects. The last three could move to a front web server; **the first two
    cannot.**
  - **Runtime requirements:** Node ≥ 20.19.0, one Node process, a writable
    `.next/cache/images` (wiping it re-pays item 8's cold encode), and **zero
    environment variables** — proven: `grep -rn "process.env" src/` returns
    nothing.
  - **Static export (`output: "export"`) considered and rejected** with a
    capability-by-capability table (loses image optimization, cannot export the
    status endpoint or the locale middleware, pushes headers/redirects onto the
    web server) — kept as a documented fallback with its known losses.
  - **Hosting options A/B/C** (Node host + reverse proxy / managed Next platform /
    static export + CDN) with what each changes vs the verified posture;
    **recommendation A**, because every checked-in gate log was produced on
    exactly that shape — the deploy is a re-host, not a re-verification.
  - **PostgreSQL — DOCUMENTED, NOT IMPLEMENTED**, per the Phase 2 prohibition:
    why PG is not running (REC-1: the static catalog in typed content modules +
    `seed-content.mjs`; `package.json` carries no prisma/driver and that does not
    change), which surface first requires it (the first dynamic surface — Phase 4
    forms / Phase 5 panels; the approved boundary needs none, so provisioning PG
    early would be a database with no reader, i.e. unmonitored attack surface),
    and a seven-step runbook (dedicated role not superuser; `DATABASE_URL` through
    the Zod boot validation that must arrive with it; the spec's PG-prod /
    SQLite-dev+test split kept exactly; `migrate deploy` + seed at release, never
    destructive deletes; one PrismaClient singleton + TLS to the DB;
    backup-with-restore-drill before any PII; the services-only Prisma boundary
    kept). The schema stays where it already lives
    (`DATABASE_ARCHITECTURE.md` §2/§4) — re-referenced, not re-created.
  - **A risk-numbering collision recorded:** HSTS is **R-4 of the Phase 1 report's
    risk table**, *not* R-4 of `TECHNICAL_RISKS.md` (the CSS override risk). Both
    registers use "R-4" for unrelated items; the docs and scripts that say
    "deferred to R-4" mean the HSTS row. Recorded in place rather than silently
    renumbered (renumbering would orphan citations already checked in across
    reports and scripts).
- **Where:** `docs/architecture/DEPLOYMENT.md` (§1–§8; PG runbook in §7,
  provenance in §8).
- **Verification:** no code changed, no package changed, no build affected — item
  12 is a document. The load-bearing claims it cites were observed in items 2, 8,
  9 and 11, whose gates already ran and whose logs are checked in.
- **Residual gap:** the hosting choice is an **owner decision** (§4); R-8 (no
  `.nvmrc` yet) is a one-line fix left to the deploy task; HSTS stays deferred to
  the real HTTPS origin (R-4 Phase 1 row).

### 13. Content-owner handover documentation — DONE (document)

- **What:** the non-developer guide, **Persian-primary prose** (the language its
  readers read) with a short English developer note at the top naming the
  technical companions and declaring the English docs authoritative if the two
  views ever disagree. It tells the content owner, honestly:
  - **There is no CMS.** Every change is a developer task: edit the file, run the
    gates, rebuild, re-deploy. What the owner contributes is a well-formed
    request, not an edit.
  - **The golden trilingual rule:** fa is canonical and en/ar must arrive in the
    same change — the build fails if a key drifts, so a half-translated request
    blocks publication rather than being deferred. Per-locale digits; machine
    translation without human review never lands.
  - **The two content surfaces and their very different editability** — the honest
    edge found during inspection: UI messages (buttons, menu, footer) are
    rewordable in all three locales; **the services catalog is parity-locked to
    the reference** (`categories.test.ts` compares every field of all 10
    categories × 3 locales at every run), so even a catalog spelling fix is really
    a request to update the reference first.
  - **Site facts** (phone, address, email, founding year, opening hours) live in
    one file, `src/config/site.config.ts`, each value with its reference citation.
  - **The admissions badge is computed, never hand-set** — from the configured
    hours (Sat–Thu 7:30–20:00, Friday closed, Asia/Tehran) via the pure domain
    function. So "just turn the badge on for the weekend" is not a request that
    will be honored; an hours change is the only correct path.
  - **The never-break rules:** `پلتفرم/` read-only for the project's lifetime, no
    invented content (no prices, invented hours, statistics, or medical data not
    in the reference), and doctor mobile/national IDs never published (the
    reference's own practice).
  - What happens after every change — the five gates in plain terms — and how to
    file a well-formed request, including the escalation if a translator is
    unavailable.
- **Where:** `docs/handover/CONTENT_OWNER_GUIDE.md`.
- **Verification:** no code changed, no package changed, no build affected — item
  13 is a document. Its claims were established by reading the actual gates
  (`categories.test.ts`, `messages/index.test.ts`, `site.config.ts`,
  `CONTENT_EDITING_WORKFLOW.md`), not by assumption; the Persian body was scanned
  for stray foreign-language fragments (zero CJK tokens; four fragments + one typo
  found by re-reading and fixed) and its facts cross-checked against the config.
- **Residual gap:** a guide documents the workflow as of Phase 2; if the surfaces
  change in a later phase, the guide must be regenerated (the English note at its
  top says exactly this).

### 14. Regression suite frozen as the Phase 3 baseline — DONE (manifest + gate test + record)

- **What:** the answer to *"future phases must not break parity"* in a repository
  with **no git history** — there is no commit to point a future phase at, so the
  freeze is an artifact plus an enforcer, not a convention:
  - `tests/phase2-baseline.manifest.json` — the frozen audit trail: repo paths →
    `{sha256, tests}` for all 28 test files, `suite {files: 28, tests: 218}`,
    `frozenAt 2026-11-11`, the environment at freeze (Node v26.13.0, vitest
    2.1.9, next 15.5.29, react 19.3.1, typescript 5.9.3), and an inline `gate`
    string explaining the rules.
  - `scripts/baseline-freeze.mjs` + `.d.mts` — zero-dependency
    (node:crypto/fs/path/url/child_process): default mode **verifies** (exit 0 =
    intact, nonzero on drift); `--write` **refreezes** by re-running the suite.
  - `tests/phase2-baseline.test.ts` — **the mandated item-14 test** (4 tests):
    the manifest parses and declares a non-empty suite; every frozen file is
    present and **byte-identical** (sha256); the manifest is internally consistent;
    and the gate never freezes itself or its manifest (`SELF_EXCLUDED`) so the
    refreeze path stays open.
  - `docs/reports/PHASE_2_BASELINE.md` — the human-readable freeze record: the
    28-file table, the environment, the parity-critical files the freeze exists to
    protect, honest limits, and the refreeze procedure.
- **Gate semantics (deliberate):** removing/renaming/**editing** any frozen file
  **fails** — no change to a baseline test is ever silent; **adding new test files
  is allowed and never a violation**, because the manifest is the frozen set, not
  a cap. (Proof: item 14's own gate test is an addition on top of the frozen 28.)
- **Verification (observed):** the suite green at freeze (28 files / 218 tests —
  the JSON the manifest was generated from); `tsc --noEmit` clean with the new
  files; the gate green; and a **negative probe** — appending one comment line to
  `src/core/i18n/digits.test.ts` made the gate fail with the "CHANGED since the
  freeze" message naming the refreeze procedure; the file was restored byte-exact
  and verify returned intact. The gate has demonstrably *failed*, not just passed.
- **Residual gap (honest limits, recorded in the baseline doc):** the gate freezes
  **files, not intent** — a refreeze that weakens an assertion is caught by the
  *amendment requirement* on `PHASE_2_BASELINE.md`, not by code. Non-test gates
  (a11y scan, CWV audit, build) are not in the freeze; they stay enforced by the
  CI workflow and their checked-in logs.

### 15. Phase 2 report + Phase 3 go/no-go review — DONE (this document)

- **What:** this report (the five mandated sections) and
  `docs/reports/PHASE_3_GO_NO_GO.md` — the client review deliverable, **not** a
  trigger to begin Phase 3 — plus the roadmap status update.
- **Where:** `docs/reports/PHASE_2_REPORT.md`, `docs/reports/PHASE_3_GO_NO_GO.md`,
  `docs/roadmap/MASTER_ROADMAP.md`, `docs/reports/PHASE_2_NOTES.md` (the
  accumulating work notes, now folded into this report by reference).
- **Verification:** §1's final-status table — every gate re-run for this report on
  2026-11-11 and its raw output checked in (`a11y-scan-final.log`,
  `cwv-audit-final.log`).
- **Residual gap:** none for the item. Phase 3 itself is **not started** — see §5
  and the go/no-go document.

---

## 3. Part A — Phase 1 debt-closure results

| Decision | Resolution | Observed result |
|---|---|---|
| **A — R-2, `npm audit` advisories: ACCEPT AND DOCUMENT** (owner decision 2026-11-10) | No major upgrades, no `npm audit fix --force`; the advisories stay documented with the owner decision. | **Runtime dependencies byte-for-byte unchanged across all of Phase 2** (`next`, `react`, `react-dom`, `zod`, `@tanstack/react-query`). Phase 2 added no packages at all except the Part-B decision below. Recorded in `PHASE_1_REPORT.md`. |
| **B — R-6, accessibility: CLOSED with observed evidence** | Dev-only `axe-core` 4.14.0 in a **zero-dependency CDP harness** (no browser-automation dependency tree; the harness drives Edge's DevTools Protocol directly). | **axe 78/78 page-runs, zero findings at every impact level**; keyboard-only 24/24; reduced-motion 24/24; logs in `docs/reports/`. `axe-core` is the **only** `package.json` change in all of Phase 2 — a devDependency, so it never enters the shipped bundle. |

No other Phase 1 debt was carried into Phase 2. R-3 (CSP `'unsafe-inline'`), R-5
(no `og:image`), R-4 (HSTS, Phase 1 row) and R-8 (no `.nvmrc`) are **carried
risks**, not Phase 2 debt — each is recorded with its disposition in item 12's
`DEPLOYMENT.md`.

---

## 4. Owner decisions still required

| # | Decision | Status | What the owner must choose |
|---|---|---|---|
| 1 | **Item 12 — hosting posture** | **OPEN (the last undecided Phase 2 decision)** | **A** (Node host + reverse proxy — **recommended**: every checked-in gate log was produced on exactly this shape, so the deploy is a re-host, not a re-verification) vs **B** (managed Next platform — moves `/_next/image` and `/api/status` to the platform's runtime, re-verification needed at the real origin) vs **C** (static export + CDN — documented fallback only; it loses image optimization and cannot serve the status endpoint or the locale middleware). See `DEPLOYMENT.md` §5. |
| 2 | Item 7 — vivid skin (Q9) | **RESOLVED — drop confirmed per approved Q9** | None. (Listed because the Phase 2 directive named it; the reference's unscoped `vivid.css` is not ported and the cascade gate pins the layer order that makes its failure mode impossible to reintroduce.) |
| 3 | Item 9 — polyfills / browserslist | **Recorded, not applied — deliberate** | Accept the ~39 KB gz polyfill payload on every cold load (current default, kept for older-browser support across a heterogeneous clinic audience) **or** authorize a browserslist narrowing that drops older browsers. |
| 4 | Item 11 — Lighthouse | **Declined, recorded** | Accept the CDP-harness CWV measurements in place of a Lighthouse score, **or** request the lab run (a ~300 MB devDependency tree, which would introduce new `npm audit` advisories against Decision A). |
| 5 | Item 12 — R-8, Node pin | **Open (one-line fix)** | Whether to pin the exact Node in `.nvmrc`/CI at deploy time; Node ≥ 20.19.0 is the declared floor either way. |

Decision 1 is the only one that gates a deploy; 3–5 are quality-of-life choices
that can be made any time without rework.

---

## 5. Phase 3 readiness

**Phase 3 is NOT approved and has NOT been started.** Confirmed by file search:
no Phase 3 code exists anywhere in `src/`, `scripts/`, or `tests/`; the only
"Phase 3" references in the codebase are the item-14 baseline artifacts (whose
*purpose* is to be the Phase 3 baseline — text references, not work) and the
Phase 0 planning docs `docs/roadmap/PHASES/PHASE_3.md` / `PHASE_4.md`
(mtime 2026-11-09, untouched by Phase 2).

**What Phase 2 hands to Phase 3:**

- **A frozen, enforceable baseline.** 28 test files / 218 tests frozen with sha256
  integrity; a future phase that deletes, renames, or edits a baseline test file
  **fails the suite** with a message naming the refreeze procedure. Additions stay
  allowed, so Phase 3 can grow the suite. The parity-critical files the freeze
  exists to protect are named in `PHASE_2_BASELINE.md` (catalog parity 10×3
  against the read-only reference, message key-completeness, the `/api/status`
  contract, sitemap/structuredData, the cascade/token rules, the CWV budget math).
- **A gate-failing performance and accessibility posture.** The CWV budget exits
  non-zero on any warm breach of Google's Good thresholds; the a11y scan exits
  non-zero on any serious/critical finding — both wired into the CI workflow in
  order, both proven to fail, both with checked-in observed logs.
- **A deployment story with one decision left.** Option A recommended; PG
  provisioning is a documented runbook, not an unrequested installation.
- **A content owner who knows the rules.** The Persian-primary guide documents the
  golden trilingual rule, the parity lock, and the never-break lines — so Phase 3's
  content requests arrive well-formed.

**Known gaps Phase 3 inherits (all recorded, none hidden):**

1. **The fa screen-reader pass was never run** (item 10's disclosed gap) — no
   fa-capable screen reader on this machine. Pre-Phase-3 action: install NVDA + a
   fa SAPI voice (e.g. Persian SCT), then run the pass against the frozen baseline.
2. **No CI runner is attached** to the checked-in workflow; the gates ran by hand
   against `http://localhost:3137`.
3. **HSTS/TLS is deferred to the real origin** (R-4, Phase 1 row) — the budgets
   were measured on local HTTP by design.
4. **Polyfill payload ~39 KB gz per cold load** (item 9) — deliberate, owner-visible.
5. **One non-reproduced transient** (§1.1) — a single INP spike on
   `/nonexistent-page` that appeared once in 24 warm page-runs; on record, bounded
   by the gate.

**Then STOP. Phase 3 does not begin here.** The client review deliverable is
`docs/reports/PHASE_3_GO_NO_GO.md`; its outcome is the owner's to make.
