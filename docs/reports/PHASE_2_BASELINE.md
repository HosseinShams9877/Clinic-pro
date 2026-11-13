# PHASE_2_BASELINE — the frozen regression suite (Phase 3 baseline)

> Phase 2 deliverable (item 14). Spec row: *"Regression suite frozen as the
> Phase 3 baseline"* — rationale: *"future phases must not break parity"*.
>
> **Frozen: 2026-11-11 · 28 test files · 218 tests · all green at freeze.**
> **Refrozen: 2026-11-11 · 29 test files · 222 tests · all green at refreeze**
> (amendment below, §"Refreeze record").
> **Refrozen: 2026-11-12 · 29 test files · 223 tests · all green at refreeze**
> (amendment below, §"Refreeze record").
> **Refrozen: 2026-11-12 · 31 test files · 232 tests · all green at refreeze**
> (amendment below, §"Refreeze record" — B-6 animations pass).
> The frozen artifact is `tests/phase2-baseline.manifest.json`; the enforcer is
> `tests/phase2-baseline.test.ts`; both are produced/driven by
> `scripts/baseline-freeze.mjs`.

This repository has **no git history**, so there is no commit to point a future
phase at and say "the suite was here." This record and the manifest are that
pointer. Together they answer the item-14 rationale directly: a later phase that
quietly drops or hollows out a parity test to make a change pass cannot do it
silently — the suite fails, and the failure message names the file and the
refreeze procedure.

## What the freeze covers

The entire test suite discovered by `vitest.config.ts` at freeze time
(`src/**/*.test.{ts,tsx}` and `tests/**/*.test.{ts,tsx}`):

| Test file | Tests at freeze |
|---|---|
| `src/app/api/status/route.test.ts` | 6 |
| `src/app/error.test.tsx` | 4 |
| `src/app/not-found.test.tsx` | 4 |
| `src/app/page.test.tsx` | 9 |
| `src/app/services/[category]/page.test.tsx` | 6 |
| `src/app/services/page.test.tsx` | 7 |
| `src/app/sitemap.test.ts` | 7 |
| `src/components/layout/focus-ring-clip.test.tsx` | 5 *(count unchanged at the B-6 refreeze)* |
| `src/components/layout/LanguageSwitcher.test.tsx` | 3 *(added at refreeze)* |
| `src/components/layout/SiteHeader.test.tsx` | 6 *(was 5; +1 at the 2026-11-12 B-6 refreeze)* |
| `src/components/shared/LiveStatus.test.tsx` | 8 |
| `src/components/shared/LivingEffects.test.tsx` | 5 |
| `src/components/shared/MagneticButtons.test.tsx` | 4 *(added at the B-6 refreeze)* |
| `src/components/shared/MenuSpy.test.tsx` | 4 *(added at the B-6 refreeze)* |
| `src/core/i18n/digits.test.ts` | 8 |
| `src/core/i18n/jalali.test.ts` | 14 |
| `src/core/openHours.test.ts` | 17 |
| `src/core/rateLimit.test.ts` | 5 |
| `src/hooks/useMediaQuery.test.tsx` | 5 |
| `src/hooks/useReducedMotion.test.tsx` | 6 |
| `src/modules/i18n/messages/index.test.ts` | 8 |
| `src/modules/seo/lib/metadata.test.ts` | 6 |
| `src/modules/seo/lib/structuredData.test.ts` | 16 |
| `src/modules/services/components/image-pipeline.test.ts` | 8 *(was 7; +1 at the 2026-11-12 B-3/B-4 refreeze)* |
| `src/modules/services/content/categories.test.ts` | 6 |
| `src/modules/services/queries/statusQueries.test.ts` | 18 |
| `src/modules/services/schemas/statusEquivalence.test.ts` | 3 |
| `src/styles/globalCss/cascade.test.ts` | 6 |
| `src/styles/globalCss/print.test.ts` | 6 |
| `src/styles/globalCss/themes.test.ts` | 4 |
| `tests/cwv-budget.test.ts` | 18 |
| **total** | **218** (original freeze) → **222** (2026-11-11 refreeze) → **223** (2026-11-12 refreeze) → **232** (2026-11-12 B-6 refreeze) |

The **31 files / 232 tests** above are the frozen set. One further file exists
outside the freeze by design: `tests/phase2-baseline.test.ts` is the enforcing
gate itself (`SELF_EXCLUDED` in the freeze script, so the refreeze path can
never self-lock). At the latest refreeze (2026-11-12, the fidelity pass)
the full suite discovered by `vitest.config.ts` was **32 files / 236
tests** — the gate test is the 32nd file with 4 tests (31 frozen files =
232 + 4 gate). Re-verified at the fidelity-pass final gate run
(2026-11-12): all 31 frozen files byte-identical to the manifest
(`scripts/baseline-freeze.mjs` hash reconciliation), full suite 32/236
green, so **no further refreeze was required** — nothing in the frozen
set changed after the B-6 refreeze.

Environment recorded at freeze: Node `v26.13.0`, vitest `2.1.9`,
next `15.5.29`, react `19.3.1`, typescript `5.9.3`. Node ≥ 20.19.0 is the
declared floor (`package.json` `engines`); see `docs/architecture/DEPLOYMENT.md`
§3 for why pinning the exact Node in CI/on the host is still open (R-8).

## The parity-critical files (the ones item 14 exists to protect)

Not every test in the suite guards parity equally. These are the ones whose
removal or weakening would let content drift past a future change unnoticed:

- `src/modules/services/content/categories.test.ts` — executes the **read-only
  reference IIFE** in a sandbox and compares all **10 categories × 3 locales**
  field by field (the item 3 extension). Weakening it = content drift against
  `پلتفرم/` undetected.
- `src/modules/i18n/messages/index.test.ts` — the **fa key set is the contract**;
  en/ar must declare exactly it, no empty values, `t()` never returns the key.
  Weakening it = half-translated UI ships.
- `src/modules/services/schemas/statusEquivalence.test.ts` + `queries/statusQueries.test.ts`
  (18 tests) — the `/api/status` contract the LiveStatus island depends on.
- `src/app/sitemap.test.ts` and `src/modules/seo/lib/structuredData.test.ts` —
  the route/SEO surface stays in sync with the actual route catalog.
- `src/styles/globalCss/cascade.test.ts` / `themes.test.ts` — the cascade-layer
  and token rules (the `vivid.css` lesson, risk R-4 in `TECHNICAL_RISKS.md`).
- `tests/cwv-budget.test.ts` — the performance budget math (item 11), so the
  budget cannot drift past Google's Good thresholds without failing.

## The gate: what it catches and what it does not

`tests/phase2-baseline.test.ts` (4 tests) fails when:

- a frozen file is **missing** (deleted, moved, or renamed), or
- a frozen file **changed** — sha256 over the file bytes differs from the
  manifest.

It deliberately **does not** fail when:

- a **new** test file is added — Phase 3 is expected to add tests; the manifest
  lists the frozen set, not a cap. New files show up as `added` in the verify
  report, informational only.

Honest limits (recorded, not oversold):

- The gate freezes **files, not behaviors** — it catches any byte-level change
  to a frozen test file, which means **no change to a baseline test is ever
  silent** (the author must refreeze and record why, per the procedure below).
  What it does not do is judge the *intent* of a change: a refreeze that
  weakens an assertion is caught by the amendment requirement on this document,
  not by the gate itself.
- The freeze does not cover the **non-test gates** — the a11y scan, the CWV
  audit, and the build. Those stay enforced by the CI workflow
  (`.github/workflows/cwv-budget.yml`) and their checked-in logs; the baseline
  covers the *suite* only.
- The manifest excludes itself and the gate test (`SELF_EXCLUDED`), so the
  refreeze path can never self-lock.

## Refreeze procedure (when a frozen file legitimately must change)

1. Make the change; run the suite green: `npm test`.
2. `node scripts/baseline-freeze.mjs --write` (re-runs the suite and rewrites
   `tests/phase2-baseline.manifest.json`; a vitest JSON run can be reused with
   `--json <path>`).
3. Amend **this document** with the date, what changed, and why — this file is
   the human-readable diff log of the baseline.

Never refreeze to make a failing suite pass without writing the reason here; a
refreeze with an empty amendment is the exact silent weakening the freeze exists
to prevent.

## Refreeze record

### 2026-11-11 — UI fix pass (B-1/B-2)

**Manifest:** `tests/phase2-baseline.manifest.json` rewritten — suite
`{ files: 29, tests: 222 }` (was `{ files: 28, tests: 218 }`). One frozen file
changed, one file added. `node scripts/baseline-freeze.mjs` (verify) exits 0
after the rewrite; the gate test ran green as part of the suite.

**Frozen file changed — `src/components/layout/SiteHeader.test.tsx` (4 → 5
tests).** The frozen version asserted the header anchor set *contains*
`/#help`, the reference's magnifier icon link. That assertion is removed and
replaced by an explicit no-search-affordance test
(`expect(container.querySelectorAll("header a[aria-label]")).toHaveLength(0)`,
`hrefs` must not contain `/#help`). **Why:** the owner's B-2 report plus
CLAUDE.md §2 rule 4 ("no fake buttons") — the magnifier was an icon link whose
accessible name read as a *search* action while it actually pointed at the
home `#help` section, and no in-scope search surface exists (Phase 1/2 cover
only the public site through Services). Keeping the link would violate rule 4;
the frozen test was enforcing the violation. The `/#help` *section* itself
remains on the home page; only the header affordance is gone. This is a
strengthening, not a weakening: the replacement test pins the absence by a
stronger property (zero labelled header links) than the old one pinned its
presence.

**File added — `src/components/layout/LanguageSwitcher.test.tsx` (3 tests,
B-1).** Not previously frozen because it did not exist. Pins the locale
switcher as plain `<a href="…?lang=">` (never next/link `<Link>`) and asserts
the Next router's `push` is never called on selection — the exact mechanism of
the B-1 bug, where a searchParams-only client navigation flipped page content
while `<html lang dir>` and the header stayed at the old locale.

**Out of scope of this refreeze:** no parity-critical file (the list in §"The
parity-critical files" above) was touched, and no assertion anywhere in the
frozen set was loosened. The full suite at refreeze was 30 files / 226 tests,
all green; the frozen subset is 29 files / 222. Full account:
`docs/reports/UI_FIX_PASS_REPORT.md`.

### 2026-11-11 — visual fidelity pass (B-1, header/footer re-skin)

**Manifest:** `tests/phase2-baseline.manifest.json` rewritten — the frozen set
is unchanged in *shape*: `{ files: 29, tests: 222 }`. Neither frozen file that
changed added or removed a test; their test counts stay 5 and 5.
`node scripts/baseline-freeze.mjs` (verify) exits 0 after the rewrite, and the
gate test ran green as part of the suite (30 files / 226 tests, 0 failing).

**Frozen files changed — `src/components/layout/SiteHeader.test.tsx` and
`src/components/layout/focus-ring-clip.test.tsx` (both still 5 tests).**

1. `SiteHeader.test.tsx` — test 2 ("exposes exactly the in-scope desktop
   anchors") gained one disjunction: `href === \`tel:${siteConfig.phone}\``.
   **Why:** the header was rewritten onto the reference's own DOM
   (پلتفرم/index.html L88–126) for the fidelity pass, which restores the
   reference's booking CTA pill (`.btn.btn-primary.btn-sm.hide-sm` + i-calendar
   + `cta.book`). Its target `patient-panel.html?go=new` is out of scope, so
   per Q1 the substituted action is the clinic phone number — the exact
   reference affordance, no fake route. The allow-list still rejects every
   other href, so the boundary gate is as strict as before; it admits exactly
   one more *kind* of href, and that href is a `tel:` action, not a route.
2. `focus-ring-clip.test.tsx` — the two corner-radius tests
   ("keeps the rounded corners on the first/last link…", "carries the corner
   radius on the first/last menuitem") asserted vestigial Tailwind classes
   (`rounded-t-lg` / `rounded-b-lg`, i.e. 8px). **Why:** the dropdowns are now
   the reference's own geometry, ported into `reference.css`
   (style.css L115–119 lang list, L798–815 sub-menu): each item carries its own
   `border-radius:10px` and the panel its own 16px/14px radius with
   `padding:8px|6px`, so *no* clipping or corner workaround is needed. Keeping
   the 8px Tailwind utilities would have overridden the reference's 10px item
   radius — an exactness violation. The replacement tests pin the invariant in
   its ported form: the ported `.menu .sub` and `.lang-list` rules must exist
   with their reference radius and must not clip (`no overflow:hidden` in the
   rule body), and nothing in the rendered markup may reintroduce a Tailwind
   overflow/radius utility that fights the ported geometry. This is a
   strengthening, not a weakening: the old tests pinned a workaround; the new
   ones pin the reference geometry itself plus the absence of both clipping and
   fighting utilities. The three remaining tests (ancestor no-overflow walks,
   the `:focus-visible` 2px/3px geometry) are unchanged.

**Out of scope of this refreeze:** no parity-critical file was touched and no
assertion was loosened — both edits narrow what the markup may do against the
ported reference geometry. Full account:
`docs/reports/EXACT_VISUAL_AND_UI_FIDELITY_REPORT.md`.

### 2026-11-12 — visual fidelity pass (B-2, home page rewrite)

**Manifest:** `tests/phase2-baseline.manifest.json` rewritten — the frozen set
is unchanged in *shape*: `{ files: 29, tests: 222 }`. No frozen file added or
removed a test; every changed file keeps its frozen test count.
`node scripts/baseline-freeze.mjs` (verify) exits 0 after the rewrite, and the
gate test ran green as part of the suite (30 files / 226 tests, 0 failing).

**Frozen files changed — `src/app/page.test.tsx` (9 tests),
`src/components/shared/LiveStatus.test.tsx` (8),
`src/styles/globalCss/print.test.ts` (6), and
`src/modules/services/components/image-pipeline.test.ts` (7).**

1. `page.test.tsx` — **why:** the home page was rewritten section-for-section
   onto the reference's own DOM (پلتفرم/index.html L128–347) with geometry and
   decoration ported into `reference.css`. Two assertions had to follow the
   new markup. (a) Test 1's stat queries are now scoped
   `within(document.querySelector(".h-stats"))` **because the mounted
   `HomeSvcBento` island renders group counters (`em.hx-n`, e.g. "۷") into the
   same document**, so `getByText(t("fa","st.n1"))` is no longer unique — a
   real-render consequence of the island, not a loosening. (b) Test 2 was
   strengthened: the no-JS `.h-svc` fallback must still render exactly its
   eight reference cards, *and* every `/services/` anchor in the whole
   document (island included) must land inside the built ten-category
   catalog regex. The remaining seven tests passed unchanged against the
   ported markup.
2. `LiveStatus.test.tsx` — the three dot assertions were re-pointed from
   inline background-color states to the reference's own `.live-dot`(+`.off`)
   class model (port in `reference.css`); no count change.
3. `print.test.ts` — the "drops the screen-only chrome" regex tracks the
   print hide-list, which lost the invented `.hero-particles` selector and
   gained `.scroll-progress` / `.float-actions` naming; no count change.
4. `image-pipeline.test.ts` — the two Tailwind-era geometry assertions
   (`/aspect-\[4\/3\]/` and `/relative order-1 min-h-64/` on the hero and
   care wrappers) pinned Phase 1's Tailwind layout, which the port replaces
   with the reference's own boxes. They are re-pointed at the ported form
   (same invariant, stronger): the markup must keep the
   `.h-media > .h-img` (hero) and `.hc-img` (care) wrapper chains with
   `fill`-mode `<Image>` inside, and `reference.css` must reserve the
   geometry (`.h-media{min-height:440px}`, `.h-img{position:absolute}`,
   `.hc-img{min-height:260px}`) — the picture itself may carry neither a
   width/height nor a Tailwind sizing utility.

**Non-frozen source changes in the same pass:** `src/app/page.tsx` (the
rewrite itself), the new islands `HomeSvcBento.tsx` / `HeroParallax.tsx`, the
deletion of the invented `HeroParticles.tsx` (+ its `layout.css` rules and
print/probe hooks), `print.css`, `scripts/reduced-motion-pass.mjs`, and
`src/components/shared/LiveStatus.tsx` / `FloatingActions.tsx` /
`LivingEffects.tsx` re-skinned onto reference DOM.

**Out of scope of this refreeze:** no parity-critical file was touched and no
assertion was loosened — every edit either follows the ported reference markup
or pins a stronger invariant (wrapper-reserved geometry, whole-document
catalog containment). Full account:
`docs/reports/EXACT_VISUAL_AND_UI_FIDELITY_REPORT.md`.

### 2026-11-12 — visual fidelity pass (B-3 services landing + B-4 category pages)

**Manifest:** `tests/phase2-baseline.manifest.json` rewritten — the frozen set
gains one test: `{ files: 29, tests: 223 }` (was `{ files: 29, tests: 222 }`).
One frozen file changed; no frozen file added or removed.
`node scripts/baseline-freeze.mjs` (verify) exits 0 after the rewrite, and the
gate test ran green as part of the suite (30 files / 227 tests, 0 failing).

**Frozen file changed — `src/modules/services/components/image-pipeline.test.ts`
(7 → 8 tests).** Two kinds of change, both following the B-3/B-4 port onto the
reference's own DOM (`پلتفرم/services.html` L132–206, populated by
`پلتفرم/assets/js/services.js`):

1. **SITES list re-pointed (no count change):** the B-4 port moves the
   category-detail picture out of `ServiceDetailPanel.tsx` (which now renders
   no image at all — the picture lives in the new client island
   `ServiceVideoButton.tsx` that also owns the reference's `ptoast` video
   behaviour). `ServiceDetailPanel.tsx` is removed from `SITES` and
   `ServiceVideoButton.tsx` is added, so coverage of "no raw `<img>` ships and
   every `<Image>` carries a `sizes`" is preserved at the file that actually
   ships the picture. The landing's `ServiceCategoryCard.tsx` stays in `SITES`
   unchanged; its JSDoc geometry note was reworded ("a `fill` picture") because
   the literal substring `<Image` in a comment was being picked up by the
   usage-splitting regex — a wording fix, not an assertion change.
2. **The two Tailwind-era geometry pins removed and replaced (net +1 test):**
   the assertions that `SubServiceGrid.tsx` matches `/relative aspect-\[16\/9\]/`
   and `ServiceDetailPanel.tsx` matches `/relative aspect-\[4\/3\]/` pinned
   Phase 1's Tailwind layout, which the B-4 port replaces with the reference's
   own boxes. They are replaced by a new test — "reserves the detail-video and
   item boxes in the ported geometry" — that pins the same invariant in its
   ported form (same invariant, stronger): the trigger is the reference's
   `button.sd-video` with a `fill`-mode `<Image>` inside, the item cells are
   the reference's `.si-m` with *non-fill* pictures carrying honest intrinsic
   width/height attributes, and `reference.css` must reserve the geometry
   itself (`.sd-video{position:relative…aspect-ratio:16/10}`,
   `.si-m img{width:100%;height:100%}`, `.si-mono{display:grid`). The
   non-fill branch is asserted with a `not.toMatch(/\bfill\b)` — the old pins
   never asserted the negative side, so this is a strengthening. The landing
   test ("reserves the services hero, advisory and card boxes…") is unchanged
   from the 2026-11-12 B-2 entry and still covers `.sh-photo` / `.sask-img` /
   `.scat`.

**Non-frozen source changes in the same pass:** `src/app/services/page.tsx`,
`ServiceGroupSection.tsx`, `ServiceCategoryCard.tsx` (B-3 landing port);
`src/app/services/[category]/page.tsx`, `ServiceDetailPanel.tsx`,
`SubServiceGrid.tsx`, the new `ServiceVideoButton.tsx` island (B-4 port); and
two adaptations in `src/styles/globalCss/reference.css` — the `.sd-text h2`
typography rule extended to `.sd-text h1` (the route's level-one heading is the
category name; rendered geometry identical) and the app-only `.svc-back` hook
for the back-to-landing button (documented in the CSS as an app-only rule, not
a ported one).

**Out of scope of this refreeze:** no parity-critical file was touched and no
assertion was loosened — the SITES move follows where the picture actually
renders, and the new geometry test asserts both the positive (ported boxes and
CSS reservations) and the negative (no `fill` in `.si-m`) sides. Full account:
`docs/reports/EXACT_VISUAL_AND_UI_FIDELITY_REPORT.md`.

### 2026-11-12 — visual fidelity pass (B-6 animations & micro-interactions)

**Manifest:** `tests/phase2-baseline.manifest.json` rewritten — the frozen set
gains two files and nine tests: `{ files: 31, tests: 232 }` (was
`{ files: 29, tests: 223 }`). Two frozen files changed, two files added.
`node scripts/baseline-freeze.mjs` (verify) exits 0 after the rewrite.

**Frozen files changed — `src/components/layout/SiteHeader.test.tsx` (5 → 6
tests) and `src/components/layout/focus-ring-clip.test.tsx` (5 tests, count
unchanged).** Both changes follow the SiteHeader gaining a required `pathname`
prop (B-6 static active state), not any loosening of the pins:

1. `SiteHeader.test.tsx`: all five existing renders now pass
   `pathname="/"`, and a sixth test is added — "bakes the reference's static
   active state into the menu (B-6)" — asserting that the home link carries
   `class="active"` with no `aria-current` on `/` (پلتفرم/index.html L101), that
   the services link carries `class="active"` plus `aria-current="page"` on
   `/services` **and** `/services/gyn` (پلتفرم/services.html L77), that the
   `/#contact` hash link is never statically active, and that the ported
   `.menu a.active{…background:var(--primary-50)}` rule the class keys into
   actually exists in `reference.css` (an active class with no rule behind it
   would be a dead affordance). This is a **strengthening**: the frozen set had
   no assertion on the menu's active state at all. One assertion was corrected
   before the freeze: the active-link queries are scoped to `#menu` because the
   brand link also targets `/` and is not an active-state carrier.
2. `focus-ring-clip.test.tsx`: the two "SiteHeader services sub-menu" renders
   gain `pathname="/"`. **No assertion changed** — the prop is newly required,
   so the frozen file would not compile without it.

**Files added — `src/components/shared/MenuSpy.test.tsx` (4 tests) and
`src/components/shared/MagneticButtons.test.tsx` (4 tests).** Not previously
frozen because the islands did not exist. They pin the two reference behaviours
the B-6 audit found missing from the app (پلتفرم/assets/js/main.js): the
scroll-spy over `#menu a[href^="#"]` (home-route only — the reference's inner
pages use fully-qualified hrefs so the selector matches nothing there; the spy
must not touch the server-rendered active class off-home) and the magnetic
buttons on `.hero .btn, .btn-primary` (armed only with motion allowed **and**
`pointer: fine`, the reference's own two gates; `mouseleave` clears the inline
transform; re-binds per route change; disarms on unmount).

**Non-frozen source changes in the same pass:** the new islands
`MenuSpy.tsx` / `MagneticButtons.tsx`; `src/middleware.ts` forwarding a verbatim
`x-pathname` request header; `src/app/layout.tsx` reading it via `headers()`
and mounting the islands; `SiteHeader.tsx` taking `pathname` and baking in the
active state (plus `id="top"` per index.html L89).

**Out of scope of this refreeze:** no parity assertion was loosened. The
focus-ring file's byte change is a required-prop adaptation with identical
assertions; the SiteHeader change is net +1 strengthening test; the two new
files cover behaviour that previously had no coverage at all. Full account:
`docs/reports/EXACT_VISUAL_AND_UI_FIDELITY_REPORT.md` §3.

## Unfrozen addition (2026-11-12, fidelity pass)

**No refreeze performed.** `src/styles/globalCss/comment-hygiene.test.ts`
(2 tests) was added during the fidelity pass's star-slash root-cause work; the
suite is now **33 files / 238 tests**, of which the 31 frozen files / 232
frozen tests remain byte-identical to the freeze above
(`node scripts/baseline-freeze.mjs` verify exits 0; `tests/phase2-baseline.test.ts`
green). The manifest freezes the frozen *set*, not a cap — new test files are
explicitly permitted, so no refreeze is warranted for a pure addition.
`src/app/page.tsx` (the 960px hero `sizes` fix, §2 of the fidelity report) is
likewise not frozen and required no refreeze.

## Observed verification at freeze

- `node scripts/baseline-freeze.mjs --write` produced the manifest from a green
  28-file / 218-test run; `node scripts/baseline-freeze.mjs` (verify) exits 0.
- The gate test ran green as part of the suite.
- **Negative probe:** appending one comment line to a frozen file
  (`src/core/i18n/digits.test.ts`) made `tests/phase2-baseline.test.ts` fail
  with the "CHANGED since the freeze" message; the file was then restored
  byte-exact and verify returned intact — the gate demonstrably catches drift,
  not just passes.
