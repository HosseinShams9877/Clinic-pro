# REFERENCE_SOURCE_ANALYSIS — structure and architecture of the existing site

> Phase 0 deliverable · Knowledge layer · Evidence: read-only inspection of `D:\New folder\Clinic-pro\پلتفرم`.

---

## 1. Delivery model

- **Zero build step.** No `package.json`, no bundler, no transpiler. Files are served as-is; `README.txt`
  instructs "open index.html in a browser".
- **Fully offline.** Bundled WOFF2 fonts, local images, inline SVG icon sprite. No CDN, no analytics,
  no fetch/XHR anywhere in the JS.
- **Progressive enhancement.** Every page is a complete document without JS; scripts enhance it
  (the strongest example is the home services grid, `html:not(.js-svc)` gating, §4.3 below).

## 2. Page architecture (22 pages)

Every page shares one skeleton:

```html
<!doctype html>
<html lang="fa" dir="rtl" data-title-key="…">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>…</title>
  <meta name="description" content="…">          (public pages only)
  <link rel="stylesheet" href="assets/css/style.css">
  …per-page CSS…
  <link rel="stylesheet" href="assets/css/vivid.css" >   (last — see §6.2)
</head>
<body class="page-…">
  <!-- inline SVG sprite: <symbol id="i-*"> (~36 core + extended icons) -->
  <header class="site-header" id="top"> … identical nav … </header>
  <main> …page content… </main>
  <footer class="footer"> …identical… </footer>
  <div class="scroll-progress"></div>
  <script src="assets/js/i18n.js"></script>
  <script src="assets/js/i18n-extra.js"></script>
  …per-page data + logic scripts…
  <script src="assets/js/main.js"></script>      (last)
</body>
</html>
```

Body classes (from grep across all 22 pages) — a small, consistent convention:

| body class | meaning |
|---|---|
| `page-home` | `index.html` |
| `page-doctors` | all inner public pages (design family) |
| `page-services` | `services.html` |
| `page-profile` | `doctor.html` |
| `page-info` | info pages (about/clinics/visiting/rights/admission/loan) |
| `page-guide` | `guide`, `guide-item` (+ `data-page="list|item"`) |
| `page-ast` | `assistant.html` |
| `staff fin` + `data-app="doctor|finance|ins|q"` | management panels |
| `staff` | staff panels |
| `platform` | `platform.html` (map) |

**Note:** only the public pages carry `<meta name="description">`; panel pages carry none.

## 3. The i18n engine (the reference's most load-bearing subsystem)

`assets/js/main.js` implements a translation engine **without dictionaries for Persian**:

1. On load, it walks the DOM and captures every `data-i18n` element's `innerHTML` and every
   `data-i18n-ph` element's `placeholder` into an in-memory `fa` dictionary, keyed by the attribute value,
   plus `document.title` under `html[data-title-key]`.
2. `window.I18N.en` / `window.I18N.ar` (from `i18n.js`, 305 lines) and `i18n-extra.js` (717 lines) supply
   the foreign dictionaries with the **same keys**.
3. `setLang(lang)` writes `html.lang` + `html.dir`, swaps all translated nodes, updates the dropdown
   button label, persists `localStorage["kh-lang"]`, and dispatches a `kh:lang` `CustomEvent`.
4. Per-page scripts (`services.js`, `doctors.js`, `guide.js`, `assistant.js`, …) listen for `kh:lang`
   and **re-render their JS-generated content** in the new language.

**Dir map:** `fa, ar → rtl`, `en → ltr`. **Digit sets:** fa `۰۱۲۳۴۵۶۷۸۹`, ar `٠١٢٣٤٥٦٧٨٩`.

**Why this matters for the rebuild:** the "capture from DOM" trick makes Persian structurally the source
of truth. In Next.js we invert this into *content files* (Persian canonical) + *message dictionaries*
(GLIS/next-intl-style) — see `LOCALIZATION_AND_CALENDAR.md` — but preserve the invariant:
**Persian is never derived from a translation.**

## 4. Script inventory (24 files, 6 083 lines)

| File | LOC | Role |
|---|---|---|
| `main.js` | 225 | i18n capture/setLang, lang dropdown, burger menu, sticky header, scroll-spy, reveal-on-scroll, LIVING LAYER (§5) |
| `i18n.js` | 305 | `window.I18N = {en, ar}` dictionaries |
| `i18n-extra.js` | 717 | extra EN/AR keys for info/guide pages |
| `home.js` | 52 | home-page glue |
| `home-svc.js` | 58 | home services bento: static fallback → JS-rendered grid |
| `services-data.js` | 140 | `window.SERVICE_CATS` — 10 service categories, trilingual (§4.2) |
| `services.js` | 66 | services page: category tabs → detail panel + sub-service grid |
| `doctors-data.js` | 106 | 66 doctors, trilingual names/titles, 12 `DOCTOR_CATS` (§4.1) |
| `doctor-profiles.js` | 110 | extended per-doctor profile content (hero photo, floor, about, TODO fields) |
| `doctors.js` | 151 | doctors page: search, category chips, modal quick-view |
| `doctor.js` | 133 | doctor profile page: tabs, reviews form, related doctors |
| `guide-data.js` | 144 | pre/post-op guide content, 8 categories |
| `guide.js` | 142 | guide list page |
| `assistant-data.js` | 154 | insurer sample data + estimator rules |
| `assistant.js` | 263 | smart assistant (insurance check / cost estimate / triage) |
| `survey-data.js` | 75 | post-op survey: 8 surgery sections + 4 lab sections |
| `loan.js` | 46 | loan-lead form + loyalty-club form (localStorage demo stores) |
| `info.js` | 34 | info-page tab anchoring |
| `panel.js` | 522 | shared panel chrome (login demo, nav, toasts) |
| `patient.js` | 723 | patient panel |
| `staff.js` | 716 | staff panel (5 roles) |
| `finance.js` | 791 | finance/insurance/doctor-income panels |
| `quality.js` | 192 | quality reports + CSV export |
| `insurance-admin.js` | 218 | insurance administrative tools |

**Script groups by tier:** public site ≈ 2 300 LOC; i18n ≈ 1 000 LOC; panels ≈ 3 100 LOC.
The panels are *more than half* of all logic — a clear signal that they are a separate product surface,
which reinforces the scope boundary (§6 of the master spec).

### 4.1 `doctors-data.js` — provenance header (verbatim rule)

```
source: drkheirkhahhospital.ir/doctors-search … merged with the clinic's
doctors_by_specialty.xlsx (1405/08); mobile & national-ID columns are NOT
published · photo:"" → monogram placeholder
```

Record shape: `d(photo, faName, enName, arName, [title×3], cat, ?slug)` — 66 records.
`window.DOCTOR_CATS`: `all, gen, plastic, ortho, uro, eye, ent, gyn, maxfac, anes, gi, cardio, int`
(12 categories + "all", Persian labels for each).

### 4.2 `services-data.js` — the model the rebuild's services module copies

```
window.SERVICE_CATS = [
  { id, doc, img, icon, floor, name:{fa,en,ar}, desc:{fa,en,ar},
    benefits:[{i, t:{fa,en,ar}}…3], items:[{img|icon, n:{fa,en,ar}, d:{fa,en,ar}}…3–5] }
]
ORDER = { surg: ["gen","plastic","ortho","uro","eye","ent","gyn"],
          med:  ["aes","anes","endo"] }
```

10 categories, each with: trilingual name + description, a **floor** (`-1/0/2/3` — the physical location
in the building, a distinctive content feature), **3 benefits** (icon + trilingual text), and **3–5
sub-services** (image or icon + trilingual name + one-line description). Group order is explicitly
annotated "order as requested by the client". See `SERVICES_SCOPE.md` for the full table.

### 4.3 `home-svc.js` — progressive enhancement pattern (evidence)

The home page renders a static services grid server-side and tags `<html class="js-svc">` from JS; the
static `.h-svc` grid is the **no-JS fallback and the SEO content**, replaced at runtime by the bento
layout. `html:not(.js-svc)` CSS gating keeps both from showing at once. **The rebuild must keep the same
guarantee**: Server Components emit the complete services content; client enhancement never gates content
availability.

## 5. The "LIVING LAYER" — motion subsystem (evidence: `main.js` lines 100–225)

Gated by two capability queries, in this order:

1. `prefers-reduced-motion: reduce` — if set: scroll progress bar still updates (cheap), count-up
   disabled, **everything else skipped**.
2. `pointer: fine` — if absent: parallax, glow, 3D tilt, magnetic buttons all skipped.

Components: scroll progress bar (`--sp`), rising gold particles (14 on `<640px`, 28 otherwise),
hero mouse parallax (`--mx/--my`, rAF-throttled), cursor glow on cards (`--gx/--gy`), 3D tilt on doctor
cards, magnetic primary buttons, count-up statistics with localized digits and cubic easing.

Also: **live open/closed status** computed in `Asia/Tehran` (closed Friday; open 07:30–20:00 = minutes
450–1200), re-evaluated every 60 s and re-checked on `lang` change.

## 6. CSS architecture — and its risks

### 6.1 Structure

`style.css` is the base layer with a `:root` custom-property design-token block; per-page CSS files add
page-specific rules; `vivid.css` is loaded **last** and implements a vivid gradient "skin".

### 6.2 Documented risks (see `docs/reports/TECHNICAL_RISKS.md` for the full list)

- **Dead/layered CSS** — `vivid.css` is appended on top of an already complete stylesheet; it is not
  scoped, and there is no way to tell which declarations are overrides vs. unused. The reference is a
  demo skin, not a design system; **the rebuild must not replicate this** — centralized tokens and
  Tailwind layers instead (`GLOBAL_CSS_ARCHITECTURE.md`).
- **No build pipeline** — no minification, no autoprefixing, no Dead-Code Elimination; the rebuild's
  Tailwind/Next pipeline fixes this.
- **Icon sprite duplicated per page** — the same ~36 `<symbol>`s are inlined into every HTML file.
  In the rebuild this becomes an icon component (single source) — see `ASSETS_INVENTORY.md`.

## 7. Data persistence (all demo)

| localStorage key | written by | content |
|---|---|---|
| `kh-lang` | `main.js` | chosen language `fa|en|ar` |
| `kh-loan-leads` | `loan.js` | `{id, mobile, name, op, src, at, status:"new"}` |
| `kh-club-members` | `loan.js` | `{mobile, topics, birthMonth, at, tier:"bronze"}` |
| `kh-guide-demo-v1` | `assistant.js` | assistant session state |
| `kh-patient-demo-v2` | `assistant.js`/panels | patient demo record |
| `kh-survey-demo-v1` | survey logic | post-op survey responses |

`platform.html` ships a **demo reset button** that clears every key matching `/^kh-/`. All panel pages
label their data «نسخه نمایشی · همه داده‌ها ساختگی است». None of these are production persistence —
in the rebuild, persistence belongs to Prisma/PostgreSQL.

## 8. Content provenance rules (stated in the reference's own data files)

| Content set | Rule as found in the reference |
|---|---|
| Doctors | Source = official site + `doctors_by_specialty.xlsx` (1405/08). **Mobile & national-ID columns are NOT published.** Empty photo → monogram placeholder. |
| Doctor profiles | Only facts published on the official site (specialty/fellowship) + verified center facts. Fields marked `TODO` **must be confirmed by each doctor before going live.** |
| Guide content | General patient-education text only; every page states the surgeon's/anesthesiologist's personal instructions take priority; **must be reviewed and approved by the center's medical team before publishing.** |
| Insurance data | Every insurer status, tariff and percentage is **SAMPLE** data. Real values are entered and confirmed by the center's insurance officer. **The engine never invents an answer** — unknown inputs → "needs inquiry". |

These rules are binding on the rebuild and are carried into `CONTENT_INVENTORY.md` and
`OPEN_QUESTIONS.md`.
