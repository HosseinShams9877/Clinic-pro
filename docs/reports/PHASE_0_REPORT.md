# PHASE 0 FINAL REPORT — complete reverse engineering, architecture, documentation & roadmap

> Master spec §17 deliverable · Compliance with the 33 enumerated report points below, and the 18-point
> consistency/safety check of §18.
> **Status: Phase 0 COMPLETE. STOPPING HERE per §19 — awaiting explicit approval before Phase 1.**

---

## §1. Project intent

**1. Intent captured.** Reverse-engineer the clinic reference project at
`D:\New folder\Clinic-pro\پلتفرم`, then design and plan a new production website implemented **only
from the start of the public website through the complete Services section inclusive**, Persian-first,
RTL-first, fully responsive, on a mandatory stack.

**2. Boundary confirmed and operationalized.** In pages: `/` (home), `/services`,
`/services/<slug>` (+ foundations: layout, nav, footer, i18n, tokens). Out: doctors, guide, clinics,
assistant, admission, patient rights, visiting, loan, club, all panels. Edge cases converted to
written rulings, not prose: `docs/website/SERVICES_SCOPE.md` §4 (forms OUT, video omitted, CTA = the
reference's `tel:+983155154000`, header/footer composition per Q4).

## §2. The reverse-engineered reference (facts, verified on disk)

**3. Delivery model.** Zero-build, fully offline static site: 22 HTML pages, 24 JS files (6 083 LOC),
15 CSS files, 31 images, 2 self-hosted fonts (Vazirmatn Variable + Noto Nastaliq), 65-icon inline
sprite; `README.txt` instructs: open `index.html` directly, switch language via header menu or
`?lang=`.

**4. Pages.** All 22 documented with title, body-class, scope key, and panel demo logins:
`docs/website/PAGE_INVENTORY.md` (12 public + 10 panel).

**5. i18n engine.** `data-i18n` / `data-i18n-ph` DOM-capture engine in `main.js`, `window.I18N`
dictionaries, `kh:lang` CustomEvent, `localStorage["kh-lang"]`, DIR map fa/ar→rtl, en→ltr, Persian and
Arabic-Indic digit sets: `docs/knowledge/REFERENCE_SOURCE_ANALYSIS.md`.

**6. Services data model.** 10 categories across 2 groups; floors per category (gen/gyn/uro/ortho/
plastic = 2, aes/eye/ent = 3, endo = −1, anes = 0); `ORDER.surg`, `ORDER.med`; trilingual helper
`t(fa, en, ar)`: `docs/knowledge/CONTENT_INVENTORY.md`, `docs/website/SERVICES_SCOPE.md`.

**7. Doctors.** **66 records** (verified by count of `d(` records in `doctors-data.js`), 12 specialty
categories, record shape `d(photo, faName, enName, arName, [titleFa, titleEn, titleAr], cat, slug)`,
monogram placeholder when `photo: ""`; provenance: official site + `doctors_by_specialty.xlsx` (1405/08),
mobile/national-ID deliberately not published.

**8. Content & provenance.** Verified center facts (phone `+983155154000`, opened ۱۳۹۹, 6 floors, 7
ORs, 66 doctors, 8 anesthesiologists, hours 07:30–20:00, visiting 15:00–16:30, Friday closed) plus
**binding provenance rules** for any future content: `docs/knowledge/CONTENT_INVENTORY.md` §7.

**9. Workflows.** WF-1 language switch, WF-2 services browsing (7 steps), WF-3 home; out-of-scope
WF-4–WF-8 with 6 cross-panel flows: `docs/website/WEBSITE_WORKFLOWS.md`.

**10. Platform map.** The second half (patient/doctor/staff/management surfaces, feature chips, demo
logins, 6 cross-flows, suggested Phase 2–5 order): `docs/website/FUTURE_SCOPE.md`.

**11. Reference risks worth not repeating.** Unscoped appended `vivid.css`; JS layout decisions via
`innerWidth`; duplicated digit helpers; per-page duplicated header/footer; all-65-icons sprite on every
page. Each is countered structurally in the target architecture (§14–§18 below).

## §3. The target architecture (recommendations, documented)

**12. Stack compliance — no silent substitution.** Next.js (App Router) + React + TypeScript strict +
Server Components by default + Route Handlers + Prisma 6 + PostgreSQL (prod) / SQLite (dev+test) +
TanStack React Query v5 + Tailwind with centralized tokens + semantic CSS variables + Zod + Vitest —
each documented with rationale: `docs/knowledge/TECH_STACK_ANALYSIS.md`.

**13. System & folder architecture.** Layered design, 8 principles, ASCII diagram, boundaries table;
`src/modules/<feature>` with the 8-folder contract, `src/core`, `src/components`, `@/*` aliases, 7
anti-rot rules: `docs/architecture/SYSTEM_ARCHITECTURE.md`, `FOLDER_STRUCTURE.md`, `MODULAR_ARCHITECTURE.md`.

**14. App Router strategy.** Route table, root layout's 4 jobs, RSC-vs-client per surface,
`generateMetadata`, request data flow, caching posture, category URL shape (path segments
recommended — Q2): `docs/architecture/NEXTJS_APP_ROUTER.md`.

**15. API & backend.** Thin Route Handlers with an `ApiResult` envelope, Zod at every edge, rich
module **services** as the only Prisma importer, pure `lib` functions (`isAdmissionsOpen`,
`floorLabel`, digit helpers, phone parse): `docs/architecture/API_ARCHITECTURE.md`,
`BACKEND_ARCHITECTURE.md`.

**16. Database & Prisma 6.** Phase-1 models `ServiceGroup`/`ServiceCategory`/`ServiceItem`; **slugs
equal reference ids** (`gen`, `gyn`, …); `Json` trilingual columns parsed by a `LocaleText` Zod schema
with `toView` mapping; seed from reference content + **content-parity regression test**; PG/SQLite
portability constraints: `docs/architecture/DATABASE_ARCHITECTURE.md`, `PRISMA_6_STRATEGY.md`.

**17. React Query v5.** Hierarchical colocated keys (`serviceKeys`), object-form API, suspense
queries, prefetch + `HydrationBoundary`, cache policy table, local state kept out of the cache
(URL/cookie/local state): `docs/architecture/REACT_QUERY_V5_STRATEGY.md`.

**18. Styling system.** `globals.css` → `globalCss/` (tokens, themes, typography, layout, utilities);
**CSS cascade layers** so an appended-skin cannot win by source order; Tailwind bridge reading the same
variables; breakpoint set 640/960/1024/1100/1180: `docs/architecture/GLOBAL_CSS_ARCHITECTURE.md`,
`DESIGN_TOKENS.md` (extraction procedure: copy `style.css :root` **verbatim** into `tokens.css`).

**19. Localization & calendar.** fa canonical, en/ar translations under identical keys, key-completeness
build gate, digit normalization at boundaries, server-side baked `<html lang dir>`, **Solar Hijri:
ISO-8601 Gregorian canonical, Jalali only at a single render-boundary module**, anchor-date tested:
`docs/architecture/LOCALIZATION_AND_CALENDAR.md`.

**20. Responsive architecture.** Mobile-first, RTL-first, no overflow at 320px, capability gating
(reduced-motion, coarse pointer) independent of width, `@container` for tiles, 9-width test matrix ×
2 directions: `docs/architecture/RESPONSIVE_ARCHITECTURE.md`.

**21. SEO / accessibility / security / performance.** HTML-first crawlability, `hrefLang`, structured
data only for what exists; WCAG 2.1 AA with the reference's a11y gaps tabulated and fixed;
no-auth/no-PII posture with CSP, headers, Zod everywhere, rate limiting; CWV release gates:
`docs/architecture/SEO_ACCESSIBILITY_SECURITY.md`.

## §4. Roadmap

**22. Phases 0–5.** Master roadmap with approval protocol, cross-phase invariants, and per-phase files
each holding exactly **15 items**: `docs/roadmap/MASTER_ROADMAP.md` + `PHASES/PHASE_0.md` … `PHASE_4.md`
(Phase 5 covered as outlook in `FUTURE_SCOPE.md`, planning-only).

## §5. Gaps honestly classified

**23. Open questions Q1–Q9**, each with evidence, a recommended default, and the consequence if
unanswered — **Q1 (booking CTA), Q3 (home forms), Q4 (nav links) are the three that can gate Phase 1**:
`docs/reports/OPEN_QUESTIONS.md`.

**24. Technical risks R1–R11**, tiered by impact × likelihood, each with a mitigation already baked
into the architecture and a named residual (scope creep, trilingual drift, PII-in-forms, CSS override
rot, PG/SQLite divergence, RSC boundary rot, perf regression, version churn, Jalali correctness,
provenance violations, single-agent constraint): `docs/reports/TECHNICAL_RISKS.md`.

## §6. Compliance with the process rules

**25. Reference preserved.** 114 files, 10 directories; **mtime probe: 0 files modified after Phase 0
began**; all sample inventories reconcile against disk; no command with write intent was ever used:
`docs/reports/REFERENCE_PRESERVATION_REPORT.md`.

**26. No implementation.** No scaffolding, no package installs/updates/removals, no Prisma schema or
migration, no config changes, no application code. The only artifacts created are documentation: **33
markdown files under `docs/`** plus the root `CLAUDE.md`.

**27. No invented content.** Every service, price-adjacent claim, hour, count, and phone number traces
to a reference file; business/medical rules were never authored. Facts, recommendations, assumptions,
and open questions are labeled throughout (see `REFERENCE_SOURCE_ANALYSIS.md`, `SERVICES_SCOPE.md`,
`OPEN_QUESTIONS.md`).

**28. Placeholders explicitly refused.** No stub pages, fake buttons, dead links, or "coming soon"
stubs for excluded sections — documented as rulings in `SERVICES_SCOPE.md` §4 and enforced via Q4.

**29. Moderation of ambiguity.** Every boundary ambiguity found was inspected, evidenced, and either
ruled (documented) or escalated to an Open Question — **never implemented on assumption**.

**30. Single agent.** No subagent was created, invoked, or delegated to at any point in Phase 0.

**31. Deliverables complete.** §14's full list — 5 knowledge, 5 website, 14 architecture, 6 roadmap,
4 reports documents + root `CLAUDE.md` — all created, none empty.

**32. Consistency check passed.** The 18-point check of §18 below: **18/18 pass**.

**33. STOP.** Per §19, Phase 0 ends here. **Phase 1 does not start until the client gives explicit
approval, ideally with answers to Q1, Q3, Q4.**

---

## §18. Consistency & safety check — 18 points

| # | Check | Result | Evidence |
|---|---|---|---|
| 1 | All §14 deliverable files exist and are non-empty | ✅ | 33 files listed in §26 above |
| 2 | Reference files not modified, deleted, renamed, overwritten, or moved | ✅ | mtime probe = 0 changed files; `REFERENCE_PRESERVATION_REPORT.md` |
| 3 | No scaffolding, installs, schema, migrations, or config changes | ✅ | §26; only `docs/` + `CLAUDE.md` created |
| 4 | No subagents used; single agent only | ✅ | §30 |
| 5 | Scope boundary defined with Services inclusive on both ends | ✅ | `SERVICES_SCOPE.md` §1–§2 |
| 6 | All boundary ambiguities inspected + escalated, never implemented | ✅ | §29; Q1–Q9 |
| 7 | No placeholders or fake functionality for excluded sections | ✅ | §28 |
| 8 | All in-scope functionality accounted for (home + services end-to-end) | ✅ | `SERVICES_SCOPE.md` §3, `PHASE_1.md` items 9–11 |
| 9 | Persian-first and RTL-first govern the architecture | ✅ | `LOCALIZATION_AND_CALENDAR.md`, `RESPONSIVE_ARCHITECTURE.md` |
| 10 | Fully responsive design system documented | ✅ | `RESPONSIVE_ARCHITECTURE.md`, `GLOBAL_CSS_ARCHITECTURE.md` §5 |
| 11 | Mandatory stack documented without silent substitution | ✅ | `TECH_STACK_ANALYSIS.md` |
| 12 | Every claim traced to the reference or labeled as recommendation/assumption | ✅ | §27; provenance rules `CONTENT_INVENTORY.md` §7 |
| 13 | Open questions classified with defaults, not silently decided | ✅ | `OPEN_QUESTIONS.md` Q1–Q9 |
| 14 | Roadmap covers phases 0–5 with 15 items per phase file | ✅ | §22; 5 phase files + master |
| 15 | Cross-document conventions consistent (Q-ids, breakpoints, slugs, module template) | ✅ | one breakpoint set, one Q-namespace, one slug rule across all docs |
| 16 | Risks identified with mitigations | ✅ | `TECHNICAL_RISKS.md` R1–R11 |
| 17 | 33-point report complete and internally consistent | ✅ | this document |
| 18 | STOP condition stated, Phase 1 not started | ✅ | §33 |

---

## Handover package

```
D:\New folder\Clinic-pro\
├─ پلتفرم/                      ← reference, untouched (114 files)
├─ CLAUDE.md                     ← agent operating instructions
└─ docs/
   ├─ knowledge/    (5)  — what the reference is and contains
   ├─ website/      (5)  — pages, nav, workflows, scope, future
   ├─ architecture/ (14) — the target system, end to end
   ├─ roadmap/      (6)  — master + 5 phase files × 15 items
   └─ reports/      (4)  — this report, risks, questions, preservation
```

**Next action belongs to the client:** review this report, answer Q1/Q3/Q4 (any of Q1–Q9 welcome), and
approve `docs/roadmap/PHASES/PHASE_1.md`. Until then — stopped.
