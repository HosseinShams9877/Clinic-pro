# PAGE_INVENTORY — every page in the reference project, with scope disposition

> Phase 0 deliverable · Website layer · Evidence: grep of all 22 HTML files (title, meta description,
> body class) + full reads of the key pages.

Scope key: **IN** = Phase 1 implementation boundary (home + complete Services section) ·
**OUT** = excluded from implementation, documented for the future only.

---

## 1. Public website

| # | File | `<title>` (fa) | Body class | Meta desc | Scope |
|---|---|---|---|---|---|
| 1 | `index.html` | مرکز جراحی فوق تخصصی دکتر خیرخواه \| کاشان | `page-home` | yes («۷ اتاق عمل مجهز، بیش از ۴۰ پزشک…») | **IN** |
| 2 | `services.html` | خدمات \| … | `page-doctors page-services` | yes | **IN** |
| 3 | `doctors.html` | تیم پزشکان \| … | `page-doctors` | yes («معرفی ۶۶ پزشک…») | OUT |
| 4 | `doctor.html` | پروفایل پزشک \| … | `page-doctors page-profile` | yes | OUT |
| 5 | `clinics.html` | خدمات پزشکی مرکز \| … | `page-doctors page-info` | yes | OUT |
| 6 | `about.html` | درباره ما \| … | `page-doctors page-info` | yes («افتتاح ۱۳۹۹، ۶ طبقه، ۷ اتاق عمل») | OUT |
| 7 | `guide.html` | راهنمای قبل و بعد از عمل \| … | `page-doctors page-guide` `data-page="list"` | yes | OUT |
| 8 | `guide-item.html` | راهنمای قبل و بعد از عمل \| … | `page-doctors page-guide` `data-page="item"` | yes | OUT |
| 9 | `assistant.html` | راهنمای هوشمند بیماران \| … | `page-doctors page-guide page-ast` | yes | OUT |
| 10 | `visiting.html` | قوانین و ساعات ملاقات \| … (۱۵–۱۶:۳۰) | `page-doctors page-info` | yes | OUT |
| 11 | `patient-rights.html` | منشور حقوق بیمار \| … | `page-doctors page-info` | yes | OUT |
| 12 | `admission.html` | پذیرش و ترخیص بیماران \| … | `page-doctors page-info` | yes | OUT |
| 13 | `loan.html` | وام درمانی بانک تجارت \| … | `page-doctors page-info` | yes | OUT |
| 14 | `platform.html` | نقشه پلتفرم | `platform` | — | OUT (documentation only) |

## 2. Panels — all OUT, all Demo

| # | File | `<title>` | Body class / data | Demo login |
|---|---|---|---|---|
| 15 | `patient-panel.html` | پنل بیمار | — | any mobile + on-screen demo code |
| 16 | `doctor-panel.html` | پنل پزشک | — | `0913 111 0001…0004` |
| 17 | `doctor-income.html` | (کارکرد و درآمد) | `staff fin` `data-app="doctor"` | same |
| 18 | `surgery-panel.html` | پنل پذیرش · برنامه جراحی | — | none (no login) |
| 19 | `staff-panel.html` | پنل پرسنل | `staff` | 5 roles, `0913 123 0001…0005` |
| 20 | `finance-panel.html` | پنل واحد مالی | `staff fin` `data-app="finance"` | `0913 124 0001` |
| 21 | `insurance-panel.html` | امور بیمه | `staff fin` `data-app="ins"` | `0913 125 0001` |
| 22 | `quality-panel.html` | گزارش رضایت | `staff fin` `data-app="q"` | `0913 126 0001` |

All panels state «نسخه نمایشی · همه داده‌ها ساختگی است». Panel pages carry **no meta description** —
consistent with their non-public role.

## 3. In-scope pages — structure captured for the rebuild

### 3.1 `index.html` (45 KB — the largest page)
Hero (particles, brand, slogan, CTAs, live open/closed) → stats (`data-count`: ۶۶/۱۲/۷) →
**services bento** (static `.h-svc` fallback grid, enhanced by `home-svc.js`; `html:not(.js-svc)` CSS
gating) → guide teaser → international-patient steps (`#steps`) → loyalty club (`#club`) →
loan lead (`#loan`) → contact (`#contact`: phone, hours, map, `#help` search) → footer.

### 3.2 `services.html` (20 KB)
Hero → two group anchors (`#surgical`, `#medical`) → category tab rows
(`#sCatsS`, `#sCatsM`; `.scat` buttons, `role="tab"`) → detail panel
(`#sDetail`: `#sdCrumb`, `#sdName`, `#sdVidName`, `#sdDesc`, `#sdFloor`, `#sdVideo` (img + "coming soon"
toast), `#sdDocs` → `doctors.html?cat=…`, `#sdBen` benefits list) → sub-service grid (`#sItems`, `.si`
cards each with `tel:` CTA) → CTA band → footer. Hash routing: `#gen|…|surgical|medical`; re-renders on
`kh:lang`; on `<960px` scrolls to `#sDetail` after a category tap.

## 4. Rebuild mapping (target routes)

| Reference | Target route (App Router) | Status |
|---|---|---|
| `index.html` | `/` (home) | **Phase 1, IN** |
| `services.html` (+ `#cat` hashes) | `/services` + `/services/[group|category]` (decision open) | **Phase 1, IN** |
| 11 other public pages | future routes, **documented only** | OUT |
| 8 panels | future authenticated app, **documented only** | OUT |
| `platform.html` | no route; it is internal documentation, its content lives in `FUTURE_SCOPE.md` | OUT |

**Route-shape decision (open):** keep the hash-based category switching of the reference (`/services#gen`)
or promote categories to path segments (`/services/gen`)? Default recommendation: **path segments** —
better SEO, shareable URLs, canonical per-category metadata — while preserving hash anchors for in-page
navigation. Tracked in `OPEN_QUESTIONS.md`.
