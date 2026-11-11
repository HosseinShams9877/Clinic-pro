# WEBSITE_WORKFLOWS — user journeys and interactions in the reference

> Phase 0 deliverable · Website layer. Scope: the **in-scope** workflows are specified for rebuild;
> out-of-scope workflows are documented for the future (`FUTURE_SCOPE.md`).

---

## 1. In-scope workflows (Phase 1 must implement these)

### WF-1 · Language switching (site-wide)
**Actor:** any visitor. **Trigger:** FA/EN/AR dropdown in header, or `?lang=xx` in URL, or
stored `kh-lang`.
1. `setLang(lang)` runs: `html.lang` + `html.dir` update (`fa|ar → rtl`, `en → ltr`).
2. All `data-i18n` nodes swap `innerHTML`, all `data-i18n-ph` swap `placeholder`, `<title>` swaps.
3. `localStorage["kh-lang"]` persists the choice.
4. `kh:lang` CustomEvent dispatched → per-page scripts **re-render JS-generated content**
   (services tabs/grid, doctor cards, …).
5. Digits re-localize (fa `۰-۹`, ar `٠-٩`) on next render.

**Rebuild contract:** identical observable behavior, server-rendered locale, URL-encodable
(`?lang=` or `/en`) — decision in `LOCALIZATION_AND_CALENDAR.md`.

### WF-2 · Browse the services catalog
**Actor:** prospective patient. **Entry points:** nav «خدمات» (→ group), home bento, direct URL.
1. Land on `/services`; the **surgical group** shows first (`ORDER.surg`), «خدمات جراحی» active.
2. Tap a category tab (`.scat`, `role="tab"`) → detail panel swaps (crumb, name, description,
   **floor**, video thumb, benefits) and the sub-service grid re-renders; hash updates to `#<id>`
   (`history.replaceState`).
3. On narrow viewports (`<960px`) the view smooth-scrolls to `#sDetail`.
4. Sub-service card CTA → `tel:+983155154000` (call the center — there is no online booking in the
   reference's public catalog).
5. «پزشکان این بخش» (`#sdDocs`) → `doctors.html?cat=<cat>` (out of scope).
6. Deep links: `/services#gen`, `#surgical`, `#medical` all resolve on load (`fromHash()` +
   `hashchange` listener).
7. Category video button → toast «ویدیوی معرفی این بخش به‌زودی اضافه می‌شود» (placeholder — the
   reference ships no videos).

**Rebuild contract:** every step above, server-component-rendered, fully crawlable without JS; the
category page is a real route; the phone CTA is retained verbatim (no invented booking flow).

### WF-3 · Browse the home page
1. Hero: brand, slogan (nastaliq, fa only), CTAs, live open/closed badge.
2. Stats strip counts up on intersection (۶۶ پزشک / ۱۲ رشته / ۷ اتاق عمل).
3. Services bento: **static grid present without JS**; JS enhances/replaces it (progressive enhancement).
4. Guide teaser, international steps, club + loan forms (out of scope), contact block.
5. Header scroll-spy keeps the in-page nav honest.

**Rebuild contract:** sections in the same order; the two home forms are **scope questions**
(`OPEN_QUESTIONS.md`) — do NOT build fake versions of them.

---

## 2. Out-of-scope workflows (documented for the future only)

### WF-4 · Find a doctor (`doctors.html`)
Search box (`#docSearch`) + 12 category chips (`#docChips[role=tablist]`) filter 66 doctors;
`#docCount` announces results (`aria-live=polite`); empty state `#docEmpty[hidden]`;
card click opens quick-view modal (`.dmodal#docModal[hidden]`: photo/monogram, specialty, facts,
CTAs → booking + profile link); doctor.html profile carries tabs (about/services/creds/reviews/faq),
a moderated review form (5-star radiogroup; «نظرات پس از تأیید پذیرش و احراز مراجعه منتشر می‌شوند»),
and related doctors.

### WF-5 · Smart assistant (`assistant.html`)
Insurer lookup + self-pay estimator + triage questions; insurers have statuses
active/limited/none; **"never invents an answer"** — unknown → «نیازمند استعلام»; session state in
`kh-guide-demo-v1` / `kh-patient-demo-v2`.

### WF-6 · Loan lead (home + `loan.html`)
Mobile (`/^09\d{9}$/`, Persian-digit-tolerant) + name + procedure → success state → stored in
`kh-loan-leads` (demo) with production intent "leads go to the server and appear for the
loan/insurance advisor".

### WF-7 · Loyalty club (home `#club`)
Mobile + topics + birth month → stored `kh-club-members`, `tier:"bronze"`.

### WF-8 · Panels (8 pages, all demo)
Patient (7 features: dashboard, surgery request, my requests, my labs, messages, account,
post-op survey) · Doctor (schedule + income) · Surgery (queue, confirm with free OR, weekly
calendar) · Staff (5 roles: shifts, payslip, leave, messages) · Finance (daily work log, invoices,
payments) · Insurance (insurers, tariffs, cost estimate, Q&A) · Quality (per-department scores,
strengths/improvements, trends, per-doctor, comments+follow-up, CSV export).
Cross-panel data flows (6, from `platform.html`): پزشک→پذیرش · بیمار→پذیرش · مالی→پزشک ·
امور بیمه→راهنمای هوشمند · بیمار→کیفیت · پرسنل→سرپرست بخش.
Demo logins listed in `PAGE_INVENTORY.md` §2.

---

## 3. Interaction qualities the rebuild must preserve

| Quality | Reference behavior | Rebuild rule |
|---|---|---|
| Motion escape hatch | `prefers-reduced-motion: reduce` disables count-up, particles, parallax, tilt, magnetic | implement the identical gate before any motion work |
| Coarse-pointer safety | `pointer: fine` gates parallax/tilt/magnetic | same |
| Open/closed status | Asia/Tehran, Fri closed, 07:30–20:00, re-check 60 s | server-computed for SSR, client-hydrated |
| No-JS completeness | services grid and all content visible without JS | Server Components, no client-only content gating |
| Digit localization | UI-only, per current lang | pure util at the render boundary |
| Live regions | `#docCount[aria-live=polite]`, `#pToast[role=status]` | keep equivalents where ranges re-render |
