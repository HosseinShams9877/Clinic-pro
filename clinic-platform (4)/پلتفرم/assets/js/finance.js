/* =========================================================
   Doctor settlement — Kheirkhah Surgery Center (DEMO, localStorage)
   Two connected but separate views over one store:
     body[data-app="finance"] → finance officer: records work & payments
     body[data-app="doctor"]  → doctor: sees only his/her own published invoices
   IMPORTANT: amounts are calculated MANUALLY by finance and only entered here.
   The system sums what is entered; it never computes a doctor's share.
   ========================================================= */
(function () {
  "use strict";
  var APP = document.body.dataset.app || "finance";
  var KEY = "kh-fin-demo-v1", SKEY = "kh-surgery-demo-v2", FSESS = "kh-fin-session", DSESS = "kh-doc-session";
  var $ = function (id) { return document.getElementById(id); };
  var app = $("app");
  var FA = "۰۱۲۳۴۵۶۷۸۹";
  function fa(s) { return String(s == null ? "" : s).replace(/\d/g, function (d) { return FA[d]; }); }
  function en(s) { return String(s || "").replace(/[۰-۹]/g, function (d) { return FA.indexOf(d); }).replace(/[٠-٩]/g, function (d) { return "٠١٢٣٤٥٦٧٨٩".indexOf(d); }); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function ic(id, c) { return "<svg" + (c ? ' class="' + c + '"' : "") + '><use href="#' + id + '"/></svg>'; }
  var nf = new Intl.NumberFormat("fa-IR");
  function money(n) { return nf.format(Math.round(n || 0)); }
  function toman(n) { return money(n) + " تومان"; }
  function mil(n) { var m = n / 1e6; return (m % 1 ? nf.format(Math.round(m * 10) / 10) : nf.format(m)) + " میلیون"; }
  function num(s) { return +en(s).replace(/[^\d]/g, "") || 0; }
  function fD(o) { return new Intl.DateTimeFormat("fa-IR-u-ca-persian", o); }
  var jDay = fD({ day: "numeric", month: "long" }), jFull = fD({ day: "numeric", month: "long", year: "numeric" }), jWd = fD({ weekday: "long" }),
      jMon = fD({ month: "long", year: "numeric" }), jMonS = fD({ month: "long" }),
      jTime = new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit", hour12: false }),
      jNum = new Intl.DateTimeFormat("en-u-ca-persian", { year: "numeric", month: "numeric", day: "numeric" });
  function jp(d) { var o = {}; jNum.formatToParts(d).forEach(function (p) { if (p.type === "year" || p.type === "month" || p.type === "day") o[p.type] = +en(p.value); }); return o; }
  function day0(d) { var x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
  function add(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function iso(d) { return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function parse(s) { var a = s.split("-"); return new Date(+a[0], a[1] - 1, +a[2]); }
  var TODAY = day0(new Date()), TISO = iso(TODAY);
  function dLabel(s) { var d = parse(s); return jFull.format(d); }
  function dWd(s) { var d = parse(s); return jWd.format(d) + " " + jDay.format(d); }
  function stamp(ts) { var d = new Date(ts); return jFull.format(d) + " · " + jTime.format(d); }
  function ymOf(s) { var p = jp(parse(s)); return p.year * 100 + p.month; }
  var CUR_YM = ymOf(TISO);

  /* ---------------- reference data ---------------- */
  var DOCTORS = (window.DOCTORS || []).map(function (d) { return { id: d.id, n: d.name.fa, s: d.spec.fa, p: d.photo }; });
  function doc(id) { return DOCTORS.filter(function (d) { return d.id === id; })[0] || { id: id, n: "—", s: "", p: "" }; }
  var PMAP = { taheri: "taheri-nassaj", nezam: "nezam-zavareh", faraji: "farajipour", agha: "aghadoust" };
  var FUSERS = {
    "09131240001": { name: "محمد موسوی", role: "مسئول مالی", approve: true },
    "09131230004": { name: "علی رضایی", role: "حسابدار", approve: false }
  };
  var METHODS = ["حواله بانکی (پایا / ساتنا)", "کارت به کارت", "چک", "نقدی"];
  var SURG = ["کوله‌سیستکتومی لاپاراسکوپی", "ترمیم فتق اینگوینال", "ترمیم فتق نافی", "آپاندکتومی لاپاراسکوپی", "جراحی تیروئید", "هیسترکتومی", "لاپاراسکوپی تشخیصی زنان", "کیست تخمدان", "سزارین", "لیزیک", "اسمایل", "پیوند قرنیه", "فیکو (آب‌مروارید)", "ویترکتومی", "ترمیم جداشدگی شبکیه", "تزریق داخل زجاجیه", "بلفاروپلاستی", "رینوپلاستی", "لیپوساکشن", "سپتوپلاستی", "سنگ کلیه (TUL)", "بیهوشی عمومی"];
  var MANUAL_WHY = ["عمل در برنامه جراحی سیستم ثبت نشده بود", "ثبت از روی برگه کارکرد اتاق عمل", "عمل اورژانسی خارج از برنامه", "سایر (در توضیحات)"];
  var PUB = {
    draft: { n: "پیش‌نویس", c: "s-can", ic: "i-doc" },
    review: { n: "در انتظار تأیید", c: "s-rev", ic: "i-clock" },
    published: { n: "ارسال‌شده به پزشک", c: "s-sub", ic: "i-send" }
  };
  var SET = {
    unpaid: { n: "پرداخت‌نشده", c: "s-un", ic: "i-wallet" },
    partial: { n: "تسویه جزئی", c: "s-coord", ic: "i-clock" },
    paid: { n: "تسویه‌شده", c: "s-ok", ic: "i-check" }
  };

  /* ---------------- state ---------------- */
  function rnd(seed) { var s = seed; return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
  function seed() {
    var R = rnd(11), S = { seq: 1000, pseq: 1, inv: [], notifs: {}, notes: {} }, FM = "محمد موسوی", AR = "علی رضایی", H = 36e5;
    var TY = {
      "taheri-nassaj": [["کوله‌سیستکتومی لاپاراسکوپی", 8e6], ["ترمیم فتق اینگوینال", 6e6], ["آپاندکتومی لاپاراسکوپی", 7e6], ["ترمیم فتق نافی", 5e6], ["جراحی تیروئید", 9e6]],
      "nezam-zavareh": [["هیسترکتومی", 9e6], ["لاپاراسکوپی تشخیصی زنان", 5e6], ["کیست تخمدان", 6e6], ["سزارین", 7e6]],
      "farajipour": [["لیزیک", 6e6], ["اسمایل", 8e6], ["پیوند قرنیه", 9e6], ["فیکو (آب‌مروارید)", 5e6]],
      "aghadoust": [["ویترکتومی", 9e6], ["ترمیم جداشدگی شبکیه", 8e6], ["تزریق داخل زجاجیه", 3e6]]
    };
    function note(d, t, inv, at, read) { (S.notifs[d] = S.notifs[d] || []).push({ id: S.pseq++, t: t, inv: inv, at: at, read: read }); }
    function mk(d, off, items, status, plan) {
      var day = add(TODAY, -off), id = ++S.seq, created = +day + 15 * H;
      var inv = { s: 1, id: id, no: "F-" + id, doc: d, date: iso(day), items: items.map(function (x) { return { t: x[0], amt: x[1], src: "manual" }; }), reason: MANUAL_WHY[1],
        files: status === "draft" ? [] : [{ name: "صورت-کارکرد-" + fa(jp(day).month) + "-" + fa(jp(day).day) + ".pdf", size: 1250000 }], note: "", status: status, pays: [], log: [], dispute: null, created: created, by: AR };
      inv.log.push({ t: status === "draft" ? "ذخیره پیش‌نویس" : "ثبت کارکرد و ارسال برای تأیید", by: AR, at: created });
      if (status === "published") { inv.log.push({ t: "تأیید و انتشار برای پزشک", by: FM, at: created + 2 * H }); note(d, "صورتحساب کارکرد " + jDay.format(day) + " منتشر شد", id, created + 2 * H, off > 3); }
      plan.forEach(function (amt, i) {
        var po = Math.max(0, off - (5 + i * 7)), pd = add(TODAY, -po), at = +pd + (po === 0 ? 1 : 11) * H;
        if (po === 0 && at > Date.now()) at = Date.now() - 6e4;
        inv.pays.push({ id: S.pseq++, amt: amt, date: iso(pd), method: METHODS[Math.floor(R() * 2)], ref: fa(String(40000000 + Math.floor(R() * 9e6))), file: null, note: "", by: FM, at: at });
        inv.log.push({ t: "ثبت پرداخت " + toman(amt), by: FM, at: at });
        note(d, "پرداخت " + toman(amt) + " ثبت شد", id, at, po > 3);
      });
      S.inv.push(inv); return inv;
    }
    Object.keys(TY).forEach(function (d, k) {
      for (var off = 150 - k * 3; off > 3; off -= 6 + Math.floor(R() * 6)) {
        var n = 1 + Math.floor(R() * 3), items = [];
        for (var i = 0; i < n; i++) { var t = TY[d][Math.floor(R() * TY[d].length)]; items.push([t[0], t[1] + (R() < 0.3 ? 5e5 : 0)]); }
        var tot = items.reduce(function (s, x) { return s + x[1]; }, 0), plan = [];
        if (off > 25) plan = R() < 0.3 ? [Math.round(tot * 0.6 / 1e6) * 1e6, tot - Math.round(tot * 0.6 / 1e6) * 1e6] : [tot];
        else if (off > 10) plan = R() < 0.5 ? [Math.round(tot / 2 / 1e6) * 1e6] : [];
        mk(d, off, items, "published", plan);
      }
    });
    var dsp = S.inv.filter(function (x) { return x.doc === "taheri-nassaj" && x.items.length > 1; }).slice(-1)[0];
    if (dsp) { dsp.dispute = { kind: "مبلغ", text: "مبلغ ثبت‌شده برای عمل دوم با توافق ما همخوانی ندارد؛ لطفاً بررسی شود.", at: Date.now() - 20 * H, status: "open", answer: "" }; dsp.log.push({ t: "اعلام مغایرت توسط پزشک", by: doc("taheri-nassaj").n, at: Date.now() - 20 * H }); }
    mk("taheri-nassaj", 0, [["کوله‌سیستکتومی لاپاراسکوپی", 8e6], ["ترمیم فتق اینگوینال", 7e6], ["آپاندکتومی لاپاراسکوپی", 7e6], ["ترمیم فتق نافی", 6e6]], "published", []);
    mk("nezam-zavareh", 0, [["هیسترکتومی", 8e6], ["کیست تخمدان", 5e6], ["لاپاراسکوپی تشخیصی زنان", 5e6]], "review", []);
    mk("farajipour", 0, [["لیزیک", 6e6], ["اسمایل", 6e6]], "published", [12e6]);
    mk("aghadoust", 1, [["ویترکتومی", 9e6]], "draft", []);
    S.notes = { "taheri-nassaj": "سهم پزشک طبق قرارداد ۱۴۰۵؛ محاسبه دستی توسط واحد مالی.", "farajipour": "پرداخت هفتگی، روزهای چهارشنبه." };
    S.seedDay = TISO;
    return S;
  }
  function load() { try { var s = JSON.parse(localStorage.getItem(KEY)); return s && s.inv && s.seedDay ? s : null; } catch (e) { return null; } }
  /* keep demo dates current: move sample invoices, payments and notices forward to today */
  function rebase(S) {
    if (S.seedDay === TISO) return S;
    var dd = Math.round((parse(TISO) - parse(S.seedDay)) / 864e5), ms = dd * 864e5, ids = {};
    S.inv.forEach(function (v) {
      if (!v.s) return; ids[v.id] = 1;
      v.date = iso(add(parse(v.date), dd)); v.created += ms;
      v.pays.forEach(function (p) { p.date = iso(add(parse(p.date), dd)); p.at += ms; });
      v.log.forEach(function (l) { l.at += ms; });
      if (v.dispute) { v.dispute.at += ms; if (v.dispute.ansAt) v.dispute.ansAt += ms; }
    });
    Object.keys(S.notifs).forEach(function (k) { S.notifs[k].forEach(function (n) { if (ids[n.inv]) n.at += ms; }); });
    S.seedDay = TISO; return S;
  }
  var S = load(); if (!S) S = seed(); else S = rebase(S); save();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast("فضای ذخیره مرورگر پر است؛ فایل‌های حجیم ذخیره نشدند.", true); } }

  /* ---------------- derived ---------------- */
  function total(v) { return v.items.reduce(function (s, x) { return s + (+x.amt || 0); }, 0); }
  function paid(v) { return v.pays.reduce(function (s, p) { return s + p.amt; }, 0); }
  function rem(v) { return total(v) - paid(v); }
  function settle(v) { if (v.status !== "published") return null; var p = paid(v); return p <= 0 ? "unpaid" : p < total(v) ? "partial" : "paid"; }
  function inv(id) { return S.inv.filter(function (x) { return x.id === id; })[0]; }
  function byDate(a, b) { return (b.date + b.created).localeCompare(a.date + a.created) || b.id - a.id; }
  function schedDone() {
    var s; try { s = JSON.parse(localStorage.getItem(SKEY)); } catch (e) { s = null; }
    if (!s || !s.items) return [];
    var used = {}; S.inv.forEach(function (v) { v.items.forEach(function (x) { if (x.ref) used[x.ref] = 1; }); });
    return s.items.filter(function (x) { return x.status === "done" && !used["S" + x.id] && x.date <= TISO; }).map(function (x) { return { ref: "S" + x.id, doc: PMAP[x.doc] || x.doc, date: x.date, t: x.type, start: x.start }; });
  }

  /* ---------------- UI helpers ---------------- */
  function toast(t, bad) { var el = $("toast"); el.textContent = t; el.className = "toast in" + (bad ? " bad" : ""); clearTimeout(toast.t); toast.t = setTimeout(function () { el.className = "toast"; }, 3000); }
  function openModal(html, cls) { var m = $("modal"); $("mCard").innerHTML = html; m.className = "modal" + (cls ? " " + cls : ""); m.hidden = false; document.body.classList.add("m-open"); }
  function closeModal() { $("modal").hidden = true; document.body.classList.remove("m-open"); }
  $("modal").addEventListener("click", function (e) { if (e.target.closest("[data-close]")) closeModal(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !$("modal").hidden) closeModal(); });
  function pb(st) { var s = PUB[st]; return '<span class="st ' + s.c + '">' + ic(s.ic) + s.n + "</span>"; }
  function sb(v) { var k = settle(v); if (!k) return '<span class="st s-none">—</span>'; var s = SET[k]; return '<span class="st ' + s.c + '">' + ic(s.ic) + s.n + "</span>"; }
  function dsb(v) { return v.dispute && v.dispute.status === "open" ? '<span class="st s-docs">' + ic("i-alert") + "مغایرت اعلام‌شده</span>" : ""; }
  function av(d, cls) { var x = doc(d); return '<span class="dav ' + (cls || "") + '">' + (x.p ? '<img src="' + x.p + '" alt="" onerror="this.remove()">' : "") + "<i>" + (x.n.replace("دکتر ", "").charAt(0)) + "</i></span>"; }
  function head(t, sub, back) { return '<div class="ph">' + (back ? '<button class="back" data-go="' + back + '">' + ic("i-back") + "بازگشت</button>" : "") + "<h1>" + t + "</h1>" + (sub ? "<p>" + sub + "</p>" : "") + "</div>"; }
  var V = { name: "dash" };
  function go(name, extra) { V = { name: name }; if (extra) for (var k in extra) V[k] = extra[k]; render(); scrollTo(0, 0); }
  function kpi(icn, cls, label, val, sub) { return '<div class="kp"><span class="si ' + cls + '">' + ic(icn) + "</span><div><small>" + label + "</small><b>" + val + "</b>" + (sub ? "<em>" + sub + "</em>" : "") + "</div></div>"; }

  /* =========================================================
     FINANCE APP
     ========================================================= */
  function fme() { var u = null; try { u = FUSERS[localStorage.getItem(FSESS)]; } catch (e) { } return u || null; }

  function vFLogin() {
    var card = !V.otp ?
      '<h1>ورود واحد مالی</h1><p class="sub">پنل کارکرد و تسویه پزشکان؛ فقط برای کارکنان مجاز واحد مالی.</p>' +
      '<label class="fl" for="mob">شماره موبایل</label><div class="inp ltr">' + ic("i-phone") + '<input id="mob" inputmode="numeric" maxlength="11" placeholder="۰۹۱۳۱۲۴۰۰۰۱" value="' + fa(V.mobile || "") + '"></div>' +
      '<button class="btn pri block" id="getOtp">دریافت کد تأیید</button>' +
      '<details class="demo-nums"><summary>' + ic("i-users") + "شماره‌های نمایشی واحد مالی</summary><div>" +
      Object.keys(FUSERS).map(function (m) { var s = FUSERS[m]; return '<button type="button" data-fill="' + m + '"><b>' + s.name + "</b><small>" + s.role + (s.approve ? " · مجاز به تأیید و انتشار" : " · ثبت و ارسال برای تأیید") + '</small><span dir="ltr">' + fa(m) + "</span></button>"; }).join("") + "</div></details>" +
      '<p class="fine">' + ic("i-lock") + "اطلاعات مالی فقط برای مسئولان مجاز و پزشک مربوط قابل مشاهده است.</p>"
      :
      '<h1>کد تأیید</h1><p class="sub">کد ۵ رقمی به <b dir="ltr">' + fa(V.mobile.slice(0, 4) + "•••" + V.mobile.slice(-4)) + '</b> ارسال شد. <button class="link" id="editMob">ویرایش شماره</button></p>' +
      '<div class="otp" id="otp">' + "<input inputmode='numeric' maxlength='1' aria-label='رقم'>".repeat(5) + "</div>" +
      '<div class="demo-code">نسخه نمایشی · کد: <b dir="ltr">' + fa(V.otp) + '</b></div><button class="btn pri block" id="verify">ورود به پنل</button>';
    app.innerHTML = '<div class="auth"><a class="logo" href="index.html"><span>' + ic("i-logo") + '</span><div><small>مرکز جراحی فوق تخصصی</small><b>دکتر خیرخواه</b></div></a>' +
      '<div class="split"><div class="hero-img fin-hero"><img src="assets/img/p-form.jpg" alt=""><div class="hero-t"><h2>کارکرد و تسویه پزشکان</h2><ul><li>' + ic("i-doc") + "ثبت سریع کارکرد روزانه پزشک</li><li>" + ic("i-send") + "انتشار صورتحساب در پنل پزشک</li><li>" + ic("i-wallet") + "ثبت پرداخت کامل یا جزئی</li></ul></div></div>" +
      '<section class="card narrow">' + card + "</section></div></div>";
    $("demo").hidden = true;
    if (!V.otp) {
      var send = function () {
        var m = en($("mob").value).replace(/\D/g, "");
        if (!/^09\d{9}$/.test(m)) return toast("شماره موبایل را درست وارد کنید.", true);
        if (!FUSERS[m]) return toast("این شماره دسترسی واحد مالی ندارد.", true);
        V.mobile = m; V.otp = String(10000 + Math.floor(Math.random() * 89999)); vFLogin();
      };
      $("getOtp").addEventListener("click", send);
      $("mob").addEventListener("keydown", function (e) { if (e.key === "Enter") send(); });
      document.querySelectorAll("[data-fill]").forEach(function (b) { b.addEventListener("click", function () { $("mob").value = fa(b.dataset.fill); }); });
      return;
    }
    var ins = Array.prototype.slice.call(document.querySelectorAll("#otp input")); ins[0].focus();
    ins.forEach(function (inp, i) {
      inp.addEventListener("input", function () { inp.value = fa(en(inp.value).replace(/\D/g, "").slice(-1)); if (inp.value && ins[i + 1]) ins[i + 1].focus(); if (ins.every(function (x) { return x.value; })) $("verify").click(); });
      inp.addEventListener("keydown", function (e) { if (e.key === "Backspace" && !inp.value && ins[i - 1]) ins[i - 1].focus(); });
    });
    $("editMob").addEventListener("click", function () { V.otp = null; vFLogin(); });
    $("verify").addEventListener("click", function () {
      if (en(ins.map(function (x) { return x.value; }).join("")) !== V.otp) { toast("کد واردشده درست نیست.", true); ins.forEach(function (x) { x.value = ""; }); ins[0].focus(); return; }
      try { localStorage.setItem(FSESS, V.mobile); } catch (e) { }
      go("dash"); toast("خوش آمدید، " + fme().name);
    });
  }

  var FNAV = [["dash", "داشبورد", "i-home"], ["new", "ثبت کارکرد جدید", "i-plus"], ["list", "صورتحساب‌ها", "i-doc"], ["pays", "پرداخت‌ها و تسویه‌ها", "i-wallet"], ["docs", "پزشکان همکار", "i-users"]];
  var FGROUP = { dash: "dash", "new": "new", list: "list", inv: "list", pays: "pays", docs: "docs" };
  function fAlerts(u) { return S.inv.filter(function (v) { return (v.dispute && v.dispute.status === "open") || (u.approve && v.status === "review"); }).length; }
  function fShell(html) {
    var u = fme(), act = FGROUP[V.name], al = fAlerts(u);
    return '<div class="shell"><aside class="side"><a class="logo" href="index.html"><span>' + ic("i-logo") + '</span><div><small>مرکز جراحی فوق تخصصی</small><b>دکتر خیرخواه</b></div></a>' +
      '<p class="side-t">پنل مالی · تسویه پزشکان</p><nav class="snav">' + FNAV.map(function (x) { return '<button data-go="' + x[0] + '"' + (act === x[0] ? ' class="on" aria-current="page"' : "") + ">" + ic(x[2]) + x[1] + (x[0] === "dash" && al ? '<i class="dot">' + fa(al) + "</i>" : "") + "</button>"; }).join("") +
      '</nav><button class="out" id="logout">' + ic("i-out") + "خروج</button></aside>" +
      '<div class="main"><header class="bar"><a class="logo m-only" href="index.html"><span>' + ic("i-logo") + "</span><b>پنل مالی</b></a>" +
      '<div class="tday">' + ic("i-cal") + "<span>" + jWd.format(TODAY) + " " + jFull.format(TODAY) + "</span></div>" +
      '<button class="ic bell" data-go="dash" aria-label="موارد نیازمند اقدام">' + ic("i-bell") + (al ? "<i>" + fa(al) + "</i>" : "") + "</button>" +
      '<div class="me"><span class="av">' + u.name.charAt(0) + "</span><div><b>" + u.name + "</b><small>" + u.role + "</small></div></div></header>" +
      '<div class="content in" id="content">' + html + "</div></div>" +
      '<nav class="tabbar">' + [["dash", "خانه", "i-home"], ["new", "ثبت کارکرد", "i-plus"], ["list", "صورتحساب‌ها", "i-doc"]].map(function (x) { return '<button data-go="' + x[0] + '"' + (act === x[0] ? ' class="on"' : "") + ">" + ic(x[2]) + x[1] + (x[0] === "dash" && al ? "<i></i>" : "") + "</button>"; }).join("") +
      '<button id="moreB"' + (act === "pays" || act === "docs" ? ' class="on"' : "") + ">" + ic("i-dots") + "بیشتر</button></nav></div>";
  }

  /* ---------- invoice table (cards on mobile) ---------- */
  function filt(list) {
    var fd = V.fd || "all";
    return list.filter(function (v) {
      if (V.fdoc && v.doc !== V.fdoc) return false;
      if (V.fpub && V.fpub !== "all" && v.status !== V.fpub) return false;
      if (V.fset && V.fset !== "all" && settle(v) !== V.fset) return false;
      if (fd === "today") return v.date === TISO;
      if (fd === "yday") return v.date === iso(add(TODAY, -1));
      if (fd === "week") return v.date >= iso(add(TODAY, -((TODAY.getDay() + 1) % 7)));
      if (fd === "month") return ymOf(v.date) === CUR_YM;
      if (fd === "prev") { var p = jp(TODAY), py = p.month === 1 ? (p.year - 1) * 100 + 12 : p.year * 100 + p.month - 1; return ymOf(v.date) === py; }
      return true;
    });
  }
  function filters(withDate) {
    var used = {}; S.inv.forEach(function (v) { used[v.doc] = 1; });
    var sel = function (id, val, opts) { return '<select class="sel sm" id="' + id + '">' + opts.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === (val || "") ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + "</select>"; };
    return '<div class="fbar">' +
      (withDate ? sel("fd", V.fd, [["today", "امروز"], ["yday", "دیروز"], ["week", "این هفته"], ["month", "این ماه"], ["prev", "ماه قبل"], ["all", "همه تاریخ‌ها"]]) : "") +
      sel("fdoc", V.fdoc, [["", "همه پزشکان"]].concat(Object.keys(used).map(function (d) { return [d, doc(d).n]; }))) +
      sel("fpub", V.fpub, [["all", "همه وضعیت‌های انتشار"], ["draft", "پیش‌نویس"], ["review", "در انتظار تأیید"], ["published", "ارسال‌شده به پزشک"]]) +
      sel("fset", V.fset, [["all", "همه وضعیت‌های تسویه"], ["unpaid", "پرداخت‌نشده"], ["partial", "تسویه جزئی"], ["paid", "تسویه‌شده"]]) + "</div>";
  }
  function bindFilters() {
    ["fd", "fdoc", "fpub", "fset"].forEach(function (k) { if ($(k)) $(k).addEventListener("change", function () { V[k] = this.value; render(); }); });
  }
  function invTable(list, showDoc, doctorView) {
    if (!list.length) return '<div class="empty sm">' + ic("i-doc") + "<b>موردی یافت نشد</b><p>فیلترها را تغییر دهید" + (doctorView ? "." : " یا کارکرد جدید ثبت کنید.") + "</p></div>";
    var sumT = 0, sumR = 0;
    var rows = list.map(function (v, i) {
      var t = total(v), r = settle(v) ? rem(v) : 0; sumT += t; sumR += r;
      return '<tr data-inv="' + v.id + '"><td class="c-n">' + fa(i + 1) + "</td>" +
        (showDoc ? '<td class="c-doc"><span class="dcell">' + av(v.doc) + "<b>" + doc(v.doc).n + "</b></span></td>" : "") +
        '<td data-l="تاریخ" class="c-date">' + dWd(v.date) + '</td><td data-l="تعداد عمل">' + fa(v.items.length) + '</td><td data-l="مبلغ کل (تومان)" class="c-amt">' + money(t) + "</td>" +
        '<td data-l="مانده" class="c-rem">' + (settle(v) ? money(r) : "—") + "</td>" +
        (doctorView ? "" : '<td data-l="انتشار">' + pb(v.status) + "</td>") + '<td data-l="تسویه">' + sb(v) + dsb(v) + "</td>" +
        '<td class="c-act"><button class="btn sm" data-inv="' + v.id + '">' + (doctorView ? "جزئیات" : "بررسی") + "</button></td></tr>";
    }).join("");
    return '<div class="tw"><table class="ftbl"><thead><tr><th>#</th>' + (showDoc ? "<th>پزشک</th>" : "") + "<th>تاریخ</th><th>تعداد عمل</th><th>مبلغ کل (تومان)</th><th>مانده</th>" + (doctorView ? "" : "<th>انتشار</th>") + "<th>تسویه</th><th></th></tr></thead><tbody>" + rows + "</tbody></table></div>" +
      '<div class="tsum"><span>' + fa(list.length) + " صورتحساب</span><span>جمع: <b>" + toman(sumT) + "</b></span><span>مانده: <b>" + toman(sumR) + "</b></span></div>";
  }

  /* ---------- dashboard ---------- */
  function vFDash() {
    var u = fme(), month = S.inv.filter(function (v) { return ymOf(v.date) === CUR_YM; }), pub = S.inv.filter(function (v) { return v.status === "published"; });
    var activeDocs = {}; month.forEach(function (v) { activeDocs[v.doc] = 1; });
    var todayOps = S.inv.filter(function (v) { return v.date === TISO; }).reduce(function (s, v) { return s + v.items.length; }, 0);
    var mShare = month.reduce(function (s, v) { return s + total(v); }, 0), unpaid = pub.reduce(function (s, v) { return s + rem(v); }, 0);
    var review = S.inv.filter(function (v) { return v.status === "review"; }), disp = S.inv.filter(function (v) { return v.dispute && v.dispute.status === "open"; }), drafts = S.inv.filter(function (v) { return v.status === "draft"; });
    var sd = schedDone();
    if (!V.fd) V.fd = "today";
    var act = "";
    if (u.approve && review.length) act += actBox("در انتظار تأیید شما", "i-clock", review, function (v) { return toman(total(v)) + " · " + fa(v.items.length) + " عمل"; });
    if (disp.length) act += actBox("مغایرت‌های اعلام‌شده توسط پزشک", "i-alert", disp, function (v) { return esc(v.dispute.text.slice(0, 60)) + "…"; }, "bad");
    if (drafts.length) act += actBox("پیش‌نویس‌های ناتمام", "i-doc", drafts, function (v) { return toman(total(v)); });
    if (!u.approve && review.length) act += actBox("ارسال‌شده برای تأیید مسئول مالی", "i-send", review, function (v) { return toman(total(v)); });
    return '<section class="welcome s-wel f-wel"><div class="w-t"><h1>سلام، ' + u.name + '</h1><p class="w-p">وضعیت کارکرد و تسویه حساب پزشکان در یک نگاه.</p>' +
      '<div class="w-b"><button class="btn pri" data-go="new">' + ic("i-plus") + "ثبت کارکرد جدید</button></div></div>" +
      '<div class="w-img"><img src="assets/img/p-form.jpg" alt=""></div></section>' +
      '<div class="kps">' + kpi("i-users", "si-b", "پزشکان فعال این ماه", fa(Object.keys(activeDocs).length)) + kpi("i-flask", "si-g", "عمل‌های ثبت‌شده امروز", fa(todayOps)) +
      kpi("i-wallet", "si-v", "جمع سهم پزشکان این ماه", money(mShare), "تومان") + kpi("i-clock", "si-r", "مانده پرداخت‌نشده (کل)", money(unpaid), "تومان") + "</div>" +
      (act ? '<div class="acts">' + act + "</div>" : "") +
      (sd.length ? '<section class="box sched"><header><h2>' + ic("i-cal") + "عمل‌های انجام‌شده در برنامه جراحی که هنوز ثبت مالی نشده‌اند</h2></header><ul class=\"rows\">" +
        sd.slice(0, 5).map(function (x) { return '<li><button data-sched="' + x.ref + '">' + av(x.doc) + "<div><b>" + doc(x.doc).n + "</b><small>" + esc(x.t) + " · " + dWd(x.date) + '</small></div><span class="btn sm">ثبت کارکرد</span></button></li>'; }).join("") + "</ul></section>" : "") +
      '<section class="box tbox"><header><h2>کارکردهای ثبت‌شده</h2><button class="more" data-go="list">مشاهده همه</button></header>' + filters(true) +
      invTable(filt(S.inv).sort(byDate), true) + "</section>";
  }
  function actBox(title, icn, list, sub, cls) {
    return '<section class="box act ' + (cls || "") + '"><header><h2>' + ic(icn) + title + " <span>" + fa(list.length) + '</span></h2></header><ul class="rows">' +
      list.slice(0, 4).map(function (v) { return '<li><button data-inv="' + v.id + '">' + av(v.doc) + "<div><b>" + doc(v.doc).n + " · " + jDay.format(parse(v.date)) + "</b><small>" + sub(v) + "</small></div>" + ic("i-chev") + "</button></li>"; }).join("") + "</ul></section>";
  }

  /* ---------- new / edit work entry ---------- */
  function newForm(pre) {
    var f = { doc: "", date: TISO, items: [{ t: "", amt: 0, src: "manual" }], reason: MANUAL_WHY[1], files: [], note: "", step: 1, edit: null, editWhy: "" };
    if (pre) for (var k in pre) f[k] = pre[k];
    return f;
  }
  function vNew() {
    var F = V.form || (V.form = newForm());
    var ed = F.edit ? inv(F.edit) : null;
    var stepsHtml = '<ol class="steps fsteps">' + ["پزشک و تاریخ", "ریز عمل‌ها", "بررسی و ارسال"].map(function (t, i) { var n = i + 1; return '<li class="' + (F.step === n ? "on" : F.step > n ? "done" : "") + '"><span>' + (F.step > n ? ic("i-check") : fa(n)) + "</span><b>" + t + "</b></li>"; }).join("") + "</ol>";
    return head(ed ? "ویرایش صورتحساب " + '<span dir="ltr">' + ed.no + "</span>" : "ثبت کارکرد پزشک", ed && ed.status === "published" ? "صورتحساب منتشرشده است؛ تغییرات با دلیل در سابقه ثبت می‌شود." : "مبالغ را طبق محاسبه واحد مالی وارد کنید؛ سیستم فقط جمع می‌زند.").replace('<div class="ph">', '<div class="ph">' + (ed ? '<button class="back" data-inv="' + ed.id + '">' + ic("i-back") + "بازگشت</button>" : "")) +
      (ed && ed.status === "published" ? '<div class="warn sm">' + ic("i-alert") + "<p><b>دلیل اصلاح: </b>" + esc(F.editWhy) + "</p></div>" : "") +
      stepsHtml +
      '<div class="fgrid step-' + F.step + '" id="fgrid">' +
      '<section class="card fs fs1"><h2 class="h2"><span class="sn">۱</span>انتخاب پزشک و تاریخ</h2>' +
      '<label class="fl">پزشک <i>*</i></label><div class="combo" id="combo">' + (F.doc ? '<button type="button" class="cv" id="cv">' + av(F.doc) + "<div><b>" + doc(F.doc).n + "</b><small>" + esc(doc(F.doc).s) + "</small></div>" + ic("i-x") + "</button>" :
        '<div class="inp">' + ic("i-search") + '<input id="dq" placeholder="نام پزشک را تایپ کنید…" autocomplete="off"' + (ed ? " disabled" : "") + '></div><div class="cl" id="cl" hidden></div>') + "</div>" +
      '<label class="fl" for="fdate">تاریخ کارکرد <i>*</i></label><select class="sel" id="fdate"' + (ed && ed.status === "published" ? " disabled" : "") + ">" + dateOpts(F.date) + "</select>" +
      '<div id="dupW"></div><div id="schedW"></div>' +
      '<div class="snav-m"><button class="btn pri block" data-step="2">ادامه: ثبت عمل‌ها</button></div></section>' +
      '<section class="card fs fs2"><h2 class="h2"><span class="sn">۲</span>عمل‌های انجام‌شده <button type="button" class="btn sm add" id="addR">' + ic("i-plus") + "افزودن عمل</button></h2>" +
      '<div class="rhead"><span>#</span><span>نام عمل</span><span>سهم پزشک (تومان)</span><span></span></div><div id="rows"></div>' +
      '<p class="kbd">' + ic("i-alert") + "نکته: بعد از وارد کردن مبلغ، کلید Enter یک ردیف جدید باز می‌کند.</p>" +
      '<div id="whyW"></div>' +
      '<div class="tot" id="tot"></div>' +
      '<div class="snav-m two-b"><button class="btn" data-step="1">قبلی</button><button class="btn pri" data-step="3">ادامه: بررسی</button></div></section>' +
      '<section class="card fs fs3"><h2 class="h2"><span class="sn">۳</span>مستندات و ارسال</h2>' +
      '<div class="mob-sum" id="mobSum"></div>' +
      '<label class="fl">آپلود مستندات <span class="opt">(اختیاری)</span></label><label class="drop sm-drop" id="drop">' + ic("i-up") + "<b>فایل‌ها را اینجا بکشید یا کلیک کنید</b><small>PDF، JPG، PNG · حداکثر ۱۰ مگابایت</small>" +
      '<input type="file" id="fin" accept="image/jpeg,image/png,application/pdf" multiple hidden></label><ul class="fls" id="fls"></ul>' +
      '<label class="fl" for="fnote">توضیحات <span class="opt">(اختیاری)</span></label><textarea id="fnote" rows="2" placeholder="توضیح برای پزشک یا سابقه داخلی…">' + esc(F.note) + "</textarea>" +
      '<div class="fact">' + (ed && ed.status === "published" ? '<button class="btn pri block" id="saveEd">' + ic("i-check") + "ذخیره اصلاحیه و اطلاع به پزشک</button>" :
        '<button class="btn" id="saveDraft">' + ic("i-doc") + 'ذخیره پیش‌نویس</button><button class="btn pri" id="preview">' + ic("i-send") + "بررسی و ارسال صورتحساب</button>") + "</div>" +
      '<button class="btn block snav-m" data-step="2">قبلی</button>' +
      '<p class="fine left">' + ic("i-shield") + "این فرم مبلغی محاسبه نمی‌کند؛ هر رقم همان است که شما وارد می‌کنید.</p></section></div>";
  }
  function dateOpts(sel) { var o = ""; for (var i = 0; i < 45; i++) { var d = add(TODAY, -i), k = iso(d); o += '<option value="' + k + '"' + (k === sel ? " selected" : "") + ">" + (i === 0 ? "امروز · " : i === 1 ? "دیروز · " : "") + jWd.format(d) + " " + jFull.format(d) + "</option>"; } if (sel < iso(add(TODAY, -44))) o += '<option value="' + sel + '" selected>' + dLabel(sel) + "</option>"; return o; }
  function rowsHtml() {
    var F = V.form;
    return F.items.map(function (x, i) {
      return '<div class="frow" data-i="' + i + '"><span class="rn">' + fa(i + 1) + "</span>" +
        '<div class="rt"><input class="rin" data-k="t" list="surgL" value="' + esc(x.t) + '" placeholder="نام عمل" aria-label="نام عمل ' + fa(i + 1) + '">' + (x.src === "schedule" ? '<small class="src">' + ic("i-cal") + "از برنامه جراحی</small>" : "") + "</div>" +
        '<div class="ra"><input class="rin amt" data-k="amt" inputmode="numeric" value="' + (x.amt ? money(x.amt) : "") + '" placeholder="۰" aria-label="مبلغ عمل ' + fa(i + 1) + '"><span>تومان</span></div>' +
        '<button type="button" class="ic del" data-del="' + i + '" aria-label="حذف ردیف">' + ic("i-x") + "</button></div>";
    }).join("") + '<datalist id="surgL">' + SURG.map(function (s) { return "<option value=\"" + s + "\">"; }).join("") + "</datalist>";
  }
  function cleanItems() { return V.form.items.filter(function (x) { return x.t.trim() || x.amt; }); }
  function updTotals() {
    var F = V.form, it = cleanItems(), t = it.reduce(function (s, x) { return s + (+x.amt || 0); }, 0), ed = F.edit ? inv(F.edit) : null;
    $("tot").innerHTML = '<div><small>تعداد عمل</small><b>' + fa(it.length) + "</b></div><div><small>جمع سهم پزشک</small><b>" + toman(t) + "</b></div>" + (ed && paid(ed) ? "<div><small>پرداخت‌شده قبلی</small><b>" + toman(paid(ed)) + "</b></div>" : "");
    $("mobSum").innerHTML = F.doc ? av(F.doc) + "<div><b>" + doc(F.doc).n + "</b><small>" + dLabel(F.date) + " · " + fa(it.length) + " عمل</small></div><b class=\"ms\">" + toman(t) + "</b>" : "";
    var man = F.items.some(function (x) { return x.src !== "schedule" && (x.t.trim() || x.amt); });
    $("whyW").innerHTML = man ? '<label class="fl" for="why">علت ثبت دستی <span class="opt">(برای عمل‌هایی که از برنامه جراحی نیامده‌اند)</span></label><select class="sel" id="why">' + MANUAL_WHY.map(function (w) { return "<option" + (w === F.reason ? " selected" : "") + ">" + w + "</option>"; }).join("") + "</select>" : "";
    if ($("why")) $("why").addEventListener("change", function () { F.reason = this.value; });
  }
  function updDup() {
    var F = V.form, w = $("dupW"), sw = $("schedW");
    var dup = F.doc ? S.inv.filter(function (v) { return v.doc === F.doc && v.date === F.date && v.id !== F.edit; }) : [];
    w.innerHTML = dup.length ? '<div class="warn sm">' + ic("i-alert") + "<p>برای این پزشک در این تاریخ قبلاً صورتحساب " + '<button class="link" data-inv="' + dup[0].id + '" dir="ltr">' + dup[0].no + "</button> (" + PUB[dup[0].status].n + ") ثبت شده است. مراقب ثبت تکراری عمل‌ها باشید.</p></div>" : "";
    var sd = F.doc ? schedDone().filter(function (x) { return x.doc === F.doc && x.date === F.date && !F.items.some(function (i) { return i.ref === x.ref; }); }) : [];
    sw.innerHTML = sd.length ? '<div class="imp"><b>' + ic("i-cal") + "عمل‌های «انجام‌شده» در برنامه جراحی این روز</b>" + sd.map(function (x) { return '<button type="button" data-imp="' + x.ref + '">' + ic("i-plus") + esc(x.t) + ' <small dir="ltr">' + fa(x.start) + "</small></button>"; }).join("") + "<small>با افزودن از برنامه، نام عمل خودکار پر می‌شود و فقط مبلغ را وارد می‌کنید.</small></div>" : "";
    w.querySelectorAll("[data-inv]").forEach(function (b) { b.addEventListener("click", function () { go("inv", { id: +b.dataset.inv }); }); });
    sw.querySelectorAll("[data-imp]").forEach(function (b) {
      b.addEventListener("click", function () {
        var x = schedDone().filter(function (s) { return s.ref === b.dataset.imp; })[0]; if (!x) return;
        var empty = F.items.filter(function (i) { return !i.t.trim() && !i.amt; })[0];
        if (empty) { empty.t = x.t; empty.src = "schedule"; empty.ref = x.ref; } else F.items.push({ t: x.t, amt: 0, src: "schedule", ref: x.ref });
        drawRows(); updDup(); var idx = F.items.findIndex(function (i) { return i.ref === x.ref; }); focusRow(idx, "amt");
      });
    });
  }
  function drawRows() { $("rows").innerHTML = rowsHtml(); bindRows(); updTotals(); }
  function focusRow(i, k) { var el = document.querySelector('.frow[data-i="' + i + '"] [data-k="' + k + '"]'); if (el) { el.focus(); if (el.select) el.select(); } }
  function bindRows() {
    var F = V.form;
    document.querySelectorAll(".frow").forEach(function (r) {
      var i = +r.dataset.i;
      r.querySelectorAll(".rin").forEach(function (inp) {
        inp.addEventListener("input", function () {
          if (inp.dataset.k === "amt") { var v = num(inp.value); F.items[i].amt = v; inp.value = v ? money(v) : ""; }
          else F.items[i].t = inp.value;
          updTotals();
        });
        inp.addEventListener("keydown", function (e) {
          if (e.key !== "Enter") return; e.preventDefault();
          if (inp.dataset.k === "t") return focusRow(i, "amt");
          if (i === F.items.length - 1) { if (!F.items[i].t.trim() && !F.items[i].amt) return; F.items.push({ t: "", amt: 0, src: "manual" }); drawRows(); }
          focusRow(i + 1, "t");
        });
      });
    });
    document.querySelectorAll("[data-del]").forEach(function (b) {
      b.addEventListener("click", function () { var i = +b.dataset.del; F.items.splice(i, 1); if (!F.items.length) F.items.push({ t: "", amt: 0, src: "manual" }); drawRows(); updDup(); });
    });
  }
  function drawFiles() {
    var F = V.form;
    $("fls").innerHTML = F.files.map(function (f, i) { return '<li><span class="ri pdf">' + ic("i-doc") + "</span><div><b>" + esc(f.name) + "</b><small>" + fa((f.size / 1048576).toFixed(1)) + " مگابایت" + (f.data ? "" : " · فقط نام فایل ذخیره شد (نمایشی)") + '</small></div><button type="button" class="ic" data-rf="' + i + '" aria-label="حذف فایل">' + ic("i-x") + "</button></li>"; }).join("");
    $("fls").querySelectorAll("[data-rf]").forEach(function (b) { b.addEventListener("click", function () { F.files.splice(+b.dataset.rf, 1); drawFiles(); }); });
  }
  function addFiles(list) {
    var F = V.form;
    Array.prototype.forEach.call(list, function (file) {
      if (!/^(image\/(jpeg|png)|application\/pdf)$/.test(file.type)) return toast("فقط فایل PDF، JPG یا PNG.", true);
      if (file.size > 10 * 1048576) return toast("حجم فایل بیش از ۱۰ مگابایت است.", true);
      var rec = { name: file.name, size: file.size, type: file.type, data: null }; F.files.push(rec);
      if (file.size <= 700 * 1024) { var r = new FileReader(); r.onload = function () { rec.data = r.result; drawFiles(); }; r.readAsDataURL(file); }
      drawFiles();
    });
  }
  function validForm(F) {
    if (!F.doc) { toast("پزشک را انتخاب کنید.", true); return null; }
    var it = cleanItems();
    if (!it.length) { toast("حداقل یک عمل با مبلغ ثبت کنید.", true); return null; }
    for (var i = 0; i < it.length; i++) {
      if (!it[i].t.trim()) { toast("نام عمل ردیف " + fa(i + 1) + " خالی است.", true); return null; }
      if (!(it[i].amt > 0)) { toast("مبلغ عمل «" + it[i].t + "» را وارد کنید.", true); return null; }
    }
    return it;
  }
  function bindNew() {
    var F = V.form, u = fme();
    var dq = $("dq");
    if (dq) {
      var show = function () {
        var q = dq.value.trim().replace(/ي/g, "ی").replace(/ك/g, "ک"), used = {};
        S.inv.forEach(function (v) { used[v.doc] = (used[v.doc] || 0) + 1; });
        var L = DOCTORS.filter(function (d) { return !q || d.n.indexOf(q) >= 0 || d.s.indexOf(q) >= 0; }).sort(function (a, b) { return (used[b.id] || 0) - (used[a.id] || 0); }).slice(0, 8);
        $("cl").innerHTML = L.length ? L.map(function (d) { return '<button type="button" data-d="' + d.id + '">' + av(d.id) + "<div><b>" + d.n + "</b><small>" + esc(d.s) + "</small></div></button>"; }).join("") : "<p>پزشکی با این نام پیدا نشد.</p>";
        $("cl").hidden = false;
        $("cl").querySelectorAll("[data-d]").forEach(function (b) { b.addEventListener("mousedown", function (e) { e.preventDefault(); F.doc = b.dataset.d; render(); setTimeout(function () { if (innerWidth > 980) focusRow(0, "t"); }, 50); }); });
      };
      dq.addEventListener("focus", show); dq.addEventListener("input", show);
      dq.addEventListener("blur", function () { setTimeout(function () { if ($("cl")) $("cl").hidden = true; }, 150); });
      dq.addEventListener("keydown", function (e) { if (e.key === "Enter") { var f = $("cl").querySelector("[data-d]"); if (f) f.dispatchEvent(new MouseEvent("mousedown")); } });
    }
    if ($("cv")) $("cv").addEventListener("click", function () { if (F.edit) return; F.doc = ""; render(); setTimeout(function () { $("dq").focus(); }, 30); });
    $("fdate").addEventListener("change", function () { F.date = this.value; updDup(); updTotals(); });
    $("addR").addEventListener("click", function () { F.items.push({ t: "", amt: 0, src: "manual" }); drawRows(); focusRow(F.items.length - 1, "t"); });
    $("fnote").addEventListener("input", function () { F.note = this.value; });
    $("fin").addEventListener("change", function () { addFiles(this.files); this.value = ""; });
    var drop = $("drop");
    ["dragenter", "dragover"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("over"); }); });
    ["dragleave", "drop"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("over"); }); });
    drop.addEventListener("drop", function (e) { addFiles(e.dataTransfer.files); });
    document.querySelectorAll("[data-step]").forEach(function (b) {
      b.addEventListener("click", function () {
        var n = +b.dataset.step;
        if (n > F.step && F.step === 1 && !F.doc) return toast("پزشک را انتخاب کنید.", true);
        if (n === 3 && !validForm(F)) return;
        F.step = n; $("fgrid").className = "fgrid step-" + n;
        document.querySelectorAll(".fsteps li").forEach(function (li, i) { li.className = i + 1 === n ? "on" : i + 1 < n ? "done" : ""; li.querySelector("span").innerHTML = i + 1 < n ? ic("i-check") : fa(i + 1); });
        scrollTo(0, 0); if (n === 2 && innerWidth > 0) setTimeout(function () { focusRow(0, F.items[0].t ? "amt" : "t"); }, 30);
      });
    });
    drawRows(); drawFiles(); updDup();
    if ($("saveDraft")) $("saveDraft").addEventListener("click", function () {
      if (!F.doc) return toast("پزشک را انتخاب کنید.", true);
      var it = cleanItems(); var v = commit(it, "draft"); toast("پیش‌نویس ذخیره شد."); go("inv", { id: v.id });
    });
    if ($("preview")) $("preview").addEventListener("click", function () {
      var it = validForm(F); if (!it) return;
      var t = it.reduce(function (s, x) { return s + x.amt; }, 0);
      openModal('<div class="rep pv"><header><div><small>پیش‌نمایش</small><h2>صورتحساب کارکرد پزشک</h2></div>' + pb("draft") + "</header>" +
        '<div class="pvd">' + av(F.doc, "lg") + "<div><b>" + doc(F.doc).n + "</b><small>" + esc(doc(F.doc).s) + "</small></div></div>" +
        '<dl class="sum"><dt>تاریخ کارکرد</dt><dd>' + dWd(F.date) + "</dd><dt>تعداد عمل</dt><dd>" + fa(it.length) + " عمل</dd><dt>پیوست</dt><dd>" + (F.files.length ? fa(F.files.length) + " فایل" : "ندارد") + "</dd></dl>" +
        '<table><thead><tr><th>#</th><th>نام عمل</th><th>مبلغ (تومان)</th></tr></thead><tbody>' + it.map(function (x, i) { return "<tr><td>" + fa(i + 1) + "</td><td>" + esc(x.t) + "</td><td>" + money(x.amt) + "</td></tr>"; }).join("") +
        '<tr class="net"><td></td><td>جمع قابل پرداخت</td><td>' + money(t) + "</td></tr></tbody></table>" +
        '<p class="rnote">' + (u.approve ? "با تأیید، صورتحساب در پنل پزشک منتشر و اعلان برای او ارسال می‌شود. نام شما، زمان و مبلغ در سابقه ثبت می‌شود." : "صورتحساب برای تأیید مسئول مالی ارسال می‌شود و پس از تأیید او در پنل پزشک منتشر خواهد شد.") + "</p></div>" +
        '<div class="m-foot"><button class="btn" data-close>بازگشت و ویرایش</button><button class="btn pri" id="confirmPub">' + ic("i-check") + (u.approve ? "تأیید و انتشار برای پزشک" : "ارسال برای تأیید") + "</button></div>");
      $("confirmPub").addEventListener("click", function () {
        var v = commit(it, u.approve ? "published" : "review"); closeModal();
        toast(u.approve ? "صورتحساب منتشر شد و به پزشک اطلاع داده شد." : "برای تأیید مسئول مالی ارسال شد.");
        go("inv", { id: v.id });
      });
    });
    if ($("saveEd")) $("saveEd").addEventListener("click", function () {
      var it = validForm(F); if (!it) return;
      var v = inv(F.edit), t = it.reduce(function (s, x) { return s + x.amt; }, 0), old = total(v);
      if (t < paid(v)) return toast("جمع جدید کمتر از مبلغ پرداخت‌شده (" + toman(paid(v)) + ") است.", true);
      v.items = it.map(cp); v.note = F.note; v.files = F.files; v.reason = F.reason;
      v.log.push({ t: "اصلاح صورتحساب منتشرشده — دلیل: " + F.editWhy + " · مبلغ از " + toman(old) + " به " + toman(t), by: u.name, at: Date.now() });
      if (v.dispute && v.dispute.status === "open") { v.dispute.status = "resolved"; v.dispute.answer = "صورتحساب اصلاح شد: " + F.editWhy; v.dispute.ansAt = Date.now(); }
      notify(v.doc, "صورتحساب " + jDay.format(parse(v.date)) + " اصلاح شد", v.id);
      save(); toast("اصلاحیه ثبت و به پزشک اطلاع داده شد."); go("inv", { id: v.id });
    });
  }
  function cp(x) { var o = { t: x.t.trim(), amt: x.amt, src: x.src || "manual" }; if (x.ref) o.ref = x.ref; return o; }
  function commit(it, status) {
    var F = V.form, u = fme(), now = Date.now(), v = F.edit ? inv(F.edit) : null;
    if (!v) { v = { id: ++S.seq, no: "F-" + (S.seq), doc: F.doc, date: F.date, items: [], reason: "", files: [], note: "", status: "draft", pays: [], log: [], dispute: null, created: now, by: u.name }; S.inv.push(v); }
    v.doc = F.doc; v.date = F.date; v.items = it.map(cp); v.reason = F.reason; v.files = F.files; v.note = F.note;
    if (status === "draft") v.log.push({ t: F.edit ? "ویرایش پیش‌نویس" : "ذخیره پیش‌نویس", by: u.name, at: now });
    if (status === "review") v.log.push({ t: "ثبت کارکرد و ارسال برای تأیید · جمع " + toman(total(v)), by: u.name, at: now });
    if (status === "published") { v.log.push({ t: "تأیید و انتشار برای پزشک · جمع " + toman(total(v)), by: u.name, at: now }); notify(v.doc, "صورتحساب کارکرد " + jDay.format(parse(v.date)) + " منتشر شد", v.id); }
    v.status = status; save(); return v;
  }
  function notify(d, t, id) { (S.notifs[d] = S.notifs[d] || []).push({ id: S.pseq++, t: t, inv: id, at: Date.now(), read: false }); }

  /* ---------- invoice detail (shared) ---------- */
  function invBody(v, doctorView) {
    var t = total(v), p = paid(v), st = settle(v);
    var html = '<section class="card ihead"><div class="ih-l">' + av(v.doc, "lg") + "<div><small>" + (doctorView ? "صورتحساب کارکرد" : "تسویه حساب با") + "</small><h2>" + (doctorView ? dWd(v.date) : doc(v.doc).n) + '</h2><p class="mut sm">' + (doctorView ? "" : dWd(v.date) + " · ") + 'شماره <span dir="ltr">' + v.no + "</span></p></div></div>" +
      '<div class="ih-b">' + (doctorView ? "" : pb(v.status)) + sb(v) + dsb(v) + "</div></section>" +
      '<div class="kps k4">' + kpi("i-flask", "si-b", "تعداد عمل", fa(v.items.length)) + kpi("i-wallet", "si-v", "جمع سهم پزشک", money(t), "تومان") + kpi("i-check", "si-g", "پرداخت‌شده", money(p), "تومان") + kpi("i-clock", "si-r", "مانده قابل پرداخت", st ? money(t - p) : "—", st ? "تومان" : "پس از انتشار") + "</div>";
    html += '<div class="igrid"><div class="icol">' +
      '<section class="box"><header><h2>جزئیات عمل‌ها</h2></header><div class="tw"><table class="ftbl it"><thead><tr><th>#</th><th>نوع عمل</th><th>مبلغ (تومان)</th></tr></thead><tbody>' +
      v.items.map(function (x, i) { return '<tr><td class="c-n">' + fa(i + 1) + '</td><td data-l="عمل">' + esc(x.t) + (x.src === "schedule" && !doctorView ? ' <small class="src">' + ic("i-cal") + "از برنامه</small>" : "") + '</td><td data-l="مبلغ" class="c-amt">' + money(x.amt) + "</td></tr>"; }).join("") +
      '<tr class="trow"><td></td><td>جمع کل</td><td class="c-amt">' + money(t) + "</td></tr></tbody></table></div>" +
      (!doctorView && v.items.some(function (x) { return x.src !== "schedule"; }) && v.reason ? '<p class="mut sm">علت ثبت دستی: ' + esc(v.reason) + "</p>" : "") + "</section>" +
      '<section class="box"><header><h2>پرداخت‌ها</h2>' + (!doctorView && st && st !== "paid" ? '<button class="btn sm pri" id="payB">' + ic("i-plus") + "ثبت پرداخت</button>" : "") + "</header>" +
      (v.pays.length ? '<ul class="pays">' + v.pays.map(function (x, i) { return '<li><span class="ri ok">' + ic("i-check") + "</span><div><b>" + (v.pays.length > 1 ? "پرداخت " + ["اول", "دوم", "سوم", "چهارم", "پنجم"][i] + " · " : "") + toman(x.amt) + "</b><small>" + dLabel(x.date) + " · " + x.method + (x.ref ? ' · مرجع <span dir="ltr">' + x.ref + "</span>" : "") + "</small>" + (x.note ? '<small>' + esc(x.note) + "</small>" : "") + "</div>" + (x.file ? fileLink(x.file) : "") + "</li>"; }).join("") + "</ul>" +
        '<div class="rem-l"><span>جمع سهم پزشک</span><b>' + toman(t) + "</b><span>پرداخت‌شده</span><b>" + toman(p) + '</b><span class="rr">مانده قابل پرداخت</span><b class="rr">' + toman(t - p) + "</b></div>"
        : '<p class="mut sm">' + (st ? "هنوز پرداختی ثبت نشده است." : "پرداخت فقط برای صورتحساب منتشرشده ثبت می‌شود.") + "</p>") +
      '<p class="fine left">' + ic("i-alert") + "ثبت پرداخت در این پنل به معنی انتقال پول نیست؛ فقط سابقه پرداخت انجام‌شده را ثبت می‌کند.</p></section></div>" +
      '<div class="icol">' +
      (v.dispute ? '<section class="box dsp ' + (v.dispute.status === "open" ? "open" : "") + '"><header><h2>' + ic("i-alert") + "اعلام مغایرت " + (v.dispute.status === "open" ? "(باز)" : "(بررسی‌شده)") + "</h2></header>" +
        "<p><b>" + esc(v.dispute.kind) + ":</b> " + esc(v.dispute.text) + '</p><small class="mut">' + stamp(v.dispute.at) + "</small>" +
        (v.dispute.answer ? '<div class="ans"><b>پاسخ واحد مالی:</b> ' + esc(v.dispute.answer) + "</div>" : "") +
        (!doctorView && v.dispute.status === "open" ? '<textarea id="ans" rows="2" placeholder="پاسخ به پزشک…"></textarea><div class="two-b"><button class="btn" id="ansOk">' + ic("i-send") + 'ثبت پاسخ و بستن</button><button class="btn pri" id="fixB">' + ic("i-doc") + "اصلاح صورتحساب</button></div>" : "") + "</section>" : "") +
      '<section class="box"><header><h2>مستندات</h2></header>' + (v.files.length ? '<ul class="fls">' + v.files.map(function (f) { return '<li><span class="ri pdf">' + ic("i-doc") + "</span><div><b>" + esc(f.name) + "</b><small>" + fa((f.size / 1048576).toFixed(1)) + " MB</small></div>" + fileLink(f) + "</li>"; }).join("") + "</ul>" : '<p class="mut sm">مستندی پیوست نشده است.</p>') + "</section>" +
      (v.note ? '<section class="box"><header><h2>توضیحات واحد مالی</h2></header><p class="sm">' + esc(v.note) + "</p></section>" : "") +
      (doctorView ? "" : '<section class="box"><header><h2>سابقه تغییرات</h2></header><ul class="tl">' + v.log.slice().reverse().map(function (l) { return "<li>" + esc(l.t) + "<small>" + esc(l.by) + " · " + stamp(l.at) + "</small></li>"; }).join("") + "</ul></section>") +
      "</div></div>";
    return html;
  }
  function fileLink(f) { return f.data ? '<a class="ic" href="' + f.data + '" download="' + esc(f.name) + '" aria-label="دانلود">' + ic("i-dl") + "</a>" : '<button class="ic" data-demo-file aria-label="دانلود">' + ic("i-dl") + "</button>"; }
  function vFInv() {
    var v = inv(V.id), u = fme(); if (!v) return head("صورتحساب یافت نشد", "", "list");
    var acts = "";
    if (v.status === "draft") acts = '<button class="btn" id="edB">' + ic("i-doc") + 'ویرایش</button><button class="btn danger" id="delB">' + ic("i-x") + "حذف پیش‌نویس</button>";
    if (v.status === "review") acts = (u.approve ? '<button class="btn pri" id="apB">' + ic("i-check") + "تأیید و انتشار برای پزشک</button>" : "") + '<button class="btn" id="edB">' + ic("i-doc") + "ویرایش</button>";
    if (v.status === "draft") acts += '<button class="btn pri" id="sendB">' + ic("i-send") + (u.approve ? "انتشار برای پزشک" : "ارسال برای تأیید") + "</button>";
    if (v.status === "published") acts = '<button class="btn" id="fixB2">' + ic("i-doc") + "اصلاح صورتحساب</button>";
    acts += '<button class="btn" id="pdfB">' + ic("i-dl") + "دانلود PDF</button>";
    return head("جزئیات صورتحساب", "", "list") + '<div class="iacts">' + acts + "</div>" + invBody(v, false);
  }
  function bindFInv() {
    var v = inv(V.id), u = fme(); if (!v) return;
    var editIt = function (why) { V = { name: "new", form: newForm({ doc: v.doc, date: v.date, items: v.items.map(function (x) { return { t: x.t, amt: x.amt, src: x.src, ref: x.ref }; }), reason: v.reason || MANUAL_WHY[1], files: v.files.slice(), note: v.note, edit: v.id, editWhy: why || "", step: 2 }), id: v.id }; render(); scrollTo(0, 0); };
    var askFix = function () {
      openModal('<div class="mp"><h2>' + ic("i-alert") + "اصلاح صورتحساب منتشرشده</h2><p class=\"mut sm\">اصلاح با ثبت دلیل و نام شما در سابقه انجام می‌شود و به پزشک اطلاع داده خواهد شد.</p>" +
        '<label class="fl" for="fw">دلیل اصلاح <i>*</i></label><textarea id="fw" rows="3" placeholder="مثلاً: مبلغ عمل دوم طبق قرارداد اصلاح شد."></textarea></div><div class="m-foot"><button class="btn" data-close>انصراف</button><button class="btn pri" id="fwOk">ادامه به ویرایش</button></div>');
      $("fw").focus();
      $("fwOk").addEventListener("click", function () { var w = $("fw").value.trim(); if (w.length < 5) return toast("دلیل اصلاح را بنویسید.", true); closeModal(); editIt(w); });
    };
    if ($("edB")) $("edB").addEventListener("click", function () { editIt(""); });
    if ($("fixB")) $("fixB").addEventListener("click", askFix);
    if ($("fixB2")) $("fixB2").addEventListener("click", askFix);
    if ($("delB")) $("delB").addEventListener("click", function () { S.inv = S.inv.filter(function (x) { return x.id !== v.id; }); save(); go("list"); toast("پیش‌نویس حذف شد."); });
    var pub = function () { v.status = "published"; v.log.push({ t: "تأیید و انتشار برای پزشک · جمع " + toman(total(v)), by: u.name, at: Date.now() }); notify(v.doc, "صورتحساب کارکرد " + jDay.format(parse(v.date)) + " منتشر شد", v.id); save(); render(); toast("صورتحساب منتشر شد و به پزشک اطلاع داده شد."); };
    if ($("apB")) $("apB").addEventListener("click", pub);
    if ($("sendB")) $("sendB").addEventListener("click", function () {
      if (!v.items.length || v.items.some(function (x) { return !x.t || !(x.amt > 0); })) return toast("ابتدا پیش‌نویس را کامل کنید.", true);
      if (u.approve) pub(); else { v.status = "review"; v.log.push({ t: "ارسال برای تأیید · جمع " + toman(total(v)), by: u.name, at: Date.now() }); save(); render(); toast("برای تأیید مسئول مالی ارسال شد."); }
    });
    if ($("pdfB")) $("pdfB").addEventListener("click", function () { printInv(v); });
    if ($("payB")) $("payB").addEventListener("click", function () { payModal(v); });
    if ($("ansOk")) $("ansOk").addEventListener("click", function () {
      var a = $("ans").value.trim(); if (a.length < 3) return toast("پاسخ را بنویسید.", true);
      v.dispute.answer = a; v.dispute.status = "resolved"; v.dispute.ansAt = Date.now(); v.log.push({ t: "پاسخ به مغایرت: " + a, by: u.name, at: Date.now() });
      notify(v.doc, "به مغایرت اعلام‌شده شما پاسخ داده شد", v.id); save(); render(); toast("پاسخ ثبت و برای پزشک ارسال شد.");
    });
  }
  function payModal(v) {
    var r = rem(v);
    openModal('<div class="mp"><h2>' + ic("i-wallet") + "ثبت پرداخت به پزشک</h2><p class=\"mut sm\">" + doc(v.doc).n + " · صورتحساب " + dLabel(v.date) + "</p>" +
      '<div class="rem-l sm"><span>جمع سهم پزشک</span><b>' + toman(total(v)) + "</b><span>پرداخت‌شده</span><b>" + toman(paid(v)) + '</b><span class="rr">مانده</span><b class="rr">' + toman(r) + "</b></div>" +
      '<label class="fl" for="pa">مبلغ پرداخت (تومان) <i>*</i></label><div class="inp ltr">' + ic("i-wallet") + '<input id="pa" inputmode="numeric" value="' + money(r) + '"></div><small class="hint" id="paH"></small>' +
      '<div class="two"><div><label class="fl" for="pd">تاریخ پرداخت <i>*</i></label><select class="sel" id="pd">' + dateOpts(TISO) + '</select></div><div><label class="fl" for="pm">روش پرداخت <i>*</i></label><select class="sel" id="pm">' + METHODS.map(function (m) { return "<option>" + m + "</option>"; }).join("") + "</select></div></div>" +
      '<label class="fl" for="pr">شماره مرجع / پیگیری <span class="opt">(در صورت وجود)</span></label><div class="inp ltr">' + ic("i-copy") + '<input id="pr" inputmode="numeric"></div>' +
      '<label class="fl">سند پرداخت <span class="opt">(اختیاری)</span></label><label class="btn sm2" id="pfL">' + ic("i-up") + '<span id="pfN">انتخاب فایل</span><input type="file" id="pf" accept="image/jpeg,image/png,application/pdf" hidden></label>' +
      '<label class="fl" for="pn">توضیح <span class="opt">(اختیاری)</span></label><textarea id="pn" rows="2"></textarea></div>' +
      '<div class="m-foot"><button class="btn" data-close>انصراف</button><button class="btn pri" id="pOk">' + ic("i-check") + "ثبت پرداخت</button></div>");
    var pfile = null;
    var hint = function () { var a = num($("pa").value); $("pa").value = a ? money(a) : ""; $("paH").textContent = a && a < r ? "پس از ثبت، وضعیت «تسویه جزئی» می‌شود و " + toman(r - a) + " مانده خواهد بود." : a === r ? "با این پرداخت صورتحساب «تسویه‌شده» می‌شود." : a > r ? "مبلغ از مانده بیشتر است." : ""; };
    $("pa").addEventListener("input", hint); hint();
    $("pf").addEventListener("change", function () { var f = this.files[0]; if (!f) return; if (f.size > 10 * 1048576) return toast("حجم فایل بیش از ۱۰ مگابایت است.", true); pfile = { name: f.name, size: f.size, data: null }; $("pfN").textContent = f.name; if (f.size <= 700 * 1024) { var rd = new FileReader(); rd.onload = function () { pfile.data = rd.result; }; rd.readAsDataURL(f); } });
    $("pOk").addEventListener("click", function () {
      var a = num($("pa").value), u = fme();
      if (!(a > 0)) return toast("مبلغ پرداخت را وارد کنید.", true);
      if (a > r) return toast("مبلغ پرداخت از مانده بیشتر است.", true);
      v.pays.push({ id: S.pseq++, amt: a, date: $("pd").value, method: $("pm").value, ref: fa(en($("pr").value).trim()), file: pfile, note: $("pn").value.trim(), by: u.name, at: Date.now() });
      v.log.push({ t: "ثبت پرداخت " + toman(a) + " · " + $("pm").value + " · وضعیت: " + SET[settle(v)].n, by: u.name, at: Date.now() });
      notify(v.doc, "پرداخت " + toman(a) + " بابت صورتحساب " + jDay.format(parse(v.date)) + " ثبت شد", v.id);
      save(); closeModal(); render(); toast("پرداخت ثبت شد · " + SET[settle(v)].n);
    });
  }
  function printInv(v) {
    var t = total(v), p = paid(v);
    openModal('<div class="rep"><header><a class="logo"><span>' + ic("i-logo") + '</span><div><small>مرکز جراحی فوق تخصصی</small><b>دکتر خیرخواه</b></div></a><span class="stamp">نمونه نمایشی</span></header>' +
      '<h2>صورتحساب کارکرد پزشک</h2><dl class="rmeta"><dt>پزشک</dt><dd>' + doc(v.doc).n + '</dd><dt>شماره</dt><dd dir="ltr">' + v.no + "</dd><dt>تاریخ کارکرد</dt><dd>" + dLabel(v.date) + "</dd><dt>وضعیت</dt><dd>" + (settle(v) ? SET[settle(v)].n : PUB[v.status].n) + "</dd></dl>" +
      '<table><thead><tr><th>#</th><th>نوع عمل</th><th>مبلغ (تومان)</th></tr></thead><tbody>' + v.items.map(function (x, i) { return "<tr><td>" + fa(i + 1) + "</td><td>" + esc(x.t) + "</td><td>" + money(x.amt) + "</td></tr>"; }).join("") +
      '<tr class="tot"><td></td><td>جمع سهم پزشک</td><td>' + money(t) + "</td></tr>" + v.pays.map(function (x) { return "<tr><td></td><td>پرداخت · " + dLabel(x.date) + "</td><td>" + money(x.amt) + "</td></tr>"; }).join("") +
      '<tr class="net"><td></td><td>مانده قابل پرداخت</td><td>' + money(t - p) + "</td></tr></tbody></table>" +
      '<p class="rnote">مبالغ توسط واحد مالی مرکز محاسبه و ثبت شده است.</p></div><div class="m-foot"><button class="btn" data-close>بستن</button><button class="btn pri" id="prt">' + ic("i-dl") + "ذخیره PDF / چاپ</button></div>");
    $("prt").addEventListener("click", function () { window.print(); });
  }

  /* ---------- list / payments / doctors ---------- */
  function vFList() {
    if (!V.fd) V.fd = "month";
    return head("صورتحساب‌ها", "همه کارکردهای ثبت‌شده، ارسال‌شده و تسویه‌شده.") + '<section class="box tbox">' + filters(true) + invTable(filt(S.inv).sort(byDate), true) + "</section>";
  }
  function vPays() {
    var all = []; S.inv.forEach(function (v) { v.pays.forEach(function (p) { all.push({ p: p, v: v }); }); });
    var m = V.pm || "month", P = jp(TODAY), prev = P.month === 1 ? (P.year - 1) * 100 + 12 : P.year * 100 + P.month - 1;
    all = all.filter(function (x) { if (V.fdoc && x.v.doc !== V.fdoc) return false; var ym = ymOf(x.p.date); return m === "all" || (m === "month" ? ym === CUR_YM : ym === prev); }).sort(function (a, b) { return b.p.date.localeCompare(a.p.date) || b.p.at - a.p.at; });
    var sum = all.reduce(function (s, x) { return s + x.p.amt; }, 0), open = S.inv.filter(function (v) { return v.status === "published" && settle(v) !== "paid"; });
    var used = {}; S.inv.forEach(function (v) { used[v.doc] = 1; });
    return head("پرداخت‌ها و تسویه‌ها", "سابقه پرداخت‌های ثبت‌شده به پزشکان.") +
      '<div class="kps k3">' + kpi("i-check", "si-g", "جمع پرداخت‌های این بازه", money(sum), "تومان") + kpi("i-clock", "si-r", "صورتحساب‌های باز", fa(open.length), "پرداخت‌نشده یا جزئی") + kpi("i-wallet", "si-v", "مانده کل", money(open.reduce(function (s, v) { return s + rem(v); }, 0)), "تومان") + "</div>" +
      '<section class="box tbox"><div class="fbar"><select class="sel sm" id="pmF">' + [["month", "این ماه"], ["prev", "ماه قبل"], ["all", "همه"]].map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === m ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + '</select><select class="sel sm" id="fdoc"><option value="">همه پزشکان</option>' + Object.keys(used).map(function (d) { return '<option value="' + d + '"' + (d === V.fdoc ? " selected" : "") + ">" + doc(d).n + "</option>"; }).join("") + "</select></div>" +
      (all.length ? '<div class="tw"><table class="ftbl"><thead><tr><th>تاریخ پرداخت</th><th>پزشک</th><th>صورتحساب</th><th>روش</th><th>مرجع</th><th>مبلغ (تومان)</th></tr></thead><tbody>' +
        all.map(function (x) { return '<tr data-inv="' + x.v.id + '"><td data-l="تاریخ">' + dLabel(x.p.date) + '</td><td class="c-doc"><span class="dcell">' + av(x.v.doc) + "<b>" + doc(x.v.doc).n + '</b></span></td><td data-l="صورتحساب">' + jDay.format(parse(x.v.date)) + " · " + sb(x.v) + '</td><td data-l="روش">' + x.p.method + '</td><td data-l="مرجع" dir="ltr">' + (x.p.ref || "—") + '</td><td data-l="مبلغ" class="c-amt">' + money(x.p.amt) + "</td></tr>"; }).join("") + "</tbody></table></div>"
        : '<div class="empty sm">' + ic("i-wallet") + "<b>پرداختی در این بازه ثبت نشده است</b></div>") + "</section>";
  }
  function vDocs() {
    var q = (V.dq || "").trim(), only = V.only !== false, agg = {};
    S.inv.forEach(function (v) { var a = agg[v.doc] = agg[v.doc] || { n: 0, t: 0, p: 0, r: 0 }; a.n++; if (v.status === "published") { a.t += total(v); a.p += paid(v); a.r += rem(v); } });
    var L = DOCTORS.filter(function (d) { return (!only || agg[d.id]) && (!q || d.n.indexOf(q) >= 0); });
    return head("پزشکان همکار", "کارکرد ثبت‌شده و مانده هر پزشک. محاسبه سهم به‌صورت دستی و طبق توافق هر پزشک انجام می‌شود.") +
      '<div class="fbar"><div class="inp sm-inp">' + ic("i-search") + '<input id="dsq" placeholder="جستجوی نام پزشک…" value="' + esc(q) + '"></div><label class="agree sm"><input type="checkbox" id="only"' + (only ? " checked" : "") + "><span>فقط پزشکان دارای کارکرد</span></label></div>" +
      '<div class="dgrid2">' + L.map(function (d) {
        var a = agg[d.id] || { n: 0, t: 0, p: 0, r: 0 };
        return '<article class="dcard"><header>' + av(d.id, "lg") + "<div><b>" + d.n + "</b><small>" + esc(d.s) + "</small></div></header>" +
          '<dl><dt>صورتحساب</dt><dd>' + fa(a.n) + "</dd><dt>جمع منتشرشده</dt><dd>" + mil(a.t) + "</dd><dt>پرداخت‌شده</dt><dd>" + mil(a.p) + '</dd><dt>مانده</dt><dd class="' + (a.r ? "rr" : "") + '">' + mil(a.r) + "</dd></dl>" +
          '<p class="dn">' + ic("i-doc") + (S.notes[d.id] ? esc(S.notes[d.id]) : '<span class="mut">یادداشت توافق مالی ثبت نشده</span>') + "</p>" +
          '<div class="two-b"><button class="btn sm" data-note="' + d.id + '">یادداشت توافق</button><button class="btn sm pri" data-dfil="' + d.id + '">صورتحساب‌ها</button></div></article>';
      }).join("") + "</div>" + (L.length ? "" : '<div class="empty sm">' + ic("i-users") + "<b>پزشکی یافت نشد</b></div>");
  }

  function fMore() {
    openModal('<div class="more"><span class="grab"></span><h2>بیشتر</h2>' + [["pays", "پرداخت‌ها و تسویه‌ها", "i-wallet"], ["docs", "پزشکان همکار", "i-users"]].map(function (x) { return '<button data-go="' + x[0] + '"><span class="ri">' + ic(x[2]) + "</span>" + x[1] + ic("i-chev") + "</button>"; }).join("") +
      '<button class="lo" id="lo2"><span class="ri">' + ic("i-out") + "</span>خروج</button></div>", "sheet");
    $("mCard").querySelectorAll("[data-go]").forEach(function (b) { b.addEventListener("click", function () { closeModal(); go(b.dataset.go); }); });
    $("lo2").addEventListener("click", function () { closeModal(); fLogout(); });
  }
  function fLogout() { try { localStorage.removeItem(FSESS); } catch (e) { } V = { name: "login" }; render(); }

  /* =========================================================
     DOCTOR APP — «کارکرد و درآمد من»
     ========================================================= */
  var QS = new URLSearchParams(location.search), EMBED = QS.get("embed") === "1", QDOC = QS.get("doc");
  if (EMBED) document.body.classList.add("embed");
  /* identity: passed by the doctor panel when embedded (works even where pages don't share storage), else the doctor session */
  function dme() { if (QDOC && PMAP[QDOC]) return PMAP[QDOC]; var s = null; try { s = localStorage.getItem(DSESS); } catch (e) { } return s && PMAP[s] ? PMAP[s] : null; }
  function eShell(html) {
    var d = dme(), act = V.name === "inv" ? "list" : V.name, N = (S.notifs[d] || []).filter(function (n) { return !n.read; }).length;
    return '<div class="emb"><div class="emb-top"><div class="tabs">' + [["dash", "خلاصه کارکرد و درآمد"], ["list", "صورتحساب‌های من"]].map(function (y) { return '<button data-go="' + y[0] + '"' + (act === y[0] ? ' class="on"' : "") + ">" + y[1] + "</button>"; }).join("") + "</div>" +
      '<button class="btn sm" id="nBell">' + ic("i-bell") + "اعلان‌های مالی" + (N ? ' <i class="tc">' + fa(N) + "</i>" : "") + '</button></div><div class="content in">' + html + "</div></div>";
  }
  function dInv(d) { return S.inv.filter(function (v) { return v.doc === d && v.status === "published"; }).sort(byDate); }
  function dShell(html) {
    var d = dme(), x = doc(d), act = V.name === "inv" ? "list" : V.name, N = (S.notifs[d] || []).filter(function (n) { return !n.read; }).length;
    return '<div class="shell"><aside class="side"><a class="logo" href="index.html"><span>' + ic("i-logo") + '</span><div><small>مرکز جراحی فوق تخصصی</small><b>دکتر خیرخواه</b></div></a>' +
      '<p class="side-t">پنل پزشک</p><nav class="snav"><a class="snl" href="doctor-panel.html">' + ic("i-cal") + "برنامه جراحی من</a>" +
      [["dash", "کارکرد و درآمد من", "i-wallet"], ["list", "صورتحساب‌های من", "i-doc"]].map(function (y) { return '<button data-go="' + y[0] + '"' + (act === y[0] ? ' class="on" aria-current="page"' : "") + ">" + ic(y[2]) + y[1] + "</button>"; }).join("") +
      '</nav><button class="out" id="dlogout">' + ic("i-out") + "خروج</button></aside>" +
      '<div class="main"><header class="bar"><a class="logo m-only" href="index.html"><span>' + ic("i-logo") + "</span><b>درآمد من</b></a>" +
      '<div class="tday">' + ic("i-cal") + "<span>" + jWd.format(TODAY) + " " + jFull.format(TODAY) + "</span></div>" +
      '<button class="ic bell" id="nBell" aria-label="اعلان‌ها">' + ic("i-bell") + (N ? "<i>" + fa(N) + "</i>" : "") + "</button>" +
      '<div class="me">' + av(d) + "<div><b>" + x.n + "</b><small>" + esc(x.s) + "</small></div></div></header>" +
      '<div class="content in" id="content">' + html + "</div></div>" +
      '<nav class="tabbar"><a class="tb" href="doctor-panel.html">' + ic("i-cal") + "برنامه جراحی</a>" +
      [["dash", "درآمد من", "i-wallet"], ["list", "صورتحساب‌ها", "i-doc"]].map(function (y) { return '<button data-go="' + y[0] + '"' + (act === y[0] ? ' class="on"' : "") + ">" + ic(y[2]) + y[1] + "</button>"; }).join("") +
      '<button id="nBell2">' + ic("i-bell") + "اعلان‌ها" + (N ? "<i></i>" : "") + "</button></nav></div>";
  }
  function vDNo() {
    $("demo").hidden = true;
    app.innerHTML = '<div class="auth"><a class="logo" href="index.html"><span>' + ic("i-logo") + '</span><div><small>مرکز جراحی فوق تخصصی</small><b>دکتر خیرخواه</b></div></a>' +
      '<section class="card narrow center">' + '<span class="big-i">' + ic("i-lock") + "</span><h1>کارکرد و درآمد من</h1><p class=\"sub\">این بخش داخل پنل پزشک است. وارد پنل پزشک شوید و از منوی کناری «کارکرد و درآمد من» را بزنید.</p>" +
      '<a class="btn pri block" href="doctor-panel.html#income" target="_top">ورود به پنل پزشک</a><p class="fine">' + ic("i-shield") + "هر پزشک فقط صورتحساب‌های خودش را می‌بیند.</p></section></div>";
  }
  function vDDash() {
    var d = dme(), L = dInv(d), m = L.filter(function (v) { return ymOf(v.date) === CUR_YM; });
    var ops = m.reduce(function (s, v) { return s + v.items.length; }, 0), share = m.reduce(function (s, v) { return s + total(v); }, 0);
    var remAll = L.reduce(function (s, v) { return s + rem(v); }, 0), recv = 0;
    L.forEach(function (v) { v.pays.forEach(function (p) { if (ymOf(p.date) === CUR_YM) recv += p.amt; }); });
    var openN = L.filter(function (v) { return settle(v) !== "paid"; }).length;
    /* last 6 Jalali months */
    var months = [], d0 = TODAY;
    for (var i = 0; i < 6; i++) { var p = jp(d0); months.unshift({ ym: p.year * 100 + p.month, n: jMonS.format(d0), t: 0, r: 0 }); while (jp(d0).day > 1) d0 = add(d0, -1); d0 = add(d0, -1); }
    L.forEach(function (v) { var mm = months.filter(function (x) { return x.ym === ymOf(v.date); })[0]; if (mm) mm.t += total(v); v.pays.forEach(function (p) { var mp = months.filter(function (x) { return x.ym === ymOf(p.date); })[0]; if (mp) mp.r += p.amt; }); });
    var mx = Math.max.apply(null, months.map(function (x) { return Math.max(x.t, x.r); }).concat([1]));
    var chart = '<div class="chart" role="img" aria-label="نمودار درآمد ماهانه">' + months.map(function (x) {
      return '<div class="bc' + (x.ym === CUR_YM ? " cur" : "") + '"><div class="bars"><span class="b1" style="height:' + Math.round(x.t / mx * 100) + '%" title="سهم ثبت‌شده: ' + toman(x.t) + '"><em>' + (x.t ? nf.format(Math.round(x.t / 1e6)) : "") + '</em></span><span class="b2" style="height:' + Math.round(x.r / mx * 100) + '%" title="دریافتی: ' + toman(x.r) + '"></span></div><small>' + x.n + "</small></div>";
    }).join("") + '</div><div class="lgd"><span><i class="b1"></i>سهم ثبت‌شده (میلیون تومان)</span><span><i class="b2"></i>دریافتی ثبت‌شده</span></div>';
    return '<section class="welcome s-wel d-wel"><div class="w-t"><h1>سلام ' + doc(d).n + '</h1><p class="w-p">خلاصه کارکرد و تسویه حساب‌های شما در مرکز. مبالغ توسط واحد مالی محاسبه و ثبت می‌شود.</p></div><div class="w-img"><img src="assets/img/or-hero.jpg" alt=""></div></section>' +
      '<div class="kps">' + kpi("i-flask", "si-b", "عمل‌های این ماه", fa(ops)) + kpi("i-wallet", "si-v", "سهم ثبت‌شده این ماه", mil(share), "تومان") + kpi("i-clock", "si-r", "مانده قابل پرداخت", mil(remAll), fa(openN) + " صورتحساب باز") + kpi("i-check", "si-g", "دریافتی ثبت‌شده این ماه", mil(recv), "تومان") + "</div>" +
      '<div class="dgrid3"><section class="box"><header><h2>آخرین تسویه حساب‌ها</h2><button class="more" data-go="list">مشاهده همه</button></header>' + invTable(L.slice(0, 5), false, true) + "</section>" +
      '<section class="box"><header><h2>نمودار درآمد ماهانه</h2><small class="mut">۶ ماه اخیر</small></header>' + chart + "</section></div>" +
      '<p class="fine left">' + ic("i-alert") + "مبالغ نمایشی هستند. اگر درباره تعداد عمل یا مبلغی اختلاف دارید، از صفحه جزئیات صورتحساب «اعلام مغایرت» کنید.</p>";
  }
  function vDList() {
    var d = dme(), L = dInv(d).filter(function (v) { return !V.fset || V.fset === "all" || settle(v) === V.fset; });
    return head("صورتحساب‌های من", "صورتحساب‌های منتشرشده توسط واحد مالی.") +
      '<section class="box tbox"><div class="fbar"><select class="sel sm" id="fset">' + [["all", "همه"], ["unpaid", "پرداخت‌نشده"], ["partial", "تسویه جزئی"], ["paid", "تسویه‌شده"]].map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === (V.fset || "all") ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + "</select></div>" + invTable(L, false, true) + "</section>";
  }
  function vDInv() {
    var d = dme(), v = inv(V.id);
    if (!v || v.doc !== d || v.status !== "published") return '<div class="empty">' + ic("i-lock") + "<b>این صورتحساب در دسترس شما نیست</b><p>هر پزشک فقط صورتحساب‌های منتشرشده خودش را می‌بیند.</p></div>";
    return head("جزئیات صورتحساب", "", "list") + '<div class="iacts"><button class="btn" id="pdfB">' + ic("i-dl") + "دانلود PDF</button>" + (!v.dispute || v.dispute.status !== "open" ? '<button class="btn danger" id="dspB">' + ic("i-alert") + "اعلام مغایرت</button>" : "") + "</div>" + invBody(v, true);
  }
  function notifModal() {
    var d = dme(), N = (S.notifs[d] || []).slice().sort(function (a, b) { return b.at - a.at; });
    openModal('<div class="mp"><h2>' + ic("i-bell") + "اعلان‌های مالی</h2>" + (N.length ? '<ul class="rows">' + N.slice(0, 12).map(function (n) { return '<li><button data-ninv="' + n.inv + '" class="' + (n.read ? "" : "unr") + '"><span class="ri">' + ic("i-wallet") + "</span><div><b>" + esc(n.t) + "</b><small>" + stamp(n.at) + "</small></div>" + ic("i-chev") + "</button></li>"; }).join("") + "</ul>" : '<p class="mut">اعلانی ندارید.</p>') +
      '</div><div class="m-foot"><button class="btn pri" data-close>بستن</button></div>');
    (S.notifs[d] || []).forEach(function (n) { n.read = true; }); save();
    $("mCard").querySelectorAll("[data-ninv]").forEach(function (b) { b.addEventListener("click", function () { closeModal(); go("inv", { id: +b.dataset.ninv }); }); });
    var bi = document.querySelector("#nBell i"); if (bi) bi.remove(); var b2 = document.querySelector("#nBell2 i"); if (b2) b2.remove();
  }
  function bindDInv() {
    var v = inv(V.id); if (!v) return;
    if ($("pdfB")) $("pdfB").addEventListener("click", function () { printInv(v); });
    if ($("dspB")) $("dspB").addEventListener("click", function () {
      openModal('<div class="mp"><h2>' + ic("i-alert") + "اعلام مغایرت</h2><p class=\"mut sm\">صورتحساب " + dLabel(v.date) + ' · شما نمی‌توانید مبلغ را ویرایش کنید؛ واحد مالی درخواست شما را بررسی می‌کند.</p>' +
        '<label class="fl">موضوع مغایرت <i>*</i></label><div class="seg" id="dk">' + ["تعداد عمل", "مبلغ", "نوع عمل", "سایر"].map(function (k, i) { return '<button type="button" data-k="' + k + '"' + (i === 1 ? ' class="on"' : "") + ">" + k + "</button>"; }).join("") + "</div>" +
        '<label class="fl" for="dt">توضیح <i>*</i></label><textarea id="dt" rows="3" placeholder="مثلاً: در این روز ۵ عمل انجام داده‌ام ولی ۴ عمل ثبت شده است."></textarea></div>' +
        '<div class="m-foot"><button class="btn" data-close>انصراف</button><button class="btn pri" id="dOk">' + ic("i-send") + "ارسال برای واحد مالی</button></div>");
      $("dk").querySelectorAll("[data-k]").forEach(function (b) { b.addEventListener("click", function () { $("dk").querySelectorAll("button").forEach(function (x) { x.classList.toggle("on", x === b); }); }); });
      $("dOk").addEventListener("click", function () {
        var t = $("dt").value.trim(); if (t.length < 8) return toast("توضیح مغایرت را کامل بنویسید.", true);
        v.dispute = { kind: $("dk").querySelector(".on").dataset.k, text: t, at: Date.now(), status: "open", answer: "" };
        v.log.push({ t: "اعلام مغایرت توسط پزشک (" + v.dispute.kind + ")", by: doc(v.doc).n, at: Date.now() });
        save(); closeModal(); render(); toast("مغایرت برای واحد مالی ارسال شد.");
      });
    });
  }

  /* =========================================================
     RENDER
     ========================================================= */
  function render() {
    if (APP === "doctor") {
      if (!dme()) return vDNo();
      var DV = { dash: vDDash, list: vDList, inv: vDInv };
      if (!DV[V.name]) V.name = "dash";
      app.innerHTML = (EMBED ? eShell : dShell)(DV[V.name]());
      bindCommon();
      if ($("dlogout")) $("dlogout").addEventListener("click", function () { try { localStorage.removeItem(DSESS); } catch (e) { } location.href = "doctor-panel.html"; });
      if ($("nBell")) $("nBell").addEventListener("click", notifModal);
      if ($("nBell2")) $("nBell2").addEventListener("click", notifModal);
      if (V.name === "inv") bindDInv();
      $("demo").hidden = true;
      return;
    }
    if (!fme()) { V.name = "login"; return vFLogin(); }
    if (V.name === "login") V.name = "dash";
    var FV = { dash: vFDash, "new": vNew, list: vFList, inv: vFInv, pays: vPays, docs: vDocs };
    if (!FV[V.name]) V.name = "dash";
    app.innerHTML = fShell(FV[V.name]());
    bindCommon();
    if ($("logout")) $("logout").addEventListener("click", fLogout);
    if ($("moreB")) $("moreB").addEventListener("click", fMore);
    if (V.name === "new") bindNew();
    if (V.name === "inv") bindFInv();
    if ($("pmF")) $("pmF").addEventListener("change", function () { V.pm = this.value; render(); });
    if ($("dsq")) $("dsq").addEventListener("input", function () { V.dq = this.value; var p = this.selectionStart; render(); var q = $("dsq"); q.focus(); q.setSelectionRange(p, p); });
    if ($("only")) $("only").addEventListener("change", function () { V.only = this.checked; render(); });
    document.querySelectorAll("[data-dfil]").forEach(function (b) { b.addEventListener("click", function () { go("list", { fdoc: b.dataset.dfil, fd: "all" }); }); });
    document.querySelectorAll("[data-note]").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.dataset.note;
        openModal('<div class="mp"><h2>' + ic("i-doc") + "یادداشت توافق مالی</h2><p class=\"mut sm\">" + doc(id).n + " · فقط برای مرجع داخلی؛ سیستم بر اساس آن محاسبه‌ای انجام نمی‌دهد.</p><textarea id=\"nt\" rows=\"4\">" + esc(S.notes[id] || "") + '</textarea></div><div class="m-foot"><button class="btn" data-close>انصراف</button><button class="btn pri" id="ntOk">ذخیره</button></div>');
        $("ntOk").addEventListener("click", function () { S.notes[id] = $("nt").value.trim(); save(); closeModal(); render(); toast("یادداشت ذخیره شد."); });
      });
    });
    document.querySelectorAll("[data-sched]").forEach(function (b) {
      b.addEventListener("click", function () {
        var x = schedDone().filter(function (s) { return s.ref === b.dataset.sched; })[0]; if (!x) return;
        go("new", { form: newForm({ doc: x.doc, date: x.date, items: [{ t: x.t, amt: 0, src: "schedule", ref: x.ref }], step: 2 }) });
        setTimeout(function () { focusRow(0, "amt"); }, 60);
      });
    });
    demo();
  }
  function bindCommon() {
    document.querySelectorAll("[data-go]").forEach(function (b) { b.addEventListener("click", function () { go(b.dataset.go); }); });
    document.querySelectorAll("[data-inv]").forEach(function (b) { b.addEventListener("click", function (e) { e.stopPropagation(); go("inv", { id: +b.dataset.inv }); }); });
    document.querySelectorAll("[data-demo-file]").forEach(function (b) { b.addEventListener("click", function () { toast("فایل نمونه است؛ در نسخه واقعی از سرور با بررسی دسترسی دانلود می‌شود."); }); });
    bindFilters();
  }
  function demo() {
    var el = $("demo"); if (!el) return; el.hidden = false;
    $("demoG").innerHTML = '<button type="button" data-d="dsp">پزشک: اعلام مغایرت روی آخرین صورتحساب منتشرشده</button><a class="dl" href="doctor-income.html" target="_blank" rel="noopener">باز کردن نمای پزشک در زبانه جدید ↗</a>';
    $("demoG").querySelector("[data-d]").addEventListener("click", function () {
      var v = S.inv.filter(function (x) { return x.status === "published" && (!x.dispute || x.dispute.status !== "open"); }).sort(byDate)[0];
      if (!v) return toast("صورتحساب منتشرشده‌ای بدون مغایرت نیست.", true);
      v.dispute = { kind: "تعداد عمل", text: "در این روز یک عمل دیگر هم انجام داده‌ام که در صورتحساب نیامده است.", at: Date.now(), status: "open", answer: "" };
      v.log.push({ t: "اعلام مغایرت توسط پزشک (تعداد عمل)", by: doc(v.doc).n, at: Date.now() });
      save(); go("inv", { id: v.id }); toast("مغایرت از طرف پزشک ثبت شد.");
    });
  }
  if ($("demoT")) $("demoT").addEventListener("click", function () { $("demo").classList.toggle("open"); });
  if ($("demoR")) $("demoR").addEventListener("click", function () { if (!confirm("داده‌های نمایشی مالی بازنشانی شود؟")) return; S = seed(); save(); go(APP === "doctor" ? "dash" : "dash"); });
  addEventListener("storage", function (e) { if (e.key === KEY || e.key === DSESS || e.key === FSESS) { S = load() || S; if (V.name !== "new") render(); } });
  render();
})();
