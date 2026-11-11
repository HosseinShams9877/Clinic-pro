# PHASE 4 — patient services, finance, and the platform (post-boundary planning)

> 15 items · **Beyond the implementation boundary.** The second half of the reference
> (`docs/website/FUTURE_SCOPE.md`) — planned so Phase 1 never blocks it, and so the client can scope
> Phase 5 work with full information. Not approved, not scheduled.

---

| # | Item | Notes |
|---|---|---|
| 1 | Patient-rights + admission + visiting pages (content-only, no forms) | in-scope spirit, out-of-scope boundary |
| 2 | Assistant (insurance) module: coverage list, limited-status semantics | `FUTURE_SCOPE.md` |
| 3 | Loan lead form — **with consent + PII retention design first** | `TECHNICAL_RISKS.md` (localStorage warning) |
| 4 | Club membership form (topics, birth month, tier) | reference demo store `kh-club-members` |
| 5 | Patient/doctor/staff/management panel shells + real auth | replaces the reference's demo logins |
| 6 | Appointment workflow (the reference's booking CTA — see Q1) | must not be a button until it works |
| 7 | File upload (documents, imaging) — size/type/A/V scanning rules | security posture §3.2 |
| 8 | Surveys + feedback loops | `kh-survey-demo-v1` → real store |
| 9 | Staff and management dashboards (operational metrics) | panel map in `FUTURE_SCOPE.md` |
| 10 | CMS decision (Q8) — headless CMS vs module content files | affects every content phase after |
| 11 | Notification layer (SMS for appointments/leads) | Iranian SMS provider, out of current scope |
| 12 | Analytics + consent banner (only when a provider is chosen) | no third-party scripts before then |
| 13 | Full audit logging on any PII-touching endpoint | minimization rule §3.3 |
| 14 | Security review + penetration test before any panel goes live | §3 applied seriously |
| 15 | Long-term roadmap review with the client | resets priorities past this horizon |

## The architectural down-payment Phase 1 makes

The module contract, services-only-Prisma seam, `LocaleText` pipeline, hierarchical query keys, and
cascade-layer CSS are all chosen so the items above are **additive**, not rewrites. That is the reason
they are documented at this depth before a single component exists.
