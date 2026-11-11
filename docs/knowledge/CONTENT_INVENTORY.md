# CONTENT_INVENTORY — verified content of the center, as published by the reference

> Phase 0 deliverable · Knowledge layer. **Every item below is copied/excerpted from the reference
> project. Nothing is invented.** Provenance rules (§7) are binding on the rebuild.

---

## 1. Identity & contact (verified)

| Field | Value |
|---|---|
| Brand (small line) | مرکز جراحی فوق تخصصی |
| Brand (name) | دکتر خیرخواه |
| Legal company | شرکت پزشکان مهراندیش خیرخواه |
| Phone (footer, `dir="ltr"`) | `031 - 5515 4000` → `tel:+983155154000` |
| City | کاشان |
| Social | `instagram.com` (footer `a.social`) |
| Founder/year | دکتر پرویز خیرخواه / ۱۳۹۹ |
| Hours | شنبه تا پنجشنبه ۷:۳۰–۲۰:۰۰ |
| Visiting hours | ۱۵:۰۰–۱۶:۳۰ |
| Slogan (nastaliq, home) | Persian slogan in `h1.h-slogan` (fa only) |

## 2. Home page (`index.html`, 45 KB)

Sections (in order): hero (particles, stats, CTA) · stats strip · **services bento** (static `.h-svc`
fallback + JS bento) · guide teaser · international-patient steps · club (loyalty) · loan lead ·
contact (map, phone, hours, live open/closed) · help/search.

Home meta description (verbatim): «۷ اتاق عمل مجهز، بیش از ۴۰ پزشک…» (truncated capture — full string
in `index.html`; must be re-captured verbatim at Phase 1).

### 2.1 Home stats (`data-count` for count-up)
- ۶۶ پزشک · ۱۲ رشته · ۷ اتاق عمل (also used on `doctors.html`)

### 2.2 Home forms (both out of the Services scope — see boundary in `SERVICES_SCOPE.md`)
- **Loan lead form** (`.ln-form`): mobile + name + optional procedure; validates `/^09\d{9}$/`;
  demo-stores to `kh-loan-leads` with `{id, mobile, name, op, src, at, status:"new"}`.
  File header states the production intent: *leads go to the server and appear for the
  loan/insurance advisor*.
- **Loyalty club form** (`.cb-form`, باشگاه تاج): mobile + topics (checkboxes) + birth month;
  demo-stores to `kh-club-members` with `{mobile, topics, birthMonth, at, tier:"bronze"}`.

## 3. Services catalog (`services.html` + `services-data.js`) — **THE in-scope content**

10 categories in 2 groups, client-specified order. `floor` is the physical building location — a
distinctive piece of content the reference maintains per category.

| # | Group | ID | Name (fa) | Floor | Sub-services | Doctors link |
|---|---|---|---|---|---|---|
| 1 | جراحی | `gen` | جراحی عمومی و لاپاراسکوپی | 2 | 5 (کیسه صفرا، فتق، روده، معده و چاقی، تیروئید) | `doctors.html?cat=gen` |
| 2 | جراحی | `plastic` | جراحی پلاستیک و زیبایی | 2 | 4 (لیپوساکشن، ابدومینوپلاستی، بلفاروپلاستی، ترمیمی) | `?cat=plastic` |
| 3 | جراحی | `ortho` | ارتوپدی | 2 | 3 (شکستگی، مفاصل، آرتروسکوپی) | `?cat=ortho` |
| 4 | جراحی | `uro` | ارولوژی و مجاری ادراری | 2 | 4 (سنگ‌شکن، یورتروسکوپی، سیستوسکوپی، جراحی مجاری) | `?cat=uro` |
| 5 | جراحی | `eye` | جراحی چشم | 3 | 4 (لیزیک/لازک/اسمایل، قرنیه، شبکیه، فیکو) | `?cat=eye` |
| 6 | جراحی | `ent` | گوش، حلق و بینی | 3 | 4 (آندوسکوپی سینوس، بینی، لوزه/آدنوئید، سر و گردن) | `?cat=ent` |
| 7 | جراحی | `gyn` | زنان، زایمان و ناباروری | 2 | 4 (جراحی‌های تخصصی، ناباروری، بارداری، بستری ۲۵ تخت) | `?cat=gyn` |
| 8 | پزشکی | `aes` | خدمات زیبایی، لیزر و کاشت مو و ابرو | 3 | 4 (رینوپلاستی، لیپوساکشن، کلینیک لیزر، کاشت مو) | `?cat=plastic` |
| 9 | پزشکی | `anes` | کلینیک بیهوشی | 0 | 3 (مشاوره، بررسی سوابق، آموزش آمادگی) | `?cat=anes` |
| 10 | پزشکی | `endo` | آندوسکوپی و کولونوسکوپی | −1 | 4 (آندوسکوپی، کولونوسکوپی، پولیپ/نمونه‌برداری، آمادگی) | `?cat=gi` |

Each category also carries: **3 benefits** (icon + trilingual text) and a trilingual one-paragraph
`desc`. Category images live in `assets/img/services/`. The two groups are `ORDER.surg` / `ORDER.med`
and the nav links to them as `services.html#surgical` / `services.html#medical`.

Floor labels (from `services.js`, trilingual):
`-1` طبقه زیرزمین · `0` طبقه همکف · `2` طبقه دوم · `3` طبقه سوم.

**Every sub-service card's CTA is `tel:+983155154000`** (a phone link) — there is no booking flow in the
reference's public services page. Booking CTAs on the public site point to `patient-panel.html?go=new`, which is the patient panel and
therefore out of scope. → `SERVICES_SCOPE.md` §5, `OPEN_QUESTIONS.md`.

## 4. Doctors (66 records, `doctors-data.js`) — out of implementation scope, content documented

- 66 doctors, each: photo?/monogram, trilingual name, trilingual specialty title, category, optional slug.
- 12 categories: `gen` جراحی عمومی و لاپاراسکوپی · `plastic` · `ortho` ارتوپدی و جراحی دست · `uro` ·
  `eye` · `ent` · `gyn` زنان، زایمان و نازایی · `maxfac` دهان، فک و صورت · `anes` · `gi` گوارش و کبد ·
  `cardio` قلب و عروق · `int` داخلی و سایر.
- Specialty-title map `S` covers compound titles (e.g. `gynI`, `anes`, `entS`, `entHN`).
- 4 extended profiles in `doctor-profiles.js` (e.g. `taheri-nassaj`: hero image + position, floor,
  tag «جراحی عمومی · فلوشیپ لاپاراسکوپی», lead paragraph, about).
- Photo filenames imply named individuals; per the provenance header these come from the official site.
- **Not published:** mobile numbers, national IDs.

## 5. About (`about.html`) — out of scope, content documented for fidelity

- 6-floor breakdown (`ol.ix-floors fl-0…fl-5`):
  - **4** تأسیسات و استریلیزاسیون مرکزی (CSR، اتوکلاو/پلاسما، آسانسور اختصاصی، روف‌گاردن)
  - **3** سه اتاق عمل ENT و چشم
  - **2** سه اتاق عمل با دیواره استیل (لاپاراسکوپ، یورتروسکوپ، سیستوسکوپ، سنگ‌شکن، لیپوساکشن)
  - **1** بخش بستری زنان ۲۵ تخت
  - **G** همکف (لابی) پذیرش/ترخیص/کلینیک‌ها/داروخانه
  - **−1** مردان ۱۵ تخت + جراحی سرپایی + اسکوپی + نمازخانه
- Mission (رسالت + ۵-year چشم‌انداز), 3 goals, 7 policy cards (ارائه خدمات، کارکنان، بیماران و
  همراهان، برون‌سپاری، تأمین کالا، تأمین منابع، توسعه و آموزش), 6 "why us" cards (فوق تخصصی، قرارداد
  با همه بیمه‌ها، موقعیت کاشان، نزدیک قم، نزدیک فرودگاه امام خمینه، امکانات رفاهی/ترانسفر رایگان).

## 6. Clinics (`clinics.html`) — out of scope, content documented

- **بیهوشی (anesthesia):** ۸ متخصص; services cl.a1–a6; team grid `#anesDrs`.
- **زیبایی (beauty):** کاشت مو و ابرو (FIT/FUT) · لیزر HONKON نسل ۲۰۲۲ (سه طول موج:
  الکساندرایت/دایود/اندیاگ، ۱۲۰۰ وات و ۲۰ میلیون شات، خنک‌کننده سه‌کاره، هندپیس ۳۶۰°، FDA + CE) ·
  ۱۰ خدمات پوست (کربوکسی‌تراپی، لیزر کیوسوئیچ، هایفوتراپی، CO2 فرکشنال، اندولیفت ۱۴۷۰nm، پلاسماژل،
  مزوتراپی، PRP، میکرونیدلینگ، فیلر) + disclaimer `cl.note`.

## 7. Content provenance rules (binding — stated in the reference data files)

| Content set | Rule (verbatim intent) |
|---|---|
| **Doctors** | Source: official site `doctors-search` merged with `doctors_by_specialty.xlsx` (1405/08). **Mobile & national-ID columns are NOT published.** `photo:""` → monogram placeholder. |
| **Doctor profiles** | Only facts published on the official site + verified center facts. **Fields marked `TODO` must be confirmed by each doctor before going live.** |
| **Guide content** | General patient-education text only; every page states the surgeon's/anesthesiologist's instructions take priority; **must be reviewed and approved by the center's medical team before publishing.** |
| **Insurance/assistant data** | Every insurer status, tariff and percentage is **SAMPLE**. Real values are entered and confirmed by the center's insurance officer. **The engine never invents an answer** — unknown → "needs inquiry". |
| **Services** | "content limited to what the center publishes (surgical suite, equipment per floor, clinics)." Group order "as requested by the client". |

**Therefore, in the rebuild:**
- The services catalog content is the **only content set authorized for Phase 1 implementation**, and it
  is authorized because its provenance is the center's own published material.
- Doctors/clinics/guide content may be **migrated** only as data (Phase 1 bonus or later), with the same
  "TODO → confirm before go-live" discipline.
- Prices, durations, and medical claims **do not exist in the reference** and must never be invented.

## 8. Trilingual coverage of in-scope content

`services-data.js` provides complete fa/en/ar for every category name, description, benefit and
sub-service (the `t(fa, en, ar)` helper forces all three). The rebuild inherits this trilingual content
as the seeded message dictionaries for the services module — see `LOCALIZATION_AND_CALENDAR.md`.
