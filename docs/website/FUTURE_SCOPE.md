# FUTURE_SCOPE — the platform around the in-scope boundary

> Phase 0 deliverable · Website layer · Authority: `platform.html` (the reference's own platform map),
> cross-checked against the 22 pages. **This is documentation for later phases — Phase 1 implements
> none of it and must not scaffold for it.**

---

## 1. The platform map (as the reference draws it)

`platform.html` tags every surface: **سایت عمومی** (pub) · **بیمار** (pat) · **پزشک** (doc) ·
**کارکنان** (staff) · **مدیریت** (mgr). It opens with a demo-reset button that clears every
`localStorage` key matching `/^kh-/`, and it labels all data «نسخه نمایشی · همه داده‌ها ساختگی است».

### 1.1 Public website (12 pages)
`index` · `services` · `doctors` (۶۶ پزشک) · `doctor.html?id=taheri-nassaj` · `guide` ·
`guide-item.html?id=gallbladder` · `assistant` · `about` · `clinics` · `visiting` · `patient-rights` ·
`admission` · `loan`.

### 1.2 Patient panel — `patient-panel.html` (pat)
Features: داشبورد · درخواست جراحی · درخواست‌های من · آزمایش‌های من · پیام‌ها و اطلاع‌رسانی ·
حساب کاربری · نظرسنجی پس از عمل. Login = any mobile + on-screen demo code. Survey data feeds the
quality panel (`SECTIONS.surgery` = 8 scored sections: پذیرش، پرستاران، جراح، نتیجه، بیهوشی و اتاق عمل،
امکانات، ترخیص، صورتحساب; `SECTIONS.lab` = 4).

### 1.3 Doctor surfaces (doc)
`doctor-panel.html` «برنامه جراحی من» + `doctor-income.html` «کارکرد و درآمد من».
Demo logins: `0913 111 0001` … `0004`.

### 1.4 Staff surfaces (staff)
- `surgery-panel` — صف درخواست‌ها، تأیید با اتاق عمل آزاد، تقویم هفتگی (no login).
- `staff-panel` — شیفت، فیش حقوقی، مرخصی، پیام‌ها; 5 roles, demo `0913 123 0001` … `0005`.
- `finance-panel` — ثبت کارکرد روزانه، انتشار صورتحساب، ثبت پرداخت; demo `0913 124 0001`.
- `insurance-panel` — بیمه‌های طرف قرارداد، تعرفه‌ها، برآورد هزینه، پرسش‌ها; demo `0913 125 0001`.
  Shares `assistant-data.js` with the public assistant.

### 1.5 Management (mgr)
`quality-panel` — نمره هر بخش، نقاط قوت/بهبود، روند، به تفکیک پزشک، نظرات و پیگیری، خروجی CSV;
demo `0913 126 0001`.

### 1.6 Cross-panel data flows (6, verbatim from the map)
پزشک→پذیرش · بیمار→پذیرش · مالی→پزشک · امور بیمه→راهنمای هوشمند · بیمار→کیفیت ·
پرسنل→سرپرست بخش.

## 2. Suggested build order beyond Phase 1

Phase 0's recommendation only (client decides at each gate):

| Phase | Surface | Why this order |
|---|---|---|
| 2 | Doctors + doctor profiles | highest public value, content already provenanced (Excel + official site) |
| 3 | About + clinics + info pages (visiting, rights, admission) | content-complete, mostly static |
| 3 | Guide + guide-item + assistant | depends on the medical-team approval gate (content provenance) |
| 4 | Patient panel + surgery panel | first real server workflows; cross-flow بیمار→پذیرش |
| 4 | Doctor panel + income | cross-flow پزشک→پذیرش |
| 5 | Staff / finance / insurance / quality panels | full operational stack; CSV, tariffs, payroll integration |
| 5 | Loan + loyalty-club server pipelines | turns the two home forms from demo into production |

## 3. Migration notes for future phases (not Phase 1 work)

- **Doctors:** 66 records → seed via Prisma; `photo:""` → monogram; keep mobile/national-ID
  unpublished; `TODO` profile fields require per-doctor sign-off before go-live.
- **Guide:** 8 categories + `GUIDE_COMMON` pre/post (4+4 items); medical-team approval is a
  **blocking release gate**, not a nice-to-have.
- **Insurance/assistant:** all sample values must be replaced by the center's insurance officer;
  the "never invents an answer → needs inquiry" behavior must be preserved in the rebuild.
- **Persistence:** `localStorage` keys `kh-*` map to PostgreSQL tables; the demo-reset behavior
  becomes an admin function, never a public button.
- **Panels:** the reference panels total ~3 100 LOC of JS — more than the whole public site. They are a
  separate product surface and should be estimated as such.

## 4. What Phase 1 must NOT do for any of this

- No routes, no layouts, no scaffolding for panel or excluded public pages.
- No authentication, no demo logins, no fake data.
- No links from in-scope pages to unimplemented routes (§5 of `SERVICES_SCOPE.md`).
- The only trace of the future in the Phase 1 codebase is this documentation set.
