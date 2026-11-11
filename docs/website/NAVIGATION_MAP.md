# NAVIGATION_MAP — the reference's complete navigation structure

> Phase 0 deliverable · Website layer · Evidence: full reads of `doctors.html` and `about.html`
> (header + footer are identical across all pages).

---

## 1. Header (`.site-header#top` → `.container` → `nav.nav[aria-label="main"]`)

### 1.1 Brand (`.brand`)
- brand-mark: `#i-logo` icon
- `.brand.small` — «مرکز جراحی فوق تخصصی»
- `.brand.name` — «دکتر خیرخواه»

### 1.2 Primary menu (`ul#menu`)

| # | Item | i18n key | href | Submenu? |
|---|---|---|---|---|
| 1 | خانه | `nav.home` | `index.html` | — |
| 2 | درباره ما | `nav.about` | (toggle) | `.has-sub`, 5 subs |
| 2a | تالار جراحی و تاریخچه | `nav.aboutHist` | `about.html#history` | |
| 2b | رسالت و چشم‌انداز | `nav.aboutMission` | `about.html#mission` | |
| 2c | اهداف مرکز | `nav.aboutGoals` | `about.html#goals` | |
| 2d | سیاست‌ها و ضوابط | `nav.aboutPolicy` | `about.html#policies` | |
| 2e | چرا ما | `nav.aboutWhy` | `about.html#why` | |
| 3 | خدمات | `nav.services` | (toggle) | `.has-sub`, 2 subs |
| 3a | خدمات جراحی | `nav.svcSurg` | `services.html#surgical` | |
| 3b | خدمات پزشکی | `nav.svcMed` | `services.html#medical` | |
| 4 | پزشکان | `nav.doctors` | `doctors.html` | — |
| 5 | راهنمای بیماران | `nav.guide` | (toggle) | `.has-sub`, 5 subs |
| 5a | راهنمای قبل و بعد از عمل | `ix.menuGuide` | `guide.html` | |
| 5b | قوانین و ساعات ملاقات | `ix.menuVisit` | `visiting.html` | |
| 5c | منشور حقوق بیمار | `ix.menuRights` | `patient-rights.html` | |
| 5d | پذیرش و ترخیص | `ix.menuAdm` | `admission.html` | |
| 5e | وام درمانی | `ix.menuLoan` | `loan.html` | |
| 6 | راهنمای هوشمند | `nav.assistant` | `assistant.html` | — |
| 7 | بیماران بین‌الملل | `nav.intl` | `index.html#steps` | — |
| 8 | تماس با ما | `nav.contact` | `index.html#contact` | — |
| 9 | پنل پزشکان | `nav.staff` | `doctor-panel.html` | `li.m-staff` (staff shortcut) |

### 1.3 Tools (`.nav-tools`)
- **`#lang`** dropdown: `button.lang-btn` (`#langLabel` shows FA/EN/AR) + `ul.lang-list` with
  `data-lang="fa|en|ar"` buttons; `aria-expanded` toggled; click-outside closes.
- **search** `.icon-btn` → `index.html#help`
- **CTA** `a.btn.btn-primary.btn-sm.hide-sm` → `patient-panel.html?go=new` (`cta.book` «نوبت و مشاوره»)
- **burger** `button.icon-btn.burger#burger` (mobile, `#menu.open`)

### 1.4 Behaviors (from `main.js`)
- Sticky: `.stuck` added when `scrollY > 420`.
- Scroll-spy: in-page `#anchor` links get `.active` only while their section crosses the 45% viewport
  line; at the very top (`scrollY < 300`) «خانه» is active.
- Mobile: burger toggles `#menu.open`; submenu toggles via `.sub-tg` (`aria-expanded`); links close menu.

## 2. Footer (`.footer` → `.container.foot-grid`)

| Column | Content |
|---|---|
| `.foot-brand` | light brand + `ft.p` mission text + `a.social` (instagram.com) |
| `ft.h1` — بخش‌ها | تالار جراحی → `about.html#history` · کلینیک بیهوشی → `clinics.html#anesthesia` · اتاق عمل جنرال → `index.html#services` · کاشت مو و ابرو → `clinics.html#hair` · لیزر → `clinics.html#laser` · خدمات زیبایی → `clinics.html#beauty` |
| `ft.h2` — دسترسی سریع | توریسم درمانی → `index.html#steps` · پذیرش و ترخیص → `admission.html` · تور مجازی → `index.html#about` · حقوق بیمار → `patient-rights.html` · ساعات ملاقات → `visiting.html` · تاریخچه → `about.html#history` |
| `ft.h3` — ساعات کاری | شنبه تا پنجشنبه ۷:۳۰–۲۰:۰۰ · ملاقات ۱۵:۰۰–۱۶:۳۰ · `a.foot-phone dir="ltr"` «031 - 5515 4000» (`tel:+983155154000`) |

`.foot-bottom`: `ft.copy` copyright + **7 staff links** (`.staff-link`):
ورود پزشکان (`doctor-panel`) · ورود پذیرش (`surgery-panel`) · ورود پرسنل (`staff-panel`) ·
ورود واحد مالی (`finance-panel`) · امور بیمه (`insurance-panel`) · گزارش رضایت (`quality-panel`) ·
نقشه پلتفرم (`platform.html`) — and `ft.company` «شرکت پزشکان مهراندیش خیرخواه».

## 3. In-page anchors of the in-scope pages

### 3.1 Home (`index.html`)
`#top` (header) · `#about` (virtual-tour link target) · `#services` · `#steps` (international) ·
`#club` · `#loan` · `#contact` · `#help` (search).

### 3.2 Services (`services.html`)
`#surgical` / `#medical` (group anchors from nav) · `#sDetail` (detail panel) · per-category hash
`#<cat-id>` with `hashchange` handling and smooth scroll.
Cross-page entry: nav, home bento cards, and `doctors.html` ↔ `services.html` are the main inbound paths.

## 4. External cross-links from in-scope pages

| From | Link | Target exists? |
|---|---|---|
| services sub-service card | `tel:+983155154000` | external phone |
| services `#sdDocs` | `doctors.html?cat=<id>` | OUT page |
| header CTA | `patient-panel.html?go=new` | OUT page |
| footer staff links | 7 panel pages | OUT pages |
| footer social | instagram.com | external |

**Consequence for the rebuild (scope rule):** in Phase 1, the header/footer must be rebuilt with the
**in-scope items only** — home, the two services group links, and contact — with no dead links to
excluded pages. Which links appear is decided in `SERVICES_SCOPE.md` §5 and tracked in
`OPEN_QUESTIONS.md`.
