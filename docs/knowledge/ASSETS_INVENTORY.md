# ASSETS_INVENTORY — fonts, images, icons, CSS in the reference project

> Phase 0 deliverable · Knowledge layer · Evidence: directory listing of `پلتفرم/assets`.

All paths are relative to `D:\New folder\Clinic-pro\پلتفرم`. **Nothing here is copied or modified in
Phase 0** — this is an inventory for Phase 1 decisions, not a transfer plan.

---

## 1. Fonts (`assets/fonts/`, 2 files)

| File | Weight range | Used for |
|---|---|---|
| `Vazirmatn-Variable.woff2` | 100–900 (variable) | **the entire trilingual UI** — fa/en/ar body + headings |
| `NotoNastaliqUrdu-Bold.woff2` | 700 | the Persian slogan **only** — selector `html[lang="fa"] .h-copy h1.h-slogan` |

Notes for the rebuild:
- Vazirmatn Variable is a single self-hosted file; keep self-hosting (no Google Fonts request) — it
  preserves the reference's offline behavior and the RTL metrics.
- The nastaliq face is deliberately scoped to one element and **only in fa**; replicating that scoping
  keeps the decorative face from leaking into body text (it is hard to read at small sizes).

## 2. Images (`assets/img/`, 4 groups, 31 files)

### 2.1 Root (`img/`, 15 files) — hero/section imagery
`building-dusk.jpg` · `building.jpg` · `corridor-wide.jpg` · `corridor.jpg` · `doctors/` thumbnails
(`dr-abdvand.jpg`, `dr-ahmadi.jpg`, `dr-kheirkhah.jpg`) · `help-bg.jpg` · `or-hero.jpg` · `or-room.jpg` ·
`p-form.jpg` · `p-lab.jpg` · `p-or.jpg` · `patient-hero.jpg`

### 2.2 Doctors (`img/doctors/`, 13 files + `hero/` 4)
Portrait photos for the doctors that have them: `abbasi-moghaddam`, `abdvand`, `abolhassani`, `aghadoust`,
`ahmadi`, `ahmadzadeh`, `chahichi`, `farajipour`, `kheirkhah`, `montazer`, `nezam-zavareh`, `taheri-nassaj`,
`talebian`.
`img/doctors/hero/` — 4 wide hero photos used on profile pages: `aghadoust`, `farajipour`,
`nezam-zavareh`, `taheri-nassaj`.
**Rule from `doctors-data.js`:** doctors with `photo: ""` get a **monogram placeholder** (initials tile),
not a missing image. 66 doctors vs 13 photos → the monogram path is the norm, and must be implemented.

### 2.3 Guide (`img/guide/`, 5 files)
`gallbladder-hero.jpg` · `hero.jpg` · `v-doctor.jpg` · `v-or.jpg` · `v-prep.jpg` (v-* are video-posters).

### 2.4 Services (`img/services/`, 14 files)
Category tiles `cat-aes` `cat-cardio` `cat-gen` `cat-gyn` `cat-uro` + procedure photos `colon` `ent`
`eye` `gallbladder` `hernia` `stomach` `thyroid` + `hero.jpg` + `or.jpg`.
These map 1:1 onto the `SERVICE_CATS` entries (§4.2 of `REFERENCE_SOURCE_ANALYSIS.md`).

## 3. Icons — the inline `<symbol>` sprite

**65 icons** inlined into **every** page (from `index.html`, deduplicated):

```
i-air i-alert i-arrow i-band i-bed i-bone i-building i-calendar i-chat i-check i-chev i-clipboard
i-clock i-crown i-dl i-doctor i-dome i-door i-drop i-ear i-ext i-eye i-flag i-food i-gem i-globe
i-hair i-hand i-heart i-insta i-kidney i-laser i-layers i-logo i-mail i-menu i-mic i-money i-mute
i-nosmoke i-phone i-pin i-plane i-play i-plus i-print i-rose i-scalpel i-search i-shield i-sparkle
i-star i-steril i-steth i-syringe i-target i-team i-upload i-user i-wave i-women i-x
```

Usage pattern: `<svg><use href="#i-…"/></svg>` — sprite referenced by id.

**Reference weakness:** the same ~2 KB–3 KB sprite block is copy-pasted into all 22 HTML files (≈ 60 KB
of duplication). **Rebuild:** a single `<Icon name="…">` component (React server component, or an icon
registry map) is the source of truth; no per-page duplication.

Icons actually referenced by in-scope content:
- Home: `i-logo`, `i-pin`(contact), `i-phone`, `i-clock`, `i-plane`(international), `i-check`,
  `i-star`/`i-shield`/`i-heart`(stats), service-card icons.
- Services: `i-scalpel i-women i-kidney i-bone i-laser i-eye i-ear i-search i-steth` (category icons),
  benefit icons `i-scalpel i-heart i-bed i-eye i-plus i-shield i-kidney i-search i-air i-laser i-hair
  i-team i-building i-clock i-clipboard`, plus `i-arrow` on go-links.

## 4. CSS (`assets/css/`, 15 files)

| File | Scope |
|---|---|
| `style.css` | base + `:root` token block (used by all pages) |
| `home.css` | home |
| `services.css` | services |
| `doctors.css` | team + profile + info + guide + services (shared inner-page styles) |
| `doctor.css` | profile page |
| `info.css` | info pages (about/clinics/visiting/rights/admission/loan) |
| `guide.css` | guide list + item |
| `assistant.css` | assistant |
| `loan.css` | loan page (and reused on about) |
| `panel.css` | panels chrome |
| `patient.css` `staff.css` `finance.css` `quality.css` | panels (out of scope) |
| `vivid.css` | **skin layer, loaded last** — unscoped overrides; discarded in the rebuild |

## 5. Media (none)

There is **no video** in the package. Two "video" UI elements exist and both are placeholders:
- services page `#sdVideo` — toast: «ویدیوی معرفی این بخش به‌زودی اضافه می‌شود» ("coming soon")
- doctor page `#pVideo` — same pattern.
The `img/guide/v-*.jpg` posters are prepared for videos that are not shipped. → `OPEN_QUESTIONS.md`.

## 6. Phase 1 transfer rules (recommendation)

1. **Copy only in-scope assets** — home + services images, the icon set they use, the two fonts.
   Do not transfer panel/quality/staff CSS or images.
2. **Re-encode nothing** — JPEGs are already web-targeted; check byte size per Phase 1 perf budget.
3. **Icons become code** (component + registry), not copied sprite blocks.
4. **`vivid.css` is not transferred** — its visual role, if the client wants the vivid gradient skin,
   becomes an optional theme variant implemented with tokens (`DESIGN_TOKENS.md` §6), never an
   appended stylesheet.
5. All transfers are **logged** in the Phase 1 work; originals stay untouched in `پلتفرم/`.
