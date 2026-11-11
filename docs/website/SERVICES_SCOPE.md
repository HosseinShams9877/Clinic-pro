# SERVICES_SCOPE — the exact Phase 1 implementation boundary

> Phase 0 deliverable · Website layer · **This document is the contract for what "through the complete
> Services section" means.** Authority: master specification §6 + the reference project.

---

## 1. The boundary, one sentence

**Implement the public website from the top of the home page (`/`) through the end of the complete
Services section (`/services` and its categories), and nothing after it.**

## 2. IN scope

### 2.1 Pages
- `/` — the home page, in full (hero, stats, help cards, services bento, care banner, patient-steps
  accordion, why-us, contact block) — see §3 for the two home **forms** (dropped per Q3).
- `/services` — the complete services section:
  - the two service groups («خدمات جراحی», «خدمات پزشکی») with the client-specified order;
  - all 10 categories, each with name + description + **floor** + 3 benefits + 3–5 sub-services
    (full table in `CONTENT_INVENTORY.md` §3);
  - category switching with shareable URLs — **path segments `/services/<slug>`, per approved Q2**;
  - the reference's «پزشکان این بخش» cross-link: **not rendered in Phase 1** — its destination is out
    of scope and approved Q4 forbids links without an implemented destination (see §3 and §5).

### 2.2 Capabilities required for those pages
- Trilingual i18n (fa/en/ar), Persian-first and RTL-first, with full coverage of all in-scope strings.
- Responsive at 1180 / 1024 / 640 (+ 1100 / 960), mobile-first.
- No-JS completeness (Server Components carry the content; enhancement never gates availability).
- `prefers-reduced-motion` + `pointer: fine` capability gating for any motion.
- SEO: per-page metadata, canonical URLs, open-graph, semantic HTML, sitemap + robots for in-scope routes.
- Accessibility: landmarks, focus styles, live regions, contrast ≥ AA, keyboard-operable tabs.
- Design tokens + Tailwind setup + theme-ability (light/dark), fonts (Vazirmatn, Nastaliq for slogan).
- Contents of the reference's header/footer **restricted to in-scope links** (§4).
- The icon set used by in-scope content, as a component (`ASSETS_INVENTORY.md` §3).

### 2.3 Foundation built *because* the in-scope pages need it
- Project scaffold (Next App Router, TS strict), tokens, i18n plumbing, Zod schemas for content,
  the catalog as **trilingual module content files with Zod validation and a key-completeness gate**
  (approved Q8; no database dependency in Phase 1 — see the note below), React Query setup for the one
  client-server surface that needs it (the live open/closed badge, item 13), Vitest setup, CI-light.
  (See `MASTER_ROADMAP.md` — the quantity of the foundation is kept proportional: build what the
  boundary needs, not the whole platform.)

> **Prisma in Phase 1 — deferred by reconciliation (REC-1).** The catalog is static trilingual content
> with no editing surface in Phase 1, so — per the master execution prompt ("Use Prisma 6 only where
> the actual Phase 1 scope requires database persistence. Do not create an unnecessary database
> dependency for static website content") combined with approved Q8 (module content files) — Phase 1
> stores the catalog in `src/modules/services/content` validated by Zod, and wires **no** Prisma/DB.
> The `ServiceGroup`/`ServiceCategory`/`ServiceItem` schema in `DATABASE_ARCHITECTURE.md` §2 remains
> the documented plan for the phase that introduces dynamic editing.

## 3. Edge cases on the boundary — ruled

| Item | Ruling |
|---|---|
| Home **loan-lead form** (`.ln-form`, `kh-loan-leads`) | **OUT, section dropped entirely (REC-7).** Approved Q3 excludes the demo form; the section's entire purpose is the lead form, so shipping a form-less remnant would be a teaser for an excluded feature. The whole `#loan` block is omitted. |
| Home **loyalty-club form** (`.cb-form`, `kh-club-members`) | **OUT, section dropped entirely (REC-7)** — same reasoning; the whole `#club` block is omitted. |
| Home CTA → booking (`patient-panel.html?go=new`) | **OUT** (patient panel). Per approved Q1, the in-scope CTA is the phone (`tel:+983155154000`), exactly as the reference's own services cards do. Repeated on every surface where the reference showed a booking button. |
| Header/footer links to excluded pages | **Decided by approved Q4 (REC-3 context):** only links whose destination is implemented and in scope are rendered. No dead links, no fake pages, no "coming soon". |
| Category video (`#sdVideo`) | Reference ships no video; shows a "coming soon" toast. Rebuild: **omit the video control entirely**; do not build a placeholder video player. (If the center later supplies videos, that's post-Phase-1.) |
| Doctors cross-links («پزشکان این بخش») | **Not rendered in Phase 1 (REC-3).** Q4 (the later, more specific client decision) forbids links to unimplemented destinations, which overrides the earlier "render as link" note. The doctors pages remain OUT. |
| Services «اونلاین» / `#international` link | **Dropped (REC-4).** Verified: `index.html` contains no `#international` anchor, so the reference's `sv2.online` link is dead *in the reference itself*. Per Q1, the sask strip keeps the `tel:` CTA and its three info items only. |
| Guide/club/loan **teaser sections** on home | Guide: the `#steps` patient-process accordion ships as **static content** (its outbound links to `guide.html`/`patient-panel.html` are removed per Q4). Loan/club teasers: **dropped** (see above). The reference has no "international" section (verified) — nothing to port. |
| Admin/panel features | OUT — no scaffolding, no routes, no fake logins. |

## 4. Header & footer composition in scope — **decided by approved Q4**

**IN (rendered):** brand, خانه, خدمات (+ 2 group sublinks), تماس با ما (in-page anchor), language
switcher, burger menu.
**OUT (links removed, not faked):** درباره ما subs, پزشکان, راهنمای بیماران subs, راهنمای هوشمند,
بیماران بین‌الملل, staff shortcut, booking CTA, and all 7 footer staff links.
**Footer:** brand + contact column + ساعات کاری + phone verbatim; the "بخش‌ها"/"دسترسی سریع" columns
link to out-of-scope pages → keep only links pointing to in-scope targets and drop the rest (Q4).
**Booking CTA replacement:** the reference's «نوبت و مشاوره» header button and every booking button are
replaced by the phone CTA per Q1.

## 5. The no-placeholders rule, operationally

> From the master specification: do not create placeholder pages or fake functionality for excluded
> sections; no fake buttons/links to excluded features.

Concretely, in Phase 1:
- No route, page, or component exists for anything past the boundary except as **documentation**.
- Every link rendered in the in-scope pages resolves to a real, implemented target or a real external
  target (`tel:`, maps, social).
- The two home forms do not exist as non-functional shells — nor do their sections (REC-7).
- The doctors/clinics/guide **content** is migrated only into `docs/`, never rendered.
- «پزشکان این بخش» cross-links are not rendered at all (REC-3): a link to an unimplemented page is a
  dead link, and Q4 rules dead links out.

## 6. Definition of done for the Services section

1. All 10 categories render with complete trilingual content, correct group order, and correct floor.
2. Category switching works by URL and by tap, with correct focus and live states.
3. Lighthouse/axe pass on `/` and `/services` (and a category route) ≥ AA, no-JS content parity check.
4. `pnpm test` green; content schemas validated against the reference values.
5. Responsive review at all five breakpoints, RTL and LTR.
6. Reference originals untouched (verify with the preservation report).

## 7. Ambiguity protocol (from the master specification)

If the boundary still looks ambiguous at implementation time: **inspect → document the evidence →
explain → ask the user**. Do not resolve ambiguity by building something. Every such question found in
Phase 0 is already filed in `docs/reports/OPEN_QUESTIONS.md`.
