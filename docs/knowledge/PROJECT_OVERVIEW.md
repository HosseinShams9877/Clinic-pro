# PROJECT_OVERVIEW — مرکز جراحی فوق تخصصی دکتر خیرخواه

> Phase 0 deliverable · Knowledge layer · Source of truth: the reference project only.

---

## 1. What the reference project is

A **static, multi-page, vanilla HTML/CSS/JS website** (no build step, no framework, no package.json) for
**مرکز جراحی فوق تخصصی دکتر خیرخواه** (Dr. Kheirkhah Sub-Specialty Surgical Center), Kashan.

It is **trilingual** (Persian / English / Arabic), **RTL-first** (Persian and Arabic), and works fully
**offline** — the Vazirmatn font is bundled, all assets are local, and there is no network call anywhere
in the codebase.

Per `README.txt`, the Persian text lives inline in the HTML; the English and Arabic translations live in
`assets/js/i18n.js` keyed on the same `data-i18n` attributes. Language can be forced via `?lang=en` / `?lang=ar`.

The reference package is organized as a single Persian-named folder, `پلتفرم/` ("platform"), containing:

```
پلتفرم/
├─ README.txt
├─ 22 × .html                      (public site + staff/management panels + platform map)
└─ assets/
   ├─ css/   (15 files)
   ├─ js/    (24 files, 6 083 lines total)
   ├─ img/   (flat + doctors/ + doctors/hero/ + guide/ + services/)
   └─ fonts/ (Vazirmatn-Variable.woff2, NotoNastaliqUrdu-Bold.woff2)
```

---

## 2. The two halves of the reference package

The 22 pages split cleanly into two tiers, which the platform map page (`platform.html`) makes explicit:

### 2.1 Public website (12 page types — the tier relevant to this project)

| Page | Role |
|---|---|
| `index.html` | Home — hero, stats, services bento, guide teaser, international-patient steps, contact |
| `services.html` | Services catalog — 10 categories in 2 groups (surgical / medical) |
| `doctors.html` | Medical team — 66 doctors, 12 specialties, search + category chips + quick-view modal |
| `doctor.html` | Individual doctor profile (`?id=…`) |
| `clinics.html` | Anesthesia clinic + beauty/laser/hair clinics |
| `about.html` | About — history, 6-floor building breakdown, mission, goals, policies, why-us |
| `guide.html` / `guide-item.html` | Pre/post-op patient guide (list + item) |
| `assistant.html` | Smart patient assistant (insurance + self-pay estimator) |
| `visiting.html` | Visiting hours & rules |
| `patient-rights.html` | Patient rights charter |
| `admission.html` | Admission & discharge |
| `loan.html` | Tejarat Bank treatment loan |

### 2.2 Panels (10 pages — **out of scope**, documented for the future)

`patient-panel`, `doctor-panel`, `doctor-income`, `surgery-panel`, `staff-panel`, `finance-panel`,
`insurance-panel`, `quality-panel`, plus `platform.html` (the map of all of them).

All panel data is **demo data in `localStorage`**; every panel states «نسخه نمایشی · همه داده‌ها ساختگی است»
("demo version — all data is fake"). See `docs/website/FUTURE_SCOPE.md`.

---

## 3. Facts about the center (as published by the reference, verbatim)

These are **verified facts from the reference project**, not invented content:

| Fact | Value in reference |
|---|---|
| Name | مرکز جراحی فوق تخصصی دکتر خیرخواه |
| Brand line | مرکز جراحی فوق تخصصی / دکتر خیرخواه |
| Operating company | شرکت پزشکان مهراندیش خیرخواه |
| City | کاشان (Kashan) |
| Phone | `031 - 5515 4000` → `tel:+983155154000` |
| Opened | ۱۳۹۹ (1399 SH) |
| Founder | دکتر پرویز خیرخواه |
| Floors | 6 (from −1 to 4) |
| Operating rooms | ۷ (seven) |
| Doctors | ۶۶ (sixty-six) across ۱۲ specialty categories |
| Anesthesiologists | ۸ |
| Women's ward | ۲۵ beds, floor 1 |
| Men's ward | ۱۵ beds + ambulatory surgery + scopy, floor −1 |
| Hours | شنبه تا پنجشنبه ۷:۳۰–۲۰:۰۰ (Sat–Thu, 07:30–20:00); closed Friday |
| Visiting | ۱۵:۰۰–۱۶:۳۰ (15:00–16:30) |
| Social | instagram.com (handle in footer link) |
| Insurance | Contract with **all** insurers (published claim, `about.html` "why us") |

---

## 4. What this project is

Per the master specification, we are building a **new production website** for the same center using a
mandatory modern stack (Next.js App Router · React · TypeScript strict · Prisma 6 · PostgreSQL/SQLite ·
TanStack React Query v5 · Tailwind with centralized design tokens · Zod · Vitest), **implemented only from
the beginning of the main website through the complete Services section**.

- **In scope:** the home page (`index`) and the services catalog (`services`) — Persian-first, RTL-first,
  fully responsive, production-maintainable, trilingual-capable architecture modeled on the reference.
- **Out of scope:** every other page and all panels. They are documented in `FUTURE_SCOPE.md` only.
- The reference is the **source of truth for content and identity**; no content may be invented.

See `docs/website/SERVICES_SCOPE.md` for the precise boundary, and `docs/roadmap/MASTER_ROADMAP.md`
for how the work is sequenced.

---

## 5. Key characteristics of the reference that the rebuild must preserve

1. **Persian-first**: Persian is the default language *and the source of truth* — EN/AR are translations
   of it, never the reverse.
2. **RTL-first**: `dir="rtl"` is the default; LTR is the EN special case.
3. **Offline/static resilience**: the reference works with no server. The rebuild is a server-rendered
   Next.js app, but the services catalog must remain **fully crawlable and complete without JS** — the
   reference does this via a static `.h-svc` fallback grid that JS progressively replaces.
4. **Trilingual i18n with full coverage**: every visible string is translated in all three languages;
   numbers are localized to Persian/Arabic-Indic digits in UI.
5. **Design tokens**: the reference already uses CSS custom properties for its palette; the rebuild
   centralizes these and adds `prefers-color-scheme` and theme-ability (see `DESIGN_TOKENS.md`).
6. **Motion with an escape hatch**: `prefers-reduced-motion` and `pointer: fine` are both honored —
   the "living layer" (particles, parallax, tilt, magnetic buttons) degrades to nothing on reduced motion
   or coarse pointers.
7. **Content provenance discipline**: the reference's own data files state where each content set comes
   from and which fields must not be published (mobile numbers, national IDs). The rebuild inherits those
   rules verbatim — see `CONTENT_INVENTORY.md`.

---

## 6. What Phase 0 produced

This documentation set: `docs/knowledge`, `docs/website`, `docs/architecture`, `docs/roadmap`,
`docs/reports`, and the root `CLAUDE.md`. Phase 0 is **inspection and planning only** — no project files,
no dependencies, no schemas, and no reference files were created, installed, or modified. See
`docs/reports/PHASE_0_REPORT.md` and `docs/reports/REFERENCE_PRESERVATION_REPORT.md`.
