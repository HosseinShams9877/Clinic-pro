# PHASE_3_GO_NO_GO — the client review deliverable

> Phase 2, item 15: *"Phase 3 go/no-go review with the client — approval
> protocol."* **This is a review document, not a trigger to begin Phase 3.**
> Phase 3 is not approved; nothing in it has been started. The go/no-go decision
> is the owner's to make, on the evidence below.

---

## 1. The question on the table

Phase 2 delivered the approved 15-item scope (content operations, hardening,
handover polish) on top of the Phase 1 website. The full account is
`PHASE_2_REPORT.md`; this document is the short, decision-shaped version:

- **Is the built website ready to deploy as-is?** (A deployment decision, not a
  Phase 3 decision.)
- **If yes, is Phase 3 (doctors directory and patient guide) the next thing to
  authorize — and under what pre-conditions?**

Phase 3's scope, for context, is `docs/roadmap/PHASES/PHASE_3.md`: 15 items
centered on a doctors module (66 records, 12 specialty categories), doctor profile
pages, the `?cat=` filter behavior the reference's category links rely on, the
patient guide (`/guide`, `/guide/<slug>`), a clinics page, search, `Physician` and
`MedicalProcedure` structured data — all of it **beyond the Phase 1/2
implementation boundary** (CLAUDE.md §2.4: the public website through the complete
Services section, inclusive). Phase 2 deliberately built none of it and left no
stub pages, fake buttons, or dead links for any of it.

## 2. What was actually verified (not claimed)

Every gate below was run against the production build at
**http://localhost:3137** (the disclosed origin; local HTTP, TLS/HSTS deferred to
the real origin per risk R-4) on 2026-11-11, and its raw output is checked in:

| Gate | Observed | Where the log lives |
|---|---|---|
| Typecheck (`tsc --noEmit`) | exit 0 | — |
| Test suite (vitest) | 29 files / 222 tests, all passing | item 14 freeze manifest |
| Production build | success, 17 routes, `/` 134 kB First Load | build output |
| Accessibility (axe-core, best-practice tag included) | **78/78 page-runs, zero findings at every impact level** — 13 routes × fa/en/ar × light/dark | `docs/reports/a11y-scan-final.log` |
| CWV budget (Google's Good thresholds, warm-gated) | **8/8 warm page-runs in budget**: ttfb 11–17 ms, fcp 64–100 ms, lcp 64–100 ms, cls 0.000, inp 40–48 ms | `docs/reports/cwv-audit-final.log` |
| Keyboard-only | 24/24 (Phase 1, unchanged — items 8/9/10 altered no keyboard-focusable structure) | `docs/reports/keyboard-pass.log` |
| Reduced-motion | 24/24 (Phase 1, unchanged) | `docs/reports/reduced-motion-pass.log` |
| Reference preservation | 114/114 reference files untouched (mtime probe: 0 modified during Phase 1 or Phase 2) | §1 of the report |
| Runtime dependencies | **unchanged** across all of Phase 2 — the only package addition is the dev-only `axe-core` | `package.json` |

No runtime dependency was upgraded (Q5 stands), no `npm audit fix --force` was
run, no CMS was introduced, no database was installed for static content, and no
Phase 3 work exists in the codebase.

## 3. Strengths Phase 3 would inherit

- **Parity with the reference is enforced, not hoped for.** A test executes the
  read-only reference catalog itself and compares all 10 categories × 3 locales
  field by field. A test that executes the *worked* Zod contract and its
  zero-dependency client mirror against 7 valid payloads + 27 malformed mutants.
- **The suite is frozen.** 28 test files / 218 tests with sha256 integrity; a
  future phase cannot quietly delete or hollow out a parity test to make a change
  pass — the suite fails and names the refreeze procedure. (Additions remain
  allowed; the manifest is the frozen set, not a cap.)
- **Performance and accessibility gates fail loudly.** The CWV audit exits
  non-zero on any warm breach of Google's Good thresholds; the a11y scan exits
  non-zero on any serious/critical finding. Both were **proven to fail**, not just
  observed passing.
- **The deployment story is decided on evidence.** One Node process, zero
  environment variables (`grep -rn "process.env" src/` returns nothing), a
  seven-step PostgreSQL runbook for the day a dynamic surface is approved — and a
  documented recommendation (Option A) that makes the deploy a re-host rather than
  a re-verification.
- **The content owner has a rulebook in their own language.** The Persian-primary
  guide documents the golden trilingual rule, the parity lock, the computed
  admissions badge, and the never-break lines — so Phase 3's content requests
  arrive well-formed.

## 4. Gaps and open items (all on record, none hidden)

| # | Item | What it means for the go decision |
|---|---|---|
| 1 | **The fa screen-reader pass was never run.** No screen reader capable of speaking Persian exists on the build machine (NVDA not installed; the only SAPI voices are en-US). Nothing about live read-out — pronunciation, landmark announcements, heading cadence — was verified by ear. | **Not a blocker for the axe gate** (the spec's release gate is the axe scan, which passes). But if the clinic's patients include fa screen-reader users, **this is the highest-value verification still outstanding** — and it is cheap: install NVDA + a fa SAPI voice (e.g. Persian SCT) and run the pass against the frozen baseline. |
| 2 | **The hosting decision is still open** (Phase 2's last undecided item). Option A (Node host + reverse proxy) is recommended; B (managed platform) needs re-verification at the real origin; C (static export) loses image optimization and the status endpoint. | **Blocks the deploy, not Phase 3.** |
| 3 | **No CI runner is attached** to the checked-in workflow (`typecheck → test → build → a11y:scan → cwv`). The gates ran by hand on the local origin. | Acceptable now; a runner should exist before Phase 3's changes start landing, so the gates run on every change rather than on request. |
| 4 | **TLS/HSTS at the real origin** (R-4, Phase 1 row). Budgets were measured on local HTTP by design. | A deploy-time step, documented in `DEPLOYMENT.md` §3.1. |
| 5 | **Polyfill payload ~39 KB gz per cold load** (no browserslist narrowing) — kept deliberately for older-browser support; a clinic's audience is heterogeneous. | Owner-visible; authorizing a narrowing is a one-line config change if a future field metric shows modern browsers only. |
| 6 | **One non-reproduced transient:** a single INP reading of 365 ms on `/nonexistent-page` appeared once across 24 warm page-runs (the other 23 held 40–48 ms, and that page measured 43 ms on both re-runs). | On record, source unattributed, bounded by the gate. Not a blocker; worth re-checking at the real origin. |
| 7 | **Lighthouse score absent** — declined deliberately (its score is a derivative of the five signals the harness measures directly; installing it would add a ~300 MB devDependency tree against Decision A). | Owner may request it; the harness covers it without new dependencies the day a runner exists. |

## 5. The recommendation

**GO — with two pre-conditions, neither of which is Phase 3 work:**

1. **Decide the hosting posture** (Option A recommended) and add TLS + HSTS at the
   real origin per `DEPLOYMENT.md` §3.1/§5. The site is verified; the deploy is a
   re-host.
2. **Run the fa screen-reader pass** on the deployed origin (NVDA + a fa SAPI
   voice) to close item 10's disclosed gap. The axe gate is green and the
   accessibility tree is correct on every route — but the *by-ear* pass is the one
   thing no gate here can substitute for.

**Phase 3 itself: separate decision, not started here.** If the owner authorizes
it, the advised pre-conditions are (a) a CI runner attached so the frozen gates
run on every change, and (b) the doctors data pipeline item addressed early — its
provenance file and the no-publish rule for doctor mobile/national IDs are the
two constraints that most shape the module (Phase 3 items 10 and 11). The frozen
baseline then carries the existing parity guarantees forward: Phase 3 cannot land
a doctors module that silently drops the services parity, the trilingual
completeness, or the performance and accessibility posture Phase 1 and Phase 2
established.

---

### One administrative note for the owner

During the Phase 2 verification sessions the build machine's `C:` drive reached
**0 bytes free** (100% full). This was worked around (the browser profile was
relocated to `D:` and the drives now report free space again) and it **did not
affect any verification result** — every gate named above ran after the
workaround, on the delivered build. It is mentioned because a machine that full
will eventually break a build or a cache write; clearing space on `C:` before the
next phase is cheap insurance.

**That is the end of Phase 2. Phase 3 is not started.**
