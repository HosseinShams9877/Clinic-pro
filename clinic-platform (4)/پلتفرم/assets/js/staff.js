/* =========================================================
   Staff portal — Kheirkhah Surgery Center (demo, localStorage)
   One personal portal for every employee; what each person sees
   depends on their permissions, not only their job title.
   ========================================================= */
(function () {
  "use strict";
  var KEY = "kh-staff-demo-v1";
  var $ = function (id) { return document.getElementById(id); };
  var app = $("app");
  var FA = "۰۱۲۳۴۵۶۷۸۹";
  function fa(s) { return String(s == null ? "" : s).replace(/\d/g, function (d) { return FA[d]; }); }
  function en(s) { return String(s || "").replace(/[۰-۹]/g, function (d) { return FA.indexOf(d); }).replace(/[٠-٩]/g, function (d) { return "٠١٢٣٤٥٦٧٨٩".indexOf(d); }); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function ic(id, c) { return "<svg" + (c ? ' class="' + c + '"' : "") + '><use href="#' + id + '"/></svg>'; }
  function arr() { return '<svg class="arr"><use href="#i-arrow"/></svg>'; }
  var nf = new Intl.NumberFormat("fa-IR");
  function toman(n) { return nf.format(Math.round(n)) + " تومان"; }
  function fD(o) { return new Intl.DateTimeFormat("fa-IR-u-ca-persian", o); }
  var jDay = fD({ day: "numeric", month: "long" }), jFull = fD({ day: "numeric", month: "long", year: "numeric" }),
      jWd = fD({ weekday: "long" }), jMon = fD({ month: "long", year: "numeric" }), jMonOnly = fD({ month: "long" }),
      jTime = new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit", hour12: false }),
      jNum = new Intl.DateTimeFormat("en-u-ca-persian", { year: "numeric", month: "numeric", day: "numeric" });
  function jp(d) { var o = {}; jNum.formatToParts(d).forEach(function (p) { if (p.type === "year" || p.type === "month" || p.type === "day") o[p.type] = +en(p.value); }); return o; }
  function day0(d) { var x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
  function add(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function key(d) { return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
  function fromKey(k) { var a = k.split("-"); return new Date(+a[0], a[1] - 1, +a[2]); }
  function sat(d) { return (d.getDay() + 1) % 7; } /* 0 = Saturday */
  var TODAY = day0(new Date());
  function stamp(d) { d = d || new Date(); return jFull.format(d) + " · " + jTime.format(d); }
  function ago(ts) {
    var d = new Date(ts), diff = Math.round((TODAY - day0(d)) / 864e5);
    if (diff <= 0) return "امروز " + jTime.format(d);
    if (diff === 1) return "دیروز";
    if (diff < 7) return fa(diff) + " روز پیش";
    return jDay.format(d);
  }
  function dur(ms) { var m = Math.max(1, Math.round(ms / 6e4)), h = Math.floor(m / 60); m = m % 60; return (h ? fa(h) + " ساعت" : "") + (h && m ? " و " : "") + (m ? fa(m) + " دقیقه" : ""); }

  /* ---------------- reference data (demo) ---------------- */
  var STAFF = {
    "09131230001": { name: "سارا احمدی", role: "کارشناس پذیرش", dept: "rec", perms: ["reception"], code: "۱۰۴۲", hire: "۱۳۹۹/۰۷/۰۱", contract: "قرارداد دائم", base: 18000000, pat: 0, nc: "0012345678", birth: "۱۳۷۲/۰۴/۱۸" },
    "09131230002": { name: "رضا کریمی", role: "نیروی خدمات", dept: "svc", perms: ["service"], code: "۱۰۸۷", hire: "۱۴۰۱/۰۲/۱۵", contract: "قرارداد یک‌ساله", base: 14500000, pat: 1, nc: "0023456789", birth: "۱۳۶۸/۱۱/۰۲" },
    "09131230003": { name: "مریم نوری", role: "پرستار اتاق عمل", dept: "or", perms: ["nurse"], code: "۱۰۵۵", hire: "۱۴۰۰/۰۵/۲۰", contract: "قرارداد دائم", base: 24000000, pat: 2, nc: "0034567891", birth: "۱۳۷۰/۰۲/۲۵" },
    "09131230004": { name: "علی رضایی", role: "حسابدار", dept: "fin", perms: ["finance"], code: "۱۰۲۱", hire: "۱۳۹۸/۰۹/۰۱", contract: "قرارداد دائم", base: 21000000, pat: 3, nc: "0045678912", birth: "۱۳۶۵/۰۶/۱۰" },
    "09131230005": { name: "نرگس محمدی", role: "سرپرست بخش پذیرش", dept: "rec", perms: ["reception", "lead"], code: "۱۰۰۸", hire: "۱۳۹۶/۰۳/۰۱", contract: "قرارداد دائم", base: 26000000, pat: 4, nc: "0056789123", birth: "۱۳۶۳/۰۸/۰۸" }
  };
  var DEPT = {
    rec: { n: "پذیرش", place: "پذیرش اصلی · ساختمان اصلی", head: "نرگس محمدی" },
    svc: { n: "خدمات", place: "بلوک جراحی · طبقه اول", head: "حسین مرادی" },
    or: { n: "اتاق عمل", place: "بلوک اتاق عمل · طبقه دوم", head: "فاطمه کاظمی (سرپرستار)" },
    fin: { n: "مالی", place: "واحد مالی · طبقه سوم", head: "محمد صادقی (مدیر مالی)" }
  };
  var COL = { rec: ["مهسا رحیمی", "زهرا قاسمی", "سارا احمدی"], svc: ["رضا کریمی", "مهدی باقری", "حسن یزدانی"], or: ["مریم نوری", "الهام شریفی", "نازنین فرهادی"], fin: ["علی رضایی", "کامران نیک‌نام"] };
  var SH = {
    M: { n: "صبح", s: "08:00", e: "16:00", ic: "i-sun", c: "m" },
    E: { n: "عصر", s: "16:00", e: "24:00", ic: "i-sunset", c: "e" },
    N: { n: "شب", s: "00:00", e: "08:00", ic: "i-moon", c: "n" },
    O: { n: "استراحت", ic: "i-pause", c: "o" }
  };
  var PAT = [
    [["M", "E", "M", "O", "M", "M", "O"], ["E", "M", "M", "O", "E", "M", "O"]],
    [["M", "M", "E", "E", "O", "M", "O"], ["E", "E", "M", "M", "O", "O", "M"]],
    [["M", "N", "O", "E", "M", "M", "O"], ["E", "M", "N", "O", "O", "M", "M"]],
    [["M", "M", "M", "M", "M", "O", "O"], ["M", "M", "M", "M", "M", "O", "O"]],
    [["M", "M", "M", "E", "M", "O", "O"], ["M", "M", "E", "M", "M", "O", "O"]]
  ];
  var TYPES = { leave: { n: "درخواست مرخصی", ic: "i-sun" }, swap: { n: "جابه‌جایی شیفت", ic: "i-swap" }, admin: { n: "درخواست اداری", ic: "i-brief" } };
  var STATUS = {
    pending: { n: "در انتظار بررسی", c: "s-rev", ic: "i-clock" },
    approved: { n: "تأییدشده", c: "s-ok", ic: "i-check" },
    rejected: { n: "ردشده", c: "s-docs", ic: "i-x" },
    fix: { n: "نیازمند اصلاح", c: "s-coord", ic: "i-alert" }
  };
  var CAT = { personal: { n: "شخصی", c: "s-sub" }, dept: { n: "بخش من", c: "s-coord" }, public: { n: "عمومی", c: "s-can" } };
  var FILES = [
    { id: 1, cat: "public", t: "بخشنامه ساعت کاری پاییز ۱۴۰۵", d: 3, kb: 240, body: ["ساعت شیفت‌ها: صبح ۰۸:۰۰ تا ۱۶:۰۰، عصر ۱۶:۰۰ تا ۲۴:۰۰، شب ۰۰:۰۰ تا ۰۸:۰۰.", "حضور ۱۵ دقیقه پیش از شروع شیفت برای تحویل‌گیری الزامی است.", "هرگونه تغییر شیفت فقط از طریق پنل پرسنل و پس از تأیید مسئول بخش معتبر است."] },
    { id: 2, cat: "public", t: "آیین‌نامه مرخصی و جابه‌جایی شیفت", d: 40, kb: 310, body: ["درخواست مرخصی استحقاقی حداقل ۴۸ ساعت قبل در پنل ثبت شود.", "مرخصی استعلاجی با بارگذاری گواهی پزشک نزد منابع انسانی تکمیل می‌شود.", "جابه‌جایی شیفت فقط با همکار هم‌بخش و پس از تأیید مسئول بخش انجام می‌شود."] },
    { id: 3, cat: "public", t: "دستورالعمل کنترل عفونت و بهداشت دست", d: 60, kb: 520, body: ["رعایت پنج موقعیت بهداشت دست در تمام بخش‌ها الزامی است.", "استفاده از تجهیزات حفاظت فردی مطابق با دستورالعمل هر بخش انجام شود."] },
    { id: 4, cat: "public", t: "راهنمای استفاده از پنل پرسنل", d: 10, kb: 180, body: ["ورود فقط با شماره موبایل ثبت‌شده در پرونده پرسنلی و کد یک‌بارمصرف انجام می‌شود.", "فیش حقوقی هر فرد فقط برای خود او قابل مشاهده است."] },
    { id: 5, cat: "rec", t: "راهنمای فرایند پذیرش بیمار جراحی", d: 15, kb: 410, body: ["بررسی برگه معرفی پزشک و تطبیق کد ملی بیمار با پرونده.", "ثبت نتیجه هر تماس جدا از وضعیت درخواست بیمار.", "اعلام تاریخ و ساعت جراحی فقط پس از تأیید برنامه اتاق عمل."] },
    { id: 6, cat: "svc", t: "دستورکار نظافت و ضدعفونی اتاق عمل", d: 12, kb: 290, body: ["نظافت کامل اتاق عمل پس از هر جراحی و ثبت در برگه کنترل.", "تعویض کیسه‌های پسماند عفونی طبق رنگ‌بندی استاندارد."] },
    { id: 7, cat: "or", t: "چک‌لیست ایمنی جراحی", d: 20, kb: 350, body: ["تأیید هویت بیمار، محل عمل و رضایت‌نامه پیش از القای بیهوشی.", "شمارش گاز و ابزار پیش از بستن زخم."] },
    { id: 8, cat: "fin", t: "دستورالعمل ثبت و بایگانی اسناد مالی", d: 25, kb: 270, body: ["هر سند باید شماره پیگیری و امضای تأییدکننده داشته باشد.", "اسناد مالی فقط در ماژول حسابداری ثبت می‌شوند، نه در پنل شخصی."] }
  ];

  /* ---------------- state ---------------- */
  function blank() { return { session: null, ov: {}, msgs: [], reqs: [], read: {}, seen: {}, extra: {}, prof: {}, notif: {}, seeded: {}, svcDone: {} }; }
  function load() { try { var s = JSON.parse(localStorage.getItem(KEY)); return s && s.msgs ? s : null; } catch (e) { return null; } }
  var S = load() || blank();
  /* keep demo dates current: sample messages/requests are rebuilt for today (user's own data is kept) */
  (function () {
    var t = new Date(); t = t.getFullYear() + "-" + (t.getMonth() + 1) + "-" + t.getDate();
    if (S.seedDay === t) return;
    S.msgs = S.msgs.filter(function (m) { return !m.s; });
    S.reqs = S.reqs.filter(function (r) { return !r.s; });
    if (!S.seedDay) { S.msgs = S.msgs.filter(function (m) { return m.replies && m.replies.length; }); S.reqs = S.reqs.filter(function (r) { return r.by.indexOf("x-") !== 0 && r.ts > Date.now() - 864e5 * 5; }); }
    S.seeded = {}; S.seedDay = t; save();
  })();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }
  var V = { name: "login" };
  function me() { var u = STAFF[S.session]; if (!u) return null; u.mobile = S.session; return u; }
  function isLead(u) { return u.perms.indexOf("lead") >= 0; }
  function headOf(u) { var h = DEPT[u.dept].head; return h === u.name ? "مدیریت داخلی مرکز" : h; }
  function nid() { return Date.now() + Math.floor(Math.random() * 1000); }

  function seed(u) {
    var now = Date.now(), H = 36e5, D = 864e5;
    if (!S.seeded._pub) {
      S.msgs.push({ s: 1, id: nid(), cat: "public", from: "مدیریت مرکز", title: "اطلاعیه عمومی پرسنل", body: "بخشنامه جدید ساعت کاری پاییز در قسمت «فایل‌ها و بخشنامه‌ها» منتشر شده است. لطفاً آن را مطالعه کنید.", ts: now - 3 * D });
      S.msgs.push({ s: 1, id: nid() + 1, cat: "public", from: "واحد مالی", title: "فیش حقوقی ماه گذشته منتشر شد", body: "فیش حقوقی ماه گذشته در بخش «فیش حقوقی» پنل شخصی شما قرار گرفت.", ts: now - 5 * D, pre: true });
      S.seeded._pub = true;
    }
    if (!S.seeded["d-" + u.dept]) {
      S.msgs.push({ s: 1, id: nid() + 2, cat: "dept", dept: u.dept, from: "مسئول بخش " + DEPT[u.dept].n, title: "اطلاعیه جلسه هماهنگی", body: "جلسه هماهنگی کارکنان بخش " + DEPT[u.dept].n + " روز سه‌شنبه ساعت ۱۴:۰۰ در سالن جلسات برگزار می‌شود. حضور همکاران شیفت صبح الزامی است.", ts: now - D });
      S.seeded["d-" + u.dept] = true;
    }
    if (!S.seeded[u.mobile]) {
      S.msgs.push({ s: 1, id: nid() + 3, cat: "personal", to: u.mobile, from: "منابع انسانی", title: "پیام مربوط به برنامه کاری", body: "لطفاً برنامه شیفت هفته آینده خود را بررسی کنید. در صورت نیاز به جابه‌جایی، تا پایان چهارشنبه درخواست ثبت کنید.", ts: now - 2 * H, reply: true, replies: [] });
      var t0 = now - 20 * D;
      S.reqs.push({ s: 1, id: nid() + 4, by: u.mobile, byName: u.name, dept: u.dept, type: "admin", data: { subject: "گواهی اشتغال به کار", note: "برای ارائه به بانک" }, status: "approved", reason: "", ts: t0,
        log: [{ t: "درخواست ثبت شد", at: stamp(new Date(t0)) }, { t: "تأیید شد؛ گواهی را از واحد اداری تحویل بگیرید.", at: stamp(new Date(t0 + D)) }] });
      S.seeded[u.mobile] = true;
    }
    if (isLead(u) && !S.seeded._team) {
      var k1 = key(add(TODAY, 6)), k2 = key(add(TODAY, 7)), k3 = key(add(TODAY, 3));
      S.reqs.push({ s: 1, id: nid() + 5, by: "x-mahsa", byName: "مهسا رحیمی", dept: "rec", type: "leave", data: { lt: "استحقاقی", from: k1, to: k2, note: "سفر خانوادگی" }, status: "pending", reason: "", ts: now - 5 * H, log: [{ t: "درخواست ثبت شد", at: stamp(new Date(now - 5 * H)) }] });
      S.reqs.push({ s: 1, id: nid() + 6, by: "x-zahra", byName: "زهرا قاسمی", dept: "rec", type: "swap", data: { date: k3, with: "مهسا رحیمی", note: "شیفت عصر با صبح جابه‌جا شود" }, status: "pending", reason: "", ts: now - 26 * H, log: [{ t: "درخواست ثبت شد", at: stamp(new Date(now - 26 * H)) }] });
      S.seeded._team = true;
    }
    save();
  }

  /* ---------------- derived data ---------------- */
  function shift(u, d) {
    var o = (S.ov[u.mobile] || {})[key(d)];
    if (o) return { t: o.t, changed: true, note: o.note };
    var wk = Math.floor(Math.round((day0(d) - new Date(2024, 0, 6)) / 864e5) / 7);
    var t = PAT[u.pat][((wk % 2) + 2) % 2][sat(d)];
    var note = sat(d) === 0 && t === "M" ? "جلسه کوتاه هماهنگی ابتدای هفته، ساعت ۰۸:۱۵" : "";
    return { t: t, note: note };
  }
  function at(d, hhmm) { var p = hhmm.split(":"), x = new Date(d); x.setHours(+p[0], +p[1], 0, 0); return x; }
  function live(u) {
    var s = shift(u, TODAY), t = SH[s.t], now = new Date();
    if (s.t === "O") return { off: true };
    var st = at(TODAY, t.s), et = at(TODAY, t.e);
    if (now < st) return { txt: "شروع تا " + dur(st - now) };
    if (now < et) return { txt: "در حال انجام · " + dur(et - now) + " تا پایان", on: true, pct: Math.round((now - st) / (et - st) * 100) };
    return { txt: "شیفت امروز پایان یافته است" };
  }
  function nextShift(u) { for (var i = 1; i < 15; i++) { var d = add(TODAY, i), s = shift(u, d); if (s.t !== "O") return { d: d, s: s }; } return null; }
  function msgsOf(u) {
    return S.msgs.filter(function (m) { return m.cat === "public" || (m.cat === "dept" && m.dept === u.dept) || (m.cat === "personal" && m.to === u.mobile); })
      .sort(function (a, b) { return b.ts - a.ts; });
  }
  function isRead(u, m) { return m.pre || !!(S.read[u.mobile] || {})[m.id]; }
  function unread(u) { return msgsOf(u).filter(function (m) { return !isRead(u, m); }).length; }
  function reqsOf(u) { return S.reqs.filter(function (r) { return r.by === u.mobile; }).sort(function (a, b) { return b.ts - a.ts; }); }
  function teamReqs(u) { return S.reqs.filter(function (r) { return r.dept === u.dept && r.by !== u.mobile; }).sort(function (a, b) { return b.ts - a.ts; }); }

  function months(n) {
    var out = [], d = TODAY;
    while (jp(d).day > 1) d = add(d, -1);
    var cur = { y: jp(d).year, m: jp(d).month, label: jMon.format(d), short: jMonOnly.format(d), cur: true };
    for (var i = 0; i < n; i++) { d = add(d, -1); var p = jp(d); out.push({ y: p.year, m: p.month, label: jMon.format(d), short: jMonOnly.format(d) }); while (jp(d).day > 1) d = add(d, -1); }
    return { cur: cur, past: out };
  }
  function slips(u) {
    var M = months(6), list = M.past.slice();
    if ((S.extra[u.mobile] || {})[M.cur.y + "-" + M.cur.m]) list.unshift(M.cur);
    return { list: list, pending: list[0] === M.cur ? null : M.cur };
  }
  function slipCalc(u, mo) {
    var seedN = (mo.m * 7 + u.pat * 3) % 6, base = u.base;
    var ot = [6, 9, 4, 12, 8, 10][seedN] * Math.round(base / 192 * 1.4 / 1000) * 1000;
    var rows = [["حقوق پایه", base], ["حق مسکن", 900000], ["بن خواربار", 1400000]];
    if (u.dept === "or" || u.dept === "svc") rows.push(["فوق‌العاده نوبت‌کاری", Math.round(base * 0.1 / 1000) * 1000]);
    rows.push(["اضافه‌کاری (" + fa([6, 9, 4, 12, 8, 10][seedN]) + " ساعت)", ot]);
    var gross = rows.reduce(function (s, r) { return s + r[1]; }, 0);
    var ins = Math.round(gross * 0.07 / 1000) * 1000, tax = Math.max(0, Math.round((gross - 24000000) * 0.1 / 1000) * 1000);
    var ded = [["بیمه تأمین اجتماعی (سهم کارمند)", ins]];
    if (tax) ded.push(["مالیات حقوق", tax]);
    var dsum = ins + tax;
    return { rows: rows, ded: ded, gross: gross, dsum: dsum, net: gross - dsum };
  }
  function slipKey(mo) { return mo.y + "-" + mo.m; }
  function slipSeen(u, mo) { return !!(S.seen[u.mobile] || {})[slipKey(mo)]; }

  /* ---------------- UI helpers ---------------- */
  function toast(t, bad) { var el = $("toast"); el.textContent = t; el.className = "toast in" + (bad ? " bad" : ""); clearTimeout(toast.t); toast.t = setTimeout(function () { el.className = "toast"; }, 2800); }
  function openModal(html, cls) { var m = $("modal"); $("mCard").innerHTML = html; m.className = "modal" + (cls ? " " + cls : ""); m.hidden = false; document.body.classList.add("m-open"); }
  function closeModal() { $("modal").hidden = true; document.body.classList.remove("m-open"); }
  $("modal").addEventListener("click", function (e) { if (e.target.closest("[data-close]")) closeModal(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !$("modal").hidden) closeModal(); });
  function badge(st) { var s = STATUS[st]; return '<span class="st ' + s.c + '">' + ic(s.ic) + s.n + "</span>"; }
  function shBadge(s) { var t = SH[s.t]; return '<span class="sb sb-' + t.c + '">' + ic(t.ic) + t.n + "</span>"; }
  function hours(s) { var t = SH[s.t]; return s.t === "O" ? "—" : '<span dir="ltr">' + t.s + " – " + t.e + "</span>"; }
  function head(t, sub, back) { return '<div class="ph">' + (back ? '<button class="back" data-go="' + back + '">' + ic("i-back") + "بازگشت</button>" : "") + "<h1>" + t + "</h1>" + (sub ? "<p>" + sub + "</p>" : "") + "</div>"; }
  function go(name, extra) { V = { name: name, wk: 0, mo: 0, tab: "all" }; if (extra) for (var k in extra) V[k] = extra[k]; render(); scrollTo(0, 0); }

  /* ================= LOGIN ================= */
  function vLogin() {
    var card = !V.otp ?
      '<h1>ورود به پنل پرسنل</h1><p class="sub">با شماره موبایلی که در پرونده پرسنلی شما ثبت شده است وارد شوید.</p>' +
      '<label class="fl" for="mob">شماره موبایل</label><div class="inp ltr">' + ic("i-phone") + '<input id="mob" inputmode="numeric" maxlength="11" placeholder="۰۹۱۳۱۲۳۰۰۰۱" autocomplete="tel" value="' + fa(V.mobile || "") + '"></div>' +
      '<button class="btn pri block" id="getOtp">دریافت کد تأیید' + arr() + "</button>" +
      '<details class="demo-nums"><summary>' + ic("i-users") + "شماره‌های نمایشی پرسنل</summary><div>" +
      Object.keys(STAFF).map(function (m) { var s = STAFF[m]; return '<button type="button" data-fill="' + m + '"><b>' + s.name + "</b><small>" + s.role + '</small><span dir="ltr">' + fa(m) + "</span></button>"; }).join("") +
      "</div></details>" +
      '<p class="fine">' + ic("i-shield") + "فقط کارکنانی که پرونده پرسنلی فعال دارند می‌توانند وارد شوند.</p>"
      :
      '<h1>کد تأیید را وارد کنید</h1><p class="sub">کد ۵ رقمی به <b dir="ltr">' + fa(V.mobile.slice(0, 4) + "•••" + V.mobile.slice(-4)) + '</b> ارسال شد. <button class="link" id="editMob">ویرایش شماره</button></p>' +
      '<div class="otp" id="otp">' + "<input inputmode='numeric' maxlength='1' aria-label='رقم'>".repeat(5) + "</div>" +
      '<div class="demo-code">نسخه نمایشی · کد: <b dir="ltr">' + fa(V.otp) + "</b></div>" +
      '<button class="btn pri block" id="verify">تأیید و ورود' + arr() + '</button><p class="resend" id="resend"></p>';
    app.innerHTML = '<div class="auth"><a class="logo" href="index.html"><span>' + ic("i-logo") + '</span><div><small>مرکز جراحی فوق تخصصی</small><b>دکتر خیرخواه</b></div></a>' +
      '<div class="split"><div class="hero-img staff-hero"><img src="assets/img/corridor-wide.jpg" alt=""><div class="hero-t"><h2>پنل پرسنل</h2>' +
      "<ul><li>" + ic("i-cal") + "برنامه شیفت و تغییرات آن</li><li>" + ic("i-wallet") + "فیش حقوقی ماهانه، کاملاً خصوصی</li><li>" + ic("i-doc") + "درخواست مرخصی و جابه‌جایی شیفت بدون مراجعه حضوری</li></ul></div></div>" +
      '<section class="card narrow">' + card + "</section></div></div>";
    if (!V.otp) {
      var send = function () {
        var m = en($("mob").value).replace(/\D/g, "");
        if (!/^09\d{9}$/.test(m)) return toast("شماره موبایل را درست وارد کنید.", true);
        if (!STAFF[m]) return toast("این شماره در پرونده پرسنلی ثبت نشده است. با منابع انسانی تماس بگیرید.", true);
        V.mobile = m; V.otp = String(10000 + Math.floor(Math.random() * 89999)); V.sent = Date.now(); vLogin();
      };
      $("getOtp").addEventListener("click", send);
      $("mob").addEventListener("keydown", function (e) { if (e.key === "Enter") send(); });
      document.querySelectorAll("[data-fill]").forEach(function (b) { b.addEventListener("click", function () { $("mob").value = fa(b.dataset.fill); $("mob").focus(); }); });
      return;
    }
    var ins = Array.prototype.slice.call(document.querySelectorAll("#otp input"));
    ins[0].focus();
    ins.forEach(function (inp, i) {
      inp.addEventListener("input", function () { inp.value = fa(en(inp.value).replace(/\D/g, "").slice(-1)); if (inp.value && ins[i + 1]) ins[i + 1].focus(); if (ins.every(function (x) { return x.value; })) $("verify").click(); });
      inp.addEventListener("keydown", function (e) { if (e.key === "Backspace" && !inp.value && ins[i - 1]) ins[i - 1].focus(); });
      inp.addEventListener("paste", function (e) { var t = en(e.clipboardData.getData("text")).replace(/\D/g, ""); if (t.length >= 5) { e.preventDefault(); ins.forEach(function (x, k) { x.value = fa(t[k]); }); $("verify").click(); } });
    });
    $("editMob").addEventListener("click", function () { V.otp = null; vLogin(); });
    $("verify").addEventListener("click", function () {
      var code = en(ins.map(function (x) { return x.value; }).join(""));
      if (code !== V.otp) { toast("کد واردشده درست نیست.", true); ins.forEach(function (x) { x.value = ""; }); ins[0].focus(); return; }
      S.session = V.mobile; save(); seed(me()); go("dash"); toast("خوش آمدید، " + me().name);
    });
    (function tick() {
      var el = $("resend"); if (!el || !V.otp) return;
      var left = 60 - Math.floor((Date.now() - V.sent) / 1000);
      if (left > 0) { el.textContent = "ارسال مجدد کد تا " + fa(left) + " ثانیه دیگر"; setTimeout(tick, 1000); }
      else { el.innerHTML = '<button class="link" id="again">ارسال مجدد کد</button>'; $("again").addEventListener("click", function () { V.otp = String(10000 + Math.floor(Math.random() * 89999)); V.sent = Date.now(); vLogin(); toast("کد جدید ارسال شد."); }); }
    })();
  }

  /* ================= SHELL ================= */
  var NAV = [["dash", "داشبورد", "i-home"], ["msgs", "پیام‌ها", "i-msg"], ["shifts", "برنامه شیفت", "i-cal"], ["pay", "فیش حقوقی", "i-wallet"], ["reqs", "درخواست‌های من", "i-doc"], ["team", "درخواست‌های تیم", "i-users", "lead"], ["prof", "پرونده پرسنلی من", "i-user"], ["files", "فایل‌ها و بخشنامه‌ها", "i-folder"]];
  var GROUP = { dash: "dash", msgs: "msgs", msg: "msgs", shifts: "shifts", pay: "pay", slip: "pay", reqs: "reqs", reqNew: "reqs", team: "team", prof: "prof", files: "files" };
  function shell(html) {
    var u = me(), n = unread(u), act = GROUP[V.name], tq = isLead(u) ? teamReqs(u).filter(function (r) { return r.status === "pending"; }).length : 0;
    var nav = NAV.filter(function (x) { return !x[3] || u.perms.indexOf(x[3]) >= 0; }).map(function (x) {
      var dot = x[0] === "msgs" && n ? '<i class="dot">' + fa(n) + "</i>" : x[0] === "team" && tq ? '<i class="dot">' + fa(tq) + "</i>" : "";
      return '<button data-go="' + x[0] + '"' + (act === x[0] ? ' class="on" aria-current="page"' : "") + ">" + ic(x[2]) + x[1] + dot + "</button>";
    }).join("");
    var more = ["pay", "reqs", "team", "prof", "files"].indexOf(act) >= 0;
    return '<div class="shell"><aside class="side"><a class="logo" href="index.html"><span>' + ic("i-logo") + '</span><div><small>مرکز جراحی فوق تخصصی</small><b>دکتر خیرخواه</b></div></a>' +
      '<nav class="snav" aria-label="منوی پنل پرسنل">' + nav + '</nav><button class="out" id="logout">' + ic("i-out") + "خروج از حساب</button></aside>" +
      '<div class="main"><header class="bar">' +
      '<a class="logo m-only" href="index.html"><span>' + ic("i-logo") + "</span><b>پنل پرسنل</b></a>" +
      '<div class="srch"><span>' + ic("i-search") + '</span><input id="q" placeholder="جستجو در بخش‌های پنل…" autocomplete="off" aria-label="جستجو"><div class="sres" id="qr" hidden></div></div>' +
      '<button class="ic bell" data-go="msgs" aria-label="پیام‌ها">' + ic("i-bell") + (n ? "<i>" + fa(n) + "</i>" : "") + "</button>" +
      '<div class="chip-d"><b>' + DEPT[u.dept].n + "</b><small>" + DEPT[u.dept].place.split(" · ").pop() + "</small></div>" +
      '<button class="me" data-go="prof"><span class="av">' + u.name.charAt(0) + "</span><div><b>" + u.name + "</b><small>" + u.role + "</small></div></button></header>" +
      '<div class="content in" id="content">' + html + "</div></div>" +
      '<nav class="tabbar" aria-label="منوی موبایل">' +
      '<button data-go="dash"' + (act === "dash" ? ' class="on"' : "") + ">" + ic("i-home") + "خانه</button>" +
      '<button data-go="shifts"' + (act === "shifts" ? ' class="on"' : "") + ">" + ic("i-cal") + "شیفت‌ها</button>" +
      '<button data-go="msgs"' + (act === "msgs" ? ' class="on"' : "") + ">" + ic("i-msg") + "پیام‌ها" + (n ? "<i></i>" : "") + "</button>" +
      '<button id="moreB"' + (more ? ' class="on"' : "") + ">" + ic("i-dots") + "بیشتر" + (tq ? "<i></i>" : "") + "</button></nav></div>";
  }
  function moreSheet() {
    var u = me(), items = [["pay", "فیش حقوقی", "i-wallet"], ["reqs", "درخواست‌های من", "i-doc"]];
    if (isLead(u)) items.push(["team", "درخواست‌های تیم", "i-users"]);
    items.push(["prof", "پرونده پرسنلی من", "i-user"], ["files", "فایل‌ها و بخشنامه‌ها", "i-folder"]);
    openModal('<div class="more"><span class="grab"></span><h2>بیشتر</h2>' + items.map(function (x) { return '<button data-go="' + x[0] + '">' + '<span class="ri">' + ic(x[2]) + "</span>" + x[1] + ic("i-chev") + "</button>"; }).join("") +
      '<button class="lo" id="logout2">' + '<span class="ri">' + ic("i-out") + "</span>خروج از حساب</button></div>", "sheet");
    $("mCard").querySelectorAll("[data-go]").forEach(function (b) { b.addEventListener("click", function () { closeModal(); go(b.dataset.go); }); });
    $("logout2").addEventListener("click", function () { closeModal(); logout(); });
  }
  function logout() { S.session = null; save(); V = { name: "login" }; render(); toast("از حساب خارج شدید."); }

  /* ================= DASHBOARD ================= */
  function greet() { var h = new Date().getHours(); return h < 11 ? "صبح بخیر" : h < 16 ? "روز بخیر" : h < 20 ? "عصر بخیر" : "شب بخیر"; }
  function weekCells(u, start, compact) {
    var html = "";
    for (var i = 0; i < 7; i++) {
      var d = add(start, i), s = shift(u, d), t = SH[s.t], today = +d === +TODAY;
      html += '<button class="wd wd-' + t.c + (today ? " today" : "") + (s.changed ? " chg" : "") + '" data-day="' + key(d) + '">' +
        "<small>" + jWd.format(d) + "</small><em>" + jDay.format(d) + "</em>" +
        '<span class="wt">' + ic(t.ic) + t.n + "</span>" +
        (s.t === "O" ? '<b class="wh">—</b>' : '<b class="wh" dir="ltr">' + t.s + "<br>" + t.e + "</b>") +
        (s.changed ? '<i class="chg-t">تغییر</i>' : "") + "</button>";
    }
    return html;
  }
  function weekStart(off) { return add(TODAY, -sat(TODAY) + 7 * (off || 0)); }
  function vDash() {
    var u = me(), n = unread(u), lv = live(u), ts = shift(u, TODAY), sl = slips(u), last = sl.list[0], R = reqsOf(u), lr = R[0], M = msgsOf(u), nx = nextShift(u);
    var ws = weekStart(V.wk);
    var shiftCard = ts.t === "O" ?
      '<b>امروز استراحت</b><p>' + (nx ? "شیفت بعدی: " + jWd.format(nx.d) + " · " + SH[nx.s.t].n : "") + "</p>" :
      '<b dir="ltr" class="big-h">' + SH[ts.t].s + " - " + SH[ts.t].e + "</b><p>" + SH[ts.t].n + " · " + DEPT[u.dept].place.split(" · ")[0] + "</p>" +
      (lv.on ? '<span class="lbar"><i style="width:' + lv.pct + '%"></i></span>' : "") + '<small class="live' + (lv.on ? " on" : "") + '">' + lv.txt + "</small>";
    var exc = excl(u);
    var html =
      '<section class="welcome s-wel"><div class="w-t"><h1>سلام ' + u.name.split(" ")[0] + ' عزیز</h1><p class="hi">' + ic("i-sun") + greet() + "</p>" +
      '<p class="w-p">خوش‌آمدید به پنل پرسنل مرکز جراحی دکتر خیرخواه. برنامه کاری، پیام‌ها و فیش‌های حقوقی شما در این صفحه در دسترس است.</p>' +
      '<div class="who"><span>' + u.role + " · بخش " + DEPT[u.dept].n + '</span><span class="st s-ok">' + ic("i-check") + "پرسنل فعال</span></div></div>" +
      '<div class="w-img"><img src="assets/img/corridor-wide.jpg" alt=""></div></section>' +
      '<div class="stats">' +
      '<button class="stat" data-day="' + key(TODAY) + '"><span class="si si-b">' + ic("i-cal") + '</span><div><h3>شیفت امروز</h3><small>' + jWd.format(TODAY) + " " + jDay.format(TODAY) + "</small>" + shiftCard + "</div></button>" +
      '<button class="stat" data-go="msgs"><span class="si si-r">' + ic("i-msg") + '</span><div><h3>پیام‌های جدید</h3>' + (n ? '<b class="cnt">' + fa(n) + ' <small>پیام خوانده‌نشده</small></b>' : '<p>پیام خوانده‌نشده‌ای ندارید.</p>') + "<p>" + (M[0] ? esc(M[0].title) : "") + "</p></div></button>" +
      '<button class="stat" ' + (last ? 'data-slip="' + slipKey(last) + '"' : 'data-go="pay"') + '><span class="si si-g">' + ic("i-wallet") + '</span><div><h3>آخرین فیش حقوقی</h3><b>' + (last ? last.label : "—") + "</b>" + (last ? (slipSeen(u, last) ? '<p class="mut">مشاهده‌شده</p>' : '<p class="okc">' + ic("i-check") + "آماده مشاهده</p>") : "") + "</div></button>" +
      '<div class="stat"><span class="si si-v">' + ic("i-doc") + '</span><div><h3>درخواست‌های من</h3>' +
      (lr ? '<p class="lr">' + TYPES[lr.type].n + "</p>" + badge(lr.status) : "<p>درخواستی ندارید.</p>") +
      '<button class="btn sm pri lv" data-go="reqNew">' + ic("i-plus") + "درخواست مرخصی</button></div></div></div>" +
      '<div class="sgrid">' +
      '<section class="box qa d-only"><header><h2>دسترسی سریع</h2></header><div class="qgrid">' +
      [["reqNew", "ثبت درخواست", "i-plus"], ["pay", "فیش حقوقی", "i-wallet"], ["shifts", "برنامه شیفت", "i-cal"], ["msgs", "پیام‌ها", "i-msg"], ["prof", "اطلاعات شخصی", "i-user"], ["files", "فایل‌های مرکز", "i-folder"]]
        .map(function (x) { return '<button data-go="' + x[0] + '">' + ic(x[2]) + x[1] + "</button>"; }).join("") + "</div></section>" +
      '<section class="box d-only"><header><h2>اعلان‌ها و پیام‌های اخیر</h2><button class="more" data-go="msgs">مشاهده همه</button></header><ul class="rows">' +
      M.slice(0, 4).map(function (m) { return '<li><button data-msg="' + m.id + '"><span class="ri">' + ic(m.cat === "personal" ? "i-user" : m.cat === "dept" ? "i-users" : "i-bell") + "</span><div><b>" + esc(m.from) + "</b><small>" + esc(m.title) + "</small></div><span class=\"tm\">" + (isRead(u, m) ? "" : '<i class="ud"></i>') + ago(m.ts) + "</span></button></li>"; }).join("") + "</ul></section>" +
      '<section class="box wk-box"><header><h2>برنامه شیفت ' + (V.wk === 0 ? "این هفته" : V.wk === 1 ? "هفته بعد" : "هفته قبل") + '</h2><div class="wnav"><button class="ic" data-wk="-1" aria-label="هفته قبل"' + (V.wk <= -1 ? " disabled" : "") + ">" + ic("i-back") + '</button><button class="ic" data-wk="1" aria-label="هفته بعد"' + (V.wk >= 1 ? " disabled" : "") + ">" + ic("i-chev") + '</button></div></header><div class="week" id="week">' + weekCells(u, ws) + '</div><button class="more wk-all" data-go="shifts">مشاهده برنامه کامل</button></section>' +
      "</div>" +
      (exc ? '<section class="box excl"><header><h2>' + ic("i-lock") + 'دسترسی‌های اختصاصی شما</h2><small class="mut">بر اساس مجوزهای حساب شما؛ جدا از اطلاعات شخصی</small></header><div class="ex-g">' + exc + "</div></section>" : "");
    return html;
  }
  function excl(u) {
    var o = [];
    if (u.perms.indexOf("reception") >= 0) o.push('<a class="exi" href="surgery-panel.html">' + '<span class="ri">' + ic("i-cal") + "</span><div><b>پنل پذیرش جراحی</b><small>صف درخواست‌های جراحی و تقویم اتاق عمل</small></div>" + ic("i-chev") + "</a>");
    if (u.perms.indexOf("lead") >= 0) { var q = teamReqs(u).filter(function (r) { return r.status === "pending"; }).length; o.push('<button class="exi" data-go="team"><span class="ri">' + ic("i-users") + "</span><div><b>بررسی درخواست‌های تیم</b><small>" + (q ? fa(q) + " درخواست در انتظار بررسی" : "درخواست در انتظاری نیست") + "</small></div>" + ic("i-chev") + "</button>"); }
    if (u.perms.indexOf("service") >= 0) { var dn = Object.keys(S.svcDone[key(TODAY)] || {}).length; o.push('<button class="exi" id="svcB"><span class="ri">' + ic("i-list") + "</span><div><b>دستورکار خدماتی امروز</b><small>" + fa(dn) + " از ۴ مورد انجام شده</small></div>" + ic("i-chev") + "</button>"); }
    if (u.perms.indexOf("nurse") >= 0) o.push('<button class="exi" id="nurseB"><span class="ri">' + ic("i-flask") + "</span><div><b>برنامه بخش و وظایف درمانی</b><small>جراحی‌های امروز بلوک اتاق عمل</small></div>" + ic("i-chev") + "</button>");
    if (u.perms.indexOf("finance") >= 0) o.push('<button class="exi" id="finB"><span class="ri">' + ic("i-wallet") + "</span><div><b>پنل مالی · تسویه پزشکان</b><small>ورود جداگانه با دسترسی مالی</small></div>" + ic("i-chev") + "</button>");
    return o.join("");
  }
  var SVC = ["نظافت و ضدعفونی اتاق عمل ۱ پس از هر جراحی", "تخلیه پسماند عفونی بلوک جراحی", "تأمین ملحفه تمیز بخش بستری روزانه", "ثبت برگه کنترل نظافت پایان شیفت"];
  function svcModal() {
    var k = key(TODAY), done = S.svcDone[k] || {};
    openModal('<div class="mp"><h2>' + ic("i-list") + "دستورکار خدماتی امروز</h2><p class=\"mut sm\">" + jFull.format(TODAY) + " · تعیین‌شده توسط مسئول خدمات</p>" +
      SVC.map(function (t, i) { return '<label class="chk"><input type="checkbox" data-i="' + i + '"' + (done[i] ? " checked" : "") + "><span>" + ic("i-check") + "</span>" + t + "</label>"; }).join("") +
      '</div><div class="m-foot"><button class="btn pri" data-close>بستن</button></div>');
    $("mCard").querySelectorAll("[data-i]").forEach(function (c) { c.addEventListener("change", function () { S.svcDone[k] = S.svcDone[k] || {}; if (c.checked) S.svcDone[k][c.dataset.i] = 1; else delete S.svcDone[k][c.dataset.i]; save(); render(); }); });
  }
  function nurseModal() {
    var rows = [["۰۸:۳۰", "اتاق عمل ۱", "کوله‌سیستکتومی لاپاراسکوپیک"], ["۱۰:۳۰", "اتاق عمل ۲", "سزارین"], ["۱۳:۰۰", "اتاق عمل ۱", "ترمیم فتق اینگوینال"]];
    openModal('<div class="mp"><h2>' + ic("i-flask") + "برنامه امروز بلوک اتاق عمل</h2><p class=\"mut sm\">نمونه نمایشی · در نسخه کامل از ماژول بخش خوانده می‌شود</p>" +
      '<table class="tbl"><thead><tr><th>ساعت</th><th>اتاق</th><th>عمل</th></tr></thead><tbody>' + rows.map(function (r) { return "<tr><td>" + r[0] + "</td><td>" + r[1] + "</td><td>" + r[2] + "</td></tr>"; }).join("") + "</tbody></table>" +
      '<p class="fine left">' + ic("i-shield") + "اطلاعات هویتی بیماران فقط در ماژول بخش و برای کادر درمان مجاز نمایش داده می‌شود.</p></div>" +
      '<div class="m-foot"><button class="btn pri" data-close>بستن</button></div>');
  }

  /* ================= SHIFTS ================= */
  function shiftModal(k) {
    var u = me(), d = fromKey(k), s = shift(u, d), t = SH[s.t], future = d >= TODAY;
    openModal('<div class="mp"><div class="mh"><div><small>' + jWd.format(d) + "</small><h2>" + jFull.format(d) + "</h2></div>" + shBadge(s) + "</div>" +
      (s.changed ? '<div class="warn sm">' + ic("i-alert") + "<p>این شیفت توسط منابع انسانی تغییر کرده است." + (s.note ? " " + esc(s.note) : "") + "</p></div>" : "") +
      (s.t === "O" ? '<p class="mut">در این روز شیفتی برای شما ثبت نشده است.</p>' :
        '<dl class="sum"><dt>ساعت شروع</dt><dd dir="ltr">' + t.s + "</dd><dt>ساعت پایان</dt><dd dir=\"ltr\">" + t.e + "</dd><dt>بخش محل خدمت</dt><dd>" + DEPT[u.dept].place + "</dd><dt>مسئول شیفت</dt><dd>" + headOf(u) + "</dd>" +
        (s.note && !s.changed ? "<dt>توضیحات</dt><dd>" + esc(s.note) + "</dd>" : "") + "</dl>") +
      '</div><div class="m-foot">' + (future && s.t !== "O" ? '<button class="btn" id="toSwap">' + ic("i-swap") + "درخواست جابه‌جایی</button>" : "") + '<button class="btn pri" data-close>بستن</button></div>');
    if ($("toSwap")) $("toSwap").addEventListener("click", function () { closeModal(); go("reqNew", { type: "swap", pre: k }); });
  }
  function vShifts() {
    var u = me(), mode = V.mode || "week", html = head("برنامه شیفت من", "روی هر روز بزنید تا جزئیات شیفت را ببینید.");
    html += '<div class="tabs"><button data-mode="week"' + (mode === "week" ? ' class="on"' : "") + '>هفتگی</button><button data-mode="month"' + (mode === "month" ? ' class="on"' : "") + ">ماهانه</button></div>";
    if (mode === "week") {
      var ws = weekStart(V.wk), we = add(ws, 6);
      html += '<section class="box"><header><div class="pnav"><button class="ic" data-wk="-1" aria-label="قبلی">' + ic("i-back") + "</button><b>" + jDay.format(ws) + " تا " + jDay.format(we) + '</b><button class="ic" data-wk="1" aria-label="بعدی">' + ic("i-chev") + "</button></div>" + (V.wk ? '<button class="more" data-wk="0">این هفته</button>' : "") + '</header><ul class="slist">';
      for (var i = 0; i < 7; i++) {
        var d = add(ws, i), s = shift(u, d);
        html += '<li><button data-day="' + key(d) + '" class="' + (+d === +TODAY ? "today " : "") + (s.t === "O" ? "off" : "") + '"><div class="sl-d"><b>' + jWd.format(d) + "</b><small>" + jDay.format(d) + (+d === +TODAY ? " · امروز" : "") + '</small></div><span class="sl-h">' + hours(s) + "</span>" + shBadge(s) + (s.changed ? '<i class="chg-t">تغییر کرده</i>' : "") + ic("i-chev") + "</button></li>";
      }
      html += "</ul></section>";
    } else {
      var base = TODAY; for (var m = 0; m !== V.mo;) { if (V.mo > 0) { base = add(base, 32); m++; } else { base = add(base, -32); m--; } }
      var d1 = base; while (jp(d1).day > 1) d1 = add(d1, -1);
      var last = d1, mm = jp(d1).month; while (jp(add(last, 1)).month === mm) last = add(last, 1);
      var cells = "", off = sat(d1);
      for (var b = 0; b < off; b++) cells += '<span class="mc nil"></span>';
      for (var x = d1; x <= last; x = add(x, 1)) {
        var sx = shift(u, x), tx = SH[sx.t];
        cells += '<button class="mc mc-' + tx.c + (+x === +TODAY ? " today" : "") + (sx.changed ? " chg" : "") + '" data-day="' + key(x) + '"><em>' + fa(jp(x).day) + '</em><span>' + ic(tx.ic) + "<b>" + tx.n + "</b></span>" + (sx.t !== "O" ? '<small dir="ltr">' + tx.s + "–" + tx.e + "</small>" : "") + "</button>";
      }
      html += '<section class="box"><header><div class="pnav"><button class="ic" data-mo="-1" aria-label="ماه قبل"' + (V.mo <= -2 ? " disabled" : "") + ">" + ic("i-back") + "</button><b>" + jMon.format(d1) + '</b><button class="ic" data-mo="1" aria-label="ماه بعد"' + (V.mo >= 1 ? " disabled" : "") + ">" + ic("i-chev") + "</button></div></header>" +
        '<div class="mgrid">' + ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"].map(function (w) { return '<span class="mw">' + w + "</span>"; }).join("") + cells + "</div>" +
        '<div class="legend">' + ["M", "E", "N", "O"].map(function (k) { return shBadge({ t: k }); }).join("") + "</div></section>";
    }
    html += '<p class="fine left">' + ic("i-alert") + "این صفحه برنامه‌ریزی شیفت است و جایگزین ثبت حضور و غیاب نیست. هر تغییر در برنامه با اعلان" + (((S.notif[u.mobile] || {}).sms !== false) ? " و پیامک" : "") + " به شما اطلاع داده می‌شود.</p>";
    return html;
  }

  /* ================= PAYSLIP ================= */
  function slipRep(u, mo) {
    var c = slipCalc(u, mo);
    return '<div class="rep slip"><header><a class="logo"><span>' + ic("i-logo") + '</span><div><small>مرکز جراحی فوق تخصصی</small><b>دکتر خیرخواه</b></div></a><span class="stamp">اطلاعات نمونه و غیرواقعی</span></header>' +
      "<h2>فیش حقوقی " + mo.label + '</h2><dl class="rmeta"><dt>نام</dt><dd>' + u.name + "</dd><dt>کد پرسنلی</dt><dd>" + u.code + "</dd><dt>سمت</dt><dd>" + u.role + "</dd><dt>بخش</dt><dd>" + DEPT[u.dept].n + "</dd></dl>" +
      '<table><thead><tr><th>شرح</th><th>مبلغ</th></tr></thead><tbody>' +
      '<tr class="grp"><td colspan="2">حقوق و مزایا</td></tr>' + c.rows.map(function (r) { return "<tr><td>" + r[0] + "</td><td>" + toman(r[1]) + "</td></tr>"; }).join("") +
      '<tr class="tot"><td>جمع حقوق و مزایا</td><td>' + toman(c.gross) + "</td></tr>" +
      '<tr class="grp"><td colspan="2">کسورات</td></tr>' + c.ded.map(function (r) { return "<tr><td>" + r[0] + "</td><td>" + toman(r[1]) + "</td></tr>"; }).join("") +
      '<tr class="tot"><td>جمع کسورات</td><td>' + toman(c.dsum) + "</td></tr>" +
      '<tr class="net"><td>خالص پرداختی</td><td>' + toman(c.net) + "</td></tr></tbody></table>" +
      '<p class="rnote">منتشرشده توسط واحد مالی · این فیش فقط برای صاحب حساب قابل مشاهده است.</p></div>';
  }
  function printSlip(u, mo) { openModal(slipRep(u, mo) + '<div class="m-foot"><button class="btn" data-close>بستن</button><button class="btn pri" id="prt">' + ic("i-dl") + "ذخیره PDF / چاپ</button></div>"); $("prt").addEventListener("click", function () { window.print(); }); setTimeout(function () { window.print(); }, 300); }
  function vPay() {
    var u = me(), sl = slips(u), top = sl.list[0], c = slipCalc(u, top);
    var html = head("فیش حقوقی من", "فیش‌های ماه‌های گذشته را ببینید یا ذخیره کنید.") +
      '<div class="priv">' + ic("i-lock") + "<p>فیش حقوقی شما کاملاً خصوصی است؛ هیچ همکار دیگری، حتی با داشتن آدرس فایل، به آن دسترسی ندارد.</p></div>" +
      '<div class="pay-g"><section class="card ptop"><div class="mh"><div><small>آخرین فیش منتشرشده</small><h2>فیش ' + top.label + '</h2><small class="mut">منتشرشده توسط واحد مالی</small></div><span class="st s-ok">' + ic("i-check") + "آماده مشاهده</span></div>" +
      '<dl class="sum"><dt>حقوق پایه</dt><dd>' + toman(c.rows[0][1]) + "</dd><dt>مزایا و اضافه‌کاری</dt><dd>" + toman(c.gross - c.rows[0][1]) + "</dd><dt>کسورات</dt><dd>" + toman(c.dsum) + '</dd><dt class="nt">خالص پرداختی</dt><dd class="nt">' + toman(c.net) + "</dd></dl>" +
      '<div class="two-b"><button class="btn pri" data-slip="' + slipKey(top) + '">' + ic("i-doc") + 'مشاهده کامل فیش</button><button class="btn" data-pdf="' + slipKey(top) + '">' + ic("i-dl") + "دانلود PDF</button></div>" +
      '<p class="mut sm stamp-n">اطلاعات نمونه و غیرواقعی</p></section>' +
      '<section class="box"><header><h2>فیش‌های ماه‌های گذشته</h2></header><ul class="plist">' +
      (sl.pending ? '<li class="pend"><span class="ri">' + ic("i-clock") + "</span><div><b>" + sl.pending.label + "</b><small>پس از پایان ماه توسط واحد مالی منتشر می‌شود</small></div><button class=\"btn sm\" disabled>" + ic("i-dl") + "دانلود</button></li>" : "") +
      sl.list.map(function (mo) { var seen = slipSeen(u, mo); return '<li><span class="ri">' + ic("i-doc") + '</span><div><button class="lnk" data-slip="' + slipKey(mo) + '"><b>' + mo.label + "</b></button><small>PDF · " + (seen ? "مشاهده‌شده" : '<span class="okc">جدید</span>') + '</small></div><button class="btn sm" data-pdf="' + slipKey(mo) + '">' + ic("i-dl") + "دانلود</button></li>"; }).join("") +
      "</ul></section></div>";
    return html;
  }
  function findSlip(u, k) { return slips(u).list.filter(function (m) { return slipKey(m) === k; })[0]; }
  function vSlip() {
    var u = me(), mo = findSlip(u, V.k);
    if (!mo) return head("فیش یافت نشد", "", "pay");
    S.seen[u.mobile] = S.seen[u.mobile] || {}; S.seen[u.mobile][V.k] = 1; save();
    return head("فیش حقوقی " + mo.label, "", "pay") + '<section class="card wide slip-c">' + slipRep(u, mo) + '<div class="two-b"><button class="btn pri" data-pdf="' + V.k + '">' + ic("i-dl") + "دانلود PDF</button></div></section>";
  }

  /* ================= MESSAGES ================= */
  function vMsgs() {
    var u = me(), tab = V.tab || "all", M = msgsOf(u).filter(function (m) { return tab === "all" || m.cat === tab; });
    var counts = function (c) { var n = msgsOf(u).filter(function (m) { return (c === "all" || m.cat === c) && !isRead(u, m); }).length; return n ? " <i class=\"tc\">" + fa(n) + "</i>" : ""; };
    return head("پیام‌ها و اطلاعیه‌ها", "پیام‌های شخصی، پیام‌های بخش شما و اطلاعیه‌های عمومی مرکز.") +
      '<div class="tabs">' + [["all", "همه"], ["personal", "شخصی"], ["dept", "بخش من"], ["public", "عمومی"]].map(function (t) { return '<button data-tab="' + t[0] + '"' + (tab === t[0] ? ' class="on"' : "") + ">" + t[1] + counts(t[0]) + "</button>"; }).join("") +
      (unread(u) ? '<button class="link" id="allRead">علامت‌گذاری همه به‌عنوان خوانده‌شده</button>' : "") + "</div>" +
      (M.length ? '<ul class="inbox">' + M.map(function (m) {
        return '<li class="' + (isRead(u, m) ? "" : "unread") + '"><button data-msg="' + m.id + '"><span class="mi ' + (m.cat === "personal" ? "" : m.cat === "dept" ? "dp" : "pb") + '">' + ic(m.cat === "personal" ? "i-user" : m.cat === "dept" ? "i-users" : "i-bell") + "</span><div><b>" + esc(m.title) + "</b><p>" + esc(m.from) + " — " + esc(m.body.slice(0, 80)) + (m.body.length > 80 ? "…" : "") + '</p><small>' + ago(m.ts) + ' · <span class="st ' + CAT[m.cat].c + ' xs">' + CAT[m.cat].n + "</span></small></div>" + ic("i-chev") + "</button></li>";
      }).join("") + "</ul>" : '<div class="empty">' + ic("i-msg") + "<b>پیامی در این دسته نیست</b></div>");
  }
  function vMsg() {
    var u = me(), m = msgsOf(u).filter(function (x) { return x.id === V.id; })[0];
    if (!m) return head("پیام یافت نشد", "", "msgs");
    S.read[u.mobile] = S.read[u.mobile] || {}; if (!S.read[u.mobile][m.id]) { S.read[u.mobile][m.id] = Date.now(); save(); }
    var rp = m.replies || [];
    return head(esc(m.title), "", "msgs") + '<section class="card wide msgv"><div class="mh"><div class="from"><span class="mi">' + ic(m.cat === "personal" ? "i-user" : m.cat === "dept" ? "i-users" : "i-bell") + "</span><div><b>" + esc(m.from) + "</b><small>" + stamp(new Date(m.ts)) + '</small></div></div><span class="st ' + CAT[m.cat].c + '">' + CAT[m.cat].n + "</span></div>" +
      '<p class="body">' + esc(m.body) + "</p>" +
      '<p class="rd">' + ic("i-check") + "خوانده شد · " + stamp(new Date(S.read[u.mobile][m.id])) + "</p>" +
      (rp.length ? '<h3 class="h3">پاسخ‌های شما</h3><ul class="rpl">' + rp.map(function (r) { return "<li><p>" + esc(r.t) + "</p><small>" + r.at + "</small></li>"; }).join("") + "</ul>" : "") +
      (m.reply ? '<label class="fl" for="rt">پاسخ به ' + esc(m.from) + '</label><textarea id="rt" rows="3" placeholder="متن پاسخ…"></textarea><button class="btn pri sm2" id="rs">' + ic("i-send") + "ارسال پاسخ</button>"
        : '<p class="fine left">' + ic("i-lock") + "پاسخ‌دادن برای این نوع پیام فعال نیست.</p>") + "</section>";
  }

  /* ================= REQUESTS ================= */
  function dShort(k) { var d = fromKey(k); return jWd.format(d) + " " + jDay.format(d); }
  function days(a, b) { return Math.round((fromKey(b) - fromKey(a)) / 864e5) + 1; }
  function reqSum(r) {
    var d = r.data;
    if (r.type === "leave") return d.lt === "ساعتی" ? "مرخصی ساعتی · " + dShort(d.from) + " · " + fa(d.h1) + " تا " + fa(d.h2) : "مرخصی " + d.lt + " · " + (d.from === d.to ? dShort(d.from) : "از " + dShort(d.from) + " تا " + dShort(d.to)) + " · " + fa(days(d.from, d.to)) + " روز";
    if (r.type === "swap") return "شیفت " + dShort(d.date) + " با " + d.with;
    return d.subject;
  }
  function reqCard(r, team) {
    return '<article class="rq"><header><span class="ri">' + ic(TYPES[r.type].ic) + "</span><div><b>" + (team ? r.byName + " · " : "") + TYPES[r.type].n + "</b><small>ثبت: " + ago(r.ts) + "</small></div>" + badge(r.status) + "</header>" +
      "<p>" + reqSum(r) + "</p>" + (r.data.note ? '<p class="mut sm">توضیح: ' + esc(r.data.note) + "</p>" : "") +
      (r.reason && (r.status === "rejected" || r.status === "fix") ? '<div class="warn sm ' + (r.status === "rejected" ? "bad" : "") + '">' + ic("i-alert") + "<p><b>" + (r.status === "rejected" ? "دلیل رد: " : "مورد اصلاح: ") + "</b>" + esc(r.reason) + "</p></div>" : "") +
      (!team && r.status === "fix" ? '<button class="btn pri sm2" data-edit="' + r.id + '">' + ic("i-doc") + "اصلاح و ارسال مجدد</button>" : "") +
      (team && r.status === "pending" ? '<div class="rq-a"><button class="btn sm pri" data-ap="' + r.id + '">' + ic("i-check") + 'تأیید</button><button class="btn sm" data-fx="' + r.id + '">' + ic("i-alert") + 'نیازمند اصلاح</button><button class="btn sm danger" data-rj="' + r.id + '">' + ic("i-x") + "رد</button></div>" : "") +
      '<details class="lg"><summary>سابقه درخواست</summary><ul class="tl">' + r.log.slice().reverse().map(function (l) { return "<li>" + esc(l.t) + "<small>" + l.at + "</small></li>"; }).join("") + "</ul></details></article>";
  }
  function vReqs() {
    var u = me(), R = reqsOf(u);
    return head("درخواست‌های من", "درخواست مرخصی، جابه‌جایی شیفت و درخواست‌های اداری؛ بدون مراجعه حضوری.") +
      '<button class="btn pri fab0" data-go="reqNew">' + ic("i-plus") + "ثبت درخواست جدید</button>" +
      (R.length ? '<div class="rqs">' + R.map(function (r) { return reqCard(r); }).join("") + "</div>" : '<div class="empty">' + ic("i-doc") + "<b>درخواستی ثبت نکرده‌اید</b></div>");
  }
  function dateOpts(from, n, sel, filter) {
    var o = "";
    for (var i = 0; i < n; i++) { var d = add(from, i), k = key(d); if (filter && !filter(d)) continue; o += '<option value="' + k + '"' + (k === sel ? " selected" : "") + ">" + jWd.format(d) + " " + jFull.format(d) + (filter ? " · " + SH[shift(me(), d).t].n : "") + "</option>"; }
    return o;
  }
  function vReqNew() {
    var u = me(), ty = V.type || "leave", ed = V.edit ? S.reqs.filter(function (r) { return r.id === V.edit; })[0] : null, d = ed ? ed.data : {};
    if (ed) ty = ed.type;
    var f = "";
    if (ty === "leave") {
      var lt = V.lt || d.lt || "استحقاقی", from = V.from || d.from || key(add(TODAY, 2)), to = V.to || d.to || from;
      if (fromKey(to) < fromKey(from)) to = from;
      f = '<label class="fl" for="lt">نوع مرخصی <i>*</i></label><div class="seg" id="lt">' + ["استحقاقی", "استعلاجی", "بدون حقوق", "ساعتی"].map(function (x) { return '<button type="button" data-lt="' + x + '"' + (x === lt ? ' class="on"' : "") + ">" + x + "</button>"; }).join("") + "</div>" +
        (lt === "ساعتی" ?
          '<label class="fl" for="fr">تاریخ <i>*</i></label><select class="sel" id="fr">' + dateOpts(TODAY, 45, from) + "</select>" +
          '<div class="two"><div><label class="fl" for="h1">از ساعت</label><select class="sel" id="h1">' + hourOpts(d.h1 || "10:00") + '</select></div><div><label class="fl" for="h2">تا ساعت</label><select class="sel" id="h2">' + hourOpts(d.h2 || "12:00") + "</select></div></div>"
          :
          '<div class="two"><div><label class="fl" for="fr">از تاریخ <i>*</i></label><select class="sel" id="fr">' + dateOpts(TODAY, 45, from) + '</select></div><div><label class="fl" for="to">تا تاریخ <i>*</i></label><select class="sel" id="to">' + dateOpts(fromKey(from), 30, to) + "</select></div></div>" +
          '<p class="calc">' + ic("i-cal") + "مدت مرخصی: <b>" + fa(days(from, to)) + " روز</b></p>") +
        (lt === "استعلاجی" ? '<div class="note">' + ic("i-alert") + "<p>گواهی پزشک را پس از ثبت، به منابع انسانی تحویل دهید.</p></div>" : "");
    } else if (ty === "swap") {
      var sd = V.pre || d.date || "";
      f = '<label class="fl" for="sd">شیفتی که می‌خواهید جابه‌جا شود <i>*</i></label><select class="sel" id="sd"><option value="">انتخاب کنید…</option>' + dateOpts(add(TODAY, 1), 21, sd, function (x) { return shift(u, x).t !== "O"; }) + "</select>" +
        '<label class="fl" for="sw">همکار جایگزین (هم‌بخش) <i>*</i></label><select class="sel" id="sw"><option value="">انتخاب کنید…</option>' + COL[u.dept].filter(function (n) { return n !== u.name; }).map(function (n) { return "<option" + (n === d.with ? " selected" : "") + ">" + n + "</option>"; }).join("") + "</select>" +
        '<small class="hint">جابه‌جایی فقط با همکار همان بخش و پس از تأیید مسئول بخش انجام می‌شود.</small>';
    } else {
      f = '<label class="fl" for="sj">موضوع <i>*</i></label><select class="sel" id="sj">' + ["گواهی اشتغال به کار", "اصلاح اطلاعات پرونده", "معرفی‌نامه", "سایر"].map(function (x) { return "<option" + (x === d.subject ? " selected" : "") + ">" + x + "</option>"; }).join("") + "</select>";
    }
    var html = head(ed ? "اصلاح درخواست" : "ثبت درخواست جدید", "درخواست برای " + (ty === "admin" ? "واحد اداری" : headOf(u)) + " ارسال می‌شود.", ed ? "reqs" : "reqs") + '<section class="card form">' +
      (ed ? '<div class="warn sm">' + ic("i-alert") + "<p><b>مورد اصلاح: </b>" + esc(ed.reason) + "</p></div>" :
        '<div class="rtype">' + [["leave", "مرخصی", "i-sun"], ["swap", "جابه‌جایی شیفت", "i-swap"], ["admin", "درخواست اداری", "i-brief"]].map(function (x) { return '<button type="button" data-ty="' + x[0] + '"' + (x[0] === ty ? ' class="on" aria-pressed="true"' : "") + ">" + ic(x[2]) + x[1] + "</button>"; }).join("") + "</div>") +
      f + '<label class="fl" for="nt">توضیحات ' + (ty === "admin" ? "<i>*</i>" : '<span class="opt">(اختیاری)</span>') + '</label><textarea id="nt" rows="3" placeholder="' + (ty === "admin" ? "درخواست خود را شرح دهید…" : "در صورت نیاز توضیح دهید…") + '">' + esc(V.note != null ? V.note : d.note || "") + "</textarea>" +
      '<button class="btn pri block" id="sendR">' + ic("i-send") + (ed ? "ارسال مجدد درخواست" : "ثبت و ارسال درخواست") + "</button></section>";
    return html;
  }
  function hourOpts(sel) { var o = ""; for (var h = 7; h <= 22; h++) { var v = (h < 10 ? "0" : "") + h + ":00"; o += '<option value="' + v + '"' + (v === sel ? " selected" : "") + ">" + fa(v) + "</option>"; } return o; }
  function bindReqNew() {
    var keep = function () { if ($("nt")) V.note = $("nt").value; };
    document.querySelectorAll("[data-ty]").forEach(function (b) { b.addEventListener("click", function () { keep(); V.type = b.dataset.ty; V.pre = null; render(); }); });
    document.querySelectorAll("[data-lt]").forEach(function (b) { b.addEventListener("click", function () { keep(); V.lt = b.dataset.lt; render(); }); });
    if ($("fr")) $("fr").addEventListener("change", function () { keep(); V.from = $("fr").value; if (!$("to") || fromKey($("to").value) < fromKey(V.from)) V.to = V.from; else V.to = $("to").value; render(); });
    if ($("to")) $("to").addEventListener("change", function () { keep(); V.from = $("fr").value; V.to = $("to").value; render(); });
    $("sendR").addEventListener("click", function () {
      var u = me(), ed = V.edit ? S.reqs.filter(function (r) { return r.id === V.edit; })[0] : null, ty = ed ? ed.type : V.type || "leave", note = $("nt").value.trim(), data;
      if (ty === "leave") {
        var lt = document.querySelector("[data-lt].on").dataset.lt;
        data = { lt: lt, from: $("fr").value, to: $("to") ? $("to").value : $("fr").value, note: note };
        if (lt === "ساعتی") { data.h1 = $("h1").value; data.h2 = $("h2").value; if (data.h2 <= data.h1) return toast("ساعت پایان باید بعد از ساعت شروع باشد.", true); }
      } else if (ty === "swap") {
        if (!$("sd").value) return toast("شیفت موردنظر را انتخاب کنید.", true);
        if (!$("sw").value) return toast("همکار جایگزین را انتخاب کنید.", true);
        data = { date: $("sd").value, with: $("sw").value, note: note };
      } else {
        if (note.length < 5) return toast("توضیحات درخواست را بنویسید.", true);
        data = { subject: $("sj").value, note: note };
      }
      if (ed) { ed.data = data; ed.status = "pending"; ed.log.push({ t: "اصلاح و ارسال مجدد توسط شما", at: stamp() }); }
      else S.reqs.push({ id: nid(), by: u.mobile, byName: u.name, dept: u.dept, type: ty, data: data, status: "pending", reason: "", ts: Date.now(), log: [{ t: "درخواست ثبت شد و برای " + (ty === "admin" ? "واحد اداری" : headOf(u)) + " ارسال شد", at: stamp() }] });
      save(); go("reqs"); toast(ed ? "درخواست اصلاح‌شده ارسال شد." : "درخواست شما ثبت و ارسال شد.");
    });
  }

  /* ================= TEAM (supervisor) ================= */
  function vTeam() {
    var u = me();
    if (!isLead(u)) return '<div class="empty">' + ic("i-lock") + "<b>به این بخش دسترسی ندارید</b><p>بررسی درخواست‌های تیم فقط برای مسئولان بخش فعال است.</p></div>";
    var T = teamReqs(u), P = T.filter(function (r) { return r.status === "pending"; }), D = T.filter(function (r) { return r.status !== "pending"; });
    return head("درخواست‌های تیم", "درخواست‌های کارکنان بخش " + DEPT[u.dept].n + "؛ فقط کارکنان تحت مدیریت شما.") +
      '<h2 class="h2">در انتظار بررسی <span>' + fa(P.length) + "</span></h2>" +
      (P.length ? '<div class="rqs">' + P.map(function (r) { return reqCard(r, true); }).join("") + "</div>" : '<div class="empty sm">' + ic("i-check") + "<b>درخواست در انتظاری نیست</b></div>") +
      (D.length ? '<h2 class="h2">بررسی‌شده <span>' + fa(D.length) + '</span></h2><div class="rqs">' + D.map(function (r) { return reqCard(r, true); }).join("") + "</div>" : "");
  }
  function decide(id, st) {
    var u = me(), r = S.reqs.filter(function (x) { return x.id === id; })[0]; if (!r) return;
    var finish = function (reason) {
      r.status = st; r.reason = reason || "";
      r.log.push({ t: (st === "approved" ? "تأیید شد" : st === "rejected" ? "رد شد: " + reason : "نیازمند اصلاح: " + reason) + " · " + u.name, at: stamp() });
      if (STAFF[r.by]) S.msgs.push({ id: nid(), cat: "personal", to: r.by, from: u.name + " · مسئول بخش", title: TYPES[r.type].n + ": " + STATUS[st].n, body: reqSum(r) + (reason ? " — " + reason : ""), ts: Date.now() });
      if (st === "approved" && r.type === "swap" && STAFF[r.by]) { S.ov[r.by] = S.ov[r.by] || {}; S.ov[r.by][r.data.date] = { t: "O", note: "جابه‌جایی با " + r.data.with + " تأیید شد." }; }
      save(); closeModal(); render(); toast("نتیجه بررسی ثبت و به همکار اطلاع داده شد.");
    };
    if (st === "approved") return finish("");
    openModal('<div class="mp"><h2>' + (st === "rejected" ? "دلیل رد درخواست" : "مورد اصلاح") + '</h2><p class="mut sm">' + r.byName + " · " + reqSum(r) + '</p><textarea id="why" rows="3" placeholder="' + (st === "rejected" ? "دلیل مشخص رد را بنویسید…" : "بنویسید چه چیزی باید اصلاح شود…") + '"></textarea><small class="hint">این متن برای همکار نمایش داده می‌شود و ثبت آن الزامی است.</small></div>' +
      '<div class="m-foot"><button class="btn" data-close>انصراف</button><button class="btn pri" id="whyOk">ثبت</button></div>');
    $("why").focus();
    $("whyOk").addEventListener("click", function () { var w = $("why").value.trim(); if (w.length < 4) return toast("دلیل را بنویسید.", true); finish(w); });
  }

  /* ================= PROFILE ================= */
  function vProf() {
    var u = me(), p = S.prof[u.mobile] || {}, nt = S.notif[u.mobile] || {};
    var perms = { reception: "دسترسی به پنل پذیرش جراحی", lead: "بررسی درخواست‌های کارکنان بخش", service: "دستورکارهای خدماتی", nurse: "برنامه بخش و وظایف درمانی", finance: "ماژول حسابداری (ورود جداگانه)" };
    return head("پرونده پرسنلی من", "اطلاعات فردی و شغلی شما.") + '<div class="acct">' +
      '<section class="card"><h2 class="h2">' + ic("i-user") + "اطلاعات فردی</h2>" +
      '<dl class="sum"><dt>نام و نام خانوادگی</dt><dd>' + u.name + '</dd><dt>کد ملی</dt><dd dir="ltr">' + fa(u.nc.slice(0, 3) + "•••••" + u.nc.slice(-2)) + '</dd><dt>تاریخ تولد</dt><dd>' + u.birth + '</dd><dt>شماره موبایل</dt><dd dir="ltr">' + fa(u.mobile) + "</dd></dl>" +
      '<label class="fl" for="ad">نشانی محل سکونت</label><div class="inp">' + ic("i-pin") + '<input id="ad" value="' + esc(p.ad || "") + '" placeholder="کاشان، …"></div>' +
      '<label class="fl" for="em">شماره تماس اضطراری</label><div class="inp ltr">' + ic("i-call") + '<input id="em" inputmode="numeric" maxlength="11" value="' + fa(p.em || "") + '" placeholder="۰۹۱۳…"></div>' +
      '<button class="btn pri" id="saveP">ذخیره تغییرات</button></section>' +
      '<div class="pcol"><section class="card"><h2 class="h2">' + ic("i-brief") + "اطلاعات شغلی</h2>" +
      '<dl class="sum"><dt>کد پرسنلی</dt><dd>' + u.code + "</dd><dt>سمت</dt><dd>" + u.role + "</dd><dt>بخش</dt><dd>" + DEPT[u.dept].n + "</dd><dt>محل فعالیت</dt><dd>" + DEPT[u.dept].place + "</dd><dt>مسئول مستقیم</dt><dd>" + headOf(u) + "</dd><dt>تاریخ استخدام</dt><dd>" + u.hire + "</dd><dt>نوع قرارداد</dt><dd>" + u.contract + "</dd></dl>" +
      '<p class="fine left">' + ic("i-alert") + 'برای اصلاح اطلاعات شغلی، <button class="link" data-go="reqNew" data-ty0="admin">درخواست اداری</button> ثبت کنید.</p></section>' +
      '<section class="card"><h2 class="h2">' + ic("i-bell") + "اعلان‌ها</h2>" +
      [["sms", "پیامک تغییر شیفت", "هر تغییر در برنامه شیفت پیامک می‌شود."], ["slip", "پیامک انتشار فیش", "پیامک کوتاه بدون ذکر مبلغ."], ["dept", "اعلان پیام‌های بخش", "اطلاعیه‌های مسئول بخش"]].map(function (x) { return '<label class="tog"><input type="checkbox" data-nt="' + x[0] + '"' + (nt[x[0]] === false ? "" : " checked") + "><span></span><div><b>" + x[1] + "</b><small>" + x[2] + "</small></div></label>"; }).join("") + "</section>" +
      '<section class="card"><h2 class="h2">' + ic("i-lock") + "دسترسی‌های حساب</h2><ul class=\"perm\"><li>" + ic("i-check") + "شیفت، فیش حقوقی، پیام‌ها و درخواست‌های شخصی</li>" + u.perms.map(function (k) { return "<li>" + ic("i-check") + perms[k] + "</li>"; }).join("") + '</ul><small class="hint">دسترسی‌ها بر اساس مجوز واقعی حساب تنظیم می‌شوند، نه فقط عنوان شغلی.</small></section></div></div>' +
      '<button class="link danger" id="out2">خروج از حساب</button>';
  }

  /* ================= FILES ================= */
  function filesOf(u) { return FILES.filter(function (f) { return f.cat === "public" || f.cat === u.dept; }); }
  function fileModal(f) {
    openModal('<div class="rep"><header><a class="logo"><span>' + ic("i-logo") + '</span><div><small>مرکز جراحی فوق تخصصی</small><b>دکتر خیرخواه</b></div></a><span class="stamp">متن نمونه</span></header><h2>' + f.t + "</h2><p class=\"mut sm\">" + (f.cat === "public" ? "عمومی · همه کارکنان" : "ویژه بخش " + DEPT[f.cat].n) + " · " + jFull.format(add(TODAY, -f.d)) + "</p><ol class=\"fb\">" + f.body.map(function (b) { return "<li>" + b + "</li>"; }).join("") + '</ol><p class="rnote">محتوای واقعی بخشنامه‌ها توسط مدیریت مرکز بارگذاری می‌شود.</p></div>' +
      '<div class="m-foot"><button class="btn" data-close>بستن</button><button class="btn pri" id="prt">' + ic("i-dl") + "دانلود PDF</button></div>");
    $("prt").addEventListener("click", function () { window.print(); });
  }
  function vFiles() {
    var u = me(), tab = V.tab || "all", F = filesOf(u).filter(function (f) { return tab === "all" || (tab === "public" ? f.cat === "public" : f.cat !== "public"); });
    return head("فایل‌ها و بخشنامه‌ها", "اسناد عمومی مرکز و دستورالعمل‌های مرتبط با شغل شما.") +
      '<div class="tabs">' + [["all", "همه"], ["public", "عمومی"], ["dept", "بخش من"]].map(function (t) { return '<button data-tab="' + t[0] + '"' + (tab === t[0] ? ' class="on"' : "") + ">" + t[1] + "</button>"; }).join("") + "</div>" +
      '<ul class="flist">' + F.map(function (f) { return '<li><span class="ri pdf">' + ic("i-doc") + '</span><div><button class="lnk" data-file="' + f.id + '"><b>' + f.t + "</b></button><small>" + (f.cat === "public" ? "عمومی" : "بخش " + DEPT[f.cat].n) + " · " + jDay.format(add(TODAY, -f.d)) + " · PDF " + fa(f.kb) + " KB" + (f.d <= 7 ? ' · <span class="okc">جدید</span>' : "") + '</small></div><button class="btn sm" data-file="' + f.id + '">' + ic("i-doc") + "مشاهده</button></li>"; }).join("") + "</ul>";
  }

  /* ================= SEARCH ================= */
  function bindSearch() {
    var q = $("q"), box = $("qr"); if (!q) return;
    var u = me();
    var idx = NAV.filter(function (x) { return !x[3] || u.perms.indexOf(x[3]) >= 0; }).map(function (x) { return { t: x[1], s: "بخش", go: x[0], k: x[1] }; })
      .concat([{ t: "ثبت درخواست مرخصی", s: "درخواست", go: "reqNew", k: "مرخصی درخواست" }, { t: "درخواست جابه‌جایی شیفت", s: "درخواست", go: "reqNew", ty: "swap", k: "جابجایی جابه‌جایی شیفت" }])
      .concat(msgsOf(u).map(function (m) { return { t: m.title, s: "پیام", msg: m.id, k: m.title + " " + m.from }; }))
      .concat(filesOf(u).map(function (f) { return { t: f.t, s: "فایل", file: f.id, k: f.t }; }));
    q.addEventListener("input", function () {
      var v = q.value.trim().replace(/ي/g, "ی").replace(/ك/g, "ک");
      if (!v) { box.hidden = true; return; }
      var R = idx.filter(function (x) { return x.k.replace(/‌/g, " ").indexOf(v.replace(/‌/g, " ")) >= 0 || x.k.indexOf(v) >= 0; }).slice(0, 7);
      box.innerHTML = R.length ? R.map(function (x, i) { return '<button data-i="' + i + '"><small>' + x.s + "</small>" + esc(x.t) + "</button>"; }).join("") : '<p>نتیجه‌ای یافت نشد.</p>';
      box.hidden = false;
      box.querySelectorAll("[data-i]").forEach(function (b) {
        b.addEventListener("mousedown", function (e) {
          e.preventDefault(); var x = R[+b.dataset.i];
          if (x.msg) go("msg", { id: x.msg }); else if (x.file) { box.hidden = true; fileModal(FILES.filter(function (f) { return f.id === x.file; })[0]); } else go(x.go, x.ty ? { type: x.ty } : null);
        });
      });
    });
    q.addEventListener("blur", function () { setTimeout(function () { box.hidden = true; }, 150); });
    q.addEventListener("keydown", function (e) { if (e.key === "Escape") { q.value = ""; box.hidden = true; q.blur(); } if (e.key === "Enter") { var f = box.querySelector("[data-i]"); if (f) f.dispatchEvent(new MouseEvent("mousedown")); } });
  }

  /* ================= RENDER ================= */
  var VIEWS = { dash: vDash, shifts: vShifts, pay: vPay, slip: vSlip, msgs: vMsgs, msg: vMsg, reqs: vReqs, reqNew: vReqNew, team: vTeam, prof: vProf, files: vFiles };
  function render() {
    var u = me();
    if (!u) { $("demo").hidden = true; return vLogin(); }
    if (!VIEWS[V.name]) V.name = "dash";
    var body = VIEWS[V.name]();
    app.innerHTML = shell(body);
    bind();
    demo();
  }
  function bind() {
    var u = me();
    document.querySelectorAll("[data-go]").forEach(function (b) { b.addEventListener("click", function () { go(b.dataset.go, b.dataset.ty0 ? { type: b.dataset.ty0 } : null); }); });
    document.querySelectorAll("[data-day]").forEach(function (b) { b.addEventListener("click", function () { shiftModal(b.dataset.day); }); });
    document.querySelectorAll("[data-wk]").forEach(function (b) { b.addEventListener("click", function () { var v = +b.dataset.wk; V.wk = v === 0 ? 0 : (V.wk || 0) + v; if (V.name === "dash") V.wk = Math.max(-1, Math.min(1, V.wk)); render(); }); });
    document.querySelectorAll("[data-mo]").forEach(function (b) { b.addEventListener("click", function () { V.mo = (V.mo || 0) + +b.dataset.mo; render(); }); });
    document.querySelectorAll("[data-mode]").forEach(function (b) { b.addEventListener("click", function () { V.mode = b.dataset.mode; V.wk = 0; V.mo = 0; render(); }); });
    document.querySelectorAll("[data-tab]").forEach(function (b) { b.addEventListener("click", function () { V.tab = b.dataset.tab; render(); }); });
    document.querySelectorAll("[data-msg]").forEach(function (b) { b.addEventListener("click", function () { go("msg", { id: +b.dataset.msg }); }); });
    document.querySelectorAll("[data-slip]").forEach(function (b) { b.addEventListener("click", function () { go("slip", { k: b.dataset.slip }); }); });
    document.querySelectorAll("[data-pdf]").forEach(function (b) { b.addEventListener("click", function () { var mo = findSlip(u, b.dataset.pdf); S.seen[u.mobile] = S.seen[u.mobile] || {}; S.seen[u.mobile][b.dataset.pdf] = 1; save(); printSlip(u, mo); }); });
    document.querySelectorAll("[data-file]").forEach(function (b) { b.addEventListener("click", function () { fileModal(FILES.filter(function (f) { return f.id === +b.dataset.file; })[0]); }); });
    document.querySelectorAll("[data-edit]").forEach(function (b) { b.addEventListener("click", function () { go("reqNew", { edit: +b.dataset.edit }); }); });
    document.querySelectorAll("[data-ap]").forEach(function (b) { b.addEventListener("click", function () { decide(+b.dataset.ap, "approved"); }); });
    document.querySelectorAll("[data-rj]").forEach(function (b) { b.addEventListener("click", function () { decide(+b.dataset.rj, "rejected"); }); });
    document.querySelectorAll("[data-fx]").forEach(function (b) { b.addEventListener("click", function () { decide(+b.dataset.fx, "fix"); }); });
    document.querySelectorAll("[data-nt]").forEach(function (c) { c.addEventListener("change", function () { S.notif[u.mobile] = S.notif[u.mobile] || {}; S.notif[u.mobile][c.dataset.nt] = c.checked; save(); toast("تنظیمات اعلان ذخیره شد."); }); });
    if ($("logout")) $("logout").addEventListener("click", logout);
    if ($("out2")) $("out2").addEventListener("click", logout);
    if ($("moreB")) $("moreB").addEventListener("click", moreSheet);
    if ($("allRead")) $("allRead").addEventListener("click", function () { S.read[u.mobile] = S.read[u.mobile] || {}; msgsOf(u).forEach(function (m) { if (!S.read[u.mobile][m.id]) S.read[u.mobile][m.id] = Date.now(); }); save(); render(); });
    if ($("rs")) $("rs").addEventListener("click", function () { var t = $("rt").value.trim(); if (t.length < 2) return toast("متن پاسخ را بنویسید.", true); var m = S.msgs.filter(function (x) { return x.id === V.id; })[0]; m.replies = m.replies || []; m.replies.push({ t: t, at: stamp() }); save(); render(); toast("پاسخ شما ارسال شد."); });
    if ($("saveP")) $("saveP").addEventListener("click", function () { var em = en($("em").value).replace(/\D/g, ""); if (em && !/^0\d{10}$/.test(em)) return toast("شماره تماس اضطراری درست نیست.", true); S.prof[u.mobile] = { ad: $("ad").value.trim(), em: em }; save(); toast("اطلاعات ذخیره شد."); });
    if ($("svcB")) $("svcB").addEventListener("click", svcModal);
    if ($("nurseB")) $("nurseB").addEventListener("click", nurseModal);
    if ($("finB")) $("finB").addEventListener("click", function () { location.href = "finance-panel.html"; });
    if (V.name === "reqNew") bindReqNew();
    var t = document.querySelector(".week .today"); if (t && t.parentNode.scrollWidth > t.parentNode.clientWidth) t.parentNode.scrollLeft = t.offsetLeft - t.parentNode.clientWidth / 2 + t.clientWidth / 2;
    bindSearch();
  }

  /* ================= DEMO SIMULATOR ================= */
  function demo() {
    var u = me(); $("demo").hidden = false;
    var acts = [
      ["msg", "منابع انسانی: ارسال پیام شخصی"],
      ["shift", "منابع انسانی: تغییر شیفت فردا"],
      ["slip", "واحد مالی: انتشار فیش جدید"],
      ["ap", "مسئول: تأیید آخرین درخواست من"],
      ["fix", "مسئول: «نیازمند اصلاح»"],
      ["rj", "مسئول: رد با دلیل"]
    ];
    $("demoG").innerHTML = acts.map(function (a) { return '<button type="button" data-d="' + a[0] + '">' + a[1] + "</button>"; }).join("");
    $("demoG").querySelectorAll("[data-d]").forEach(function (b) {
      b.addEventListener("click", function () {
        var a = b.dataset.d, close = function () { if (innerWidth < 981) $("demo").classList.remove("open"); };
        if (a === "msg") { S.msgs.push({ id: nid(), cat: "personal", to: u.mobile, from: "منابع انسانی", title: "یادآوری تکمیل پرونده", body: "لطفاً شماره تماس اضطراری خود را در بخش «پرونده پرسنلی من» تکمیل کنید.", ts: Date.now(), reply: true, replies: [] }); save(); close(); render(); toast("پیام جدید رسید."); return; }
        if (a === "shift") {
          var tm = add(TODAY, 1), cur = shift(u, tm).t, nt = cur === "O" ? "M" : cur === "M" ? "E" : "M";
          S.ov[u.mobile] = S.ov[u.mobile] || {}; S.ov[u.mobile][key(tm)] = { t: nt, note: "به دلیل تغییر برنامه اتاق عمل." };
          S.msgs.push({ id: nid(), cat: "personal", to: u.mobile, from: "منابع انسانی", title: "برنامه شیفت فردای شما تغییر کرد", body: "شیفت " + jWd.format(tm) + " " + jDay.format(tm) + " به شیفت " + SH[nt].n + " (" + SH[nt].s + " تا " + SH[nt].e + ") تغییر کرد. جزئیات در بخش برنامه شیفت.", ts: Date.now() });
          save(); close(); go("shifts"); toast(((S.notif[u.mobile] || {}).sms !== false) ? "اعلان و پیامک تغییر شیفت ارسال شد (نمایشی)." : "اعلان تغییر شیفت ارسال شد."); return;
        }
        if (a === "slip") {
          var M = months(1).cur; S.extra[u.mobile] = S.extra[u.mobile] || {};
          if (S.extra[u.mobile][slipKey(M)]) return toast("فیش این ماه قبلاً منتشر شده است.", true);
          S.extra[u.mobile][slipKey(M)] = 1; S.msgs.push({ id: nid(), cat: "personal", to: u.mobile, from: "واحد مالی", title: "فیش حقوقی " + M.label + " منتشر شد", body: "فیش حقوقی " + M.label + " در پنل شما قرار گرفت.", ts: Date.now() });
          save(); close(); go("pay"); toast("فیش جدید منتشر شد."); return;
        }
        var r = reqsOf(u).filter(function (x) { return x.status === "pending"; })[0];
        if (!r) return toast("درخواست در انتظاری ندارید؛ ابتدا یک درخواست ثبت کنید.", true);
        var st = a === "ap" ? "approved" : a === "fix" ? "fix" : "rejected", why = st === "fix" ? "لطفاً تاریخ را با برنامه بخش هماهنگ کنید و یک روز بعد را انتخاب کنید." : st === "rejected" ? "در این بازه دو نفر از همکاران بخش در مرخصی هستند و حداقل نیروی شیفت تأمین نمی‌شود." : "";
        r.status = st; r.reason = why; r.log.push({ t: (st === "approved" ? "تأیید شد" : STATUS[st].n + ": " + why) + " · " + headOf(u), at: stamp() });
        S.msgs.push({ id: nid(), cat: "personal", to: u.mobile, from: headOf(u), title: TYPES[r.type].n + ": " + STATUS[st].n, body: reqSum(r) + (why ? " — " + why : ""), ts: Date.now() });
        save(); close(); go("reqs"); toast("نتیجه بررسی درخواست ثبت شد.");
      });
    });
  }
  $("demoT").addEventListener("click", function () { $("demo").classList.toggle("open"); });
  $("demoR").addEventListener("click", function () { if (!confirm("همه اطلاعات نمایشی پنل پرسنل پاک شود؟")) return; S = blank(); save(); V = { name: "login" }; render(); });
  window.addEventListener("storage", function (e) { if (e.key === KEY) { S = load() || blank(); render(); } });

  if (me()) { seed(me()); V = { name: "dash", wk: 0 }; }
  render();
})();
