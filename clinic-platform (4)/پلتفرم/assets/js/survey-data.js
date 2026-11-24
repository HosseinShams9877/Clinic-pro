/* =========================================================
   Patient satisfaction survey — shared definitions & store (DEMO)
   Used by: patient-panel.html (fills the survey) · quality-panel.html (reports)
   Seeded responses are SAMPLE data for the demo report.
   ========================================================= */
(function () {
  "use strict";
  var KEY = "kh-survey-demo-v1";
  var SECTIONS = {
    surgery: [
      { k: "reception", n: "پذیرش و تشکیل پرونده", ic: "i-user", r: ["زمان انتظار طولانی", "برخورد کارکنان", "اطلاع‌رسانی ناکافی", "درخواست مدارک تکراری"] },
      { k: "nurse", n: "پرستاران و مراقبت در بخش", ic: "i-shield", r: ["دیر پاسخ دادن به درخواست", "برخورد", "کنترل ناکافی درد", "آموزش ناکافی"] },
      { k: "surgeon", n: "پزشک جراح و توضیح درباره عمل", ic: "i-help", r: ["توضیح ناکافی پیش از عمل", "زمان کوتاه ویزیت", "پیگیری ناکافی بعد از عمل"] },
      { k: "outcome", n: "نتیجه عمل و وضعیت فعلی شما", ic: "i-check", r: ["هنوز مشکل دارم", "عارضه بعد از عمل", "با انتظارم متفاوت بود"] },
      { k: "anesth", n: "بیهوشی و اتاق عمل", ic: "i-flask", r: ["توضیح ناکافی درباره بیهوشی", "درد هنگام بیدار شدن", "تهوع بعد از عمل"] },
      { k: "facility", n: "نظافت، آرامش و امکانات", ic: "i-home", r: ["نظافت", "سروصدا", "غذا", "دمای اتاق"] },
      { k: "discharge", n: "ترخیص و آموزش مراقبت در منزل", ic: "i-doc", r: ["طولانی بودن ترخیص", "آموزش ناکافی", "دستورات مکتوب داده نشد"] },
      { k: "billing", n: "صورتحساب و شفافیت هزینه", ic: "i-copy", r: ["هزینه بیشتر از برآورد", "توضیح ناکافی صورتحساب", "روند طولانی بیمه"] }
    ],
    lab: [
      { k: "sampling", n: "نمونه‌گیری", ic: "i-flask", r: ["درد یا کبودی", "برخورد کارکنان", "نظافت"] },
      { k: "wait", n: "زمان انتظار در مرکز", ic: "i-clock", r: ["صف طولانی", "نوبت‌دهی نامنظم"] },
      { k: "speed", n: "سرعت آماده شدن جواب", ic: "i-cal", r: ["دیرتر از زمان اعلام‌شده", "اطلاع‌رسانی نشد"] },
      { k: "portal", n: "اطلاع‌رسانی و پنل آنلاین", ic: "i-bell", r: ["پیدا کردن جواب سخت بود", "پیامک دریافت نشد"] }
    ]
  };
  var LABELS = ["", "خیلی بد", "بد", "متوسط", "خوب", "عالی"];
  var DOCS = ["دکتر حسین طاهری نساج", "دکتر جمیله نظام‌زواره", "دکتر حسن فرجی‌پور", "دکتر داوود آقادوست", "دکتر پریسا طالبیان", "دکتر اویس احمدزاده"];
  var CMT = {
    pos: ["از برخورد پرستاران بخش خیلی راضی بودم.", "پزشک قبل از عمل همه‌چیز را کامل توضیح داد.", "نظافت بخش عالی بود.", "پیامک‌ها به‌موقع می‌رسید و نیازی به تماس نشد.", "پذیرش سریع و منظم بود."],
    neg: ["ترخیص بیش از سه ساعت طول کشید.", "مبلغ نهایی با برآورد اولیه فرق داشت و کسی توضیح نداد.", "شب‌ها سروصدای راهرو زیاد بود.", "دستورات مراقبت در منزل را فقط شفاهی گفتند.", "روند بیمه تکمیلی طولانی بود."]
  };
  function rnd(seed) { var s = seed; return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
  function seed() {
    var R = rnd(23), out = [], now = Date.now(), D = 864e5, id = 1;
    /* sample tendencies per section (mean on 1–5) — billing & discharge weaker, improving slightly over time */
    var MEAN = { reception: 4.1, nurse: 4.5, surgeon: 4.6, outcome: 4.4, anesth: 4.3, facility: 4.0, discharge: 3.5, billing: 3.2, sampling: 4.3, wait: 3.6, speed: 4.2, portal: 4.4 };
    function score(m, trend) { var x = m + trend + (R() - 0.5) * 2.2; return Math.max(1, Math.min(5, Math.round(x))); }
    for (var i = 0; i < 170; i++) {
      var age = Math.floor(R() * 178) + 1, type = R() < 0.72 ? "surgery" : "lab", trend = (178 - age) / 178 * 0.35;
      var sc = {}, rs = {}, sum = 0, n = 0;
      SECTIONS[type].forEach(function (s) {
        if (s.k === "anesth" && R() < 0.15) { sc[s.k] = 0; return; }
        var v = score(MEAN[s.k], s.k === "billing" || s.k === "discharge" ? trend : trend / 3);
        sc[s.k] = v; sum += v; n++;
        if (v <= 2) rs[s.k] = [s.r[Math.floor(R() * s.r.length)]];
      });
      var avg = sum / n, nps = Math.max(0, Math.min(10, Math.round(avg * 2 + (R() - 0.4) * 2.4)));
      var low = Object.keys(rs).length > 0, anon = R() < 0.3;
      out.push({ id: id++, at: now - age * D - Math.floor(R() * D), type: type, doc: type === "surgery" ? DOCS[Math.floor(R() * DOCS.length)] : "", scores: sc, reasons: rs, nps: nps,
        comment: R() < 0.45 ? (low ? CMT.neg : CMT.pos)[Math.floor(R() * 5)] : "", anon: anon, name: anon ? "" : "بیمار نمونه " + fa(100 + i), mobile: "", contact: low && R() < 0.6, follow: low && age > 20 ? { done: true, note: "تماس گرفته شد و موضوع به سرپرست بخش ارجاع شد.", by: "مریم صادقی", at: now - (age - 3) * D } : null, demo: true });
    }
    return { v: 1, resp: out, invites: 230, seq: 1000, seedDay: dayKey() };
  }
  var FA = "۰۱۲۳۴۵۶۷۸۹";
  function fa(s) { return String(s).replace(/\d/g, function (d) { return FA[d]; }); }
  function dayKey() { var d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
  /* keep demo dates current: sample responses move with today; real responses keep their time */
  function rebase(s) {
    var t = dayKey(); if (s.seedDay === t) return false;
    if (!s.seedDay) { var n = seed(); n.resp = n.resp.concat(s.resp.filter(function (r) { return !r.demo; })); n.seq = Math.max(n.seq, s.seq || 0); n.invites += s.resp.filter(function (r) { return !r.demo; }).length; Object.keys(n).forEach(function (k) { s[k] = n[k]; }); return true; }
    var a = s.seedDay.split("-"), from = new Date(+a[0], a[1] - 1, +a[2]), now = new Date(); now.setHours(0, 0, 0, 0); var ms = Math.round((now - from) / 864e5) * 864e5;
    s.resp.forEach(function (r) { if (r.demo) { r.at += ms; if (r.follow && r.follow.at) r.follow.at += ms; } });
    s.seedDay = t; return true;
  }
  function load() { var s = null; try { s = JSON.parse(localStorage.getItem(KEY)); } catch (e) { } if (!s || s.v !== 1) { s = seed(); save(s); return s; } if (rebase(s)) save(s); return s; }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { } }
  function add(r) { var s = load(); r.id = ++s.seq; r.at = Date.now(); s.resp.push(r); s.invites++; save(s); return r; }
  function sec(type) { return SECTIONS[type] || []; }
  function allSections() { return SECTIONS.surgery.concat(SECTIONS.lab); }
  function avg(list, k) { var v = list.map(function (r) { return r.scores[k]; }).filter(function (x) { return x > 0; }); return v.length ? { m: v.reduce(function (a, b) { return a + b; }, 0) / v.length, n: v.length, sat: v.filter(function (x) { return x >= 4; }).length / v.length } : null; }
  function overall(r) { var v = Object.keys(r.scores).map(function (k) { return r.scores[k]; }).filter(function (x) { return x > 0; }); return v.length ? v.reduce(function (a, b) { return a + b; }, 0) / v.length : 0; }
  function nps(list) { if (!list.length) return null; var p = list.filter(function (r) { return r.nps >= 9; }).length, d = list.filter(function (r) { return r.nps <= 6; }).length; return Math.round((p - d) / list.length * 100); }
  window.KHS = { KEY: KEY, SECTIONS: SECTIONS, LABELS: LABELS, load: load, save: save, add: add, sec: sec, allSections: allSections, avg: avg, overall: overall, nps: nps, seed: seed };
})();
