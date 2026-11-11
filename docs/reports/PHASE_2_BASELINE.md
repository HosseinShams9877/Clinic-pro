# PHASE_2_BASELINE — the frozen regression suite (Phase 3 baseline)

> Phase 2 deliverable (item 14). Spec row: *"Regression suite frozen as the
> Phase 3 baseline"* — rationale: *"future phases must not break parity"*.
>
> **Frozen: 2026-11-11 · 28 test files · 218 tests · all green at freeze.**
> **Refrozen: 2026-11-11 · 29 test files · 222 tests · all green at refreeze**
> (amendment below, §"Refreeze record").
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
| `src/components/layout/focus-ring-clip.test.tsx` | 5 |
| `src/components/layout/LanguageSwitcher.test.tsx` | 3 *(added at refreeze)* |
| `src/components/layout/SiteHeader.test.tsx` | 5 *(was 4 at the original freeze)* |
| `src/components/shared/LiveStatus.test.tsx` | 8 |
| `src/components/shared/LivingEffects.test.tsx` | 5 |
| `src/core/i18n/digits.test.ts` | 8 |
| `src/core/i18n/jalali.test.ts` | 14 |
| `src/core/openHours.test.ts` | 17 |
| `src/core/rateLimit.test.ts` | 5 |
| `src/hooks/useMediaQuery.test.tsx` | 5 |
| `src/hooks/useReducedMotion.test.tsx` | 6 |
| `src/modules/i18n/messages/index.test.ts` | 8 |
| `src/modules/seo/lib/metadata.test.ts` | 6 |
| `src/modules/seo/lib/structuredData.test.ts` | 16 |
| `src/modules/services/components/image-pipeline.test.ts` | 7 |
| `src/modules/services/content/categories.test.ts` | 6 |
| `src/modules/services/queries/statusQueries.test.ts` | 18 |
| `src/modules/services/schemas/statusEquivalence.test.ts` | 3 |
| `src/styles/globalCss/cascade.test.ts` | 6 |
| `src/styles/globalCss/print.test.ts` | 6 |
| `src/styles/globalCss/themes.test.ts` | 4 |
| `tests/cwv-budget.test.ts` | 18 |
| **total** | **218** (original freeze) → **222** (refreeze) |

The **29 files / 222 tests** above are the frozen set. One further file exists
outside the freeze by design: `tests/phase2-baseline.test.ts` is the enforcing
gate itself (`SELF_EXCLUDED` in the freeze script, so the refreeze path can
never self-lock). At the refreeze the full suite discovered by
`vitest.config.ts` was **30 files / 226 tests** — the gate test is the 30th
file with 4 tests.

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

## Observed verification at freeze

- `node scripts/baseline-freeze.mjs --write` produced the manifest from a green
  28-file / 218-test run; `node scripts/baseline-freeze.mjs` (verify) exits 0.
- The gate test ran green as part of the suite.
- **Negative probe:** appending one comment line to a frozen file
  (`src/core/i18n/digits.test.ts`) made `tests/phase2-baseline.test.ts` fail
  with the "CHANGED since the freeze" message; the file was then restored
  byte-exact and verify returned intact — the gate demonstrably catches drift,
  not just passes.
