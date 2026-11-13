# CLAUDE.md — operating instructions for the Clinic website project

> Read this **before doing anything** in `D:\New folder\Clinic-pro`.

## 1. What this project is

A clinic website rebuild. The reference project (a zero-build static trilingual site) lives at
`پلتفرم/` and is the **source of truth for all content and visual identity**. The new site is planned
in `docs/` and is **not yet built**.

## 2. Non-negotiable rules

1. **Never modify, delete, rename, overwrite, or move anything inside `پلتفرم/`.** It is read-only for
   the lifetime of the project. Phase gates re-verify this by mtime probe
   (`docs/reports/REFERENCE_PRESERVATION_REPORT.md`).
2. **Do not invent content** — no services, prices, medical facts, hours, or doctor data that is not
   in the reference. Provenance rules: `docs/knowledge/CONTENT_INVENTORY.md` §7.
3. **One agent only.** Do not spawn, invoke, or delegate to subagents.
4. **Implementation boundary: the public website from the start through the complete Services section,
   inclusive.** Rulings for edge cases: `docs/website/SERVICES_SCOPE.md` §4. No stub pages, fake
   buttons, or dead links for anything beyond it.
5. **Persian-first, RTL-first, fully responsive — always.** fa is canonical; en/ar translate
   (`docs/architecture/LOCALIZATION_AND_CALENDAR.md`).
6. **Mandatory stack** (no silent substitution): Next.js App Router + React + TS strict + Server
   Components by default + Route Handlers + Prisma 6 + PostgreSQL (prod) / SQLite (dev+test) +
   TanStack React Query v5 + Tailwind with centralized tokens + Zod + Vitest.
7. **Visual Fidelity Standard: Every new UI element, page, or component built in any future phase
   MUST match the read-only reference (پلتفرم/) exactly in style, spacing, curves, and animations.
   No improvisation or 'better' redesigns are allowed.** This is binding exactly like the Q1–Q9
   decisions (`docs/reports/OPEN_QUESTIONS.md`) and is enforced at every release gate
   (`docs/reports/EXACT_VISUAL_AND_UI_FIDELITY_REPORT.md`).

## 3. Where things are

| Need | Read |
|---|---|
| the scope boundary | `docs/website/SERVICES_SCOPE.md` |
| what content exists | `docs/knowledge/CONTENT_INVENTORY.md`, `ASSETS_INVENTORY.md` |
| how to build X | `docs/architecture/*` (start with `FOLDER_STRUCTURE.md`, `MODULAR_ARCHITECTURE.md`) |
| the plan / next task | `docs/roadmap/MASTER_ROADMAP.md` + `PHASES/PHASE_1.md` |
| open decisions | `docs/reports/OPEN_QUESTIONS.md` (Q1–Q9) |
| risks | `docs/reports/TECHNICAL_RISKS.md` |
| what was decided in Phase 0 | `docs/reports/PHASE_0_REPORT.md` |

## 4. Current state

**Phase 1 delivered (2026-11-10): ACCEPTED WITH DOCUMENTED LIMITATIONS.** The public website
through the complete Services section is built and verified; the full account is
`docs/reports/PHASE_1_REPORT.md` (§12.1 records the owner review). R-2 (npm audit advisories)
ACCEPTED per owner decision 2026-11-10; R-6 (a11y) CLOSED with observed evidence — axe 72/72
zero findings, keyboard-only 24/24, reduced-motion 24/24 (logs in `docs/reports/`).
**Phase 2 delivered (2026-11-11): all 15 items complete.** The full account is
`docs/reports/PHASE_2_REPORT.md`; the client review deliverable is
`docs/reports/PHASE_3_GO_NO_GO.md`. Every spec-mandated gate was observed green on
the delivered build (tsc 0, vitest 29/222, build success, axe 78/78 zero findings,
CWV 8/8 warm in budget, runtime deps unchanged, `پلتفرم/` 0/114 changed). One
disclosed gap: the fa screen-reader pass was unobservable on the build machine
(no fa-capable screen reader). One owner decision open: the hosting posture
(`docs/architecture/DEPLOYMENT.md` §5). **UI fix pass delivered (2026-11-11):
owner-reported bugs B-1…B-6 fixed or audited-clean with regression tests in
place — the full account is `docs/reports/UI_FIX_PASS_REPORT.md`; the Phase 2
baseline was refrozen (29 files/222 tests) with the reason recorded in
`docs/reports/PHASE_2_BASELINE.md` §"Refreeze record".** Phase 3 is NOT
approved — do not start it.

## 5. Conventions that bind all future work

- Slugs = reference ids (`gen`, `gyn`, …). Breakpoints: 640 / 960 / 1024 / 1100 / 1180.
- Dates: ISO-8601 Gregorian canonical; Jalali only at the render boundary.
- Only `modules/*/services` import Prisma. Zod at every API edge. Business logic never in a
  Route Handler.
- CSS cascade layers, semantic tokens only — no appended-skin files (the `vivid.css` lesson).
- Reference content is *copied* into `modules/*/content` with provenance recorded; the reference file
  stays untouched.
- Every spec-mandated gate (a11y, SEO, security, parity, no-overflow-at-320px) is a release gate, not
  a nicety (`docs/architecture/SEO_ACCESSIBILITY_SECURITY.md` §5).
- If a task appears to require editing the reference or exceeding the boundary: **stop and ask**.
