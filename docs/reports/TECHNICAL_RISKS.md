# TECHNICAL_RISKS — what can go wrong, and what Phase 0 did about it

> Phase 0 deliverable · Reports layer · Ranked by impact × likelihood. Each risk carries a **mitigation
> already baked into the architecture** and a **residual** we accept.

---

## Tier 1 — must manage actively

### R1. Scope creep past the Services boundary
**Impact: high · Likelihood: high.** The reference's 22 pages are densely cross-linked; doctors,
assistant, loan, and the panels all sit one click away and every stakeholder will want "just that one
page."
**Mitigation:** the boundary is documented as rulings, not prose (`SERVICES_SCOPE.md` §4 edge table);
nav composition is pre-decided (Q4); the no-placeholders rule is operationalized; approval protocol
gates each phase.
**Residual:** client pressure in Phase 1 review. Owner: client.

### R2. Trilingual content drift
**Impact: high · Likelihood: medium.** fa is canonical; en/ar translate. Reference ships complete
dictionaries (~1 000 keys) because the entire site is translated. Any gap shows as raw keys or blank
text.
**Mitigation:** build-failing key-completeness test; `LocaleText` Zod schema at every crossing;
content-parity test across the 10 categories × 3 locales (`LOCALIZATION_AND_CALENDAR.md` §9).
**Residual:** new content arriving unreviewed. Mitigated by workflow, not architecture.

### R3. PII handling when forms arrive (Phase 4)
**Impact: high · Likelihood: medium (later).** The reference's demos **store phone numbers in
localStorage in plain text** (`kh-loan-leads`, `kh-club-members`). Replicating that pattern in a real
deployment leaks PII on shared devices and has no retention path.
**Mitigation:** Phase 1 stores nothing user-related; the rule is written down before the first form
exists (`SEO_ACCESSIBILITY_SECURITY.md` §3.3; `PHASE_4.md` item 3 puts consent + retention design
**before** implementation).
**Residual:** none in Phase 1 — this is a future-phase discipline, here documented.

## Tier 2 — structural risks

### R4. CSS override pattern (the `vivid.css` lesson)
**Impact: medium · Likelihood: high without action.** One unscoped appended file re-skinned the whole
reference — proving the cascade had no defenses.
**Mitigation:** explicit CSS cascade layers so source order can never silently win; themes live as
selectors inside `themes.css`, never as new files (`GLOBAL_CSS_ARCHITECTURE.md` §2, §7).
**Residual:** a developer can still write `!important` outside layers — review checklist item §9.

### R5. Prisma + SQLite/PostgreSQL divergence
**Impact: medium · Likelihood: medium.** Dev on SQLite, prod on PG: type mismatches (Json storage,
case sensitivity, `PRAGMA` differences) surface only in prod.
**Mitigation:** portability constraints written up front (`DATABASE_ARCHITECTURE.md` §1); only
ANSI-compatible types; a CI check can run the seed + parity test against PG in a container at Phase 2.
**Residual:** any raw SQL added later is an immediate review blocker.

### R6. Server/Client component boundary rot
**Impact: medium · Likelihood: medium.** The living layer is interactive; the catalog is static. Easy
mistakes: shipping the catalog as client state (bundle), or breaking interactivity by accident.
**Mitigation:** RSC-by-default table per route (`NEXTJS_APP_ROUTER.md` §4); enhancement is an explicit
client *island*; React Query used only where justified (`REACT_QUERY_V5_STRATEGY.md` §1).
**Residual:** ongoing review discipline; bundle budget in CI.

### R7. Performance regression vs the zero-build reference
**Impact: medium · Likelihood: medium.** The reference has no framework and no network requests; users
experience it as instant. A Next.js app can feel slower if JS grows.
**Mitigation:** CWV targets as release gates (`SEO_ACCESSIBILITY_SECURITY.md` §4); 65-icon sprite →
tree-shaken `Icon`; fonts self-hosted; lazy living layer.
**Residual:** real measurement happens in Phase 1; budget set now, enforced then.

## Tier 3 — known-unknowns

### R8. Tailwind v4 / Next 15 version churn at Phase 1 start
**Impact: low-medium · Likelihood: high.** Both are on moving minor versions (Q5, Q6).
**Mitigation:** pin exact versions at install; document the decision in `TECH_STACK_ANALYSIS.md`.
**Residual:** one upgrade pass per phase, planned not panicked.

### R9. Jalali conversion correctness
**Impact: high if wrong · Likelihood: low.** A wrong leap-year rule silently misdates everything.
**Mitigation:** one conversion module behind a seam; pinned anchor-date tests (۱۳۹۹ opening ↔ 2020);
library test suite as a lower layer, never the only one.
**Residual:** none worth deeper action.

### R10. Doctor-data provenance violations
**Impact: high (legal/privacy) · Likelihood: low.** The reference deliberately does **not** publish
mobile numbers or national IDs (header note in `doctors-data.js`).
**Mitigation:** the rule is carried into the Phase 3 plan (`PHASE_3.md` item 11) and into the
provenance rules table (`CONTENT_INVENTORY.md` §7).
**Residual:** a future hand-import bypassing the rules — the seed script is the only sanctioned path.

### R11. Single-agent execution constraint
**Impact: low-medium · Likelihood: medium.** All work flows through one agent; large parallelizable
work (12 screener pages) is serialized by the spec itself.
**Mitigation:** documented in `MASTER_ROADMAP.md` §5; phase sizing accounts for it.
**Residual:** schedule risk only — acceptable, spec-mandated.

## Summary table

| # | Risk | Tier | Phase concerned | Mitigation doc |
|---|---|---|---|---|
| R1 | scope creep | 1 | 1→all | `SERVICES_SCOPE.md`, `MASTER_ROADMAP.md` |
| R2 | trilingual drift | 1 | 1→2 | `LOCALIZATION_AND_CALENDAR.md` |
| R3 | PII in forms | 1 | 4 | `SEO_ACCESSIBILITY_SECURITY.md` §3.3 |
| R4 | CSS override rot | 2 | 1 | `GLOBAL_CSS_ARCHITECTURE.md` §2 |
| R5 | PG/SQLite divergence | 2 | 1→2 | `DATABASE_ARCHITECTURE.md` §1 |
| R6 | RSC/Client rot | 2 | 1 | `NEXTJS_APP_ROUTER.md`, RQ strategy |
| R7 | perf regression | 2 | 1→2 | SEO doc §4 |
| R8 | version churn | 3 | 1 | Q5/Q6 |
| R9 | Jalali correctness | 3 | 1 | L&C §5, §9 |
| R10 | provenance violations | 3 | 3 | `CONTENT_INVENTORY.md` §7 |
| R11 | single-agent constraint | 3 | all | `MASTER_ROADMAP.md` §5 |
