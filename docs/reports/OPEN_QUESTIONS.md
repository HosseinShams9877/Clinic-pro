# OPEN_QUESTIONS — Q1–Q9, the decisions only the client can make

> Phase 0 deliverable · Reports layer · Every one of these blocks or shapes Phase 1 work. Each carries:
> the question, why it exists (evidence), the recommended default, and what happens if unanswered.
> **Status: all nine answered and approved by the client — see the `**Answer:**` lines below.**

---

## Q1 — What replaces the reference's booking CTA in scope?

**Evidence:** `services.js` sub-service cards link to `tel:+983155154000`; panels promise appointment
booking (out of scope). The Services section must have a next action that is *not* fake.
**Recommendation:** use the phone CTA verbatim (verified contact channel) + a "visiting hours" link.
**If unanswered:** ship the phone CTA — the reference's own choice — and revisit when Phase 4 lands.
**Answer:** Approved. Use the verified phone CTA `tel:+983155154000` as the primary action. Include a
visiting-hours link only if it points to real, implemented, in-scope content; otherwise show the phone
CTA only. (In Phase 1 no in-scope visiting-hours page exists, so the phone CTA is used alone.)

## Q2 — Category URL shape: `/services?cat=gyn` (reference's hash/query behavior) or `/services/gyn`?

**Evidence:** the reference uses `#gyn` hash + `doctors.html?cat=`; services supports
`#surgical`/`#medical` groups.
**Recommendation:** path segments (`/services/gyn`) — better SEO, shareable, and redirects cover the
old hash form (one-time 301). Documented in `NEXTJS_APP_ROUTER.md` §4.
**If unanswered:** path segments proceed as documented; they are reversible via redirect.
**Severity:** low (decision documented; confirm only).

**Answer:** Approved. Path segments (e.g. `/services/gyn`) are canonical. Legacy hash/query URLs are
redirected where applicable, without redirect loops.

## Q3 — Home page forms: the reference's home has two demo forms. In or out?

**Evidence:** `index.html` carries loan + club teasers/forms wired to localStorage demos.
**Recommendation:** **out** — per the boundary, and no fake versions (`SERVICES_SCOPE.md` §4).
**If unanswered:** out (the no-placeholders rule makes this the default).
**Severity:** medium — affects home composition (item 11).

**Answer:** Approved. Exclude both demo forms (loan and club) from the homepage; do not reproduce their
localStorage demo behavior and do not replace them with fake forms.

## Q4 — Header/footer links to out-of-scope pages (doctors, guide, clinics…): show, hide, or stub?

**Evidence:** the reference's nav has 9 top items, 12 sub-items, 7 staff links; only Services is in scope.
**Recommendation:** show only in-scope items; hide out-of-scope entries until their phase ships (nav
parity returns in Phase 3).
**If unanswered:** hide — showing dead links violates the no-fake-links rule; showing "coming soon"
stubs violates the no-placeholders rule.
**Severity:** high — this is the one place the boundary visibly cuts; needs a client nod.

**Answer:** Approved. Show only navigation items that lead to implemented, in-scope destinations. Hide
links to out-of-scope pages until their phases ship. No dead links, fake links, placeholder
destinations, or "coming soon" pages.

## Q5 — Exact versions: Next.js 15 / React 19 vs the current stable line?

**Evidence:** the spec mandates App Router + RSC but not versions; App Router semantics differ across
minor versions (caching defaults especially).
**Recommendation:** pin the latest stable 15.x/19.x at Phase 1 start; record in `TECH_STACK_ANALYSIS.md`.
**If unanswered:** latest stable, pinned and documented at install time.
**Severity:** low-medium.

**Answer:** Approved. Use compatible stable Next.js 15.x / React 19.x releases available at Phase 1
implementation time; pin exact versions in the lockfile and document them in `TECH_STACK_ANALYSIS.md`.
No silent major-version upgrades.

## Q6 — Tailwind v4 vs v3?

**Evidence:** v4's CSS-first config changes the token bridge (`GLOBAL_CSS_ARCHITECTURE.md` §2 shows a
v4-style layer import; the config snippet is v3-shaped).
**Recommendation:** v4 with `@import "tailwindcss" layer(utilities)` — matches the cascade-layer
strategy that prevents the reference's `vivid.css` failure mode.
**If unanswered:** v4, documented as above.
**Severity:** low.

**Answer:** Approved. Use Tailwind CSS v4 with the CSS-first configuration and cascade-layer strategy.
Any v3-style examples in architecture documentation are updated to match the actual v4 implementation.

## Q7 — i18n library vs hand-rolled?

**Evidence:** the reference hand-rolls a capture engine; the spec mandates server-side locale but no
library.
**Recommendation:** a minimal hand-rolled catalog (fa canonical + en/ar siblings) — the surface is 3
locales with static content; a library buys little and adds a dependency to audit.
**If unanswered:** hand-rolled per `LOCALIZATION_AND_CALENDAR.md` §2.
**Severity:** low.

**Answer:** Approved. Use a minimal hand-rolled localization catalog: Persian (`fa`) canonical, English
(`en`) and Arabic (`ar`) as sibling locales, following the documented server-side locale, direction, and
RTL strategy. No i18n dependency added.

## Q8 — CMS now or module content files?

**Evidence:** Phase 1's catalog is ~10 records of trilingual structured content; editors are medical
staff, not developers.
**Recommendation:** module content files + seed scripts in Phase 1 (with the key-completeness gate);
revisit a headless CMS in Phase 4 when non-developer editing volume justifies it.
**If unanswered:** content files proceed.
**Severity:** low (Phase 1), high (Phase 4 planning).

**Answer:** Approved. Use structured module content files and seed scripts for Phase 1, with the
documented content-key completeness checks enforced. No CMS in Phase 1; revisit during Phase 4 planning.

## Q9 — The "vivid" skin: port, drop, or make optional?

**Evidence:** `assets/css/vivid.css` is an unscoped override appended last — architecturally the pattern
that breaks, regardless of taste in the look.
**Recommendation:** do **not** port the pattern; if the client loves the look, implement it as
`[data-theme="vivid"]` inside `themes.css` (`GLOBAL_CSS_ARCHITECTURE.md` §7).
**If unanswered:** drop it; revisit on request.
**Severity:** low.

**Answer:** Approved. Do not port the unscoped `vivid.css` override. The vivid skin is dropped for the
initial implementation; if requested in a future phase it is implemented only as a properly scoped
`[data-theme="vivid"]` theme inside the centralized theme architecture.

## Resolution protocol

1. Client answers in this file (append a `**Answer:**` line under each Q).
2. Any answer that contradicts a documented recommendation triggers an update to the affected
   architecture doc(s) — not a silent deviation.
3. Q1, Q3, Q4 are the three that can block Phase 1 start; the rest have safe documented defaults.
