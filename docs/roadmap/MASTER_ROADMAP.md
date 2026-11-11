# MASTER_ROADMAP — phases, deliverables, and gates

> Phase 0 deliverable · Roadmap layer · Governs the whole project. **Phase 0 is documentation-only;
> nothing here may start before the client approves it (spec §19).**

---

## 0. The boundary, restated

Build runs **from the start of the public website through the complete Services section — inclusive**
(`SERVICES_SCOPE.md` §1). Everything after that (doctors directory, guide, clinics, assistant, loan,
club, platform panels) is scoped, documented, and deliberately unbuilt.

## 1. Phase overview

| Phase | Name |(end) Artifact | Gate | Status |
|---|---|---|---|---|
| **0** | Reverse-engineering, architecture, documentation & roadmap | this docs set + 33-point report | 18-point consistency check + client approval | **delivered and approved — Q1–Q9 answered** |
| **1** | Foundation + home + Services | a running Next.js app: i18n, tokens, layout, `/`, `/services`, `/services/<slug>`, content-parity | a11y/SEO/security/perf gates + content parity with the reference | **delivered — COMPLETED WITH DOCUMENTED LIMITATIONS** (`PHASE_1_REPORT.md`, 2026-11-10) |
| **2** | Content operations & hardening | seed scripts, CMS-less editing workflow, edge cases, polish | parity test on all 10 categories, zero gate findings | **delivered — all 15 items complete; every gate observed green** (`PHASE_2_REPORT.md`, 2026-11-11; one disclosed gap: the fa screen-reader pass was unobservable on the build machine; one owner decision open: the hosting posture) |
| **3** | Doctors & guide (beyond the boundary) | — | — | documented in `FUTURE_SCOPE.md` only |
| **4** | Patient-facing services (assistant, admission, rights) | — | — | documented in `FUTURE_SCOPE.md` only |
| **5** | Platform & financial (panels, loan, club) | — | — | documented in `FUTURE_SCOPE.md` only |

Phases 2–5 are **planned, not approved.** Phases 3–5 exceed the implementation boundary; they exist in
this roadmap so architecture decisions in Phase 1 do not paint the project into a corner. Phase 2 was
approved 2026-11-10 and delivered 2026-11-11; **Phase 3 remains unapproved and not started** — the
go/no-go review deliverable is `docs/reports/PHASE_3_GO_NO_GO.md`.

## 2. What Phase 0 handed over

- **Evidence:** reference structure, all 22 pages, 24 scripts, 15 CSS files, 31 images + 2 fonts + 65
  icons, content inventories, workflows (`docs/knowledge/`, `docs/website/`).
- **Architecture:** the full target system across 14 documents (`docs/architecture/`).
- **Decisions made + open:** Q1–Q9 catalogued in `OPEN_QUESTIONS.md`; risks in `TECHNICAL_RISKS.md`.
- **Preservation proof:** `REFERENCE_PRESERVATION_REPORT.md`.

## 3. Phase 1 shape (the approved-scope build)

```
Week A  foundation  →  repo, tokens, i18n, layout, navigation, footer, a11y baseline
Week B  content     →  services module (10 categories) as content files + Zod + content-parity test
Week C  surfaces    →  home page, /services, /services/<slug>, living layer, RQ live-badge island
Week D  hardening   →  SEO, security headers, responsive matrix, test suite, gates
```

Every task below traces to an architecture document; every gate traces to
`SEO_ACCESSIBILITY_SECURITY.md` §5.

**Phase 1 deviations from the Week-B/C drafts, reconciled and documented (see
`PHASE_1_REPORT.md` for the outcome):**

- **REC-1 — no Prisma/DB in Phase 1.** The static catalog lives in
  `src/modules/services/content` behind Zod; the `DATABASE_ARCHITECTURE.md` schema stays the documented
  plan for the phase that adds dynamic editing. Rationale: master execution prompt + approved Q8.
- **REC-2 — React Query scoped to one genuine use.** The live open/closed badge polling
  `GET /api/status` every 60 s while visible. The `/api/services` catalog handler is dropped (no
  consumer; category switching is static route navigation).
- **REC-3 — doctors cross-links not rendered** (approved Q4 forbids links to unimplemented
  destinations).
- **REC-4 — the reference's dead `#international` link dropped** (verified: the anchor does not exist
  in the reference either).
- **REC-7 — loan/club home sections dropped entirely** (approved Q3; their whole purpose is the
  excluded lead form).

## 4. Roadmap of the roadmap (per-phase detail)

| File | Contents |
|---|---|
| `PHASES/PHASE_0.md` | 15 items — the documentation program just completed (the audit trail) |
| `PHASES/PHASE_1.md` | 15 items — foundation → home → services, the implementation boundary |
| `PHASES/PHASE_2.md` | 15 items — content ops, hardening, and pre-handover polish |
| `PHASES/PHASE_3.md` | 15 items — doctors + guide (post-boundary, planning only) |
| `PHASES/PHASE_4.md` | 15 items — patient services & finance/panels (post-boundary, planning only) |

Phase 5 (platform) is covered as outlook in `docs/website/FUTURE_SCOPE.md`; a separate phase file is
not required by §14 and adding one would imply approval this roadmap does not have.

## 5. Cross-phase invariants (never renegotiated per phase)

1. Persian-first, RTL-first, fully responsive — every phase ships both directions.
2. Reference files remain the source of truth; new content needs provenance
   (`CONTENT_INVENTORY.md` §7).
3. The mandatory stack (Next.js App Router, TS strict, Prisma 6, PG/SQLite, React Query v5, Tailwind
   tokens, Zod, Vitest) — no silent substitution (spec, `TECH_STACK_ANALYSIS.md`).
4. No invented content, no placeholders for out-of-scope features, no fake buttons.
5. Server Components by default; enhancement explicit.
6. Only ONE agent works on this project; no subagent delegation without, and only for, an explicit
   client request.

## 6. Approval protocol

```
Phase 0 complete → STOP → client review (this docs set + OPEN_QUESTIONS.md)
  → answers to Q1–Q9 → approval of PHASE_1.md → Phase 1 starts
Phase 1 complete → gates + parity → client review → sign-off → Phase 2…
```

No phase begins on momentum. Each begins with an explicit go.
