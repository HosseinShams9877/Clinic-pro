# PHASE 1 — foundation, home, and the complete Services section

> 15 items · **The implementation boundary.** Nothing here starts before the client approves the Phase 0
> handover and answers Q1–Q9 (`docs/reports/OPEN_QUESTIONS.md`).

---

| # | Item | Traces to |
|---|---|---|
| 1 | Scaffold Next.js App Router + TS strict; set up `src/` tree, aliases, config | `FOLDER_STRUCTURE.md` |
| 2 | Extract `tokens.css` verbatim from `assets/css/style.css :root`; semantic layer + Tailwind bridge | `DESIGN_TOKENS.md` §7, `GLOBAL_CSS_ARCHITECTURE.md` |
| 3 | Build the locale pipeline (fa default, cookie + URL override) and message catalogs fa/en/ar | `LOCALIZATION_AND_CALENDAR.md` |
| 4 | Root layout: `<html lang dir>`, fonts, skip link, header, footer | `NEXTJS_APP_ROUTER.md` §3 |
| 5 | Header + footer parity with the reference, links restricted to in-scope destinations (approved Q4) | `NAVIGATION_MAP.md` |
| 6 | i18n + digit + Jalali core modules with unit tests | `LOCALIZATION_AND_CALENDAR.md` §4–5 |
| 7 | Catalog as trilingual module content files (`modules/services/content`) + Zod schemas + key-completeness gate — **no database dependency in Phase 1 (REC-1)**; Prisma schema stays documented for a later phase | `DATABASE_ARCHITECTURE.md` §2, `PRISMA_6_STRATEGY.md` |
| 8 | services module: content, schemas, lib, services (pure, no Prisma), queries | `MODULAR_ARCHITECTURE.md` §3 |
| 9 | `/services` page: group sections, category cards (tabs pattern), floor labels, sub-service grid; **no doctors cross-links (REC-3)** | `SERVICES_SCOPE.md`, `CONTENT_INVENTORY.md` |
| 10 | `/services/<slug>` detail per approved Q2: benefits, floor, `tel:` CTA alone per Q1 | `SERVICES_SCOPE.md` §3 |
| 11 | Home page composition: hero, stats, help, services bento teaser, care banner, patient-steps, why-us, contact — **loan/club sections dropped (REC-7)** | `MODULAR_ARCHITECTURE.md` §6 |
| 12 | Living layer islands (particles, scroll progress, count-up, reveal) gated on reduced-motion + pointer | `RESPONSIVE_ARCHITECTURE.md` §7 |
| 13 | React Query set-up, scoped to its one genuine use: **live open/closed badge polling `GET /api/status` every 60 s while visible** (category switching is static route navigation, not client fetch) | `REACT_QUERY_V5_STRATEGY.md` |
| 14 | SEO pack: metadata, hrefLang, sitemap, structured data for the 10 categories | `SEO_ACCESSIBILITY_SECURITY.md` §1 |
| 15 | Test suite + gates: parity test vs reference, axe, responsive matrix, security headers, CWV | `SEO_ACCESSIBILITY_SECURITY.md` §5 |

## Explicit non-goals (do not build, do not placeholder)

doctors directory · guide · clinics · assistant/insurance · loan/club forms **or their teaser
sections (REC-7)** · panel logins · video (the reference itself shows only "coming soon") · any search
UI · any CMS UI · any database/Prisma wiring (REC-1) · any doctors cross-links (REC-3).

## Decisions baked in (from approved Q1–Q9)

Q1 phone CTA alone · Q2 path-segment category URLs (+ legacy hash redirects, loop-free) · Q3/Q4/REC-7
loan & club dropped, nav in-scope-only · Q5 Next 15.x / React 19.x pinned at install · Q6 Tailwind v4
CSS-first · Q7 hand-rolled catalog · Q8 content files, no CMS · Q9 no unscoped vivid skin.

## Exit gate

Content parity with the reference on all 10 categories; zero serious axe findings; no overflow at
320px in both directions; all gates from `SEO_ACCESSIBILITY_SECURITY.md` §5 passing; client sign-off.
