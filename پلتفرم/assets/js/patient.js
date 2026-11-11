/* =========================================================
   Patient portal — Dr. Kheirkhah Surgical Center (MVP · DEMO)
   Two core jobs: "request surgery" and "see my lab results".
   - Patient never books a slot; reception reviews the referral & calls.
   - Lab results are matched by sample/request ID (not mobile) and published by the center.
   ========================================================= */
(function () {
  "use strict";
  var KEY = "kh-patient-demo-v2", $ = function (s) { return document.getElementById(s); }, app = $("app");
  var FA = "۰۱۲۳۴۵۶۷۸۹";
  function fa(x) { return String(x).replace(/\d/g, function (d) { return FA[d]; }); }
  function en(x) { return String(x).replace(/[۰-۹]/g, function (d) { return FA.indexOf(d); }).replace(/[٠-٩]/g, function (d) { return "٠١٢٣٤٥٦٧٨٩".indexOf(d); }); }
  var jD = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { day: "numeric", month: "long", year: "numeric" });
  var jY = new Intl.DateTimeFormat("en-US-u-ca-persian", { year: "numeric" });
  function dayOff(n) { var d = new Date(); d.setDate(d.getDate() + n); return d; }
  function hm(d) { return fa(("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2)); }
  function stamp(d) { d = d || new Date(); return jD.format(d) + " · " + hm(d); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function mask(m) { return fa(m.slice(0, 4) + " ••• " + m.slice(-4)); }
  function ic(n) { return '<svg><use href="#' + n + '"/></svg>'; }

  /* ---------- statuses ---------- */
  var ST = {
    submitted: { t: "ثبت‌شده؛ در انتظار بررسی", s: "ثبت‌شده", d: "برگه معرفی پزشک دریافت شده است.", i: "i-check", c: "s-sub" },
    review:    { t: "در حال بررسی", s: "در حال بررسی", d: "اطلاعات و مدارک شما توسط کارشناس پذیرش بررسی می‌شود.", i: "i-search", c: "s-rev" },
    docs:      { t: "نیاز به تکمیل مدارک", s: "نیاز به تکمیل مدارک", d: "لازم است تصویر یا اطلاعاتی را اصلاح یا تکمیل کنید.", i: "i-alert", c: "s-docs" },
    coord:     { t: "در حال هماهنگی", s: "در حال هماهنگی", d: "پذیرش برای هماهنگی مراحل بعدی با شما تماس می‌گیرد.", i: "i-call", c: "s-coord" },
    confirmed: { t: "برنامه جراحی تعیین شد", s: "تأییدشده", d: "تاریخ و ساعت جراحی شما ثبت و اعلام شد.", i: "i-cal", c: "s-ok" },
    done:      { t: "عمل انجام شد", s: "انجام‌شده", d: "عمل شما انجام شد و ترخیص شدید. نظر شما به بهبود خدمات مرکز کمک می‌کند.", i: "i-check", c: "s-ok" },
    canceled:  { t: "لغوشده", s: "لغوشده", d: "این درخواست لغو شده است.", i: "i-ban", c: "s-can" }
  };
  var TRACK = [
    { k: "submitted", t: "درخواست ثبت شد", d: "برگه معرفی دریافت شده است." },
    { k: "review", t: "بررسی مدارک توسط پذیرش", d: "اطلاعات بیمار و مدارک توسط کارشناس بررسی می‌شوند." },
    { k: "coord", t: "تماس و هماهنگی", d: "پذیرش با شما تماس می‌گیرد و مراحل بعدی را مشخص می‌کند." },
    { k: "confirmed", t: "تعیین برنامه جراحی", d: "پس از تأییدهای لازم، تاریخ و ساعت جراحی اعلام می‌شود." },
    { k: "done", t: "انجام عمل و ترخیص", d: "پس از ترخیص، نظرسنجی کوتاهی برای شما فعال می‌شود." }
  ];
  var LAB = {
    sent:  { t: "در انتظار جواب", sub: "نمونه به آزمایشگاه همکار ارسال شده است.", c: "s-rev", i: "i-clock" },
    ready: { t: "آماده مشاهده", sub: "جواب پس از کنترل مرکز در پنل شما قرار گرفت.", c: "s-ok", i: "i-check" }
  };

  /* ---------- store ---------- */
  var S;
  function load() { try { S = JSON.parse(localStorage.getItem(KEY)); } catch (e) { S = null; } if (!S) S = { users: {}, session: null, reqs: [], labs: [], msgs: [], seq: 2577 }; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast("حجم فایل برای نسخه نمایشی زیاد است.", true); } }
  function me() { return S.session && S.users[S.session]; }
  function mine(list) { return list.filter(function (x) { return x.mobile === S.session; }).sort(function (a, b) { return b.id - a.id; }); }
  function reqs() { return mine(S.reqs); }
  function labs() { return mine(S.labs); }
  function msgs() { return mine(S.msgs); }
  function unread() { return msgs().filter(function (m) { return !m.read; }).length; }
  function msg(kind, title, text, ref) { S.msgs.push({ id: Date.now() + Math.random(), mobile: S.session, kind: kind, title: title, text: text, ref: ref || null, at: stamp(), read: false }); }

  /* demo lab records for a new account: matched to the patient record by sample ID */
  /* demo: one completed (sample) surgery per account, so the post-surgery survey is visible right away */
  function seedDoneSurgery(mobile) {
    var u = S.users[mobile]; if (!u || u.svSeed) return;
    var d = dayOff(-3), at = stamp(d), y = new Intl.DateTimeFormat("en-u-ca-persian", { year: "numeric" }).format(d).replace(/\D/g, "");
    var id = 1000 + Object.keys(S.users).length;
    S.reqs.push({ id: id, code: "KH-" + y + "-2401", mobile: mobile, ref: "دکتر حسین طاهری نساج", refId: "taheri-nassaj", note: "", file: null, status: "done", demo: true,
      created: stamp(dayOff(-12)), surgery: { date: jD.format(d), time: "۰۷:۳۰", place: "پذیرش همکف · کاشان، خیابان امیرکبیر", doc: "دکتر حسین طاهری نساج" }, reason: "",
      calls: [{ ok: true, t: "تماس برقرار شد", at: stamp(dayOff(-10)) }],
      log: [{ t: "درخواست ثبت شد و برگه معرفی دریافت شد", at: stamp(dayOff(-12)), ts: +dayOff(-12) }, { t: "برنامه جراحی تعیین و اعلام شد", at: stamp(dayOff(-9)), ts: +dayOff(-9) }, { t: "عمل انجام شد و بیمار ترخیص شد", at: at, ts: +d }] });
    S.msgs.push({ id: +dayOff(-2) + 10 * 36e5, mobile: mobile, kind: "surgery", title: "نظر شما درباره خدمات مرکز", text: "عمل شما انجام شد. لطفاً در نظرسنجی دو دقیقه‌ای درباره پذیرش، پرستاران، پزشک و ترخیص شرکت کنید (کد KH-" + y + "-2401).", ref: id, at: stamp(dayOff(-2)), read: false, demo: true });
    u.svSeed = true;
  }
  /* keep demo dates current: sample tests / surgery / messages are rebuilt for today; the patient's own data is kept */
  function todayKey() { var d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
  function refreshDemo(mobile) {
    var u = S.users[mobile]; if (!u || u.seedDay === todayKey()) return false;
    var legacy = !u.seedDay, demoReq = {};
    S.reqs.forEach(function (r) { if (r.mobile === mobile && r.demo) demoReq[r.id] = 1; });
    var isOldLab = function (l) { return l.demo || (legacy && l.id >= 50310 && l.id < 50720); };
    var oldLab = {}; S.labs.forEach(function (l) { if (l.mobile === mobile && isOldLab(l)) oldLab[l.id] = 1; });
    S.labs = S.labs.filter(function (l) { return !(l.mobile === mobile && oldLab[l.id]); });
    S.reqs = S.reqs.filter(function (r) { return !(r.mobile === mobile && demoReq[r.id]); });
    S.msgs = S.msgs.filter(function (m) { return !(m.mobile === mobile && (m.demo || (m.kind === "lab" && oldLab[m.ref]) || demoReq[m.ref])); });
    u.svSeed = false; seedLabs(mobile); seedDoneSurgery(mobile); u.seedDay = todayKey();
    return true;
  }
  function seedLabs(mobile) {
    var base = 50310 + Math.floor(Math.random() * 400);
    [["آزمایش خون کامل (CBC)", "ready", 9], ["آزمایش قند خون ناشتا (FBS)", "ready", 6], ["آزمایش انعقاد خون (PT, PTT)", "sent", 1]].forEach(function (r, k) {
      S.labs.push({ id: base + k, mobile: mobile, name: r[0], sample: "S-" + fa(base + k), status: r[1], taken: jD.format(dayOff(-r[2])), eta: r[1] === "sent" ? "تا ۲ روز کاری" : "", published: r[1] === "ready" ? jD.format(dayOff(-r[2] + 1)) : "", seen: false, demo: true });
    });
    S.msgs.push({ id: +dayOff(-5) + 9 * 36e5, mobile: mobile, kind: "lab", title: "جواب آزمایش آماده است", text: "جواب «آزمایش قند خون ناشتا (FBS)» در پنل شما قرار گرفت.", ref: base + 1, at: stamp(dayOff(-5)), read: false, demo: true });
  }

  /* ---------- router ---------- */
  var V = { name: "login", otp: null, mobile: "", draft: null, id: null, after: null };
  var NAV = [
    { k: "dash", t: "داشبورد", i: "i-home" },
    { k: "new", t: "درخواست جراحی", i: "i-cal" },
    { k: "reqs", t: "درخواست‌های من", i: "i-folder" },
    { k: "labs", t: "آزمایش‌های من", i: "i-flask" },
    { k: "msgs", t: "پیام‌ها و اطلاع‌رسانی", i: "i-msg" },
    { k: "acct", t: "حساب کاربری", i: "i-user" }
  ];
  var NAVOF = { survey: "reqs", svdone: "reqs", new: "new", upload: "new", review: "new", success: "reqs", reqs: "reqs", detail: "reqs", reupload: "reqs", labs: "labs", lab: "labs", msgs: "msgs", acct: "acct", dash: "dash", onboard: "dash" };
  function go(name, extra) { V.name = name; if (extra) for (var k in extra) V[k] = extra[k]; render(); scrollTo(0, 0); }

  /* ---------- shell ---------- */
  function shell(inner) {
    var u = me(), n = unread(), cur = NAVOF[V.name];
    return '<div class="shell"><aside class="side"><a class="logo" href="index.html"><span>' + ic("i-logo") + '</span><div><small>مرکز جراحی فوق تخصصی</small><b>دکتر خیرخواه</b></div></a><nav class="snav">' +
      NAV.map(function (x) { return '<button type="button" data-go="' + x.k + '" class="' + (cur === x.k ? "on" : "") + '">' + ic(x.i) + "<span>" + x.t + "</span>" + (x.k === "msgs" && n ? '<i class="dot">' + fa(n) + "</i>" : "") + "</button>"; }).join("") +
      '</nav><button type="button" class="out" id="logout">' + ic("i-out") + "خروج از حساب</button></aside>" +
      '<div class="main"><header class="bar"><a class="logo m-only" href="index.html"><span>' + ic("i-logo") + "</span><div><b>دکتر خیرخواه</b></div></a>" +
      '<button type="button" class="ic bell" data-go="msgs" aria-label="پیام‌ها">' + ic("i-bell") + (n ? "<i>" + fa(n) + "</i>" : "") + "</button>" +
      '<a class="sup" href="tel:+983155154000"><span>' + ic("i-call") + '</span><div><small>پشتیبانی</small><b dir="ltr">031-55154000</b></div></a>' +
      '<button type="button" class="me" data-go="acct"><span class="av">' + esc((u.name || "؟").charAt(0)) + "</span><div><b>" + esc(u.name || "بیمار گرامی") + '</b><small dir="ltr">' + mask(u.mobile) + "</small></div></button></header>" +
      '<div class="content" id="content">' + inner + "</div></div>" +
      '<nav class="tabbar">' + NAV.filter(function (x) { return x.k !== "new"; }).map(function (x) { return '<button type="button" data-go="' + x.k + '" class="' + (cur === x.k ? "on" : "") + '">' + ic(x.i) + "<span>" + x.t.split(" ")[0] + "</span>" + (x.k === "msgs" && n ? "<i></i>" : "") + "</button>"; }).join("") + "</nav></div>";
  }
  function head(t, sub, back) { return (back ? '<button class="back" data-go="' + back + '">' + ic("i-back") + "بازگشت</button>" : "") + '<div class="ph"><h1>' + t + "</h1>" + (sub ? "<p>" + sub + "</p>" : "") + "</div>"; }
  function badge(c, i, t) { return '<span class="st ' + c + '">' + ic(i) + t + "</span>"; }
  function rBadge(st) { var s = ST[st]; return badge(s.c, s.i, s.s); }
  function lBadge(st) { var s = LAB[st]; return badge(s.c, s.i, s.t); }

  /* ================= LOGIN ================= */
  function vLogin() {
    var otp = V.otp;
    var card = !otp ?
      '<h1>ورود به پنل بیمار</h1><p class="sub">با شماره موبایل وارد شوید؛ برای ثبت درخواست جراحی و دریافت جواب آزمایش.</p>' +
      '<label class="fl" for="mob">شماره موبایل</label><div class="inp ltr">' + ic("i-phone") + '<input id="mob" inputmode="numeric" maxlength="11" placeholder="۰۹۱۲۳۴۵۶۷۸۹" autocomplete="tel" value="' + fa(V.mobile) + '"></div>' +
      '<button class="btn pri block" id="getOtp">دریافت کد تأیید' + arr() + "</button>" +
      '<p class="fine">' + ic("i-shield") + "اطلاعات پزشکی شما فقط در اختیار کادر مجاز مرکز قرار می‌گیرد.</p>"
      :
      '<h1>کد تأیید را وارد کنید</h1><p class="sub">کد ۵ رقمی به <b dir="ltr">' + mask(V.mobile) + '</b> ارسال شد. <button class="link" id="editMob">ویرایش شماره</button></p>' +
      '<div class="otp" id="otp">' + "<input inputmode='numeric' maxlength='1' aria-label='رقم'>".repeat(5) + "</div>" +
      '<div class="demo-code">نسخه نمایشی · کد: <b dir="ltr">' + fa(otp) + "</b></div>" +
      '<button class="btn pri block" id="verify">تأیید و ورود' + arr() + '</button><p class="resend" id="resend"></p>';
    app.innerHTML = '<div class="auth"><a class="logo" href="index.html"><span>' + ic("i-logo") + '</span><div><small>مرکز جراحی فوق تخصصی</small><b>دکتر خیرخواه</b></div></a>' +
      '<div class="split"><div class="hero-img"><img src="assets/img/patient-hero.jpg" alt=""><div class="hero-t"><h2>پنل شخصی بیمار</h2>' +
      "<ul><li>" + ic("i-doc") + "ارسال برگه پزشک و درخواست جراحی</li><li>" + ic("i-flask") + "دریافت جواب آزمایش بدون مراجعه حضوری</li><li>" + ic("i-search") + "پیگیری وضعیت و پیام‌های مرکز</li></ul></div></div>" +
      '<section class="card narrow">' + card + "</section></div></div>";
    if (!otp) {
      $("mob").focus();
      var send = function () {
        var m = en($("mob").value).replace(/\D/g, "");
        if (!/^09\d{9}$/.test(m)) return toast("شماره موبایل را درست وارد کنید (مثل ۰۹۱۲۳۴۵۶۷۸۹).", true);
        V.mobile = m; V.otp = String(10000 + Math.floor(Math.random() * 89999)); V.sent = Date.now(); render();
      };
      $("getOtp").addEventListener("click", send);
      $("mob").addEventListener("keydown", function (e) { if (e.key === "Enter") send(); });
      return;
    }
    var ins = Array.prototype.slice.call(document.querySelectorAll("#otp input"));
    ins[0].focus();
    ins.forEach(function (inp, i) {
      inp.addEventListener("input", function () { inp.value = fa(en(inp.value).replace(/\D/g, "").slice(-1)); if (inp.value && ins[i + 1]) ins[i + 1].focus(); if (ins.every(function (x) { return x.value; })) $("verify").click(); });
      inp.addEventListener("keydown", function (e) { if (e.key === "Backspace" && !inp.value && ins[i - 1]) ins[i - 1].focus(); });
      inp.addEventListener("paste", function (e) { var t = en(e.clipboardData.getData("text")).replace(/\D/g, ""); if (t.length >= 5) { e.preventDefault(); ins.forEach(function (x, k) { x.value = fa(t[k]); }); $("verify").click(); } });
    });
    $("editMob").addEventListener("click", function () { V.otp = null; render(); });
    $("verify").addEventListener("click", function () {
      var code = en(ins.map(function (x) { return x.value; }).join(""));
      if (code !== V.otp) { toast("کد واردشده درست نیست.", true); ins.forEach(function (x) { x.value = ""; }); ins[0].focus(); var o = document.querySelector(".otp"); o.classList.add("shake"); setTimeout(function () { o.classList.remove("shake"); }, 500); return; }
      S.session = V.mobile; V.otp = null;
      if (!S.users[V.mobile]) { S.users[V.mobile] = { mobile: V.mobile, name: "", nc: "", birth: "", notif: { surgery: true, lab: true }, created: stamp(), seedDay: todayKey() }; seedLabs(V.mobile); }
      seedDoneSurgery(V.mobile);
      save();
      var u = me(), dest = V.after || "dash";
      if (/[?&]next=assistant/.test(location.search) && u.name) { location.href = "assistant.html#me"; return; }
      if (!u.name) go("onboard", { next: dest }); else go(dest);
    });
    tick();
  }
  var tickT;
  function tick() {
    clearTimeout(tickT); var el = $("resend"); if (!el) return;
    var left = 60 - Math.floor((Date.now() - V.sent) / 1000);
    if (left > 0) { el.textContent = "ارسال مجدد کد تا " + fa(left) + " ثانیه دیگر"; tickT = setTimeout(tick, 1000); }
    else { el.innerHTML = '<button class="link" id="again">ارسال مجدد کد</button>'; $("again").addEventListener("click", function () { V.otp = String(10000 + Math.floor(Math.random() * 89999)); V.sent = Date.now(); render(); toast("کد جدید ارسال شد."); }); }
  }
  function arr() { return '<svg class="arr"><use href="#i-arrow"/></svg>'; }

  /* ================= FIRST-TIME PROFILE ================= */
  function profileFields(u) {
    return '<label class="fl" for="nm">نام و نام خانوادگی <i>*</i></label><div class="inp">' + ic("i-user") + '<input id="nm" value="' + esc(u.name) + '" autocomplete="name" placeholder="مثلاً: علی محمدی"></div>' +
      '<label class="fl">شماره موبایل</label><div class="inp ro ltr">' + ic("i-phone") + '<input value="' + fa(u.mobile) + '" readonly><span class="ok-b">' + ic("i-check") + "تأییدشده</span></div>" +
      '<label class="fl" for="nc">کد ملی <i>*</i></label><div class="inp ltr">' + ic("i-doc") + '<input id="nc" inputmode="numeric" maxlength="10" value="' + fa(u.nc) + '" placeholder="۱۲۳۴۵۶۷۸۹۰"></div>' +
      '<small class="hint">کد ملی فقط برای تطبیق با پرونده شما در مرکز استفاده می‌شود تا پرونده تکراری ساخته نشود.</small>' +
      birthFields(u.birth);
  }
  var JMONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
  function birthFields(b) {
    var p = en(b || "").split("/"), y = +p[0] || 0, m = +p[1] || 0, d = +p[2] || 0, cy = +en(new Intl.DateTimeFormat("fa-IR-u-ca-persian", { year: "numeric" }).format(new Date())).replace(/\D/g, "");
    var opt = function (v, t, sel) { return '<option value="' + v + '"' + (v === sel ? " selected" : "") + ">" + t + "</option>"; };
    var days = '<option value="">روز</option>', mons = '<option value="">ماه</option>', yrs = '<option value="">سال</option>';
    for (var i = 1; i <= 31; i++) days += opt(i, fa(i), d);
    JMONTHS.forEach(function (n, i) { mons += opt(i + 1, n, m); });
    for (var j = cy; j >= cy - 100; j--) yrs += opt(j, fa(j), y);
    return '<label class="fl" for="bdD">تاریخ تولد <span class="opt">(اختیاری)</span></label><div class="bdate"><select class="sel" id="bdD" aria-label="روز تولد">' + days + '</select><select class="sel" id="bdM" aria-label="ماه تولد">' + mons + '</select><select class="sel" id="bdY" aria-label="سال تولد">' + yrs + "</select></div>";
  }
  function readBirth() {
    var d = $("bdD").value, m = $("bdM").value, y = $("bdY").value;
    if (!d && !m && !y) return "";
    if (!d || !m || !y) return null;
    if (+m > 6 && +d > 30 || +m === 12 && +d > 30) return null;
    var z = function (v) { return ("0" + v).slice(-2); };
    return fa(y + "/" + z(m) + "/" + z(d));
  }
  function readProfile(u) {
    var nm = $("nm").value.trim(), nc = en($("nc").value).replace(/\D/g, "");
    if (nm.length < 3) { toast("نام و نام خانوادگی را وارد کنید.", true); return false; }
    if (!/^\d{10}$/.test(nc)) { toast("کد ملی باید ۱۰ رقم باشد.", true); return false; }
    var b = readBirth(); if (b === null) { toast("تاریخ تولد را کامل و درست انتخاب کنید (روز، ماه و سال).", true); return false; }
    u.name = nm; u.nc = nc; u.birth = b; return true;
  }
  function vOnboard() {
    var u = me();
    app.innerHTML = '<div class="auth"><section class="card narrow">' + head("تکمیل اطلاعات", "اولین ورود شماست؛ فقط چند مورد کوتاه.") + profileFields(u) +
      '<button class="btn pri block" id="ok">ذخیره و ورود به پنل' + arr() + "</button></section></div>";
    $("ok").addEventListener("click", function () { if (!readProfile(u)) return; save(); if (/[?&]next=assistant/.test(location.search)) { location.href = "assistant.html#me"; return; } go(V.next || "dash"); toast("خوش آمدید، " + u.name); });
  }

  /* ================= DASHBOARD ================= */
  function completion(u) { var f = [u.name, u.nc, u.birth, u.mobile].filter(Boolean).length; return Math.round(f / 4 * 100); }
  function vDash() {
    var u = me(), R = reqs(), L = labs(), lr = R[0], ll = L[0], pct = completion(u);
    var lastCoord = (function () { var all = []; R.forEach(function (r) { r.log.forEach(function (l) { all.push({ r: r, l: l }); }); }); return all.sort(function (a, b) { return b.l.ts - a.l.ts; })[0]; })();
    var html =
      '<section class="welcome"><div class="w-t"><h1>سلام ' + esc((u.name || "").split(" ")[0]) + ' عزیز<br><span>به پنل شخصی خودتان خوش آمدید</span></h1>' +
      "<p>در این پنل می‌توانید درخواست نوبت جراحی ثبت کنید، نتایج آزمایش‌های خود را مشاهده کنید و از وضعیت درخواست‌ها مطلع شوید.</p>" +
      '<div class="w-b"><button class="btn pri" data-go="new">' + ic("i-plus") + 'ثبت درخواست نوبت جراحی</button><button class="btn" data-go="labs">' + ic("i-doc") + "مشاهده نتایج آزمایش‌ها</button></div></div>" +
      '<div class="w-img"><img src="assets/img/p-or.jpg" alt=""></div></section>' +
      '<div class="dgrid"><div class="dmain">' + svBanner() +
      '<div class="big2">' +
      '<button class="bigc" data-go="new"><div><span class="bi">' + ic("i-cal") + "</span><b>درخواست نوبت جراحی</b><p>برگه معرفی پزشک خود را ارسال کنید و درخواست نوبت جراحی ثبت نمایید.</p><em>ثبت درخواست" + arr() + '</em></div><img src="assets/img/p-form.jpg" alt=""></button>' +
      '<button class="bigc" data-go="labs"><div><span class="bi lab">' + ic("i-flask") + "</span><b>نتایج آزمایش‌ها</b><p>نتایج آزمایش‌های انجام‌شده خود را به‌صورت آنلاین مشاهده کنید.</p><em>مشاهده نتایج" + arr() + '</em></div><img src="assets/img/p-lab.jpg" alt=""></button></div>' +
      '<div class="lists"><section class="box"><header><h2>آخرین درخواست‌های نوبت جراحی</h2><button class="more" data-go="reqs">مشاهده همه</button></header>' +
      (R.length ? '<ul class="rows">' + R.slice(0, 3).map(function (r) { return '<li><button data-req="' + r.id + '"><span class="ri">' + ic("i-cal") + '</span><div><b>درخواست جراحی</b><small>کد پیگیری: <span dir="ltr">' + r.code + "</span> · " + r.created.split(" · ")[0] + "</small></div>" + rBadge(r.status) + ic("i-chev") + "</button></li>"; }).join("") + "</ul>"
        : '<div class="mini-empty">' + ic("i-cal") + '<p>هنوز درخواستی ثبت نکرده‌اید.</p><button class="btn sm pri" data-go="new">ثبت اولین درخواست</button></div>') + "</section>" +
      '<section class="box"><header><h2>آخرین نتایج آزمایش‌ها</h2><button class="more" data-go="labs">مشاهده همه</button></header>' +
      (L.length ? '<ul class="rows">' + L.slice(0, 3).map(function (l) { return '<li><button data-lab="' + l.id + '"><span class="ri">' + ic("i-doc") + "</span><div><b>" + l.name + "</b><small>" + l.taken + "</small></div>" + lBadge(l.status) + ic("i-chev") + "</button></li>"; }).join("") + "</ul>"
        : '<div class="mini-empty">' + ic("i-flask") + "<p>آزمایشی برای شما ثبت نشده است. پس از نمونه‌گیری در مرکز، وضعیت آن این‌جا نمایش داده می‌شود.</p></div>") + "</section></div>" +
      '<section class="nophys"><div><b>نیازی به مراجعه حضوری نیست</b><p>بیشتر هماهنگی‌ها از طریق همین پنل و تماس تلفنی انجام می‌شود. در صورت نیاز به حضور، از طریق پیامک اطلاع‌رسانی خواهید شد.</p></div><span>' + ic("i-call") + "</span></section>" +
      '</div><aside class="dside">' +
      '<section class="box prof"><h2>تکمیل اطلاعات پروفایل</h2><div class="ring" style="--p:' + pct + '"><b>' + fa(pct) + "٪</b></div><p>با تکمیل اطلاعات، هماهنگی‌ها سریع‌تر انجام می‌شود.</p>" + (pct < 100 ? '<button class="btn sm block" data-go="acct">تکمیل اطلاعات</button>' : '<span class="okc">' + ic("i-check") + "اطلاعات کامل است</span>") + "</section>" +
      '<section class="box"><h2 class="ih">' + ic("i-call") + "آخرین هماهنگی با مرکز</h2>" + (lastCoord ? '<div class="last"><small>' + lastCoord.l.at + "</small><p>" + esc(lastCoord.l.t) + '</p><button class="link" data-req="' + lastCoord.r.id + '">مشاهده درخواست</button></div>' : '<p class="mut sm">هنوز هماهنگی‌ای ثبت نشده است.</p>') + "</section>" +
      '<a class="box link-box" href="guide.html"><h2 class="ih">' + ic("i-book") + "راهنمای بیماران</h2><p>نکات و توصیه‌های قبل و بعد از عمل</p><span>مشاهده راهنما</span></a>" +
      '<a class="box link-box" href="assistant.html"><h2 class="ih">' + ic("i-help") + "راهنمای هوشمند · بیمه و هزینه</h2><p>بیمه، برآورد هزینه، نوبت و سؤالات متداول</p><span>مشاهده سؤالات</span></a>" +
      "</aside></div>";
    app.innerHTML = shell(html);
  }

  /* ================= SURGERY REQUEST (3 steps) ================= */
  function steps(n) { var L = ["تأیید اطلاعات", "برگه پزشک", "بررسی و ارسال"]; return '<ol class="steps">' + L.map(function (t, i) { var k = i + 1; return '<li class="' + (k < n ? "done" : k === n ? "on" : "") + '"><span>' + (k < n ? ic("i-check") : fa(k)) + "</span><b>" + t + "</b></li>"; }).join("") + '</ol><p class="stepn">مرحله ' + fa(n) + " از ۳</p>"; }
  function vNew() {
    var u = me(); V.draft = V.draft || { ref: "", note: "", file: null };
    var html = '<section class="card form">' + head("درخواست نوبت جراحی", "اطلاعات هویتی شما را بررسی کنید؛ در صورت نیاز تکمیل کنید.") + steps(1) + profileFields(u) +
      '<div class="note">' + ic("i-clock") + "<p>در این مرحله <b>نیازی به انتخاب تاریخ یا ساعت عمل نیست</b>؛ زمان پس از بررسی ظرفیت اتاق عمل و هماهنگی پزشک توسط پذیرش تعیین می‌شود.</p></div>" +
      '<button class="btn pri block" id="next">ادامه و ارسال برگه پزشک' + arr() + "</button></section>";
    app.innerHTML = shell(html);
    $("next").addEventListener("click", function () { if (!readProfile(u)) return; save(); go("upload"); });
  }
  function vUpload(re) {
    var d = V.draft || (V.draft = { ref: "", note: "", file: null }), f = d.file;
    var html = '<section class="card form">' + head(re ? "بارگذاری مجدد مدارک" : "ارسال برگه معرفی پزشک", re ? "تصویر جدید و خوانا از برگه پزشک ارسال کنید؛ درخواست شما همان درخواست قبلی می‌ماند." : "", re ? "detail" : "new") + (re ? "" : steps(2)) +
      (f ? '<div class="prev"><div class="prev-m">' + (f.data ? '<img src="' + f.data + '" alt="پیش‌نمایش برگه">' : '<div class="pdf">' + ic("i-doc") + "<b>" + esc(f.name) + "</b></div>") + "</div>" +
        '<div class="prev-b"><span>' + ic("i-check") + esc(f.name) + " · " + fa((f.size / 1048576).toFixed(1)) + ' مگابایت</span><div><button class="btn sm" id="repl">جایگزینی</button><button class="btn sm danger" id="del">حذف</button></div></div></div>'
       : '<div class="drop" id="drop"><span class="drop-i">' + ic("i-doc") + '</span><b>عکس برگه پزشک</b><small>عکس بگیرید یا فایل برگه را انتخاب کنید.</small>' +
        '<div class="drop-btns"><label class="btn pri">' + ic("i-cam") + 'عکس گرفتن<input type="file" accept="image/*" capture="environment" hidden data-pick></label>' +
        '<label class="btn">' + ic("i-up") + 'انتخاب فایل<input type="file" accept="image/jpeg,image/png,application/pdf" hidden data-pick></label></div><small class="fmt">JPG، PNG، PDF · حداکثر ۱۰ مگابایت</small></div>') +
      '<ul class="tips"><li>' + ic("i-check") + "تمام نوشته‌های برگه خوانا باشد.</li><li>" + ic("i-check") + "از کل برگه عکس بگیرید.</li><li>" + ic("i-sun") + "نور کافی باشد و عکس تار نباشد.</li></ul>" +
      (re ? "" : '<label class="fl" for="refQ">پزشک جراح شما <span class="opt">(از پزشکان مرکز · اختیاری)</span></label><div class="dcombo" id="dcombo"></div>' +
        '<small class="hint">پزشک شما در فهرست نیست یا مطمئن نیستید؟ خالی بگذارید؛ پذیرش از روی برگه پزشک بررسی می‌کند.</small>' +
        '<label class="fl" for="nt">توضیحات <span class="opt">(اختیاری)</span></label><textarea id="nt" rows="3" placeholder="هر نکته‌ای که لازم است پذیرش بداند…">' + esc(d.note) + "</textarea>" +
        '<div class="note">' + ic("i-call") + "<p>پذیرش پس از بررسی برگه برای هماهنگی با شما تماس می‌گیرد. نیازی به انتخاب زمان جراحی نیست.</p></div>") +
      '<button class="btn pri block" id="next"' + (f ? "" : " disabled") + ">" + (re ? "ارسال مدرک جدید" : "ادامه و بررسی نهایی") + arr() + "</button></section>";
    app.innerHTML = shell(html);
    var keep = function () { if ($("nt")) d.note = $("nt").value.trim(); };
    if ($("dcombo")) docCombo(d);
    document.querySelectorAll("[data-pick]").forEach(function (inp) { inp.addEventListener("change", function () { keep(); pick(inp.files[0]); }); });
    var dz = $("drop");
    if (dz) {
      ["dragenter", "dragover"].forEach(function (e) { dz.addEventListener(e, function (ev) { ev.preventDefault(); dz.classList.add("over"); }); });
      ["dragleave", "drop"].forEach(function (e) { dz.addEventListener(e, function (ev) { ev.preventDefault(); dz.classList.remove("over"); }); });
      dz.addEventListener("drop", function (ev) { keep(); pick(ev.dataTransfer.files[0]); });
    }
    if ($("del")) $("del").addEventListener("click", function () { keep(); d.file = null; render(); });
    if ($("repl")) $("repl").addEventListener("click", function () { keep(); d.file = null; render(); });
    $("next").addEventListener("click", function () {
      if (!d.file) return; keep();
      if (re) {
        var r = cur(); r.file = d.file; r.status = "review"; log(r, "مدرک جدید ارسال شد؛ در صف بررسی پذیرش"); msg("surgery", "مدرک جدید دریافت شد", "مدرک تکمیلی درخواست " + r.code + " دریافت شد و در حال بررسی است.", r.id);
        save(); V.draft = null; go("detail"); toast("مدرک جدید ارسال شد.");
      } else go("review");
    });
  }
  /* doctor picker: only the center's own doctors (assets/js/doctors-data.js) — search or pick from the list */
  function docList() { return (window.DOCTORS || []).map(function (x) { return { id: x.id, n: x.name.fa, s: x.spec.fa, p: x.photo }; }); }
  function dAv(x) { return '<span class="dav">' + (x.p ? '<img src="' + x.p + '" alt="" onerror="this.remove()">' : "") + "<i>" + x.n.replace("دکتر ", "").charAt(0) + "</i></span>"; }
  function docCombo(d) {
    var box = $("dcombo"), L = docList(), cur = -1;
    var sel = d.refId ? L.filter(function (x) { return x.id === d.refId; })[0] : null;
    if (sel) {
      box.innerHTML = '<div class="dsel">' + dAv(sel) + "<div><b>" + sel.n + "</b><small>" + esc(sel.s) + '</small></div><button type="button" class="ic" id="refX" aria-label="تغییر پزشک">' + ic("i-x") + "</button></div>";
      $("refX").addEventListener("click", function () { d.ref = ""; d.refId = ""; docCombo(d); setTimeout(function () { $("refQ").focus(); }, 0); });
      return;
    }
    box.innerHTML = '<div class="inp dq">' + ic("i-search") + '<input id="refQ" autocomplete="off" role="combobox" aria-expanded="false" aria-controls="refL" aria-autocomplete="list" placeholder="نام پزشک را بنویسید یا از فهرست انتخاب کنید">' +
      '<button type="button" class="dtog" id="refT" aria-label="نمایش فهرست پزشکان">' + ic("i-chev") + '</button></div><div class="dlist" id="refL" role="listbox" hidden></div>';
    var q = $("refQ"), list = $("refL"), shown = [];
    var norm = function (t) { return String(t || "").replace(/ي/g, "ی").replace(/ك/g, "ک").replace(/\u200c/g, " ").trim(); };
    var draw = function () {
      var t = norm(q.value).replace(/^دکتر\s*/, "");
      shown = L.filter(function (x) { return !t || norm(x.n).indexOf(t) >= 0 || norm(x.s).indexOf(t) >= 0; });
      list.innerHTML = shown.length ? '<p class="dl-h">' + fa(shown.length) + " پزشک مرکز</p>" + shown.map(function (x, i) { return '<button type="button" role="option" id="ro' + i + '" data-i="' + i + '"' + (i === cur ? ' class="on" aria-selected="true"' : "") + ">" + dAv(x) + "<div><b>" + x.n + "</b><small>" + esc(x.s) + "</small></div></button>"; }).join("")
        : '<p class="dl-e">پزشکی با این نام در فهرست پزشکان مرکز نیست.</p>';
      list.hidden = false; q.setAttribute("aria-expanded", "true");
      list.querySelectorAll("[data-i]").forEach(function (b) { b.addEventListener("mousedown", function (e) { e.preventDefault(); choose(+b.dataset.i); }); });
    };
    var close = function () { list.hidden = true; q.setAttribute("aria-expanded", "false"); cur = -1; };
    var choose = function (i) { var x = shown[i]; if (!x) return; d.ref = x.n; d.refId = x.id; docCombo(d); };
    q.addEventListener("focus", draw);
    q.addEventListener("input", function () { cur = -1; draw(); });
    q.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); if (list.hidden) draw(); cur = Math.max(0, Math.min(shown.length - 1, cur + (e.key === "ArrowDown" ? 1 : -1))); draw(); var el = $("ro" + cur); if (el) el.scrollIntoView({ block: "nearest" }); }
      else if (e.key === "Enter") { e.preventDefault(); if (cur >= 0) choose(cur); else if (shown.length === 1) choose(0); }
      else if (e.key === "Escape") close();
    });
    q.addEventListener("blur", function () { setTimeout(function () { if (!$("refQ")) return; close(); if (q.value.trim()) { q.value = ""; toast("فقط پزشکان مرکز قابل انتخاب هستند؛ از فهرست انتخاب کنید.", true); } }, 150); });
    $("refT").addEventListener("mousedown", function (e) { e.preventDefault(); if (list.hidden) { q.focus(); draw(); } else close(); });
  }
  function pick(file) {
    if (!file) return;
    var ok = /^(image\/(jpeg|png|jpg|heic|heif|webp)|application\/pdf)$/.test(file.type) || /\.(jpe?g|png|pdf|heic)$/i.test(file.name);
    if (!ok) return toast("فرمت فایل پشتیبانی نمی‌شود؛ JPG، PNG یا PDF انتخاب کنید.", true);
    if (file.size > 10 * 1048576) return toast("حجم فایل بیشتر از ۱۰ مگابایت است.", true);
    var meta = { name: file.name, size: file.size, type: file.type || "", data: null };
    if (file.type.indexOf("image") !== 0) { V.draft.file = meta; return render(); }
    var rd = new FileReader();
    rd.onerror = function () { toast("بارگذاری انجام نشد؛ دوباره تلاش کنید.", true); };
    rd.onload = function () {
      var im = new Image();
      im.onload = function () { var k = Math.min(1, 1100 / Math.max(im.width, im.height)), c = document.createElement("canvas"); c.width = im.width * k; c.height = im.height * k; c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); meta.data = c.toDataURL("image/jpeg", .72); V.draft.file = meta; render(); };
      im.onerror = function () { toast("تصویر قابل خواندن نیست؛ فایل دیگری انتخاب کنید.", true); };
      im.src = rd.result;
    };
    rd.readAsDataURL(file);
  }
  function vReview() {
    var u = me(), d = V.draft;
    var open = reqs().filter(function (r) { return ["canceled", "confirmed"].indexOf(r.status) < 0; })[0];
    var html = '<section class="card form">' + head("تأیید و ارسال درخواست", "اطلاعات و تصویر برگه را مرور کنید.", "upload") + steps(3) +
      '<dl class="sum"><dt>نام بیمار</dt><dd>' + esc(u.name) + '</dd><dt>شماره موبایل</dt><dd dir="ltr">' + mask(u.mobile) + "</dd><dt>کد ملی</dt><dd>" + fa(u.nc.slice(0, 3) + "•••••" + u.nc.slice(-2)) + "</dd>" +
      (d.ref ? "<dt>پزشک جراح</dt><dd>" + esc(d.ref) + "</dd>" : "") + '<dt>برگه پزشک</dt><dd class="okc">' + ic("i-check") + "بارگذاری‌شده</dd>" + (d.note ? "<dt>توضیحات</dt><dd>" + esc(d.note) + "</dd>" : "") + "</dl>" +
      (d.file && d.file.data ? '<img class="sum-img" src="' + d.file.data + '" alt="برگه پزشک">' : "") +
      '<div class="note">' + ic("i-call") + "<p><b>پس از ثبت، پذیرش برای بررسی و هماهنگی با شما تماس می‌گیرد.</b> با ثبت این درخواست هنوز نوبت قطعی جراحی ایجاد نمی‌شود.</p></div>" +
      (open ? '<div class="warn">' + ic("i-alert") + '<p>یک درخواست در جریان دارید (کد <b dir="ltr">' + open.code + "</b>). اگر این برگه برای همان عمل است، نیازی به ثبت دوباره نیست؛ از صفحه آن درخواست مدارک را تکمیل کنید.</p></div>" : "") +
      '<label class="agree"><input type="checkbox" id="ag"><span>صحت اطلاعات را تأیید می‌کنم و با تماس پذیرش موافقم.</span></label>' +
      '<button class="btn pri block" id="send" disabled>' + ic("i-check") + "ثبت درخواست جراحی</button></section>";
    app.innerHTML = shell(html);
    $("ag").addEventListener("change", function () { $("send").disabled = !this.checked; });
    $("send").addEventListener("click", function () {
      var b = this; b.disabled = true; b.innerHTML = '<span class="spin"></span>در حال ثبت…';
      setTimeout(function () {
        S.seq++; var y = jY.format(new Date()).replace(/\D/g, "");
        var r = { id: S.seq, code: "KH-" + y + "-" + S.seq, mobile: u.mobile, ref: d.ref, note: d.note, file: d.file, status: "submitted", created: stamp(), surgery: null, reason: "", calls: [], log: [] };
        log(r, "درخواست ثبت شد و برگه معرفی دریافت شد"); S.reqs.push(r);
        msg("surgery", "درخواست شما دریافت شد", "درخواست جراحی با کد " + r.code + " ثبت شد. همکاران پذیرش ظرف ۲۴ تا ۴۸ ساعت کاری با شما تماس می‌گیرند؛ نیازی به تماس شما نیست.", r.id);
        save(); V.id = r.id; V.draft = null; go("success");
      }, 900);
    });
  }
  function log(r, t) { r.log.push({ t: t, at: stamp(), ts: Date.now() }); }
  function vSuccess() {
    var r = cur();
    app.innerHTML = shell('<section class="card form succ"><div class="burst"><span>' + ic("i-check") + "</span></div><h1>درخواست شما ثبت شد</h1>" +
      '<p class="sub">کد پیگیری را نگه دارید؛ وضعیت درخواست را همیشه در «درخواست‌های من» می‌بینید.</p>' +
      '<div class="code"><small>کد پیگیری</small><b dir="ltr">' + r.code + '</b><button class="ic" id="cp" aria-label="کپی">' + ic("i-copy") + "</button></div>" +
      '<div class="nx-ok">' + ic("i-call") + "<div><b>نیازی به تماس با مرکز یا پزشک نیست</b><p>اطلاعات شما به‌طور کامل دریافت شد. همکاران پذیرش ظرف <strong>۲۴ تا ۴۸ ساعت کاری آینده</strong> برای هماهنگی با شما تماس می‌گیرند.</p></div></div>" +
      '<h3 class="nx-h">مراحل بعدی</h3><ol class="nx">' +
      '<li class="done"><span>' + ic("i-check") + "</span><div><b>درخواست ثبت شد</b><small>همین حالا · برگه پزشک دریافت شد</small></div></li>" +
      '<li class="on"><span>۲</span><div><b>بررسی مدارک و تماس پذیرش</b><small>ظرف ۲۴ تا ۴۸ ساعت کاری · از شماره <span dir="ltr">۰۳۱-۵۵۱۵۴۰۰۰</span></small></div></li>' +
      "<li><span>۳</span><div><b>تعیین زمان جراحی</b><small>تاریخ و ساعت حضور با پیامک و در همین پنل اعلام می‌شود</small></div></li></ol>" +
      '<ul class="nx-tips"><li>' + ic("i-phone") + "تلفن همراه خود را در دسترس نگه دارید؛ اگر تماس بی‌پاسخ بماند، دوباره با شما تماس گرفته می‌شود.</li><li>" + ic("i-bell") + "هر تغییری در وضعیت درخواست، از طریق پیامک و بخش «پیام‌ها» به شما اطلاع داده می‌شود.</li></ul>" +
      '<h3 class="nx-h">تا زمان تماس، پاسخ سؤال‌هایتان را این‌جا ببینید</h3><div class="nx-links">' +
      '<a href="assistant.html#ins"><span class="t1">' + ic("i-shield") + "</span><div><b>هزینه و پوشش بیمه</b><small>برآورد سهم پرداختی شما</small></div></a>" +
      '<a href="assistant.html#me"><span class="t2">' + ic("i-cal") + "</span><div><b>نوبت و زمان مراجعه</b><small>پس از هماهنگی نمایش داده می‌شود</small></div></a>" +
      '<a href="guide.html"><span class="t3">' + ic("i-book") + "</span><div><b>راهنمای قبل و بعد از عمل</b><small>آمادگی، ناشتایی و مراقبت‌ها</small></div></a>" +
      '<a href="assistant.html#faq"><span class="t4">' + ic("i-help") + "</span><div><b>سؤالات متداول</b><small>مدارک لازم، همراه، ترخیص و …</small></div></a></div>" +
      '<p class="fine">' + ic("i-msg") + "پیام دریافت درخواست در بخش پیام‌ها ثبت شد" + (me().notif.surgery ? " و پیامک ارسال می‌شود (شبیه‌سازی)." : ".") + "</p>" +
      '<button class="btn pri block" id="toD">مشاهده جزئیات درخواست' + arr() + '</button><button class="btn block" data-go="dash">بازگشت به داشبورد</button></section>');
    $("cp").addEventListener("click", function () { try { navigator.clipboard.writeText(r.code); } catch (e) {} toast("کد پیگیری کپی شد."); });
    $("toD").addEventListener("click", function () { go("detail", { id: r.id }); });
  }

  /* ================= MY REQUESTS ================= */
  function cur() { return S.reqs.filter(function (r) { return r.id === V.id; })[0] || reqs()[0]; }
  function vReqs() {
    var R = reqs();
    var html = head("درخواست‌های من", "سوابق و وضعیت درخواست‌های جراحی شما") +
      (R.length ? '<div class="reqs">' + R.map(function (r) {
        return '<article class="req"><header><span class="ri">' + ic("i-cal") + '</span><div><b>درخواست جراحی</b><small dir="ltr">' + r.code + "</small></div>" + rBadge(r.status) + "</header>" +
          "<dl><dt>تاریخ ثبت</dt><dd>" + r.created.split(" · ")[0] + "</dd><dt>زمان جراحی</dt><dd>" + ((r.status === "confirmed" || r.status === "done") && r.surgery ? '<b class="okc">' + r.surgery.date + " · " + r.surgery.time + "</b>" : '<span class="mut">هنوز تعیین نشده</span>') + "</dd></dl>" +
          (r.status === "docs" ? '<div class="warn sm">' + ic("i-alert") + "<p>" + ST.docs.d + "</p></div>" : "") +
          '<button class="btn block sm2" data-req="' + r.id + '">مشاهده جزئیات' + arr() + "</button></article>";
      }).join("") + "</div>" :
        '<div class="empty">' + ic("i-folder") + "<b>هنوز درخواستی ثبت نکرده‌اید</b><p>برای درخواست نوبت جراحی، برگه معرفی پزشک خود را ارسال کنید.</p><button class=\"btn pri\" data-go=\"new\">" + ic("i-plus") + "ثبت درخواست جراحی</button></div>") +
      (R.length ? '<button class="btn pri fab" data-go="new">' + ic("i-plus") + "درخواست جدید</button>" : "");
    app.innerHTML = shell(html);
  }
  function vDetail() {
    var r = cur(); if (!r) return go("reqs");
    var s = ST[r.status], idx = r.status === "canceled" ? -1 : r.status === "docs" ? 1 : TRACK.map(function (x) { return x.k; }).indexOf(r.status);
    var track = TRACK.map(function (x, i) {
      var cls = r.status === "canceled" ? "" : i < idx || ((r.status === "confirmed" || r.status === "done") && i === idx) ? "done" : i === idx ? (r.status === "docs" ? "warn" : "on") : "";
      return '<li class="' + cls + '"><span>' + ic(cls === "done" ? "i-check" : cls === "warn" ? "i-alert" : "i-clock") + "</span><div><b>" + x.t + "</b><p>" + (i === 1 && r.status === "docs" ? ST.docs.d : x.d) + "</p></div></li>";
    }).join("");
    var html = head("جزئیات درخواست", "", "reqs") +
      '<section class="card wide"><div class="dt-h"><div><small>کد پیگیری</small><h2 dir="ltr">' + r.code + "</h2></div>" + rBadge(r.status) + "</div>" +
      '<div class="now ' + s.c + '">' + ic(s.i) + "<div><b>" + s.t + "</b><p>" + s.d + "</p></div></div>" +
      (r.status === "confirmed" && r.surgery ?
        '<div class="sx"><h3>' + ic("i-cal") + 'برنامه جراحی شما</h3><div class="sx-g"><div><small>تاریخ جراحی</small><b>' + r.surgery.date + "</b></div><div><small>ساعت حضور</small><b>" + r.surgery.time + "</b></div><div><small>محل مراجعه</small><b>" + r.surgery.place + "</b></div><div><small>پزشک</small><b>" + esc(r.surgery.doc) + "</b></div></div>" +
        '<p class="sx-docs"><b>مدارک لازم:</b> کارت ملی یا کارت شناسایی معتبر عکس‌دار، دستور بستری پزشک، جواب آزمایش‌ها و فهرست داروهای مصرفی.</p>' +
        '<a class="btn pri block" href="guide.html">' + ic("i-book") + "راهنمای پیش از عمل</a></div>" : "") +
      (r.status === "done" ? svCard("surgery", r) : "") +
      (r.status === "docs" ? '<div class="warn">' + ic("i-alert") + "<div><b>پیام پذیرش</b><p>" + esc(r.reason) + '</p><button class="btn pri" id="reup">' + ic("i-up") + "تکمیل یا بارگذاری مجدد مدارک</button></div></div>" : "") +
      (r.status === "canceled" ? '<div class="warn bad">' + ic("i-ban") + "<div><b>علت لغو</b><p>" + esc(r.reason) + "</p></div></div>" : "") +
      '<h3 class="h3">روند پیگیری جراحی</h3>' + (r.status === "canceled" ? '<p class="mut sm">این درخواست لغو شده است.</p>' : '<ol class="track">' + track + "</ol>") +
      (r.calls && r.calls.length ? '<h3 class="h3">تماس‌های پذیرش</h3><ul class="calls">' + r.calls.slice().reverse().map(function (c) { return '<li class="' + (c.ok ? "ok" : "no") + '">' + ic("i-call") + "<div><b>" + c.t + "</b><small>" + c.at + "</small></div></li>"; }).join("") + "</ul>" : "") +
      '<dl class="sum"><dt>تاریخ ثبت</dt><dd>' + r.created + "</dd>" + (r.ref ? "<dt>پزشک جراح</dt><dd>" + esc(r.ref) + "</dd>" : "") + "<dt>مدرک</dt><dd>برگه معرفی پزشک</dd></dl>" +
      (r.file && r.file.data ? '<details class="sheet"><summary>' + ic("i-doc") + 'مشاهده برگه ارسالی</summary><img src="' + r.file.data + '" alt=""></details>' : "") +
      '<h3 class="h3">سابقه تغییرات</h3><ol class="tl">' + r.log.slice().reverse().map(function (l) { return "<li><b>" + esc(l.t) + "</b><small>" + l.at + "</small></li>"; }).join("") + "</ol>" +
      (["submitted", "review", "docs"].indexOf(r.status) > -1 ? '<button class="link danger" id="cancel">انصراف و لغو درخواست</button>' : "") + "</section>";
    app.innerHTML = shell(html);
    if ($("reup")) $("reup").addEventListener("click", function () { V.draft = { file: null }; go("reupload"); });
    if ($("cancel")) $("cancel").addEventListener("click", function () {
      if (!this.dataset.sure) { this.dataset.sure = 1; this.textContent = "برای لغو، دوباره بزنید"; return; }
      r.status = "canceled"; r.reason = "انصراف بیمار از طریق پنل"; log(r, "درخواست توسط بیمار لغو شد"); save(); render(); toast("درخواست لغو شد.");
    });
  }

  /* ================= LABS ================= */
  function vLabs() {
    var L = labs(), wait = L.filter(function (l) { return l.status === "sent"; }), ready = L.filter(function (l) { return l.status === "ready"; });
    var card = function (l) {
      var s = LAB[l.status];
      return '<article class="lab ' + l.status + '"><span class="li">' + ic("i-flask") + '</span><div class="lb"><b>' + l.name + '</b><small>نمونه‌گیری: ' + l.taken + " · شناسه نمونه " + l.sample + "</small><p>" + s.sub + (l.eta ? " · زمان تخمینی: " + l.eta : "") + "</p></div>" +
        lBadge(l.status) + (l.status === "ready" ? '<button class="btn sm pri" data-lab="' + l.id + '">' + (l.seen ? "مشاهده جواب" : "مشاهده جواب آزمایش") + "</button>" + (l.seen ? "" : '<i class="new">جدید</i>') : "") + "</article>";
    };
    var html = head("آزمایش‌های من", "جواب آزمایش‌هایی که در مرکز نمونه‌گیری شده و به آزمایشگاه همکار ارسال شده‌اند") +
      '<div class="lab-info">' + ic("i-shield") + "<p>جواب‌ها با <b>شناسه نمونه</b> به پرونده شما متصل و پس از کنترل مرکز منتشر می‌شوند؛ نیازی به مراجعه حضوری برای دریافت جواب نیست.</p></div>" +
      (L.length ?
        '<h2 class="h2">آماده مشاهده <span>' + fa(ready.length) + "</span></h2>" + (ready.length ? '<div class="labs">' + ready.map(card).join("") + "</div>" : '<p class="mut sm">هنوز جوابی منتشر نشده است.</p>') +
        '<h2 class="h2">در انتظار جواب <span>' + fa(wait.length) + "</span></h2>" + (wait.length ? '<div class="labs">' + wait.map(card).join("") + "</div>" : '<p class="mut sm">آزمایش در جریانی ندارید.</p>')
        : '<div class="empty">' + ic("i-flask") + "<b>آزمایشی برای شما ثبت نشده است</b><p>پس از نمونه‌گیری در پذیرش مرکز، وضعیت آزمایش این‌جا نمایش داده می‌شود و آماده‌شدن جواب به شما اطلاع داده می‌شود.</p></div>");
    app.innerHTML = shell(html);
  }
  function vLab() {
    var l = labs().filter(function (x) { return x.id === V.id; })[0]; if (!l) return go("labs");
    if (l.status === "ready" && !l.seen) { l.seen = true; save(); }
    var ready = l.status === "ready";
    var html = head(l.name, "", "labs") + '<section class="card wide"><div class="dt-h"><div><small>شناسه نمونه</small><h2>' + l.sample + "</h2></div>" + lBadge(l.status) + "</div>" +
      '<dl class="sum"><dt>نام آزمایش</dt><dd>' + l.name + "</dd><dt>تاریخ نمونه‌گیری</dt><dd>" + l.taken + "</dd><dt>آزمایشگاه</dt><dd>آزمایشگاه همکار مرکز</dd>" +
      (ready ? "<dt>تاریخ انتشار</dt><dd>" + l.published + "</dd>" : "<dt>زمان تخمینی</dt><dd>" + (l.eta || "اعلام نشده") + "</dd>") + "</dl>" +
      (ready ?
        '<div class="pdfcard"><span>' + ic("i-doc") + '</span><div><b>جواب آزمایش · فایل PDF تأییدشده</b><small>' + l.sample + ".pdf · منتشرشده توسط مرکز</small></div></div>" +
        '<div class="two-b"><button class="btn pri" id="view">' + ic("i-doc") + 'مشاهده جواب</button><button class="btn" id="dl">' + ic("i-dl") + 'دانلود PDF</button><button class="btn" id="sh">' + ic("i-share") + "اشتراک امن</button></div>" +
        '<p class="fine">' + ic("i-alert") + "تفسیر جواب آزمایش با پزشک معالج شماست.</p>" + svCard("lab", l)
        : '<div class="now s-rev">' + ic("i-clock") + "<div><b>جواب هنوز آماده نیست</b><p>" + LAB.sent.sub + " به‌محض انتشار، از طریق پیام و پیامک به شما اطلاع داده می‌شود.</p></div></div>") +
      '<ol class="lsteps">' + ["ثبت در پذیرش مرکز", "ارسال نمونه به آزمایشگاه", "بارگذاری جواب توسط آزمایشگاه", "کنترل و انتشار توسط مرکز", "مشاهده توسط شما"].map(function (t, i) {
        var done = ready ? true : i < 2; return '<li class="' + (done ? "done" : i === 2 ? "on" : "") + '"><span>' + (done ? ic("i-check") : fa(i + 1)) + "</span>" + t + "</li>"; }).join("") + "</ol></section>";
    app.innerHTML = shell(html);
    if (!ready) return;
    $("view").addEventListener("click", function () { report(l); });
    $("dl").addEventListener("click", function () { report(l, true); });
    $("sh").addEventListener("click", function () {
      var t = "جواب " + l.name + " · مرکز جراحی دکتر خیرخواه";
      if (navigator.share) navigator.share({ title: t, text: t + " (لینک امن با اعتبار ۲۴ ساعت)" }).catch(function () {});
      else toast("لینک امن با اعتبار ۲۴ ساعت ساخته شد (شبیه‌سازی).");
    });
  }
  function report(l, print) {
    var u = me();
    var rows = /CBC/.test(l.name) ? [["WBC", "۶٫۸", "10³/µL", "۴٫۰ – ۱۰٫۰"], ["RBC", "۴٫۹", "10⁶/µL", "۴٫۲ – ۵٫۸"], ["Hb", "۱۴٫۱", "g/dL", "۱۳٫۰ – ۱۷٫۰"], ["PLT", "۲۴۵", "10³/µL", "۱۵۰ – ۴۵۰"]]
      : /FBS/.test(l.name) ? [["FBS", "۹۲", "mg/dL", "۷۰ – ۱۰۰"]] : [["PT", "۱۲٫۸", "sec", "۱۱ – ۱۳٫۵"], ["PTT", "۳۱", "sec", "۲۵ – ۳۵"]];
    $("mCard").innerHTML = '<div class="rep" id="rep"><header><div class="logo"><span>' + ic("i-logo") + '</span><div><small>مرکز جراحی فوق تخصصی</small><b>دکتر خیرخواه</b></div></div><span class="stamp">نمونه نمایشی</span></header>' +
      "<h2>" + l.name + '</h2><dl class="rmeta"><dt>بیمار</dt><dd>' + esc(u.name) + "</dd><dt>شناسه نمونه</dt><dd>" + l.sample + "</dd><dt>نمونه‌گیری</dt><dd>" + l.taken + "</dd><dt>انتشار</dt><dd>" + l.published + "</dd></dl>" +
      '<table><thead><tr><th>آزمون</th><th>نتیجه</th><th>واحد</th><th>محدوده مرجع</th></tr></thead><tbody>' + rows.map(function (r) { return '<tr><td dir="ltr">' + r[0] + "</td><td><b>" + r[1] + '</b></td><td dir="ltr">' + r[2] + "</td><td>" + r[3] + "</td></tr>"; }).join("") + "</tbody></table>" +
      '<p class="rnote">این گزارش نمونه نمایشی است و ارزش پزشکی ندارد. در نسخه واقعی، فایل PDF امضاشده آزمایشگاه نمایش داده می‌شود.</p></div>' +
      '<footer class="m-foot"><button class="btn" data-close>بستن</button><button class="btn pri" id="prt">' + ic("i-dl") + "ذخیره PDF / چاپ</button></footer>";
    $("modal").hidden = false; document.body.classList.add("m-open");
    $("prt").addEventListener("click", function () { window.print(); });
    $("modal").querySelectorAll("[data-close]").forEach(function (b) { b.addEventListener("click", closeM); });
    if (print) setTimeout(function () { window.print(); }, 250);
  }
  function closeM() { $("modal").hidden = true; document.body.classList.remove("m-open"); }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !$("modal").hidden) closeM(); });

  /* ================= MESSAGES ================= */
  function vMsgs() {
    var M = msgs().map(function (m) { m._ts = Math.floor(m.id) || 0; return m; }).sort(function (a, b) { return b._ts - a._ts; }), f = V.mf || "all";
    var unreadN = M.filter(function (m) { return !m.read; }).length;
    var list = M.filter(function (m) { return f === "all" || (f === "unread" ? !m.read : m.kind === f); });
    var cnt = function (k) { var n = M.filter(function (m) { return k === "all" || (k === "unread" ? !m.read : m.kind === k); }).length; return n ? " <i>" + fa(n) + "</i>" : ""; };
    /* what each message lets you do — so the patient knows where a tap leads */
    var action = function (m) {
      if (m.kind === "lab" && m.ref) { var l = S.labs.filter(function (x) { return x.id === m.ref; })[0]; return l ? { t: l.status === "ready" ? "مشاهده جواب آزمایش" : "پیگیری آزمایش", go: "lab" } : null; }
      if (m.ref) {
        var r = S.reqs.filter(function (x) { return x.id === m.ref; })[0]; if (!r) return null;
        if (r.status === "done" && !r.survey && /نظر/.test(m.title)) return { t: "شروع نظرسنجی", go: "survey" };
        if (r.status === "docs" && /مدارک|مدرک/.test(m.title)) return { t: "تکمیل مدارک", go: "detail" };
        return { t: "مشاهده درخواست " + r.code, go: "detail" };
      }
      if (/برآورد/.test(m.title)) return { t: "مشاهده برآورد هزینه", href: "assistant.html#me" };
      return null;
    };
    var tag = function (m) { return m.kind === "lab" ? '<em class="mtag lab">' + ic("i-flask") + "آزمایش</em>" : /برآورد/.test(m.title) ? '<em class="mtag ins">' + ic("i-copy") + "بیمه و هزینه</em>" : /نظر/.test(m.title) ? '<em class="mtag sv">' + ic("i-help") + "نظرسنجی</em>" : '<em class="mtag srg">' + ic("i-cal") + "جراحی</em>"; };
    var d0 = new Date(); d0.setHours(0, 0, 0, 0); var T = +d0, DAY = 864e5;
    var grp = function (ts) { return ts >= T ? "امروز" : ts >= T - DAY ? "دیروز" : ts >= T - 6 * DAY ? "این هفته" : "قدیمی‌تر"; };
    var body = "", last = "";
    list.forEach(function (m) {
      var g = grp(m._ts); if (g !== last) { body += (last ? "</ul>" : "") + '<h3 class="mgrp">' + g + '</h3><ul class="mbox">'; last = g; }
      var a = action(m);
      body += '<li class="' + (m.read ? "rd" : "nw") + '" data-mid="' + m.id + '"><span class="mi ' + m.kind + '">' + ic(m.kind === "lab" ? "i-flask" : /برآورد/.test(m.title) ? "i-copy" : /نظر/.test(m.title) ? "i-help" : "i-cal") + "</span>" +
        '<div class="mb"><div class="mh">' + tag(m) + (m.read ? "" : '<em class="mnew">جدید</em>') + "<small>" + m.at + "</small></div>" +
        "<b>" + esc(m.title) + "</b><p>" + esc(m.text) + "</p>" +
        (a ? (a.href ? '<a class="btn sm mact" href="' + a.href + '">' + a.t + arr() + "</a>" : '<button type="button" class="btn sm mact" data-act="' + a.go + '" data-ref="' + m.ref + '">' + a.t + arr() + "</button>") : "") + "</div></li>";
    });
    if (last) body += "</ul>";
    var html = head("پیام‌ها و اطلاع‌رسانی", "همه خبرهای مرکز درباره درخواست جراحی، آزمایش‌ها و برآورد هزینه شما") +
      '<div class="mtop"><p>' + (unreadN ? '<b>' + fa(unreadN) + " پیام خوانده‌نشده</b> دارید." : ic("i-check") + "همه پیام‌ها را خوانده‌اید.") + "</p>" + (unreadN ? '<button type="button" class="btn sm" id="allRead">' + ic("i-check") + "همه را خوانده‌شده کن</button>" : "") + "</div>" +
      '<div class="tabs mtabs">' + [["all", "همه"], ["unread", "خوانده‌نشده"], ["surgery", "جراحی"], ["lab", "آزمایش"]].map(function (t) { return '<button type="button" data-mf="' + t[0] + '" class="' + (f === t[0] ? "on" : "") + '">' + t[1] + cnt(t[0]) + "</button>"; }).join("") + "</div>" +
      (list.length ? body : '<div class="empty">' + ic("i-msg") + "<b>" + (f === "unread" ? "پیام خوانده‌نشده‌ای ندارید" : "پیامی در این بخش نیست") + "</b><p>پیام‌های پذیرش، آماده‌شدن جواب آزمایش و برآورد هزینه این‌جا نمایش داده می‌شوند.</p></div>") +
      '<p class="fine">' + ic("i-shield") + "در پیامک فقط اعلان کوتاه ارسال می‌شود؛ جزئیات پزشکی فقط بعد از ورود به همین پنل نمایش داده می‌شود.</p>";
    app.innerHTML = shell(html);
    document.querySelectorAll("[data-mf]").forEach(function (b) { b.addEventListener("click", function () { V.mf = b.dataset.mf; render(); }); });
    if ($("allRead")) $("allRead").addEventListener("click", function () { M.forEach(function (m) { m.read = true; }); save(); render(); toast("همه پیام‌ها خوانده‌شده علامت خورد."); });
    var mark = function (id) { var m = M.filter(function (x) { return String(x.id) === String(id); })[0]; if (m && !m.read) { m.read = true; save(); } };
    document.querySelectorAll(".mbox li").forEach(function (li) { li.addEventListener("click", function (e) { if (e.target.closest(".mact")) return; if (li.classList.contains("nw")) { mark(li.dataset.mid); render(); } }); });
    document.querySelectorAll(".mact").forEach(function (b) {
      b.addEventListener("click", function () {
        mark(b.closest("li").dataset.mid);
        if (b.dataset.act === "survey") go("survey", { stype: "surgery", ref: +b.dataset.ref, ans: null });
        else if (b.dataset.act) go(b.dataset.act, { id: +b.dataset.ref });
      });
    });
  }

  /* ================= ACCOUNT ================= */
  function vAcct() {
    var u = me();
    var html = head("حساب کاربری", "مشخصات فردی و تنظیمات اطلاع‌رسانی") +
      '<div class="acct"><section class="card">' + '<h2 class="h2">مشخصات فردی</h2>' + profileFields(u) +
      '<button class="btn pri" id="saveP">' + ic("i-check") + "ذخیره تغییرات</button>" +
      '<p class="fine left">' + ic("i-alert") + "برای تغییر شماره موبایل یا اصلاح کد ملی ثبت‌شده در پرونده، تأیید مجدد یا بررسی پذیرش لازم است.</p></section>" +
      '<section class="card"><h2 class="h2">تنظیمات اطلاع‌رسانی</h2>' +
      '<label class="tog"><input type="checkbox" id="nS"' + (u.notif.surgery ? " checked" : "") + '><span></span><div><b>پیامک‌های جراحی</b><small>دریافت درخواست، نقص مدارک، تأیید یا تغییر زمان</small></div></label>' +
      '<label class="tog"><input type="checkbox" id="nL"' + (u.notif.lab ? " checked" : "") + '><span></span><div><b>پیامک‌های آزمایش</b><small>دریافت نمونه و آماده‌شدن جواب</small></div></label>' +
      '<p class="mut sm">پیام‌ها همیشه در بخش «پیام‌ها» پنل هم ثبت می‌شوند.</p>' +
      '<button class="btn danger block" id="out2">' + ic("i-out") + "خروج از حساب</button></section></div>";
    app.innerHTML = shell(html);
    $("saveP").addEventListener("click", function () { if (!readProfile(u)) return; save(); render(); toast("اطلاعات ذخیره شد."); });
    $("nS").addEventListener("change", function () { u.notif.surgery = this.checked; save(); toast("تنظیمات ذخیره شد."); });
    $("nL").addEventListener("change", function () { u.notif.lab = this.checked; save(); toast("تنظیمات ذخیره شد."); });
    $("out2").addEventListener("click", logout);
  }
  function logout() { S.session = null; save(); V = { name: "login", otp: null, mobile: "", draft: null }; render(); }


  /* ================= SATISFACTION SURVEY ================= */
  function svItem(type, id) { return (type === "surgery" ? S.reqs : S.labs).filter(function (x) { return x.id === id && x.mobile === S.session; })[0]; }
  function svCard(type, x) {
    if (x.survey) return '<div class="sv-mini done">' + ic("i-check") + "<div><b>نظر شما ثبت شده است</b><small>" + x.survey.at + " · سپاس از همراهی شما</small></div></div>";
    return '<div class="sv-mini">' + ic("i-help") + "<div><b>" + (type === "surgery" ? "نظر شما درباره خدمات مرکز" : "از خدمات آزمایشگاه راضی بودید؟") + "</b><small>" + (type === "surgery" ? "پذیرش، پرستاران، پزشک، ترخیص و … · حدود ۲ دقیقه" : "۴ پرسش کوتاه · کمتر از یک دقیقه") + '</small></div><button class="btn sm pri" data-survey="' + type + ":" + x.id + '">شروع نظرسنجی</button></div>';
  }
  function svBanner() {
    var r = reqs().filter(function (x) { return x.status === "done" && !x.survey; })[0];
    if (!r) return "";
    return '<section class="sv-ban">' + ic("i-help") + "<div><b>عمل شما انجام شد؛ نظرتان برای ما مهم است</b><p>در یک نظرسنجی دو دقیقه‌ای، از پذیرش، پرستاران، پزشک و روند ترخیص نمره دهید. نظر شما مستقیم به مدیریت کیفیت مرکز می‌رسد.</p></div>" + '<button class="btn pri" data-survey="surgery:' + r.id + '">شروع نظرسنجی' + arr() + "</button></section>";
  }
  function vSurvey() {
    var type = V.stype, x = svItem(type, V.ref); if (!x) return go("dash");
    if (x.survey) return go("svdone", { stype: type, ref: V.ref });
    var secs = KHS.sec(type), A = V.ans || (V.ans = { scores: {}, reasons: {}, notes: {}, nps: null, comment: "", anon: false, contact: false });
    var doc = type === "surgery" ? ((x.surgery && x.surgery.doc) || x.ref || "") : "";
    var q = function (s, i) {
      return '<section class="sv-q" id="q-' + s.k + '"><h3><span>' + fa(i + 1) + "</span>" + s.n + (s.k === "surgeon" && doc ? ' <small>(' + esc(doc) + ")</small>" : "") + '</h3><div class="sv-sc" role="radiogroup" aria-label="' + s.n + '">' +
        [1, 2, 3, 4, 5].map(function (v) { return '<button type="button" role="radio" aria-checked="false" data-k="' + s.k + '" data-v="' + v + '" class="v' + v + '"><b>' + fa(v) + "</b><small>" + KHS.LABELS[v] + "</small></button>"; }).join("") +
        '</div><button type="button" class="sv-na" data-k="' + s.k + '" data-v="0">مربوط به من نبود</button><div class="sv-rs" id="rs-' + s.k + '"></div></section>';
    };
    var html = head("نظرسنجی " + (type === "surgery" ? "خدمات جراحی" : "خدمات آزمایشگاه"), "پاسخ شما محرمانه است و فقط برای بهبود خدمات مرکز استفاده می‌شود.", type === "surgery" ? "reqs" : "labs") +
      '<div class="sv-prog"><span><i id="svBar"></i></span><small id="svCnt"></small></div>' +
      '<div class="sv">' + secs.map(q).join("") +
      '<section class="sv-q" id="q-nps"><h3><span>' + fa(secs.length + 1) + '</span>چقدر احتمال دارد مرکز را به دوستان و آشنایان خود معرفی کنید؟</h3><div class="sv-nps" role="radiogroup">' +
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(function (v) { return '<button type="button" role="radio" aria-checked="false" data-nps="' + v + '">' + fa(v) + "</button>"; }).join("") + '</div><div class="sv-npsl"><small>اصلاً</small><small>حتماً</small></div></section>' +
      '<section class="sv-q"><h3>' + ic("i-msg") + 'نظر یا پیشنهاد دیگری دارید؟ <small>(اختیاری)</small></h3><textarea id="svC" rows="3" placeholder="هر نکته‌ای که به بهتر شدن خدمات کمک می‌کند…"></textarea>' +
      '<label class="tog"><input type="checkbox" id="svAnon"><span></span><div><b>نظرم بدون نام ثبت شود</b><small>نام و شماره شما برای مدیریت نمایش داده نمی‌شود.</small></div></label>' +
      '<label class="tog"><input type="checkbox" id="svCt"><span></span><div><b>در صورت نیاز، کارشناس کیفیت با من تماس بگیرد</b><small>برای پیگیری مواردی که از آن‌ها راضی نبودید.</small></div></label>' +
      '<div id="svSafe"></div></section>' +
      '<button class="btn pri block" id="svGo">' + ic("i-check") + "ثبت نظر</button></div>";
    app.innerHTML = shell(html);
    var paint = function () {
      var done = secs.filter(function (s) { return A.scores[s.k] != null; }).length + (A.nps != null ? 1 : 0), tot = secs.length + 1;
      $("svBar").style.width = Math.round(done / tot * 100) + "%"; $("svCnt").textContent = fa(done) + " از " + fa(tot) + " پرسش";
      $("svSafe").innerHTML = A.scores.outcome && A.scores.outcome <= 2 ? '<div class="warn bad sm">' + ic("i-alert") + "<p>اگر تب، خونریزی، درد شدید یا تنگی نفس دارید، منتظر پیگیری نظرسنجی نمانید و همین حالا با مرکز (۰۳۱-۵۵۱۵۴۰۰۰) یا اورژانس ۱۱۵ تماس بگیرید.</p></div>" : "";
    };
    var rs = function (s) {
      var el = $("rs-" + s.k), v = A.scores[s.k];
      if (!(v > 0 && v <= 2)) { el.innerHTML = ""; return; }
      var sel = A.reasons[s.k] || [];
      el.innerHTML = '<p>چه چیزی باید بهتر شود؟</p><div class="sv-chips">' + s.r.map(function (t) { return '<button type="button" class="' + (sel.indexOf(t) >= 0 ? "on" : "") + '" data-rk="' + s.k + '" data-rt="' + t + '">' + t + "</button>"; }).join("") + '</div><input class="sv-note" data-nk="' + s.k + '" placeholder="توضیح کوتاه (اختیاری)" value="' + esc(A.notes[s.k] || "") + '">';
      el.querySelectorAll("[data-rt]").forEach(function (b) { b.addEventListener("click", function () { var L = A.reasons[s.k] = A.reasons[s.k] || [], i = L.indexOf(b.dataset.rt); if (i >= 0) L.splice(i, 1); else L.push(b.dataset.rt); b.classList.toggle("on"); }); });
      el.querySelector("[data-nk]").addEventListener("input", function () { A.notes[s.k] = this.value; });
    };
    secs.forEach(function (s) {
      document.querySelectorAll('#q-' + s.k + ' [data-v]').forEach(function (b) {
        b.addEventListener("click", function () {
          A.scores[s.k] = +b.dataset.v;
          document.querySelectorAll('#q-' + s.k + ' [data-v]').forEach(function (o) { var on = o === b; o.classList.toggle("on", on); o.setAttribute("aria-checked", on ? "true" : "false"); });
          $("q-" + s.k).classList.remove("miss"); rs(s); paint();
        });
      });
    });
    document.querySelectorAll("[data-nps]").forEach(function (b) { b.addEventListener("click", function () { A.nps = +b.dataset.nps; document.querySelectorAll("[data-nps]").forEach(function (o) { o.classList.toggle("on", o === b); o.setAttribute("aria-checked", o === b ? "true" : "false"); }); $("q-nps").classList.remove("miss"); paint(); }); });
    $("svAnon").addEventListener("change", function () { if (this.checked) $("svCt").checked = false; });
    $("svCt").addEventListener("change", function () { if (this.checked) $("svAnon").checked = false; });
    paint();
    $("svGo").addEventListener("click", function () {
      var miss = secs.filter(function (s) { return A.scores[s.k] == null; }).map(function (s) { return "q-" + s.k; });
      if (A.nps == null) miss.push("q-nps");
      if (miss.length) { miss.forEach(function (id) { $(id).classList.add("miss"); }); $(miss[0]).scrollIntoView({ behavior: "smooth", block: "center" }); return toast("به همه پرسش‌ها پاسخ دهید (یا «مربوط به من نبود» را بزنید).", true); }
      var u = me(), anon = $("svAnon").checked, contact = $("svCt").checked, low = Object.keys(A.scores).some(function (k) { return A.scores[k] > 0 && A.scores[k] <= 2; });
      var reasons = {}; Object.keys(A.reasons).forEach(function (k) { if (A.scores[k] > 0 && A.scores[k] <= 2 && A.reasons[k].length) reasons[k] = A.reasons[k]; });
      var notes = {}; Object.keys(A.notes).forEach(function (k) { if (A.notes[k] && A.scores[k] <= 2) notes[k] = A.notes[k].trim(); });
      KHS.add({ type: type, ref: x.id, doc: doc, scores: A.scores, reasons: reasons, notes: notes, nps: A.nps, comment: $("svC").value.trim(), anon: anon, name: anon ? "" : u.name, mobile: anon ? "" : u.mobile, contact: contact, follow: null });
      x.survey = { at: stamp(), low: low, contact: contact, bad: A.scores.outcome > 0 && A.scores.outcome <= 2 };
      save(); go("svdone", { stype: type, ref: x.id });
    });
  }
  function vSvDone() {
    var x = svItem(V.stype, V.ref); if (!x || !x.survey) return go("dash");
    var v = x.survey;
    app.innerHTML = shell('<section class="card narrow succ" style="margin:20px auto">' + '<div class="burst"><span>' + ic("i-check") + "</span></div><h1>سپاس از نظر شما</h1>" +
      '<p class="sub">نظر شما ثبت شد و مستقیم در گزارش‌های مدیریت کیفیت مرکز قرار می‌گیرد.</p>' +
      (v.low && v.contact ? '<div class="note">' + ic("i-call") + "<p>چون از بخشی از خدمات راضی نبودید، کارشناس کیفیت مرکز ظرف ۲ روز کاری برای پیگیری با شما تماس می‌گیرد.</p></div>" : "") +
      (v.bad ? '<div class="warn bad">' + ic("i-alert") + "<p>اگر علائم هشدار مثل تب، خونریزی، درد شدید یا تنگی نفس دارید، همین حالا با مرکز (۰۳۱-۵۵۱۵۴۰۰۰) یا ۱۱۵ تماس بگیرید.</p></div>" : "") +
      (V.stype === "surgery" ? '<a class="btn block" href="guide.html">' + ic("i-book") + "راهنمای مراقبت بعد از عمل</a>" : "") +
      '<button class="btn pri block" data-go="dash">بازگشت به داشبورد</button></section>');
  }

  /* ================= DEMO SIMULATOR ================= */
  var SIM = [
    ["review", "شروع بررسی مدارک", "", "پذیرش بررسی مدارک را شروع کرد"],
    ["docs", "درخواست تکمیل مدارک", "تصویر برگه خوانا نیست؛ لطفاً دوباره و در نور کافی از کل برگه عکس بگیرید.", "پذیرش درخواست تکمیل مدارک کرد"],
    ["call-no", "تماس بی‌پاسخ", "", ""],
    ["coord", "تماس موفق · هماهنگی", "", "تماس برقرار شد؛ در حال هماهنگی مراحل بعدی"],
    ["confirmed", "تعیین برنامه جراحی", "", "برنامه جراحی تعیین و اعلام شد"],
    ["done", "انجام عمل و ترخیص", "", "عمل انجام شد و بیمار ترخیص شد"],
    ["canceled", "لغو توسط پذیرش", "جراحی موردنظر در این مرکز انجام نمی‌شود؛ پذیرش راهنمایی لازم را تلفنی ارائه کرد.", "درخواست توسط پذیرش لغو شد"]
  ];
  function demo() {
    var on = !!me() && ["login", "onboard"].indexOf(V.name) < 0; $("demo").hidden = !on; if (!on) return;
    var r = reqs()[0];
    $("demoG").innerHTML = r ? SIM.map(function (x) { return '<button type="button" data-s="' + x[0] + '" class="' + (r.status === x[0] ? "on" : "") + '">' + x[1] + "</button>"; }).join("") : '<small class="mut">ابتدا یک درخواست جراحی ثبت کنید.</small>';
    var svr = reqs().filter(function (x) { return x.status === "done"; })[0], svl = labs().filter(function (l) { return l.status === "ready"; })[0];
    $("demoS").innerHTML = (svr ? '<button type="button" data-sv="surgery:' + svr.id + '">' + (svr.survey ? "مشاهده نظر ثبت‌شده (جراحی)" : "باز کردن نظرسنجی بعد از عمل") + "</button>" : "") +
      (svl ? '<button type="button" data-sv="lab:' + svl.id + '">' + (svl.survey ? "مشاهده نظر ثبت‌شده (آزمایشگاه)" : "باز کردن نظرسنجی آزمایشگاه") + "</button>" : "") +
      '<button type="button" data-sv="reset">پاک کردن نظرهای ثبت‌شده برای تکرار نمایش</button><a class="demo-lk" href="quality-panel.html" target="_blank" rel="noopener">دیدن نتیجه در گزارش مدیریت ↗</a>';
    $("demoS").querySelectorAll("[data-sv]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (innerWidth < 981) $("demo").classList.remove("open");
        if (b.dataset.sv === "reset") { reqs().concat(labs()).forEach(function (x) { delete x.survey; }); save(); render(); toast("نظرسنجی‌ها دوباره فعال شد."); return; }
        var p = b.dataset.sv.split(":"); go("survey", { stype: p[0], ref: +p[1], ans: null });
      });
    });
    var pend = labs().filter(function (l) { return l.status === "sent"; })[0];
    $("demoL").innerHTML = (pend ? '<button type="button" data-l="pub">انتشار جواب «' + pend.name.split(" (")[0] + "»</button>" : "") + '<button type="button" data-l="new">ثبت آزمایش جدید و ارسال نمونه</button>';
    $("demoG").querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () {
        var k = b.dataset.s, x = reqs()[0], row = SIM.filter(function (s) { return s[0] === k; })[0];
        x.calls = x.calls || [];
        if (k === "call-no") {
          x.calls.push({ ok: false, t: "تماس پذیرش بی‌پاسخ ماند؛ پیگیری مجدد برنامه‌ریزی شد", at: stamp() });
          log(x, "تماس پذیرش بی‌پاسخ ماند"); msg("surgery", "تماس از پذیرش مرکز", "پذیرش برای هماهنگی درخواست " + x.code + " با شما تماس گرفت و پاسخی دریافت نکرد. دوباره تماس گرفته می‌شود.", x.id);
        } else {
          x.status = k; x.reason = row[2]; log(x, row[3]);
          if (k === "coord") x.calls.push({ ok: true, t: "تماس برقرار شد", at: stamp() });
          if (k === "confirmed" || (k === "done" && !x.surgery)) { var d = k === "done" ? dayOff(0) : dayOff(6); if (d.getDay() === 5) d = dayOff(7); x.surgery = { date: jD.format(d), time: "۰۷:۳۰", place: "پذیرش همکف · کاشان، خیابان امیرکبیر", doc: x.ref || "دکتر حسین طاهری نساج" }; }
          msg("surgery", { review: "درخواست در حال بررسی است", docs: "نیاز به تکمیل مدارک", coord: "در حال هماهنگی", confirmed: "زمان جراحی شما تعیین شد", done: "نظر شما درباره خدمات مرکز", canceled: "درخواست لغو شد" }[k], (k === "done" ? "عمل شما انجام شد. لطفاً در نظرسنجی دو دقیقه‌ای شرکت کنید؛ از پنل، بخش «درخواست‌های من»." : ST[k].d) + " (کد " + x.code + ")", x.id);
        }
        save(); if (innerWidth < 981) $("demo").classList.remove("open"); go("detail", { id: x.id });
      });
    });
    $("demoL").querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () {
        if (b.dataset.l === "pub") { pend.status = "ready"; pend.published = jD.format(new Date()); pend.eta = ""; msg("lab", "جواب آزمایش آماده است", "جواب «" + pend.name + "» در پنل شما قرار گرفت.", pend.id); save(); if (innerWidth < 981) $("demo").classList.remove("open"); go("lab", { id: pend.id }); }
        else { var id = Date.now() % 100000; S.labs.push({ id: id, mobile: S.session, name: "آزمایش چکاپ پیش از عمل", sample: "S-" + fa(id), status: "sent", taken: jD.format(new Date()), eta: "تا ۳ روز کاری", published: "", seen: false }); msg("lab", "نمونه شما دریافت شد", "نمونه «آزمایش چکاپ پیش از عمل» به آزمایشگاه همکار ارسال شد.", id); save(); if (innerWidth < 981) $("demo").classList.remove("open"); go("labs"); }
      });
    });
  }
  $("demoT").addEventListener("click", function () { $("demo").classList.toggle("open"); });
  $("demoR").addEventListener("click", function () { localStorage.removeItem(KEY); load(); V = { name: "login", otp: null, mobile: "", draft: null }; render(); toast("نسخه نمایشی بازنشانی شد."); });

  /* ================= RENDER ================= */
  function render() {
    if (!me() && V.name !== "login") V.name = "login";
    if (me() && refreshDemo(S.session)) save();
    ({ login: vLogin, onboard: vOnboard, dash: vDash, new: vNew, upload: function () { vUpload(false); }, reupload: function () { vUpload(true); }, review: vReview, success: vSuccess,
       reqs: vReqs, detail: vDetail, labs: vLabs, lab: vLab, msgs: vMsgs, acct: vAcct, survey: vSurvey, svdone: vSvDone })[V.name]();
    document.querySelectorAll("[data-survey]").forEach(function (b) { b.addEventListener("click", function () { var p = b.dataset.survey.split(":"); go("survey", { stype: p[0], ref: +p[1], ans: null }); }); });
    document.querySelectorAll("[data-go]").forEach(function (b) { b.addEventListener("click", function () { go(b.dataset.go); }); });
    document.querySelectorAll("[data-req]").forEach(function (b) { b.addEventListener("click", function () { go("detail", { id: +b.dataset.req }); }); });
    document.querySelectorAll("[data-lab]").forEach(function (b) { b.addEventListener("click", function () { go("lab", { id: +b.dataset.lab }); }); });
    if ($("logout")) $("logout").addEventListener("click", logout);
    demo();
    var c = $("content") || app.firstElementChild; if (c) { c.classList.remove("in"); void c.offsetWidth; c.classList.add("in"); }
  }
  var tt;
  function toast(m, bad) { var el = $("toast"); el.textContent = m; el.className = "toast in" + (bad ? " bad" : ""); clearTimeout(tt); tt = setTimeout(function () { el.className = "toast"; }, 3200); }

  load();
  var qGo = new URLSearchParams(location.search).get("go");
  if (qGo && NAVOF[qGo]) V.after = qGo;
  if (me()) V.name = me().name ? (V.after || "dash") : "onboard";
  render();
})();
