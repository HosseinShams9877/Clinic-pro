/* =========================================================
   Surgery scheduling panel — Dr. Kheirkhah Surgical Center (DEMO)
   One shared data store → doctor view + reception view.
   Flow: doctor request → pending → reception: approve (room) | propose new time (needs)
         → doctor: accept proposal (approved) | reject (back to pending) → done / canceled
   ========================================================= */
(function () {
  "use strict";
  var $ = function (s) { return document.getElementById(s); };
  var KEY = "kh-surgery-demo-v2";

  /* ---------- reference data ---------- */
  var STATUS = {
    pending:  { t: "در انتظار پذیرش", i: "p-clock", c: "s-pending" },
    approved: { t: "تأییدشده",        i: "p-check", c: "s-approved" },
    done:     { t: "انجام‌شده",        i: "p-done",  c: "s-done" },
    canceled: { t: "لغوشده",           i: "p-ban",   c: "s-canceled" }
  };
  var ROOMS = [
    { id: 1, n: "اتاق عمل ۱", f: "طبقه دوم" }, { id: 2, n: "اتاق عمل ۲", f: "طبقه دوم" }, { id: 3, n: "اتاق عمل ۳", f: "طبقه دوم" },
    { id: 4, n: "اتاق عمل ۴", f: "طبقه سوم" }, { id: 5, n: "اتاق عمل ۵", f: "طبقه سوم" }, { id: 6, n: "اتاق عمل ۶", f: "طبقه سوم" },
    { id: 7, n: "اتاق عمل سرپایی", f: "طبقه منفی یک" }
  ];
  var DOCS = [
    { id: "taheri", n: "دکتر حسین طاهری نساج", s: "جراح عمومی · لاپاراسکوپی", p: "assets/img/doctors/taheri-nassaj.jpg" },
    { id: "nezam",  n: "دکتر جمیله نظام‌زواره", s: "زنان، زایمان و نازایی",   p: "assets/img/doctors/nezam-zavareh.jpg" },
    { id: "faraji", n: "دکتر حسن فرجی‌پور",    s: "فوق تخصص قرنیه",          p: "assets/img/doctors/farajipour.jpg" },
    { id: "agha",   n: "دکتر داوود آقادوست",   s: "فلوشیپ شبکیه",            p: "assets/img/doctors/aghadoust.jpg" }
  ];
  var TYPES = {
    taheri: ["کوله‌سیستکتومی لاپاراسکوپی", "ترمیم فتق اینگوینال", "ترمیم فتق نافی", "آپاندکتومی لاپاراسکوپی", "جراحی تیروئید"],
    nezam:  ["هیسترکتومی", "لاپاراسکوپی تشخیصی زنان", "کیست تخمدان", "سزارین برنامه‌ریزی‌شده"],
    faraji: ["لیزیک", "اسمایل", "پیوند قرنیه", "فیکو (آب‌مروارید)"],
    agha:   ["ویترکتومی", "ترمیم جداشدگی شبکیه", "تزریق داخل زجاجیه"]
  };
  var PATIENTS = [ /* fictional demo patients */
    { id: "P-1021", n: "مریم احمدی", nc: "1290••••41", m: "0913•••2210" },
    { id: "P-1022", n: "علی رضایی", nc: "1271••••08", m: "0912•••6643" },
    { id: "P-1023", n: "حسن محمدی", nc: "1250••••77", m: "0935•••1092" },
    { id: "P-1024", n: "زهرا کریمی", nc: "1284••••13", m: "0913•••7740" },
    { id: "P-1025", n: "نرگس کاظمی", nc: "1269••••52", m: "0917•••3301" },
    { id: "P-1026", n: "رضا حسینی", nc: "1243••••90", m: "0919•••5524" },
    { id: "P-1027", n: "فاطمه موسوی", nc: "1288••••36", m: "0936•••8817" },
    { id: "P-1028", n: "کاظم مرادی", nc: "1238••••65", m: "0913•••4402" },
    { id: "P-1029", n: "سارا نوری", nc: "1296••••29", m: "0938•••6150" },
    { id: "P-1030", n: "امیر جعفری", nc: "1261••••84", m: "0912•••0937" }
  ];
  var DAYS = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];
  var H0 = 7, H1 = 18, ROW = 56; // calendar hours & px per hour
  var RECEPTION = { n: "واحد پذیرش", s: "مسئول برنامه‌ریزی اتاق عمل", p: "" };

  /* ---------- date helpers (Gregorian storage, Jalali display) ---------- */
  var FA = "۰۱۲۳۴۵۶۷۸۹";
  function fa(x) { return String(x).replace(/\d/g, function (d) { return FA[d]; }); }
  function iso(d) { return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function parse(s) { var a = s.split("-"); return new Date(+a[0], +a[1] - 1, +a[2]); }
  function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function weekStart(d) { var x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); return addDays(x, -((x.getDay() + 1) % 7)); }
  var jDM = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { day: "numeric", month: "long" });
  var jFull = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { day: "numeric", month: "long", year: "numeric" });
  var jMonth = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { month: "numeric" });
  function dayName(d) { return DAYS[(d.getDay() + 1) % 7]; }
  function jd(s) { var d = parse(s); return dayName(d) + " " + jDM.format(d); }
  function toMin(t) { var a = t.split(":"); return +a[0] * 60 + +a[1]; }
  function toT(m) { return ("0" + Math.floor(m / 60)).slice(-2) + ":" + ("0" + (m % 60)).slice(-2); }
  function esc(v) { return String(v).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function timeLabel(x) { return x.start ? fa(x.start) + " – " + fa(endT(x)) : "ساعت تعیین نشده"; }
  function endT(s) { return toT(toMin(s.start) + Math.round(s.dur * 60)); }
  function durTxt(h) { return h % 1 ? fa(Math.floor(h)) + " ساعت و ۳۰ دقیقه" : fa(h) + " ساعت"; }
  function now() { return new Date(); }
  function stamp() { var d = now(); return jDM.format(d) + " · " + fa(toT(d.getHours() * 60 + d.getMinutes())); }

  /* ---------- store ---------- */
  var S;
  function seed() {
    /* sample items relative to TODAY: past → done / canceled · upcoming → pending / approved / canceled */
    var t0 = new Date(now().getFullYear(), now().getMonth(), now().getDate());
    var D = function (i) { var d = addDays(t0, i); if (d.getDay() === 5) d = addDays(d, i > 0 ? 1 : -1); return iso(d); };
    var list = [
      ["taheri", "P-1025", "جراحی تیروئید", -6, "08:30", 2, 2, "done"],
      ["nezam",  "P-1029", "کیست تخمدان", -5, "11:30", 2, 3, "done"],
      ["faraji", "P-1030", "پیوند قرنیه", -4, "09:30", 2.5, 4, "canceled"],
      ["taheri", "P-1024", "ترمیم فتق نافی", -3, "13:00", 2, 1, "done"],
      ["agha",   "P-1023", "ویترکتومی", -2, "10:00", 2, 5, "done"],
      ["taheri", "P-1026", "آپاندکتومی لاپاراسکوپی", -1, "09:00", 1.5, 2, "done"],
      ["taheri", "P-1022", "ترمیم فتق اینگوینال", 1, "08:00", 2, 1, "approved"],
      ["taheri", "P-1028", "آپاندکتومی لاپاراسکوپی", 1, "11:00", 1.5, null, "pending"],
      ["nezam",  "P-1027", "لاپاراسکوپی تشخیصی زنان", 2, "09:00", 1.5, 3, "approved"],
      ["taheri", "P-1021", "کوله‌سیستکتومی لاپاراسکوپی", 3, "10:30", 1.5, 1, "approved"],
      ["faraji", "P-1026", "لیزیک", 3, "08:00", 1, 4, "approved"],
      ["agha",   "P-1021", "تزریق داخل زجاجیه", 4, "10:00", 0.5, null, "canceled"],
      ["taheri", "P-1027", "ترمیم فتق نافی", 5, "13:00", 2, null, "pending"],
      ["nezam",  "P-1029", "کیست تخمدان", 6, "11:30", 2, null, "pending"],
      ["faraji", "P-1030", "پیوند قرنیه", 8, "09:30", 2.5, null, "pending"]
    ];
    return { seq: 100, seedDay: iso(t0), items: list.map(function (r, k) {
      var x = { id: 50 + k, s: 1, doc: r[0], pat: r[1], type: r[2], date: D(r[3]), start: r[4], dur: r[5], room: r[6], status: r[7], prop: null,
        note: k === 9 ? "نیاز به ست لاپاراسکوپی و آماده‌سازی خون ۲ واحد" : "", log: [{ t: "ثبت درخواست توسط " + (secretary ? "منشی" : "پزشک"), at: "—" }] };
      if (r[7] === "approved" || r[7] === "done") x.log.push({ t: "تأیید پذیرش · " + room(r[6]).n, at: "—" });
      if (r[7] === "done") x.log.push({ t: "عمل انجام شد", at: "—" });
      if (r[7] === "canceled") x.log.push({ t: r[3] < 0 ? "لغو به درخواست بیمار" : "لغو توسط پزشک", at: "—" });
      return x;
    }), extraPatients: [] };
  }
  /* keep demo dates current: shift sample items to today; then enforce date ↔ status rules */
  function todayIso() { var n = now(); return iso(new Date(n.getFullYear(), n.getMonth(), n.getDate())); }
  function rebase() {
    var t = todayIso(); if (S.seedDay === t) return;
    var delta = Math.round((parse(t) - parse(S.seedDay)) / 864e5);
    S.items.forEach(function (x) { if (!x.s) return; var d = addDays(parse(x.date), delta); if (d.getDay() === 5) d = addDays(d, 1); x.date = iso(d); });
    S.seedDay = t;
  }
  function normalize() {
    var t = todayIso(), ch = false;
    S.items.forEach(function (x) {
      if (!x.date) return;
      if (x.date < t && x.status === "approved") { x.status = "done"; x.log.push({ t: "عمل انجام شد (ثبت خودکار پس از تاریخ عمل)", at: "—" }); ch = true; }
      else if (x.date < t && x.status === "pending") { x.status = "canceled"; x.log.push({ t: "لغو خودکار: تا تاریخ عمل تأیید نشد", at: "—" }); ch = true; }
      else if (x.date > t && x.status === "done") { x.status = "approved"; ch = true; }
    });
    return ch;
  }
  function load() {
    try { S = JSON.parse(localStorage.getItem(KEY)); } catch (e) { S = null; }
    if (!S || !S.items || !S.seedDay) { S = seed(); }
    S.items.forEach(function (x) { if (x.status === "needs") { x.status = "pending"; x.prop = null; } });
    rebase(); normalize(); save();
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); return true; } catch (e) { return false; } }
  function pat(id) { return PATIENTS.concat(S.extraPatients).filter(function (p) { return p.id === id; })[0] || { n: "—", nc: "", m: "" }; }
  function doc(id) { return DOCS.filter(function (d) { return d.id === id; })[0]; }
  function room(id) { return ROOMS.filter(function (r) { return r.id === id; })[0]; }
  function item(id) { return S.items.filter(function (x) { return x.id === id; })[0]; }

  /* ---------- conflicts (doctor, room) ---------- */
  var ACTIVE = { pending: 1, approved: 1 };
  function overlap(a, b) { return !!(a.start && b.start) && a.date === b.date && toMin(a.start) < toMin(b.start) + b.dur * 60 && toMin(b.start) < toMin(a.start) + a.dur * 60; }
  function conflicts(slot, exceptId) {
    var out = [];
    S.items.forEach(function (x) {
      if (x.id === exceptId || !ACTIVE[x.status] || !overlap(slot, x)) return;
      if (slot.doc && x.doc === slot.doc) out.push({ kind: "doc", x: x });
      if (slot.room && x.room === slot.room && x.status === "approved") out.push({ kind: "room", x: x });
    });
    return out;
  }
  function inHours(slot) { var a = toMin(slot.start), b = a + slot.dur * 60; return a >= H0 * 60 && b <= 20 * 60 && parse(slot.date).getDay() !== 5; }

  /* ---------- UI state ---------- */
  var APP = document.body.dataset.app || "reception";
  var secretary = APP === "secretary";
  function curWeek() { var w = weekStart(now()); return now().getDay() === 5 ? addDays(w, 7) : w; }
  var U = { role: secretary ? "doctor" : APP, me: null, week: curWeek(), view: "list", room: "all", doc: "all", st: "all", q: "" };

  function badge(st) { var s = STATUS[st]; return '<span class="st ' + s.c + '"><svg><use href="#' + s.i + '"/></svg>' + s.t + "</span>"; }
  function visible() {
    var w0 = iso(U.week), w1 = iso(addDays(U.week, 6)), q = U.q.trim();
    return S.items.filter(function (x) {
      if (!x.date) return false;
      if (U.role === "doctor" && x.doc !== U.me) return false;
      if (U.role === "reception" && U.doc !== "all" && x.doc !== U.doc) return false;
      if (U.room !== "all" && String(x.room) !== U.room) return false;
      if (U.st !== "all" && x.status !== U.st) return false;
      if (q) { var p = pat(x.pat); if ((p.n + p.nc + x.type + x.pat).indexOf(q) < 0) return false; return true; }
      return x.date >= w0 && x.date <= w1;
    }).sort(function (a, b) { return (a.date + a.start).localeCompare(b.date + b.start); });
  }

  /* ---------- render: chrome ---------- */
  function renderChrome() {
    document.body.dataset.role = U.role;
    if (0) document.querySelectorAll(".role button").forEach(function (b) { b.classList.toggle("on", b.dataset.role === U.role); });
    if (U.role === "reception") $("pageTitle").textContent = "برنامه جراحی مرکز";
    $("newBtn").hidden = U.role !== "doctor";
    $("fDoc").hidden = U.role !== "reception";
    if (U.role === "doctor") {
      $("me").innerHTML = '<div><b>' + doc(U.me).n + "</b><small>" + (secretary ? "منشی پزشک" : doc(U.me).s) + '</small></div><img src="' + doc(U.me).p + '" alt=""><button class="ic" id="logout" title="خروج" aria-label="خروج"><svg><use href="#p-out"/></svg></button>';
      $("logout").addEventListener("click", function () { try { localStorage.removeItem(SESS); } catch (e) {} location.reload(); });
    } else {
      $("me").innerHTML = '<div><b>' + RECEPTION.n + "</b><small>" + RECEPTION.s + '</small></div><span class="av"><svg><use href="#p-user"/></svg></span>';
    }
    if ($("bellN")) {
      var n = S.items.filter(function (x) { return U.role === "doctor" ? x.doc === U.me && x.status === "pending" : !!x.date && x.status === "pending"; }).length;
      $("bellN").hidden = !n; $("bellN").textContent = fa(n);
    }
    var w0 = U.week, w1 = addDays(U.week, 6);
    $("wkLabel").textContent = dayName(w0) + " " + jDM.format(w0) + " تا " + dayName(w1) + " " + jFull.format(w1);
  }
  function renderFilters() {
    $("fRoom").innerHTML = '<option value="all">همه اتاق‌ها</option>' + ROOMS.map(function (r) { return '<option value="' + r.id + '">' + r.n + "</option>"; }).join("");
    $("fDoc").innerHTML = '<option value="all">همه پزشکان</option>' + DOCS.map(function (d) { return '<option value="' + d.id + '">' + d.n + "</option>"; }).join("");
    $("fStatus").innerHTML = '<option value="all">همه وضعیت‌ها</option>' + Object.keys(STATUS).map(function (k) { return '<option value="' + k + '">' + STATUS[k].t + "</option>"; }).join("");
    $("legend").innerHTML = Object.keys(STATUS).map(function (k) { return badge(k); }).join("");
  }

  /* ---------- render: KPIs ---------- */
  function renderKpis() {
    var mine = S.items.filter(function (x) { return U.role === "reception" || x.doc === U.me; });
    var w0 = iso(U.week), w1 = iso(addDays(U.week, 6));
    var inW = mine.filter(function (x) { return x.date >= w0 && x.date <= w1; });
    var cnt = function (arr, st) { return arr.filter(function (x) { return x.status === st; }).length; };
    var cards = U.role === "doctor" ? [
      { n: inW.filter(function (x) { return x.status !== "canceled"; }).length, t: "عمل‌های این هفته", s: "به‌جز لغوشده‌ها", i: "p-cal", c: "k1" },
      { n: cnt(mine, "pending"), t: "در انتظار پذیرش", s: "منتظر بررسی", i: "p-clock", c: "k2", f: "pending" },
      { n: cnt(inW, "approved"), t: "تأییدشده این هفته", s: "برنامه قطعی", i: "p-check", c: "k4", f: "approved" },
      { n: cnt(mine, "done"), t: "انجام‌شده", s: "عمل‌های انجام‌شده", i: "p-done", c: "k1", f: "done" }
    ] : [
      { n: cnt(S.items, "pending"), t: "درخواست‌های جدید", s: "در صف بررسی پذیرش", i: "p-clock", c: "k2", f: "pending" },
      { n: cnt(S.items, "done"), t: "انجام‌شده", s: "عمل‌های انجام‌شده", i: "p-done", c: "k3", f: "done" },
      { n: cnt(inW, "approved"), t: "عمل‌های قطعی این هفته", s: "تأییدشده", i: "p-check", c: "k4", f: "approved" },
      { n: roomUse(inW), t: "اشغال اتاق‌های عمل", s: "ساعت تأییدشده از ظرفیت هفته", i: "p-door", c: "k1", raw: true }
    ];
    $("kpis").innerHTML = cards.map(function (k) {
      return '<button type="button" class="kpi ' + k.c + (k.f && U.st === k.f ? " on" : "") + '"' + (k.f ? ' data-f="' + k.f + '"' : " disabled") + '><span class="ki"><svg><use href="#' + k.i + '"/></svg></span><div><small>' + k.t + "</small><b>" + (k.raw ? k.n : fa(k.n)) + "</b><em>" + k.s + "</em></div></button>";
    }).join("");
    document.querySelectorAll(".kpi[data-f]").forEach(function (b) {
      b.addEventListener("click", function () { U.st = U.st === b.dataset.f ? "all" : b.dataset.f; $("fStatus").value = U.st; if (U.st !== "all") U.view = "list"; renderAll(); });
    });
  }
  function roomUse(inW) {
    var h = inW.filter(function (x) { return x.status === "approved" || x.status === "done"; }).reduce(function (a, x) { return a + x.dur; }, 0);
    var cap = ROOMS.length * 6 * (20 - 7.5);
    return fa(Math.round(h / cap * 100)) + "٪";
  }

  /* ---------- render: week calendar ---------- */
  function renderWeek(list) {
    var todayIso = iso(now()), cols = "";
    for (var i = 0; i < 7; i++) {
      var d = addDays(U.week, i), di = iso(d), ev = list.filter(function (x) { return x.date === di; });
      cols += '<div class="col' + (di === todayIso ? " today" : "") + (i === 6 ? " fri" : "") + '" data-date="' + di + '">' +
        '<div class="ch"><b>' + DAYS[i] + "</b><small>" + jDM.format(d) + "</small></div>" +
        '<div class="cb">' + (i === 6 ? '<span class="closed">تعطیل</span>' : "") +
        ev.map(function (x) {
          var p = pat(x.pat), dd = doc(x.doc), r = x.room ? room(x.room).n : "اتاق: تعیین نشده";
          return '<button type="button" class="ev ' + STATUS[x.status].c + '" data-id="' + x.id + '">' +
            '<em dir="ltr">' + timeLabel(x) + "</em><b>" + esc(p.n) + "</b><span>" + esc(x.type) + "</span>" +
            (U.role === "reception" ? "<span>" + dd.n.replace("دکتر ", "د. ") + "</span>" : "") +
            '<span class="ev-r">' + r + '</span><i class="ev-st"><svg><use href="#' + STATUS[x.status].i + '"/></svg>' + STATUS[x.status].t + "</i></button>";
        }).join("") +
        (U.role === "doctor" && i !== 6 ? '<button type="button" class="add" data-date="' + di + '" aria-label="ثبت جراحی در این روز"><svg><use href="#p-plus"/></svg></button>' : "") +
        "</div></div>";
    }
    $("board").innerHTML = '<div class="cal"><div class="cols">' + cols + "</div></div>";
    document.querySelectorAll(".ev").forEach(function (b) { b.addEventListener("click", function () { openItem(+b.dataset.id); }); });
    document.querySelectorAll(".add").forEach(function (b) { b.addEventListener("click", function () { openForm({ date: b.dataset.date, start: "08:00" }); }); });
  }
  function layout(ev) { // side-by-side lanes for overlapping events
    var out = {}, groups = [];
    ev.forEach(function (x) {
      var g = groups.filter(function (g) { return g.some(function (y) { return overlap(x, y); }); })[0];
      if (g) g.push(x); else groups.push([x]);
    });
    groups.forEach(function (g) { g.forEach(function (x, i) { out[x.id] = { i: i, n: g.length }; }); });
    return out;
  }

  /* ---------- render: list ---------- */
  function renderList(list) {
    if (!list.length) { $("board").innerHTML = '<div class="empty"><svg><use href="#p-cal"/></svg><b>موردی برای نمایش نیست</b><span>هفته یا فیلترها را تغییر دهید.</span></div>'; return; }
    $("board").innerHTML = '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th>بیمار</th><th>نوع عمل</th>' + (U.role === "reception" ? "<th>پزشک</th>" : "") +
      "<th>تاریخ و ساعت</th><th>مدت</th><th>اتاق عمل</th><th>وضعیت</th><th></th></tr></thead><tbody>" +
      list.map(function (x, k) {
        var p = pat(x.pat), act = U.role === "reception" && x.status === "pending" ? "بررسی" : "مشاهده";
        return '<tr data-id="' + x.id + '"><td>' + fa(k + 1) + "</td><td><b>" + esc(p.n) + "</b><small>" + fa(x.pat) + "</small></td><td>" + esc(x.type) + "</td>" +
          (U.role === "reception" ? "<td>" + doc(x.doc).n + "</td>" : "") +
          "<td>" + jd(x.date) + '<small dir="ltr">' + timeLabel(x) + "</small>" + "</td>" +
          "<td>" + (x.dur ? durTxt(x.dur) : "تعیین نشده") + "</td><td>" + (x.room ? room(x.room).n : '<span class="muted">تعیین نشده</span>') + "</td><td>" + badge(x.status) + '</td><td><button class="btn sm' + (act !== "مشاهده" ? " pri" : "") + '">' + act + "</button></td></tr>";
      }).join("") + "</tbody></table></div>";
    document.querySelectorAll(".tbl tbody tr").forEach(function (tr) { tr.addEventListener("click", function () { openItem(+tr.dataset.id); }); });
  }

  function renderAll() {
    renderChrome(); if ($("kpis")) renderKpis();
    renderTomorrow();
    if (secretary) updateVoiceReview();
    else renderVoiceNotes();
    document.querySelectorAll(".views button").forEach(function (b) { b.classList.toggle("on", b.dataset.view === U.view); });
    var list = visible();
    if (U.view === "week") renderWeek(list); else renderList(list);
  }

  /* ---------- drawer ---------- */
  function openDrawer(title, body, foot) {
    $("drTitle").textContent = title; $("drBody").innerHTML = body; $("drFoot").innerHTML = foot || "";
    $("drBack").hidden = false; requestAnimationFrame(function () { document.body.classList.add("dr-open"); });
    $("drawer").setAttribute("aria-hidden", "false");
  }
  function closeDrawer() {
    document.body.classList.remove("dr-open"); $("drawer").setAttribute("aria-hidden", "true");
    setTimeout(function () { $("drBack").hidden = true; }, 250);
  }
  $("drClose").addEventListener("click", closeDrawer); $("drBack").addEventListener("click", closeDrawer);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeDrawer(); });

  /* ---------- doctor: new request form ---------- */
  function slots() { var o = ""; for (var m = 7 * 60 + 30; m <= 18 * 60; m += 30) o += '<option value="' + toT(m) + '">' + fa(toT(m)) + "</option>"; return o; }
  function dateOpts(sel) {
    var o = "", d0 = parse(todayIso());
    for (var i = 1; i < 36; i++) { var d = addDays(d0, i); if (d.getDay() === 5) continue; var v = iso(d); o += '<option value="' + v + '"' + (v === sel ? " selected" : "") + ">" + dayName(d) + " " + jFull.format(d) + "</option>"; }
    return o;
  }
  function calendarPicker(select) {
    var monthName = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { month: "long", year: "numeric" });
    var dayNumber = new Intl.DateTimeFormat("en-u-ca-persian", { day: "numeric" });
    var values = Array.from(select.options).map(function (option) { return option.value; });
    var days = values.filter(function (value) { return /^\d{4}-\d{2}-\d{2}$/.test(value); });
    var months = [];
    days.forEach(function (value) {
      var d = parse(value), title = monthName.format(d);
      if (!months.length || months[months.length - 1].title !== title) {
        months.push({ title: title, first: addDays(d, 1 - Number(dayNumber.format(d))) });
      }
    });
    var index = 0;
    var picker = document.createElement("details");
    picker.className = "date-picker";
    picker.innerHTML = '<summary></summary><div class="date-panel"></div>';
    select.after(picker);
    select.hidden = true;
    select.required = false;
    var summary = picker.querySelector("summary"), panel = picker.querySelector(".date-panel");
    var label = select.labels[0];
    if (label) {
      label.removeAttribute("for");
      label.id = select.id + "Label";
      summary.setAttribute("aria-describedby", label.id);
    }
    function refresh() {
      summary.textContent = select.value === "undated" ? "بدون تاریخ" :
        select.value ? jFull.format(parse(select.value)) : "انتخاب تاریخ از تقویم";
    }
    function render(focusDirection) {
      var month = months[index], d = month.first, cells = "";
      for (var offset = (d.getDay() + 1) % 7; offset > 0; offset--) cells += "<span></span>";
      for (; monthName.format(d) === month.title; d = addDays(d, 1)) {
        var value = iso(d), enabled = days.indexOf(value) !== -1;
        cells += '<button type="button" class="btn sm' + (select.value === value ? ' pri' : '') +
          '" data-value="' + value + '" aria-label="' + jFull.format(d) + '"' + (enabled ? '' : ' disabled') +
          '>' + fa(dayNumber.format(d)) + '</button>';
      }
      panel.innerHTML = '<div class="date-month"><button type="button" class="btn sm" data-month="-1" aria-label="ماه قبل"' +
        (index === 0 ? ' disabled' : '') + '>‹</button><b aria-live="polite">' + month.title +
        '</b><button type="button" class="btn sm" data-month="1" aria-label="ماه بعد"' +
        (index === months.length - 1 ? ' disabled' : '') + '>›</button></div><div class="date-days">' +
        DAYS.map(function (day) { return '<small title="' + day + '">' + day[0] + '</small>'; }).join("") + cells + '</div>' +
        (values.indexOf("undated") === -1 ? '' : '<button type="button" class="btn sm date-undated" data-value="undated">بدون تاریخ</button>');
      if (focusDirection) {
        var next = panel.querySelector('[data-month="' + focusDirection + '"]');
        (next.disabled ? panel.querySelector('[data-value]:not(:disabled)') : next).focus();
      }
    }
    picker.addEventListener("toggle", function () {
      if (!picker.open) return;
      var title = select.value && select.value !== "undated" && monthName.format(parse(select.value));
      index = Math.max(0, months.findIndex(function (month) { return month.title === title; }));
      render();
    });
    panel.addEventListener("click", function (event) {
      var button = event.target.closest("button");
      if (!button || button.disabled) return;
      if (button.dataset.month) {
        index += Number(button.dataset.month);
        render(button.dataset.month);
        return;
      }
      select.value = button.dataset.value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
      picker.open = false;
      summary.focus();
    });
    picker.addEventListener("keydown", function (event) {
      if (event.key !== "Escape" || !picker.open) return;
      event.stopPropagation();
      picker.open = false;
      summary.focus();
    });
    select.addEventListener("change", refresh);
    refresh();
    return refresh;
  }

  function spokenDate(text, options) {
    var value = toEn(text).replace(/[يى]/g, "ی").replace(/ك/g, "ک")
      .replace(/[،,؛]/g, "").replace(/‌/g, " ").trim().replace(/\s+/g, " ");
    var today = parse(todayIso());
    var relative = { "امروز": 0, "فردا": 1, "پس فردا": 2 };
    if (Object.prototype.hasOwnProperty.call(relative, value)) return iso(addDays(today, relative[value]));
    var jalali = new Intl.DateTimeFormat("en-US-u-ca-persian", { year: "numeric", month: "numeric", day: "numeric" });
    var months = "فروردین اردیبهشت خرداد تیر مرداد شهریور مهر آبان آذر دی بهمن اسفند".split(" ");
    var days = "یک|دو|سه|چهار|پنج|شش|هفت|هشت|نه|ده|یازده|دوازده|سیزده|چهارده|پانزده|شانزده|هفده|هجده|نوزده".split("|");
    var numeric = /^(?:(\d{4})[\/.-])?(\d{1,2})[\/.-](\d{1,2})$/.exec(value);
    var named = new RegExp("^(.+?) (" + months.join("|") + ")(?: (?:سال )?(\\d{4}))?$").exec(value);
    var year, month, day;
    if (numeric) {
      year = numeric[1]; month = +numeric[2]; day = +numeric[3];
      if (year >= 1700) return year + "-" + String(month).padStart(2, "0") + "-" + String(day).padStart(2, "0");
    } else if (named) {
      year = named[3]; month = months.indexOf(named[2]) + 1;
      var raw = named[1].replace(/سوم$/, "سه").replace(/دوم$/, "دو").replace(/(?:مین|م)$/, "").replace(/^اول$/, "یک");
      day = +raw || days.indexOf(raw) + 1;
      if (/^(بیست|سی)( و |$)/.test(raw)) {
        var parts = raw.split(" و ");
        day = (parts[0] === "بیست" ? 20 : 30) + (parts[1] ? days.indexOf(parts[1]) + 1 : 0);
      }
    }
    if (!month || !day) return "";
    var match = options.find(function (opt) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(opt.value)) return false;
      var p = {};
      jalali.formatToParts(parse(opt.value)).forEach(function (part) { p[part.type] = +part.value; });
      return (!year || p.year === +year) && p.month === month && p.day === day;
    });
    return match ? match.value : "";
  }

  function renderTomorrow() {
    if (!$("tomorrowBooking")) return;
    var tomorrow = addDays(parse(todayIso()), 1), date = iso(tomorrow);
    var closed = tomorrow.getDay() === 5;
    $("tomorrowDate").textContent = jd(date) + (closed ? " · تعطیل" : "");
    var active = S.items.filter(function (x) { return x.doc === U.me && x.status !== "canceled"; });
    function details(x) {
      return "<span><b>" + esc(pat(x.pat).n) + "</b><small>" + esc(x.type) + "</small></span>";
    }
    $("tomorrowScheduled").innerHTML = active.filter(function (x) { return x.date === date; })
      .sort(function (a, b) { return (a.start || "99").localeCompare(b.start || "99"); })
      .map(function (x) {
        return "<li>" + details(x) + "<small>" + timeLabel(x) + "</small>" + badge(x.status) + "</li>";
      }).join("") || "<li>برای فردا عملی ثبت نشده است.</li>";
    var undated = $("tomorrowUnscheduled");
    undated.innerHTML = active.filter(function (x) { return !x.date && x.status === "pending"; }).map(function (x) {
      return "<li>" + details(x) + '<button type="button" class="btn sm pri" data-book-tomorrow="' + x.id + '"' +
        (closed ? " disabled" : "") + ">انتخاب برای فردا</button></li>";
    }).join("") || "<li>درخواست بدون تاریخ ندارید.</li>";
    undated.querySelectorAll("[data-book-tomorrow]").forEach(function (button) {
      button.addEventListener("click", function () {
        var next = addDays(parse(todayIso()), 1);
        if (iso(next) !== date || next.getDay() === 5) {
          renderTomorrow();
          return toast("تاریخ برنامه تغییر کرده یا فردا تعطیل است.", true);
        }
        load();
        var x = item(+button.dataset.bookTomorrow);
        if (!x || x.doc !== U.me || x.date || x.status !== "pending") {
          renderAll();
          return toast("وضعیت درخواست تغییر کرده است.", true);
        }
        x.date = date;
        x.log.push({ t: "انتخاب برای فردا توسط " + (secretary ? "منشی" : "پزشک"), at: stamp() });
        if (!save()) { load(); return toast("درخواست ذخیره نشد. دوباره تلاش کنید.", true); }
        U.week = weekStart(tomorrow);
        renderAll();
        toast("عمل به برنامه فردا اضافه و برای پذیرش ارسال شد.");
      });
    });
  }

  var selectedVoice = null, voiceListState = "", archiveState = "";
  function audioPlayer(note) {
    var audio = document.createElement("audio");
    audio.controls = true;
    audio.preload = "none";
    audio.src = note.audio;
    return audio;
  }

  function renderVoiceArchive(notes) {
    var list = $("voiceArchiveList");
    if (!list) return;
    var archived = notes.filter(function (note) { return note.approvedAt; })
      .sort(function (a, b) { return b.approvedAt - a.approvedAt; });
    var state = JSON.stringify([U.me, archived.map(function (note) { return note.id; })]);
    if (state === archiveState) return;
    archiveState = state;
    list.replaceChildren();
    if (!archived.length) {
      var empty = document.createElement("li");
      empty.textContent = "هنوز ویسی تأیید و بایگانی نشده است.";
      list.append(empty);
    }
    archived.forEach(function (note) {
      var row = document.createElement("li"), info = document.createElement("div");
      var title = document.createElement("b"), detail = document.createElement("small");
      var request = item(note.requestId);
      title.textContent = request ? pat(request.pat).n + " · " + request.type : "ویس تأییدشده";
      var approval = new Date(note.approvedAt);
      detail.textContent = "تأیید منشی · " + jFull.format(approval) + " · " + fa(approval.toTimeString().slice(0, 5));
      info.append(title, detail);
      row.append(info, audioPlayer(note));
      list.append(row);
    });
  }
  function renderVoiceNotes() {
    var list = $("voiceList");
    if (!list || !U.me) return;
    var notes = (S.voiceNotes || []).filter(function (note) { return note.doc === U.me; });
    renderVoiceArchive(notes);
    notes = notes.filter(function (note) { return !note.approvedAt; });
    var state = JSON.stringify([U.me, notes.map(function (note) { return note.id; })]);
    if (state === voiceListState) return;
    voiceListState = state;
    list.replaceChildren();
    if (!notes.length) {
      var empty = document.createElement("li");
      empty.textContent = secretary ? "ویسی برای بررسی نیست." : "ویسی در انتظار تأیید نیست.";
      list.append(empty);
    }
    notes.forEach(function (note) {
      var row = document.createElement("li"), label = document.createElement("span");
      var sent = new Date(note.sent);
      label.textContent = jFull.format(sent) + " · " + fa(sent.toTimeString().slice(0, 5));
      row.append(label);
      if (secretary) {
        var review = document.createElement("button");
        review.className = "btn sm";
        review.type = "button";
        review.dataset.voiceId = String(note.id);
        review.textContent = "ثبت اطلاعات این ویس";
        review.addEventListener("click", function () {
          $("quickForm").reset();
          $("quickDate").dispatchEvent(new Event("change"));
          $("voiceStatus").textContent = "";
          selectedVoice = note.id;
          updateVoiceReview();
          $("quickName").focus();
        });
        row.append(audioPlayer(note), review);
      } else {
        var pending = document.createElement("small");
        pending.textContent = "در انتظار تأیید منشی";
        row.append(pending);
      }
      list.append(row);
    });
  }

  function updateVoiceReview() {
    if (!secretary) return;
    if (selectedVoice && !(S.voiceNotes || []).some(function (note) { return note.id === selectedVoice && note.doc === U.me && !note.approvedAt; })) {
      selectedVoice = null;
      $("voiceStatus").textContent = "این ویس قبلاً تأیید شده است.";
      $("quickForm").reset();
      $("quickDate").dispatchEvent(new Event("change"));
    }
    $("voiceSelected").hidden = !selectedVoice;
    var target = $(selectedVoice ? "voiceSelected" : "quickFormHome");
    if ($("quickForm").parentNode !== target) target.append($("quickForm"));
    $("quickForm").querySelector('[type="submit"]').lastChild.textContent =
      selectedVoice ? "تأیید ویس و ثبت درخواست" : "تأیید و ارسال به پذیرش";
    renderVoiceNotes();
    $("voiceList").querySelectorAll("[data-voice-id]").forEach(function (button) {
      button.disabled = !!selectedVoice;
      button.textContent = Number(button.dataset.voiceId) === selectedVoice ? "در حال ثبت" : "ثبت اطلاعات این ویس";
    });
  }

  function initVoiceNotes() {
    if ($("closeVoiceReview")) $("closeVoiceReview").addEventListener("click", function () {
      selectedVoice = null;
      $("quickForm").reset();
      $("quickDate").dispatchEvent(new Event("change"));
      updateVoiceReview();
    });
    var record = $("recordNote");
    if (!record) return;
    var draft = $("voiceDraft"), preview = $("voicePreview"), status = $("voiceStatus");
    var recorder = null, recordingTimer, preparing = false;
    function stopRecording() {
      if (recorder && recorder.state === "recording") recorder.stop();
    }
    record.addEventListener("click", async function () {
      if (recorder) { stopRecording(); return; }
      if (preparing || !U.me) return;
      if (!navigator.mediaDevices || !window.MediaRecorder) {
        status.textContent = "ضبط ویس به دسترسی میکروفون در مرورگر نیاز دارد.";
        return;
      }
      preparing = true;
      var stream;
      function release() {
        clearTimeout(recordingTimer);
        if (stream) stream.getTracks().forEach(function (track) { track.stop(); });
        recorder = null;
        record.textContent = "ضبط ویس برای منشی";
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        var chunks = [];
        recorder = new MediaRecorder(stream, { audioBitsPerSecond: 24000 });
        recorder.ondataavailable = function (event) { if (event.data.size) chunks.push(event.data); };
        recorder.onerror = function () {
          recorder.onstop = null;
          release();
          preparing = false;
          status.textContent = "ضبط انجام نشد. دوباره تلاش کنید.";
        };
        recorder.onstop = function () {
          var blob = new Blob(chunks, { type: recorder.mimeType || (chunks[0] && chunks[0].type) });
          release();
          if (!blob.size || blob.size > 600000) {
            preparing = false;
            status.textContent = "ویس ذخیره نشد. یک ویس کوتاه‌تر ضبط کنید.";
            return;
          }
          var reader = new FileReader();
          reader.onload = function () {
            preview.src = reader.result;
            draft.hidden = false;
            preparing = false;
            status.textContent = "ویس آماده ارسال است.";
          };
          reader.onerror = function () { preparing = false; status.textContent = "آماده‌سازی ویس انجام نشد."; };
          reader.readAsDataURL(blob);
        };
        recorder.start();
        draft.hidden = true;
        preview.removeAttribute("src");
        preview.load();
        recordingTimer = setTimeout(stopRecording, 60000);
        record.textContent = "پایان ضبط";
        status.textContent = "در حال ضبط · حداکثر یک دقیقه";
      } catch (e) {
        release();
        preparing = false;
        status.textContent = "میکروفون در دسترس نیست یا اجازه ضبط داده نشده است.";
      }
    });
    $("sendNote").addEventListener("click", function () {
      if (!U.me || draft.hidden) return;
      load();
      if (!S.voiceNotes) S.voiceNotes = [];
      S.voiceSeq = (S.voiceSeq || 0) + 1;
      S.voiceNotes.unshift({ id: S.voiceSeq, doc: U.me, sent: Date.now(), audio: preview.src });
      if (!save()) { load(); status.textContent = "فضای ذخیره کافی نیست. ویس ارسال نشد."; return; }
      draft.hidden = true;
      preview.removeAttribute("src");
      preview.load();
      renderVoiceNotes();
      status.textContent = "ویس برای منشی ارسال شد.";
    });
    addEventListener("pagehide", function () {
      if (recorder) stopRecording();
    });
  }

  function initQuickBooking() {
    var form = $("quickForm");
    if (!form) return;
    var date = $("quickDate"), status = $("quickStatus"), transcript = $("quickTranscript");
    var voice = $("quickVoice"), name = $("quickName"), type = $("quickType");
    date.innerHTML = '<option value="">انتخاب تاریخ</option><option value="undated">بدون تاریخ</option>' + dateOpts();
    var refreshDate = calendarPicker(date);
    function applySpeech() {
      var speech = transcript.value.trim().replace(/\s*[،,؛]?\s+بدون تاریخ[.،؛]?$/, "");
      var parts = speech.split(/\s*(?:[،,؛:]\s*)?(?:در\s+)?تاریخ(?:\s+(?:عمل|جراحی))?\s*[:،]?\s*/);
      var fields = /^(.*?)\s+(?:[،,؛:]\s*)?(?:تشخیص|نوع\s+(?:عمل|جراحی)|عمل|جراحی)\s*[:،]?\s+(.+)$/.exec(parts[0].replace(/[،,؛]/g, " "));
      if (!fields || parts.length > 2) {
        status.textContent = "برای تکمیل خودکار، نام بیمار و تشخیص را در متن مشخص کنید.";
        return;
      }
      name.value = fields[1].replace(/^(?:نام بیمار|بیمار)\s*[:،]?\s*/, "").trim().slice(0, 100);
      type.value = fields[2].trim().slice(0, 160);
      var dateText = (parts[1] || "بدون تاریخ").trim().replace(/[.،؛]+$/, "");
      date.value = /^(?:بدون تاریخ|نامشخص|تعیین نشده)$/.test(dateText) ? "undated" :
        spokenDate(dateText, Array.from(date.options));
      refreshDate();
      status.textContent = date.value
        ? "اطلاعات را مرور کنید و برای ارسال به پذیرش تأیید کنید."
        : "تاریخ گفتاری در فهرست روزهای کاری پیدا نشد. تاریخ را در فرم انتخاب کنید.";
    }
    $("quickApply").addEventListener("click", applySpeech);
    var Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    var recognition = null;
    voice.addEventListener("click", function () {
      if (recognition) { recognition.stop(); return; }
      if (!Speech) {
        status.textContent = "مرورگر از ورود صوتی پشتیبانی نمی‌کند. فرم را دستی پر کنید.";
        return;
      }
      recognition = new Speech();
      recognition.lang = "fa-IR";
      recognition.onstart = function () {
        voice.setAttribute("aria-pressed", "true");
        voice.querySelector("span").textContent = "پایان گفتار";
        status.textContent = "در حال شنیدن…";
        form.querySelector('[type="submit"]').disabled = true;
      };
      recognition.onresult = function (event) {
        transcript.value = event.results[0][0].transcript;
        $("quickTranscriptWrap").hidden = false;
        applySpeech();
      };
      recognition.onerror = function (event) {
        status.textContent = event.error === "not-allowed"
          ? "دسترسی به میکروفون داده نشد. مجوز مرورگر را بررسی کنید."
          : "تبدیل گفتار انجام نشد. دوباره امتحان کنید یا فرم را دستی پر کنید.";
      };
      recognition.onnomatch = function () { status.textContent = "گفتار تشخیص داده نشد. دوباره امتحان کنید."; };
      recognition.onend = function () {
        if (status.textContent === "در حال شنیدن…") status.textContent = "گفتاری دریافت نشد.";
        recognition = null;
        voice.setAttribute("aria-pressed", "false");
        voice.querySelector("span").textContent = "ورود صوتی";
        form.querySelector('[type="submit"]').disabled = false;
      };
      try { recognition.start(); }
      catch (e) { recognition = null; status.textContent = "میکروفون در دسترس نیست."; }
    });
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!U.me || recognition) return;
      var patientName = name.value.trim(), surgeryType = type.value.trim(), selectedDate = date.value;
      var undated = selectedDate === "undated";
      if (patientName.split(/\s+/).length < 2 || !surgeryType || !selectedDate || (!undated && selectedDate <= todayIso())) {
        return toast("نام و نام خانوادگی، تشخیص و تاریخ پیشنهادی معتبر را وارد کنید.", true);
      }
      load();
      var noteId = secretary ? selectedVoice : null;
      var note = noteId && (S.voiceNotes || []).find(function (entry) {
        return entry.id === noteId && entry.doc === U.me && !entry.approvedAt;
      });
      if (noteId && !note) {
        updateVoiceReview();
        return;
      }
      var pid = "P-" + (2000 + S.extraPatients.length);
      S.extraPatients.push({ id: pid, n: patientName, nc: "—", m: "—" });
      S.items.push({ id: ++S.seq, doc: U.me, pat: pid, type: surgeryType, date: undated ? null : selectedDate,
        start: null, dur: null, room: null, status: "pending", prop: null, note: "",
        log: [{ t: "ثبت سریع درخواست توسط " + (secretary ? "منشی" : "پزشک"), at: stamp() }] });
      if (note) { note.approvedAt = Date.now(); note.requestId = S.seq; }
      if (!save()) { load(); return toast("درخواست ذخیره نشد. دوباره تلاش کنید.", true); }
      selectedVoice = null;
      form.reset();
      refreshDate();
      transcript.value = "";
      $("quickTranscriptWrap").hidden = true;
      status.textContent = "";
      if (undated) $("tomorrowBooking").open = true;
      else U.week = weekStart(parse(selectedDate));
      renderAll();
      if (noteId) $("voiceStatus").textContent = "درخواست ثبت شد و ویس به بایگانی پزشک رفت.";
      toast(undated ? "درخواست در فهرست بدون تاریخ ذخیره شد." : "درخواست در صف بررسی پذیرش ثبت شد.");
    });
  }

  function openForm(pre) {
    pre = pre || {};
    var body = '<ol class="steps"><li class="on"><span>۱</span>اطلاعات اصلی</li><li><span>۲</span>توضیحات</li><li><span>۳</span>ارسال به پذیرش</li></ol>' +
      '<label class="fl">بیمار</label><div class="psearch"><svg><use href="#p-search"/></svg><input id="fPat" autocomplete="off" placeholder="جستجو با نام، کد پرونده یا کد ملی…"><ul id="fPatL"></ul></div>' +
      '<div class="pchip" id="fPatSel" hidden></div><button type="button" class="link" id="fNewPat">+ بیمار جدید (ایجاد پرونده)</button>' +
      '<div class="newpat" id="fNewBox" hidden><input id="fNpN" placeholder="نام و نام خانوادگی"><input id="fNpC" placeholder="کد ملی" inputmode="numeric"><input id="fNpM" placeholder="شماره موبایل" inputmode="tel"></div>' +
      '<label class="fl" for="fType">نوع جراحی</label><select id="fType"><option value="">انتخاب کنید…</option>' + TYPES[U.me].map(function (t) { return "<option>" + t + "</option>"; }).join("") + '<option value="__other">سایر…</option></select>' +
      '<input id="fTypeO" placeholder="نام عمل" hidden>' +
      '<div class="two"><div><label class="fl" for="fDate">تاریخ پیشنهادی</label><select id="fDate">' + dateOpts(pre.date) + '</select></div>' +
      '<div><label class="fl" for="fStart">ساعت شروع</label><select id="fStart">' + slots() + "</select></div></div>" +
      '<label class="fl" for="fDur">مدت تقریبی</label><div class="seg" id="fDur">' + [0.5, 1, 1.5, 2, 2.5, 3, 4].map(function (h) { return '<button type="button" data-v="' + h + '"' + (h === 2 ? ' class="on"' : "") + ">" + (h < 1 ? "۳۰ دقیقه" : fa(h).replace(".", "/") + " ساعت") + "</button>"; }).join("") + "</div>" +
      '<div id="fCheck" class="check"></div>' +
      '<label class="fl" for="fNote">توضیحات و تجهیزات مورد نیاز</label><textarea id="fNote" rows="3" placeholder="مثلاً: ست لاپاراسکوپی، رزرو خون، ملاحظات بیهوشی…"></textarea>' +
      '<p class="note"><svg><use href="#p-door"/></svg>اتاق عمل پس از بررسی ظرفیت توسط پذیرش تعیین می‌شود.</p>';
    openDrawer("ثبت درخواست جراحی جدید", body, '<button class="btn pri" id="fSend"><svg><use href="#p-check"/></svg>ارسال به پذیرش</button><button class="btn" id="fMore" title="ارسال و باز ماندن فرم برای عمل بعدی"><svg><use href="#p-plus"/></svg>ارسال و ثبت بعدی</button>');
    if (pre.count) $("drTitle").textContent = "ثبت درخواست جراحی · مورد " + fa(pre.count + 1);
    if (pre.start) $("fStart").value = pre.start; else $("fStart").value = "08:00";
    var chosen = null, dur = 2;
    var list = function () {
      var q = $("fPat").value.trim(); var all = PATIENTS.concat(S.extraPatients);
      var r = q ? all.filter(function (p) { return (p.n + p.id + p.nc).indexOf(q) > -1; }).slice(0, 6) : [];
      $("fPatL").innerHTML = r.map(function (p) { return '<li data-id="' + p.id + '"><b>' + esc(p.n) + "</b><small>" + fa(p.id) + " · " + esc(fa(p.nc)) + "</small></li>"; }).join("") || (q ? '<li class="none">پرونده‌ای پیدا نشد؛ «بیمار جدید» را بزنید.</li>' : "");
      $("fPatL").querySelectorAll("li[data-id]").forEach(function (li) { li.addEventListener("mousedown", function () { pick(li.dataset.id); }); });
    };
    var pick = function (id) {
      chosen = id; var p = pat(id); $("fPat").value = ""; $("fPatL").innerHTML = "";
      $("fPatSel").hidden = false; $("fPatSel").innerHTML = '<svg><use href="#p-user"/></svg><div><b>' + esc(p.n) + "</b><small>" + fa(p.id) + " · " + esc(fa(p.m)) + '</small></div><button type="button" aria-label="حذف"><svg><use href="#p-x"/></svg></button>';
      $("fPatSel").querySelector("button").addEventListener("click", function () { chosen = null; $("fPatSel").hidden = true; });
      $("fNewBox").hidden = true; step();
    };
    $("fPat").addEventListener("input", list);
    $("fNewPat").addEventListener("click", function () { $("fNewBox").hidden = !$("fNewBox").hidden; chosen = null; $("fPatSel").hidden = true; });
    $("fType").addEventListener("change", function () { $("fTypeO").hidden = this.value !== "__other"; step(); });
    $("fDur").querySelectorAll("button").forEach(function (b) { b.addEventListener("click", function () { dur = +b.dataset.v; $("fDur").querySelectorAll("button").forEach(function (x) { x.classList.toggle("on", x === b); }); check(); }); });
    calendarPicker($("fDate"));
    ["fDate", "fStart"].forEach(function (id) { $(id).addEventListener("change", check); });
    $("fNote").addEventListener("input", step);
    function slot() { return { doc: U.me, date: $("fDate").value, start: $("fStart").value, dur: dur }; }
    function check() {
      var s = slot(), c = conflicts(s), el = $("fCheck");
      if (!inHours(s)) { el.className = "check bad"; el.innerHTML = '<svg><use href="#p-alert"/></svg>زمان انتخابی خارج از ساعات کاری اتاق عمل (۷ تا ۲۰) است.'; return false; }
      if (c.length) { el.className = "check bad"; el.innerHTML = '<svg><use href="#p-alert"/></svg>تداخل با برنامه خودتان: ' + esc(pat(c[0].x.pat).n) + " (" + esc(c[0].x.type) + ") · " + fa(c[0].x.start) + "–" + fa(endT(c[0].x)); return false; }
      el.className = "check ok"; el.innerHTML = '<svg><use href="#p-check"/></svg>این بازه با برنامه شما تداخلی ندارد · پایان تقریبی ' + fa(toT(toMin(s.start) + dur * 60)); return true;
    }
    function step() {
      var st = document.querySelectorAll(".steps li");
      st[1].classList.toggle("on", !!(chosen || !$("fNewBox").hidden) && !!$("fType").value);
      st[2].classList.toggle("on", !!$("fNote").value.trim());
    }
    check();
    var more = false;
    $("fMore").addEventListener("click", function () { more = true; $("fSend").click(); more = false; });
    $("fSend").addEventListener("click", function () {
      var pid = chosen;
      if (!pid && !$("fNewBox").hidden) {
        var n = $("fNpN").value.trim(); if (!n) return toast("نام بیمار جدید را وارد کنید.", true);
        pid = "P-" + (2000 + S.extraPatients.length); S.extraPatients.push({ id: pid, n: n, nc: $("fNpC").value || "—", m: $("fNpM").value || "—" });
      }
      if (!pid) return toast("بیمار را انتخاب کنید یا پرونده جدید بسازید.", true);
      var type = $("fType").value === "__other" ? $("fTypeO").value.trim() : $("fType").value;
      if (!type) return toast("نوع جراحی را انتخاب کنید.", true);
      if (!check()) return toast("زمان انتخابی تداخل دارد؛ زمان دیگری انتخاب کنید.", true);
      var s = slot();
      S.items.push({ id: ++S.seq, doc: U.me, pat: pid, type: type, date: s.date, start: s.start, dur: dur, room: null, status: "pending", prop: null, note: $("fNote").value.trim(), log: [{ t: "ثبت درخواست توسط " + (secretary ? "منشی" : "پزشک"), at: stamp() }] });
      save(); U.week = weekStart(parse(s.date)); renderAll();
      if (more) { var n = (pre.count || 0) + 1; openForm({ date: s.date, start: toT(Math.min(toMin(s.start) + dur * 60, 18 * 60)), count: n }); toast("مورد " + fa(n) + " ارسال شد؛ عمل بعدی را وارد کنید."); }
      else { closeDrawer(); toast("درخواست ثبت شد و در صف بررسی پذیرش قرار گرفت."); }
    });
  }

  /* ---------- item detail (both roles) ---------- */
  function info(x) {
    var p = pat(x.pat), d = doc(x.doc);
    return '<div class="dt-head">' + badge(x.status) + '<span class="muted">کد درخواست ' + fa(x.id) + "</span></div>" +
      '<div class="dt-pat"><span class="av"><svg><use href="#p-user"/></svg></span><div><b>' + esc(p.n) + "</b><small>" + fa(x.pat) + " · کد ملی " + esc(fa(p.nc)) + " · " + esc(fa(p.m)) + "</small></div></div>" +
      '<dl class="dt"><dt>تشخیص یا نوع جراحی</dt><dd>' + esc(x.type) + "</dd><dt>جراح</dt><dd>" + d.n + "</dd>" +
      "<dt>زمان</dt><dd>" + (x.date ? jd(x.date) : "بدون تاریخ") + ' · <span dir="ltr">' + timeLabel(x) + "</span></dd><dt>مدت</dt><dd>" + (x.dur ? durTxt(x.dur) : "تعیین نشده") + "</dd>" +
      "<dt>اتاق عمل</dt><dd>" + (x.room ? room(x.room).n + " · " + room(x.room).f : '<span class="muted">تعیین نشده</span>') + "</dd>" +
      (x.note ? "<dt>توضیحات پزشک</dt><dd>" + esc(x.note) + "</dd>" : "") + "</dl>";
  }
  function history(x) {
    return '<h3 class="dh">روند درخواست</h3><ol class="tl">' + x.log.map(function (l) { return "<li><b>" + l.t + "</b><small>" + l.at + "</small></li>"; }).join("") + "</ol>";
  }
  function openItem(id) {
    var x = item(id); if (!x) return;
    if (U.role === "doctor") return openDoctorItem(x);
    return openReceptionItem(x);
  }

  function openDoctorItem(x) {
    var body = info(x), foot = "";
    if (x.status === "pending" && !secretary) {
      foot = '<button class="btn danger" id="aCan"><svg><use href="#p-ban"/></svg>لغو درخواست</button>';
    }
    openDrawer("جزئیات جراحی", body + history(x), foot);
    if ($("aCan")) $("aCan").addEventListener("click", function () {
      x.status = "canceled"; x.log.push({ t: "لغو توسط پزشک", at: stamp() }); save(); closeDrawer(); renderAll(); toast("درخواست لغو شد.");
    });
  }

  function roomOpts(slot, exceptId, sel) {
    return ROOMS.map(function (r) {
      var c = conflicts({ room: r.id, date: slot.date, start: slot.start, dur: slot.dur }, exceptId).filter(function (k) { return k.kind === "room"; });
      return '<label class="room' + (c.length ? " busy" : "") + '"><input type="radio" name="rm" value="' + r.id + '"' + (c.length ? " disabled" : "") + (sel === r.id && !c.length ? " checked" : "") + ">" +
        "<span><b>" + r.n + "</b><small>" + r.f + "</small></span><em>" + (c.length ? "تداخل · " + fa(c[0].x.start) + "–" + fa(endT(c[0].x)) : "آزاد") + "</em></label>";
    }).join("");
  }
  function openReceptionItem(x) {
    var body = info(x), foot = "";
    var needsTime = x.status === "pending" && !x.start;
    var docC = conflicts(x, x.id).filter(function (k) { return k.kind === "doc"; });
    if (x.status === "pending") {
      if (needsTime) body += '<div class="two"><div><label class="fl" for="quickStart">ساعت شروع</label><select id="quickStart"><option value="">انتخاب ساعت</option>' + slots() +
        '</select></div><div><label class="fl" for="quickDuration">مدت عمل</label><select id="quickDuration"><option value="">انتخاب مدت</option>' +
        [0.5, 1, 1.5, 2, 2.5, 3, 4].map(function (h) { return '<option value="' + h + '">' + (h === 0.5 ? "۳۰ دقیقه" : durTxt(h)) + '</option>'; }).join("") + '</select></div></div>';
      body += (needsTime ? '<div id="quickAvailability" class="check" role="status"></div>' : docC.length ? '<div class="check bad"><svg><use href="#p-alert"/></svg>تداخل برنامه جراح: ' + esc(pat(docC[0].x.pat).n) + " · " + fa(docC[0].x.start) + "–" + fa(endT(docC[0].x)) + "</div>" : '<div class="check ok"><svg><use href="#p-check"/></svg>جراح در این بازه آزاد است.</div>') +
        '<h3 class="dh">ظرفیت اتاق‌های عمل در این بازه</h3><div class="rooms" id="rmList">' + (needsTime ? "" : roomOpts(x, x.id, null)) + "</div>";
      foot = '<button class="btn pri" id="aOk"' + (needsTime || docC.length ? " disabled" : "") + '><svg><use href="#p-check"/></svg>تأیید و قطعی کردن</button><button class="btn danger" id="aCan"><svg><use href="#p-ban"/></svg>رد درخواست</button>';
    } else if (x.status === "approved") {
      foot = (x.date <= todayIso() ? '<button class="btn pri" id="aDone"><svg><use href="#p-done"/></svg>ثبت انجام عمل</button>' : '<span class="hint-f">ثبت «انجام‌شده» از روز عمل به بعد فعال می‌شود.</span>') + '<button class="btn danger" id="aCan"><svg><use href="#p-ban"/></svg>لغو</button>';
    }
    openDrawer(x.status === "pending" ? "بررسی درخواست جراحی" : "جزئیات جراحی", body + history(x), foot);
    function proposedSlot() {
      return Object.assign({}, x, { start: $("quickStart").value, dur: +$("quickDuration").value });
    }
    function updateRooms() {
      var slot = proposedSlot(), startReady = slot.start && slot.dur;
      var free = startReady && inHours(slot) && !conflicts(slot, x.id).length;
      $("quickAvailability").textContent = !startReady ? "ساعت و مدت عمل را انتخاب کنید." :
        free ? "اتاق آزاد را انتخاب کنید." : "این بازه با برنامه پزشک یا ساعت کاری تداخل دارد.";
      $("rmList").innerHTML = free ? roomOpts(slot, x.id, null) : "";
      $("aOk").disabled = !free;
    }
    if (needsTime) {
      $("quickStart").addEventListener("change", updateRooms);
      $("quickDuration").addEventListener("change", updateRooms);
      updateRooms();
    }
    if ($("aOk")) $("aOk").addEventListener("click", function () {
      var r = document.querySelector('input[name="rm"]:checked'); if (!r) return toast("یک اتاق عمل آزاد انتخاب کنید.", true);
      if (needsTime) {
        var slot = proposedSlot();
        load();
        x = item(slot.id);
        if (!x || x.status !== "pending" || x.start) {
          closeDrawer(); renderAll();
          return toast("وضعیت درخواست تغییر کرده است. دوباره آن را باز کنید.", true);
        }
        slot.room = +r.value;
        if (!inHours(slot) || conflicts(slot, x.id).length) return toast("این بازه دیگر آزاد نیست.", true);
        x.start = slot.start; x.dur = slot.dur;
      }
      x.room = +r.value; x.status = "approved"; x.log.push({ t: "تأیید پذیرش · " + room(x.room).n, at: stamp() }, { t: "اطلاع‌رسانی به بیمار (پیامک · شبیه‌سازی)", at: stamp() });
      if (!save()) { load(); return toast("تأیید ذخیره نشد. دوباره تلاش کنید.", true); }
      closeDrawer(); renderAll(); toast("عمل قطعی شد و در برنامه پزشک نمایش داده می‌شود.");
    });
    if ($("aDone")) $("aDone").addEventListener("click", function () { x.status = "done"; x.log.push({ t: "عمل انجام شد", at: stamp() }); save(); closeDrawer(); renderAll(); toast("وضعیت به «انجام‌شده» تغییر کرد."); });
    if ($("aCan")) $("aCan").addEventListener("click", function () { x.status = "canceled"; x.log.push({ t: "لغو / رد توسط پذیرش", at: stamp() }); save(); closeDrawer(); renderAll(); toast("درخواست لغو شد."); });
  }

  /* ---------- toast ---------- */
  var tt;
  function toast(m, bad) { var el = $("toast"); el.textContent = m; el.className = "toast in" + (bad ? " bad" : ""); clearTimeout(tt); tt = setTimeout(function () { el.className = "toast"; }, 3200); }

  /* ---------- wiring ---------- */
  document.querySelectorAll(".role button").forEach(function (b) {
    b.addEventListener("click", function () { U.role = b.dataset.role; U.st = "all"; U.doc = "all"; $("fStatus").value = "all"; $("fDoc").value = "all"; U.view = U.role === "reception" ? "list" : "week"; renderAll(); });
  });
  document.querySelectorAll(".views button").forEach(function (b) { b.addEventListener("click", function () { U.view = b.dataset.view; renderAll(); }); });
  $("prevW").addEventListener("click", function () { U.week = addDays(U.week, -7); renderAll(); });
  $("nextW").addEventListener("click", function () { U.week = addDays(U.week, 7); renderAll(); });
  $("today").addEventListener("click", function () { U.week = curWeek(); renderAll(); });
  $("fRoom").addEventListener("change", function () { U.room = this.value; renderAll(); });
  $("fDoc").addEventListener("change", function () { U.doc = this.value; renderAll(); });
  $("fStatus").addEventListener("change", function () { U.st = this.value; renderAll(); });
  $("q").addEventListener("input", function () { U.q = this.value; if (U.q) U.view = "list"; renderAll(); });
  $("newBtn").addEventListener("click", function () { openForm(); });
  if ($("bell")) $("bell").addEventListener("click", function () { U.st = "pending"; $("fStatus").value = U.st; U.view = "list"; renderAll(); });
  if ($("resetDemo")) $("resetDemo").addEventListener("click", function () { S = seed(); save(); renderAll(); toast("داده‌های نمایشی بازنشانی شد."); });
  $("burger").addEventListener("click", function () { document.body.classList.toggle("side-open"); });
  addEventListener("storage", function (e) { if (e.key === KEY && (U.role === "reception" || U.me)) { load(); renderAll(); } }); // sync between tabs (doctor ↔ reception)

  /* ---------- doctor login (demo OTP) ---------- */
  var SESS = secretary ? "kh-secretary-session" : "kh-doc-session";
  /* registered doctor mobiles (demo) — real system: from the center's staff records */
  var MOB = secretary ? { taheri: "09131120001", nezam: "09131120002", faraji: "09131120003", agha: "09131120004" } : { taheri: "09131110001", nezam: "09131110002", faraji: "09131110003", agha: "09131110004" };
  function toEn(v) { return String(v).replace(/[۰-۹]/g, function (c) { return FA.indexOf(c); }).replace(/[٠-٩]/g, function (c) { return "٠١٢٣٤٥٦٧٨٩".indexOf(c); }); }
  var lgTimer;
  function loginView(step, mob) {
    var b = $("lgBody"); clearTimeout(lgTimer);
    if (!step) {
      b.innerHTML = '<label class="fl" for="lgMob">شماره موبایل</label>' +
        '<div class="lg-inp"><svg><use href="#p-user"/></svg><input id="lgMob" inputmode="numeric" maxlength="11" placeholder="۰۹۱۲۳۴۵۶۷۸۹" autocomplete="tel" value="' + (mob ? fa(mob) : "") + '"></div>' +
        '<button class="btn pri lg-go" id="lgSend">دریافت کد تأیید</button>' +
        '<details class="lg-demo-n"><summary>' + (secretary ? "شماره‌های نمایشی منشی‌ها" : "شماره‌های نمایشی پزشکان") + '</summary><ul>' + DOCS.map(function (d) {
          return '<li><button type="button" data-m="' + MOB[d.id] + '"><b dir="ltr">' + fa(MOB[d.id]) + "</b><span>" + d.n + "</span></button></li>"; }).join("") + "</ul></details>";
      var send = function () {
        var m = toEn($("lgMob").value).replace(/\D/g, "");
        if (!/^09\d{9}$/.test(m)) return toast("شماره موبایل را درست وارد کنید.", true);
        var id = Object.keys(MOB).filter(function (k) { return MOB[k] === m; })[0];
        if (!id) return toast(secretary ? "این شماره در فهرست منشی‌ها ثبت نشده است." : "این شماره در فهرست پزشکان همکار مرکز ثبت نشده است. با پذیرش تماس بگیرید.", true);
        loginView(1, m);
      };
      $("lgSend").addEventListener("click", send);
      $("lgMob").addEventListener("keydown", function (e) { if (e.key === "Enter") send(); });
      b.querySelectorAll("[data-m]").forEach(function (x) { x.addEventListener("click", function () { $("lgMob").value = fa(x.dataset.m); $("lgMob").focus(); }); });
      $("lgMob").focus();
      return;
    }
    var pick = Object.keys(MOB).filter(function (k) { return MOB[k] === mob; })[0];
    var code = String(10000 + Math.floor(Math.random() * 89999)), sent = Date.now();
    b.innerHTML = '<p class="lg-sent">کد ۵ رقمی به شماره <b dir="ltr">' + fa(mob.slice(0, 4) + "•••" + mob.slice(-4)) + '</b> ارسال شد. <button type="button" class="lg-ch" id="lgCh">ویرایش شماره</button></p>' +
      '<label class="fl" for="lgCode">کد تأیید</label><input id="lgCode" inputmode="numeric" maxlength="5" class="lg-code" placeholder="– – – – –" autocomplete="one-time-code">' +
      '<div class="lg-hint">نسخه نمایشی · کد: <b dir="ltr">' + fa(code) + '</b></div><button class="btn pri lg-go" id="lgGo">ورود به پنل</button><p class="lg-re" id="lgRe"></p>';
    $("lgCh").addEventListener("click", function () { loginView(0, mob); });
    $("lgCode").focus();
    var tick = function () {
      var el = $("lgRe"); if (!el) return; var left = 60 - Math.floor((Date.now() - sent) / 1000);
      if (left > 0) { el.textContent = "ارسال مجدد کد تا " + fa(left) + " ثانیه دیگر"; lgTimer = setTimeout(tick, 1000); }
      else { el.innerHTML = '<button type="button" class="lg-ch" id="lgAgain">ارسال مجدد کد</button>'; $("lgAgain").addEventListener("click", function () { loginView(1, mob); toast("کد جدید ارسال شد."); }); }
    };
    tick();
    var enter = function () {
      var v = toEn($("lgCode").value);
      if (v !== code) { toast("کد واردشده درست نیست.", true); $("lgCode").value = ""; return; }
      clearTimeout(lgTimer);
      try { localStorage.setItem(SESS, pick); } catch (e) {}
      start(pick);
    };
    $("lgGo").addEventListener("click", enter);
    $("lgCode").addEventListener("keydown", function (e) { if (e.key === "Enter") enter(); });
    $("lgCode").addEventListener("input", function () { this.value = fa(toEn(this.value).replace(/\D/g, "")); if (this.value.length === 5) enter(); });
  }
  function start(id) {
    U.me = id; $("login").hidden = true; document.body.classList.remove("locked");
    load(); renderFilters(); renderAll();
    toast("خوش آمدید، " + doc(id).n);
    showView(viewFromLocation());
  }
  function viewFromLocation() {
    if (APP === "doctor" && (location.hash === "#income" || (!location.hash && /[?&]next=income/.test(location.search)))) return "income";
    if (secretary && location.hash === "#voices") return "voices";
    if (APP === "doctor" && location.hash === "#voice-archive") return "archive";
    if (["#schedule", "#bookingTable"].indexOf(location.hash) !== -1) return "schedule";
    return "dashboard";
  }
  function showView(view) {
    var income = view === "income", schedule = view === "schedule";
    $("quickBooking").hidden = view !== "dashboard";
    if ($("voiceInbox")) {
      $("voiceInbox").hidden = view !== "voices";
      if (view !== "voices" && selectedVoice) $("closeVoiceReview").click();
    }
    if ($("voiceArchive")) $("voiceArchive").hidden = view !== "archive";
    ["kpis", "tomorrowBooking", "legend", "board"].forEach(function (id) {
      if ($(id)) $(id).hidden = !schedule;
    });
    document.querySelector(".main > .bar").hidden = !schedule;
    document.querySelector(".tsearch").hidden = !schedule;
    if ($("bell")) $("bell").hidden = !schedule;
    if ($("incWrap")) {
      $("incWrap").hidden = !income;
      if (income && !$("incFrame")) $("incWrap").innerHTML = '<iframe id="incFrame" title="کارکرد و درآمد من" src="doctor-income.html?embed=1&doc=' + encodeURIComponent(U.me) + '"></iframe>';
    }
    $("pageTitle").textContent = income ? "کارکرد و درآمد من" : schedule ? "نوبت‌دهی" : view === "voices" ? "ویس‌های پزشک" : view === "archive" ? "بایگانی ویس‌ها" : "داشبورد";
    [["navDash", "dashboard"], ["navSched", "schedule"], ["navInc", "income"], ["navVoices", "voices"], ["navVoiceArchive", "archive"]].forEach(function (pair) {
      var link = $(pair[0]);
      if (!link) return;
      link.classList.toggle("on", view === pair[1]);
      if (view === pair[1]) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    document.body.classList.remove("side-open");
  }
  addEventListener("hashchange", function () { if (U.me && (APP === "doctor" || secretary)) showView(viewFromLocation()); });
  ["navDash", "navSched", "navInc", "navVoices", "navVoiceArchive"].forEach(function (id) {
    if ($(id)) $(id).addEventListener("click", function () { if (U.me) document.body.classList.remove("side-open"); });
  });
  initQuickBooking();
  initVoiceNotes();
  if (APP === "doctor" || secretary) {
    var sid = null; try { sid = localStorage.getItem(SESS); } catch (e) {}
    if (sid && doc(sid)) start(sid);
    else { load(); $("login").hidden = false; document.body.classList.add("locked"); loginView(0); }
  } else { U.view = "list"; load(); renderFilters(); renderAll(); }
})();
