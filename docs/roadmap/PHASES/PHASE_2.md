# PHASE 2 — content operations, hardening, and handover polish

> 15 items · Planning only — begins after Phase 1 sign-off. Purpose: make the shipped boundary
> **maintainable by content owners**, not just correct once.

---

| # | Item | Rationale |
|---|---|---|
| 1 | Trilingual content editing workflow (fa canonical, en/ar sibling files + key-completeness gate) | `LOCALIZATION_AND_CALENDAR.md` §2 |
| 2 | Seed/reseed scripts as the single data-entry path for the catalog | `PRISMA_6_STRATEGY.md` §5 |
| 3 | Content-parity test extended to all 10 categories × 3 locales | `DATABASE_ARCHITECTURE.md` §4 |
| 4 | 404 / error pages in fa/RTL | SEO + a11y completeness |
| 5 | Print stylesheet (the reference's `i-print` waits to be real) | `ASSETS_INVENTORY.md` icon note |
| 6 | Dark-mode audit and token re-tuning if the client uses it | `DESIGN_TOKENS.md` §5 |
| 7 | Decide the vivid skin (Q9) — port as a theme variant or drop | `GLOBAL_CSS_ARCHITECTURE.md` §7 |
| 8 | Image pipeline pass: `sizes`, AVIF/WebP variants, LCP audit | `RESPONSIVE_ARCHITECTURE.md` §6 |
| 9 | Bundle/JS audit vs the reference's snappiness | `TECHNICAL_RISKS.md` |
| 10 | Accessibility audit round 2 (screen-reader passes, fa with NVDA) | `SEO_ACCESSIBILITY_SECURITY.md` §2.5 |
| 11 | Lighthouse / CWV budget enforced in CI | §4 perf targets |
| 12 | Deployment story (static vs Node, PG provisioning) | `BACKEND_ARCHITECTURE.md` runtime posture |
| 13 | Documentation handover for content owners (non-developer guide) | maintainability mandate |
| 14 | Regression suite frozen as the Phase 3 baseline | future phases must not break parity |
| 15 | Phase 3 go/no-go review with the client | approval protocol |

## Non-goals persist

No new features beyond the boundary; every item above polishes or proves what Phase 1 shipped.
