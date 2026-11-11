# PHASE 0 — reverse engineering, architecture, documentation & roadmap

> 15-item program · Status: **delivered** · This file is the audit trail for the documentation phase,
> proving each §13 inspection item was actually performed rather than assumed.

---

| # | Item | Evidence |
|---|---|---|
| 1 | Inventory every reference file (22 pages, 24 JS, 15 CSS, fonts, images) | `ASSETS_INVENTORY.md`, `PAGE_INVENTORY.md` |
| 2 | Read and summarize each of the 24 scripts with role + LOC | `REFERENCE_SOURCE_ANALYSIS.md` (script table) |
| 3 | Map all 22 pages: title, body-class, scope key, panel logins | `PAGE_INVENTORY.md` |
| 4 | Map header/footer nav and all in-page anchors | `NAVIGATION_MAP.md` |
| 5 | Extract the trilingual i18n engine mechanics | `REFERENCE_SOURCE_ANALYSIS.md`, `LOCALIZATION_AND_CALENDAR.md` |
| 6 | Extract the services data model (10 cats, floors, orders) | `CONTENT_INVENTORY.md`, `SERVICES_SCOPE.md` |
| 7 | Verify the doctor count (66) and record shape | `CONTENT_INVENTORY.md` (`d(photo, fa, en, ar, [×3 titles], cat, slug)`) |
| 8 | Document workflows (in-scope and out-of-scope) | `WEBSITE_WORKFLOWS.md` (WF-1…WF-8) |
| 9 | Document the platform second half for later phases | `FUTURE_SCOPE.md` |
| 10 | Define the implementation boundary + edge-case rulings | `SERVICES_SCOPE.md` |
| 11 | Choose and document the target architecture (14 docs) | `docs/architecture/*` |
| 12 | Define the data model and Prisma strategy | `DATABASE_ARCHITECTURE.md`, `PRISMA_6_STRATEGY.md` |
| 13 | Define styling tokens and responsive system | `DESIGN_TOKENS.md`, `GLOBAL_CSS_ARCHITECTURE.md`, `RESPONSIVE_ARCHITECTURE.md` |
| 14 | Raise and classify open questions + risks | `OPEN_QUESTIONS.md` Q1–Q9, `TECHNICAL_RISKS.md` |
| 15 | Verify reference preservation + run the consistency check | `REFERENCE_PRESERVATION_REPORT.md`, `PHASE_0_REPORT.md` §18 |

## Method constraints honored

- **Read-only:** no reference file was modified, deleted, renamed, overwritten, or moved — proven in
  `REFERENCE_PRESERVATION_REPORT.md`.
- **No implementation:** no scaffolding, no installs, no schema, no config, no code files outside
  `docs/`.
- **Single agent:** no subagents were spawned.
- **Honesty of facts:** every claim tagged as verified-from-reference / recommendation / assumption /
  open question; nothing invented.

## Exit gate

The 33-point report (`docs/reports/PHASE_0_REPORT.md`) and the 18-point consistency check
(`docs/reports/PHASE_0_REPORT.md` §18). **STOP** and await explicit client approval (spec §19).
