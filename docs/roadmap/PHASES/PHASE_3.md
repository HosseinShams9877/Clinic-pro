# PHASE 3 — doctors directory and patient guide (post-boundary planning)

> 15 items · **Beyond the implementation boundary** — planned here only so Phase 1's architecture does
> not need rework when it is approved. Not approved, not scheduled.

---

| # | Item | Architects-now so it lands later |
|---|---|---|
| 1 | Doctors module: 66 records, 12 specialty cats, monogram fallback | `modules/doctors` per `MODULAR_ARCHITECTURE.md` §7 |
| 2 | Doctor profile page (`/doctors/<slug>`) with trilingual titles | route table extension, static-friendly |
| 3 | `?cat=` filter behavior the reference's category links rely on | `NAVIGATION_MAP.md` cross-link rule |
| 4 | Category pages under `/services/<slug>` linking to pre-filtered doctors | cross-module flow through services |
| 5 | Guide landing + guide items (`/guide`, `/guide/<slug>`) | `WEBSITE_WORKFLOWS.md` WF-4 |
| 6 | Guide content model (pre-op/post-op instructions per procedure) | `DATABASE_ARCHITECTURE.md` §5 future entities |
| 7 | Clinics page (visiting hours, clinic list) | content-only extension |
| 8 | Search across doctors + guide (only when the UI really exists) | `SEO_ACCESSIBILITY_SECURITY.md` §1.3 |
| 9 | Structured data: `Physician` ×66 + `MedicalProcedure` | schema honesty rule |
| 10 | Doctors data pipeline from the xlsx provenance file | `CONTENT_INVENTORY.md` provenance rules |
| 11 | No-publish fields (mobile, national ID) stay out — documented rule | provenance rule, verbatim |
| 12 | Parity test for doctors vs the reference render | regression pattern from Phase 1 |
| 13 | Loading/empty/error states for every new query | RQ strategy rule |
| 14 | A11y pass: filterable list as a real listbox, not styled divs | §2 fixes pattern |
| 15 | Phase 4 go/no-go review | approval protocol |

## Why it's not Phase 1

`SERVICES_SCOPE.md` §2: the boundary ends at Services. Doctors is heavily cross-linked **into** Services
(category → doctor list), which is exactly why the URL and slug decisions in Phase 1 matter now.
