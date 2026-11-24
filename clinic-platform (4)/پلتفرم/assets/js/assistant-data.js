/* =========================================================
   Smart patient guide — shared store & rules (DEMO)
   Used by: assistant.html (public/personal)  ·  insurance-panel.html (staff)
   - Every insurer status, tariff and percentage below is SAMPLE data.
     The real values are entered and confirmed by the center's insurance officer.
   - The engine never invents an answer: unknown inputs → "needs inquiry".
   ========================================================= */
(function () {
  "use strict";
  var KEY = "kh-guide-demo-v1", PKEY = "kh-patient-demo-v2";
  var FA = "۰۱۲۳۴۵۶۷۸۹";
  function fa(s) { return String(s == null ? "" : s).replace(/\d/g, function (d) { return FA[d]; }); }
  var DAY = 864e5;

  function seed() {
    var now = Date.now(), OFF = "زهرا امینی · امور بیمه", REC = "واحد پذیرش";
    var d = function (n) { return now - n * DAY; };
    return {
      v: 1, seedDay: dayKey(),
      /* insurers — status: active (طرف قرارداد) · limited (نیازمند استعلام/معرفی‌نامه) · none (طرف قرارداد نیست) */
      ins: [
        { s: 1, id: "tamin", n: "تأمین اجتماعی", kind: "base", status: "active", share: 20, note: "همراه داشتن کارت ملی برای استعلام برخط کافی است.", upd: d(12), by: OFF },
        { s: 1, id: "salamat", n: "سلامت ایرانیان", kind: "base", status: "active", share: 18, note: "", upd: d(12), by: OFF },
        { s: 1, id: "artesh", n: "نیروهای مسلح", kind: "base", status: "limited", share: 20, note: "دریافت معرفی‌نامه از بیمه پیش از عمل لازم است.", upd: d(40), by: OFF },
        { s: 1, id: "nobase", n: "بیمه پایه ندارم", kind: "base", status: "self", share: 0, note: "", upd: d(12), by: OFF },
        { s: 1, id: "dana", n: "دانا", kind: "supp", status: "active", share: 80, cap: 60e6, note: "سقف و فرانشیز بسته به طرح بیمه‌نامه متفاوت است.", upd: d(9), by: OFF },
        { s: 1, id: "iran", n: "ایران", kind: "supp", status: "active", share: 75, cap: 50e6, note: "", upd: d(9), by: OFF },
        { s: 1, id: "alborz", n: "البرز", kind: "supp", status: "active", share: 80, cap: 45e6, note: "", upd: d(30), by: OFF },
        { s: 1, id: "asia", n: "آسیا", kind: "supp", status: "limited", share: 0, cap: 0, note: "قرارداد در حال تمدید است؛ پوشش موردی استعلام می‌شود.", upd: d(5), by: OFF },
        { s: 1, id: "pasargad", n: "پاسارگاد", kind: "supp", status: "limited", share: 0, cap: 0, note: "بسته به طرح سازمانی بیمه‌شده.", upd: d(95), by: OFF },
        { s: 1, id: "moallem", n: "معلم", kind: "supp", status: "none", share: 0, cap: 0, note: "در حال حاضر طرف قرارداد نیست؛ امکان دریافت خسارت به‌صورت بازپرداخت از بیمه‌گر وجود دارد.", upd: d(20), by: OFF },
        { s: 1, id: "nosupp", n: "بیمه تکمیلی ندارم", kind: "supp", status: "self", share: 0, cap: 0, note: "", upd: d(12), by: OFF },
        { s: 1, id: "unknown", n: "نمی‌دانم / سایر", kind: "supp", status: "unknown", share: 0, cap: 0, note: "", upd: d(12), by: OFF }
      ],
      /* surgeries — tariff = sample estimate of total cost (toman); cov: yes · cond · no */
      surg: [
        { s: 1, id: "gallbladder", n: "جراحی کیسه صفرا (کوله‌سیستکتومی لاپاراسکوپی)", k: "کیسه صفرا صفرا کوله سنگ", t: 30e6, cov: "yes", g: "gallbladder", upd: d(14) },
        { s: 1, id: "hernia", n: "ترمیم فتق", k: "فتق هرنی", t: 25e6, cov: "yes", g: "hernia", upd: d(14) },
        { s: 1, id: "appendix", n: "آپاندکتومی", k: "آپاندیس آپاندکتومی", t: 22e6, cov: "yes", g: "appendix", upd: d(14) },
        { s: 1, id: "thyroid", n: "جراحی تیروئید", k: "تیروئید", t: 35e6, cov: "yes", g: "thyroid", upd: d(14) },
        { s: 1, id: "sleeve", n: "جراحی چاقی (اسلیو / بای‌پس معده)", k: "چاقی اسلیو بای پس معده", t: 120e6, cov: "cond", cond: "پوشش معمولاً به شاخص توده بدنی و مدارک پزشکی بستگی دارد.", g: "stomach", upd: d(60) },
        { s: 1, id: "colon", n: "جراحی روده و کولون", k: "روده کولون", t: 45e6, cov: "yes", g: "colon", upd: d(14) },
        { s: 1, id: "tul", n: "سنگ‌شکنی حالب (TUL)", k: "سنگ کلیه حالب tul ارولوژی", t: 28e6, cov: "yes", g: "urology", upd: d(14) },
        { s: 1, id: "hyst", n: "هیسترکتومی", k: "رحم هیسترکتومی زنان", t: 35e6, cov: "yes", g: "gyn", upd: d(14) },
        { s: 1, id: "csec", n: "سزارین", k: "سزارین زایمان", t: 20e6, cov: "yes", g: "gyn", upd: d(14) },
        { s: 1, id: "phaco", n: "عمل آب‌مروارید (فیکو)", k: "آب مروارید فیکو چشم", t: 18e6, cov: "yes", g: "eye", upd: d(14) },
        { s: 1, id: "lasik", n: "لیزیک / اسمایل", k: "لیزیک اسمایل لازک چشم عینک", t: 30e6, cov: "cond", cond: "جراحی انکساری معمولاً فقط با حداقل نمره چشم مشخص و در برخی طرح‌های تکمیلی پوشش دارد.", g: "eye", upd: d(14) },
        { s: 1, id: "septo", n: "سپتوپلاستی (انحراف بینی)", k: "انحراف بینی سپتوپلاستی سینوس", t: 25e6, cov: "cond", cond: "اگر جنبه درمانی داشته باشد و پزشک تأیید کند.", g: "ent", upd: d(14) },
        { s: 1, id: "rhino", n: "رینوپلاستی زیبایی", k: "جراحی بینی زیبایی رینوپلاستی", t: 80e6, cov: "no", g: "aesthetic", upd: d(14) },
        { s: 1, id: "lipo", n: "لیپوساکشن", k: "لیپوساکشن زیبایی چربی", t: 70e6, cov: "no", g: "aesthetic", upd: d(14) },
        { s: 1, id: "bleph", n: "بلفاروپلاستی", k: "پلک بلفاروپلاستی", t: 35e6, cov: "cond", cond: "فقط در صورت افتادگی پلک با اختلال دید و تأیید پزشک.", g: "aesthetic", upd: d(14) }
      ],
      excl: ["لوازم مصرفی و پروتزهای خاص (در صورت نیاز)", "اتاق خصوصی به درخواست بیمار", "هزینه همراه و خدمات رفاهی", "آزمایش‌ها و تصویربرداری خارج از مرکز"],
      faq: [
        { s: 1, id: 1, cat: "ins", q: "آیا مرکز با بیمه من قرارداد دارد؟", a: "با ابزار «بررسی بیمه من» فهرست به‌روز بیمه‌های طرف قرارداد را ببینید. دقت کنید طرف قرارداد بودن مرکز به‌تنهایی به معنی پوشش عمل شما نیست؛ پوشش نهایی به طرح بیمه‌نامه، سقف تعهدات، فرانشیز و گاهی معرفی‌نامه بستگی دارد.", act: "ins", unit: OFF, ok: d(9) },
        { s: 1, id: 2, cat: "ins", q: "هزینه عمل من چقدر می‌شود؟", a: "با «برآورد هزینه جراحی» یک برآورد اولیه می‌بینید. برای مبلغ دقیق، پس از ورود به حساب «درخواست برآورد دقیق» ثبت کنید تا واحد بیمه بررسی کند و نتیجه در همین صفحه و پنل شما منتشر شود.", act: "cost", unit: OFF, ok: d(9) },
        { s: 1, id: 3, cat: "ins", q: "فرانشیز یعنی چه؟", a: "بخشی از هزینه درمان که طبق قرارداد بیمه بر عهده خود بیمه‌شده است. درصد آن در طرح‌های مختلف بیمه متفاوت است و در بیمه‌نامه شما درج شده است.", unit: OFF, ok: d(30) },
        { s: 1, id: 4, cat: "ins", q: "جراحی زیبایی تحت پوشش بیمه است؟", a: "جراحی‌هایی که فقط جنبه زیبایی دارند معمولاً تحت پوشش بیمه پایه و بیشتر بیمه‌های تکمیلی نیستند. اگر عمل جنبه درمانی داشته باشد (مثلاً انحراف بینی یا افتادگی پلک با اختلال دید)، ممکن است با تأیید پزشک و بیمه پوشش داده شود.", unit: OFF, ok: d(30) },
        { s: 1, id: 5, cat: "ins", q: "برای استفاده از بیمه تکمیلی چه مدارکی لازم است؟", a: "معمولاً کارت ملی بیمه‌شده، مشخصات بیمه‌نامه و در برخی طرح‌ها معرفی‌نامه از بیمه‌گر. فهرست دقیق را پس از ثبت درخواست برآورد، واحد بیمه برای شما اعلام می‌کند.", unit: OFF, ok: d(30) },
        { s: 1, id: 6, cat: "time", q: "نوبت جراحی من چه روزی و چه ساعتی است؟", a: "پس از اینکه پذیرش برنامه جراحی شما را قطعی کرد، تاریخ و «ساعت حضور در مرکز» در بخش «نوبت من» همین صفحه و در پنل بیمار نمایش داده می‌شود و پیامک اطلاع‌رسانی هم دریافت می‌کنید.", act: "me", unit: REC, ok: d(7) },
        { s: 1, id: 7, cat: "time", q: "ساعت حضور با ساعت شروع عمل فرق دارد؟", a: "بله. ساعت حضور برای پذیرش، تشکیل پرونده و آمادگی پیش از عمل است و معمولاً زودتر از شروع جراحی است. همیشه طبق «ساعت حضور» ثبت‌شده در پنل خود مراجعه کنید.", unit: REC, ok: d(7) },
        { s: 1, id: 8, cat: "time", q: "اگر نتوانم در زمان تعیین‌شده بیایم چه کنم؟", a: "در اولین فرصت با پذیرش مرکز تماس بگیرید تا زمان جدید هماهنگ شود. تغییر زمان پس از ثبت در سیستم، در پنل شما به‌روز می‌شود.", unit: REC, ok: d(7) },
        { s: 1, id: 9, cat: "pre", q: "چند ساعت قبل از عمل باید ناشتا باشم؟", a: "زمان دقیق ناشتایی را پزشک یا متخصص بیهوشی برای شما تعیین می‌کند و به نوع عمل و بیهوشی بستگی دارد. دستور ثبت‌شده در راهنمای عمل و پنل خود را ملاک قرار دهید.", act: "guide", unit: REC, ok: d(20) },
        { s: 1, id: 10, cat: "pre", q: "داروهای مصرفی‌ام را قبل از عمل قطع کنم؟", a: "هیچ دارویی را بدون دستور پزشک قطع نکنید. فهرست کامل داروها، به‌خصوص داروهای رقیق‌کننده خون، دیابت و فشار خون را پیش از عمل به پزشک اطلاع دهید.", unit: REC, ok: d(20) },
        { s: 1, id: 11, cat: "docs", q: "روز عمل چه مدارکی همراه داشته باشم؟", a: "کارت ملی یا کارت شناسایی عکس‌دار، دستور بستری پزشک، جواب آزمایش‌ها و تصویربرداری‌ها، فهرست داروهای مصرفی و مدارک بیمه.", unit: REC, ok: d(7) },
        { s: 1, id: 12, cat: "docs", q: "جواب آزمایشم را کجا ببینم؟", a: "در پنل بیمار، بخش «آزمایش‌های من». وقتی جواب آماده شود اعلان دریافت می‌کنید و فایل PDF آن قابل دانلود است.", link: "patient-panel.html?go=labs", unit: REC, ok: d(7) },
        { s: 1, id: 13, cat: "post", q: "بعد از عمل چه علائمی خطرناک است؟", a: "تب، خونریزی، درد شدید یا رو به افزایش، تنگی نفس، قرمزی یا ترشح چرکی زخم و استفراغ مداوم. در این موارد منتظر پاسخ آنلاین نمانید و فوراً با مرکز تماس بگیرید یا با ۱۱۵ تماس بگیرید.", urgent: true, unit: REC, ok: d(20) },
        { s: 1, id: 14, cat: "post", q: "بخیه‌ها کی کشیده می‌شوند؟", a: "زمان کشیدن بخیه به نوع عمل و نظر پزشک بستگی دارد و در ویزیت پیگیری مشخص می‌شود. راهنمای بعد از عمل مربوط به جراحی خود را ببینید.", act: "guide", unit: REC, ok: d(20) },
        { s: 1, id: 15, cat: "post", q: "آیا برای ترخیص همراه لازم است؟", a: "بله؛ برای عمل‌هایی که با بیهوشی یا آرام‌بخش انجام می‌شود، حضور یک همراه بزرگسال برای ترخیص و بازگشت به منزل لازم است.", unit: REC, ok: d(20) }
      ],
      est: [],      /* estimate requests from patients */
      unans: [      /* questions the system could not answer */
        { s: 1, id: 1, q: "آیا بیمه بانک ملت را قبول دارید؟", mobile: "", at: d(1), done: false },
        { s: 1, id: 2, q: "پارکینگ برای همراه بیمار دارید؟", mobile: "", at: d(3), done: false }
      ],
      stats: { q: 41, ok: 33, est: 0 },
      seq: 100
    };
  }
  function dayKey() { var d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
  /* keep demo dates current: sample timestamps move with today; anything staff/patients entered keeps its real time */
  function rebase(s) {
    var t = dayKey(); if (s.seedDay === t) return false;
    if (!s.seedDay) { var n = seed(); n.est = s.est || []; n.unans = n.unans.concat((s.unans || []).filter(function (u) { return u.id > 2; })); n.stats = s.stats || n.stats; n.seq = Math.max(n.seq, s.seq || 0); Object.keys(n).forEach(function (k) { s[k] = n[k]; }); return true; }
    var a = s.seedDay.split("-"), from = new Date(+a[0], a[1] - 1, +a[2]), now = new Date(); now.setHours(0, 0, 0, 0);
    var ms = Math.round((now - from) / DAY) * DAY;
    s.ins.forEach(function (x) { if (x.s) x.upd += ms; }); s.surg.forEach(function (x) { if (x.s) x.upd += ms; });
    s.faq.forEach(function (x) { if (x.s) x.ok += ms; }); s.unans.forEach(function (x) { if (x.s) x.at += ms; });
    s.seedDay = t; return true;
  }
  function load() { var s = null; try { s = JSON.parse(localStorage.getItem(KEY)); } catch (e) { } if (!s || s.v !== 1) { s = seed(); save(s); return s; } if (rebase(s)) save(s); return s; }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { } }
  function find(arr, id) { return arr.filter(function (x) { return x.id === id; })[0]; }

  /* ---- estimate engine: uses only staff-entered rules; returns parts + state ---- */
  function estimate(S, baseId, suppId, surgId) {
    var b = find(S.ins, baseId), s = find(S.ins, suppId), g = find(S.surg, surgId);
    if (!b || !s || !g) return null;
    var T = g.t, r = { T: T, base: 0, supp: 0, pay: T, state: "ok", notes: [], baseState: "", suppState: "" };
    if (g.cov === "no") { r.state = "nocov"; r.baseState = r.suppState = "no"; return r; }
    if (b.status === "active") { r.base = Math.round(T * b.share / 100 / 1e5) * 1e5; r.baseState = "ok"; }
    else if (b.status === "limited") { r.baseState = "inq"; r.state = "partial"; r.notes.push(b.note || "پوشش بیمه پایه نیازمند استعلام است."); }
    else { r.baseState = "self"; }
    if (s.status === "active") { r.supp = Math.min(s.cap || Infinity, Math.round((T - r.base) * s.share / 100 / 1e5) * 1e5); r.suppState = "ok"; if (s.cap && r.supp === s.cap) r.notes.push("سهم بیمه تکمیلی به سقف تعهد طرح نمونه رسیده است."); }
    else if (s.status === "limited" || s.status === "unknown") { r.suppState = "inq"; r.state = "partial"; if (s.note) r.notes.push(s.note); }
    else if (s.status === "none") { r.suppState = "none"; r.notes.push(s.note || "این بیمه طرف قرارداد مرکز نیست."); }
    else r.suppState = "self";
    if (g.cov === "cond") { r.state = r.state === "ok" ? "cond" : r.state; r.notes.unshift(g.cond); }
    r.pay = T - r.base - r.supp;
    return r;
  }

  /* ---- intent matcher for the smart search (keyword rules, no guessing) ---- */
  var INTENTS = [
    { k: "urgent", w: ["تب", "خونریزی", "درد شدید", "تنگی نفس", "عفونت", "چرک", "استفراغ", "اورژانس", "بیهوش"] },
    { k: "ins", w: ["بیمه", "تکمیلی", "تامین", "تأمین", "سلامت", "قرارداد", "پوشش", "دانا", "آسیا", "البرز", "پاسارگاد", "معلم", "معرفی نامه", "معرفی‌نامه"] },
    { k: "cost", w: ["هزینه", "قیمت", "چقدر", "چند", "پول", "تعرفه", "پرداخت", "مبلغ", "برآورد"] },
    { k: "me", w: ["نوبت", "ساعت", "کی بیام", "چه ساعتی", "چه روزی", "زمان", "تاریخ", "مراجعه", "حضور", "وقت"] },
    { k: "guide", w: ["قبل از عمل", "بعد از عمل", "ناشتا", "آمادگی", "مراقبت", "پانسمان", "بخیه", "راهنما", "رژیم", "حمام"] },
    { k: "track", w: ["پیگیری", "وضعیت", "درخواست", "کد پیگیری"] },
    { k: "lab", w: ["آزمایش", "جواب"] }
  ];
  function norm(t) { return String(t || "").replace(/ي/g, "ی").replace(/ك/g, "ک").replace(/[‌]/g, " ").replace(/\s+/g, " ").trim(); }
  function intents(q) { q = norm(q); return INTENTS.filter(function (it) { return it.w.some(function (w) { return q.indexOf(norm(w)) >= 0; }); }).map(function (it) { return it.k; }); }
  var STOP = ["آیا", "من", "را", "که", "از", "به", "با", "در", "و", "یا", "برای", "چه", "است", "هست", "می", "باید", "کنم", "دارم", "این", "آن", "تا", "هم", "یک"];
  function faqMatch(S, q) {
    var words = norm(q).split(" ").filter(function (w) { return w.length > 1 && STOP.indexOf(w) < 0; });
    if (!words.length) return [];
    return S.faq.map(function (f) {
      var hay = norm(f.q + " " + f.a), sc = 0;
      words.forEach(function (w) { if (norm(f.q).indexOf(w) >= 0) sc += 3; else if (hay.indexOf(w) >= 0) sc += 1; });
      return { f: f, sc: sc };
    }).filter(function (x) { return x.sc >= 2; }).sort(function (a, b) { return b.sc - a.sc; }).slice(0, 4).map(function (x) { return x.f; });
  }
  function surgMatch(S, q) { q = norm(q); return S.surg.filter(function (g) { return norm(g.k).split(" ").some(function (w) { return w.length > 2 && q.indexOf(w) >= 0; }); }); }

  /* ---- patient store (read-only bridge to the patient portal) ---- */
  function patient() {
    var P; try { P = JSON.parse(localStorage.getItem(PKEY)); } catch (e) { P = null; }
    if (!P || !P.session || !P.users || !P.users[P.session]) return null;
    var u = P.users[P.session];
    var reqs = (P.reqs || []).filter(function (r) { return r.mobile === P.session; }).reverse();
    return { mobile: P.session, user: u, reqs: reqs, P: P };
  }
  function notifyPatient(mobile, title, text) {
    var P; try { P = JSON.parse(localStorage.getItem(PKEY)); } catch (e) { P = null; }
    if (!P || !P.users || !P.users[mobile]) return;
    var d = new Date(), st = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { day: "numeric", month: "long", year: "numeric" }).format(d) + " · " + new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit", hour12: false }).format(d);
    P.msgs = P.msgs || []; P.msgs.push({ id: Date.now() + Math.random(), mobile: mobile, kind: "surgery", title: title, text: text, ref: null, at: st, read: false });
    try { localStorage.setItem(PKEY, JSON.stringify(P)); } catch (e) { }
  }

  window.KHA = { KEY: KEY, PKEY: PKEY, load: load, save: save, seed: seed, find: find, estimate: estimate, intents: intents, faqMatch: faqMatch, surgMatch: surgMatch, norm: norm, patient: patient, notifyPatient: notifyPatient, fa: fa };
})();
