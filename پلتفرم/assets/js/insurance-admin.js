/* =========================================================
   Insurance & patient-guide management (staff) — DEMO
   Whatever is saved here is exactly what patients see in assistant.html.
   ========================================================= */
(function () {
  "use strict";
  var K = window.KHA, S = K.load(), fa = K.fa, SESS = "kh-ins-session";
  var $ = function (id) { return document.getElementById(id); };
  var app = $("app"), nf = new Intl.NumberFormat("fa-IR");
  function money(n) { return nf.format(Math.round(n || 0)); }
  function toman(n) { return money(n) + " تومان"; }
  function num(s) { return +String(s || "").replace(/[۰-۹]/g, function (d) { return "۰۱۲۳۴۵۶۷۸۹".indexOf(d); }).replace(/[^\d]/g, "") || 0; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function ic(id) { return '<svg><use href="#i-' + id + '"/></svg>'; }
  var jFull = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { day: "numeric", month: "long", year: "numeric" });
  function dd(ts) { return jFull.format(new Date(ts)); }
  function age(ts) { return Math.floor((Date.now() - ts) / 864e5); }
  var USERS = { "09131250001": { name: "زهرا امینی", role: "مسئول امور بیمه" }, "09131240001": { name: "محمد موسوی", role: "مسئول مالی" } };
  var CAT = { ins: "بیمه و هزینه", time: "نوبت و مراجعه", pre: "قبل از عمل", post: "بعد از عمل", docs: "مدارک و آزمایش" };
  var STALE = 60;
  var EST = { pending: ["s-rev", "clock", "در انتظار بررسی"], docs: ["s-coord", "alert", "نیازمند مدرک"], ok: ["s-ok", "check", "تأیید و منتشرشده"] };
  var INS = { active: ["s-ok", "طرف قرارداد"], limited: ["s-rev", "نیازمند استعلام"], none: ["s-docs", "طرف قرارداد نیست"], self: ["s-can", "گزینه بدون بیمه"], unknown: ["s-can", "گزینه نامشخص"] };
  var COV = { yes: ["s-ok", "معمولاً مشمول"], cond: ["s-rev", "شرطی"], no: ["s-docs", "معمولاً غیرمشمول"] };
  function me() { var u = null; try { u = USERS[localStorage.getItem(SESS)]; } catch (e) { } return u; }
  function toast(t, bad) { var el = $("toast"); el.textContent = t; el.className = "toast in" + (bad ? " bad" : ""); clearTimeout(toast.t); toast.t = setTimeout(function () { el.className = "toast"; }, 3000); }
  function openModal(h, cls) { $("mCard").innerHTML = h; $("modal").className = "modal" + (cls ? " " + cls : ""); $("modal").hidden = false; document.body.classList.add("m-open"); }
  function closeModal() { $("modal").hidden = true; document.body.classList.remove("m-open"); }
  $("modal").addEventListener("click", function (e) { if (e.target.closest("[data-close]")) closeModal(); });
  function st(arr) { return '<span class="st ' + arr[0] + '">' + arr[arr.length - 1] + "</span>"; }
  function stale(ts) { return age(ts) > STALE ? '<span class="st s-docs xs">' + ic("alert") + fa(age(ts)) + " روز بدون بازبینی</span>" : ""; }
  function head(t, sub) { return '<div class="ph"><h1>' + t + "</h1>" + (sub ? "<p>" + sub + "</p>" : "") + "</div>"; }
  function kpi(icn, cls, label, val, sub) { return '<div class="kp"><span class="si ' + cls + '">' + ic(icn) + "</span><div><small>" + label + "</small><b>" + val + "</b>" + (sub ? "<em>" + sub + "</em>" : "") + "</div></div>"; }
  var V = { name: "dash" };
  function go(n, x) { V = { name: n }; if (x) for (var k in x) V[k] = x[k]; render(); scrollTo(0, 0); }
  function save() { K.save(S); }

  /* ---------- login ---------- */
  function vLogin() {
    var card = !V.otp ? '<h1>مدیریت راهنمای بیماران و بیمه‌ها</h1><p class="sub">فقط کارکنان مجاز امور بیمه و مالی.</p><label class="fl" for="mob">شماره موبایل</label><div class="inp ltr">' + ic("phone") + '<input id="mob" inputmode="numeric" maxlength="11" placeholder="۰۹۱۳۱۲۵۰۰۰۱"></div><button class="btn pri block" id="getOtp">دریافت کد تأیید</button>' +
      '<details class="demo-nums"><summary>' + ic("users") + "شماره‌های نمایشی</summary><div>" + Object.keys(USERS).map(function (m) { return '<button type="button" data-fill="' + m + '"><b>' + USERS[m].name + "</b><small>" + USERS[m].role + '</small><span dir="ltr">' + fa(m) + "</span></button>"; }).join("") + "</div></details>"
      : '<h1>کد تأیید</h1><p class="sub">نسخه نمایشی · کد: <b dir="ltr">' + fa(V.otp) + '</b></p><div class="otp" id="otp">' + "<input inputmode='numeric' maxlength='1' aria-label='رقم'>".repeat(5) + '</div><button class="btn pri block" id="verify">ورود</button>';
    app.innerHTML = '<div class="auth"><a class="logo" href="index.html"><span>' + ic("logo") + '</span><div><small>مرکز جراحی فوق تخصصی</small><b>دکتر خیرخواه</b></div></a><section class="card narrow" style="margin:30px auto 0">' + card + "</section></div>";
    $("demo").hidden = true;
    if (!V.otp) {
      var send = function () { var m = String($("mob").value).replace(/[۰-۹]/g, function (d) { return "۰۱۲۳۴۵۶۷۸۹".indexOf(d); }).replace(/\D/g, ""); if (!USERS[m]) return toast("این شماره دسترسی به این پنل ندارد.", true); V.mobile = m; V.otp = String(10000 + Math.floor(Math.random() * 89999)); vLogin(); };
      $("getOtp").addEventListener("click", send); $("mob").addEventListener("keydown", function (e) { if (e.key === "Enter") send(); });
      document.querySelectorAll("[data-fill]").forEach(function (b) { b.addEventListener("click", function () { $("mob").value = fa(b.dataset.fill); }); });
      return;
    }
    var ins = Array.prototype.slice.call(document.querySelectorAll("#otp input")); ins[0].focus();
    ins.forEach(function (inp, i) { inp.addEventListener("input", function () { inp.value = fa(String(num(inp.value)).slice(-1)); if (inp.value && ins[i + 1]) ins[i + 1].focus(); if (ins.every(function (x) { return x.value; })) $("verify").click(); }); });
    $("verify").addEventListener("click", function () { if (ins.map(function (x) { return String(num(x.value)); }).join("") !== V.otp) { toast("کد درست نیست.", true); return; } try { localStorage.setItem(SESS, V.mobile); } catch (e) { } go("dash"); });
  }

  /* ---------- shell ---------- */
  var NAV = [["dash", "داشبورد", "home"], ["est", "درخواست‌های برآورد", "wallet"], ["unans", "سؤال‌های بی‌پاسخ", "msg"], ["ins", "بیمه‌های طرف قرارداد", "shield"], ["surg", "جراحی‌ها و تعرفه‌ها", "cal"], ["faq", "پرسش‌های پرتکرار", "help"]];
  function counts() { return { est: S.est.filter(function (e) { return e.status === "pending"; }).length, unans: S.unans.filter(function (u) { return !u.done; }).length }; }
  function shell(html) {
    var u = me(), c = counts();
    return '<div class="shell"><aside class="side"><a class="logo" href="index.html"><span>' + ic("logo") + '</span><div><small>مرکز جراحی فوق تخصصی</small><b>دکتر خیرخواه</b></div></a><p class="side-t">راهنمای بیماران و بیمه‌ها</p><nav class="snav">' +
      NAV.map(function (x) { var n = c[x[0]]; return '<button data-go="' + x[0] + '"' + (V.name === x[0] ? ' class="on"' : "") + ">" + ic(x[2]) + x[1] + (n ? '<i class="dot">' + fa(n) + "</i>" : "") + "</button>"; }).join("") +
      '<a class="snl" href="assistant.html" target="_blank" rel="noopener">' + ic("search") + "نمای بیمار ↗</a></nav><button class=\"out\" id=\"logout\">" + ic("out") + "خروج</button></aside>" +
      '<div class="main"><header class="bar"><a class="logo m-only" href="index.html"><span>' + ic("logo") + "</span><b>امور بیمه</b></a><div class=\"tday\">" + ic("shield") + "<span>اطلاعاتی که اینجا ذخیره کنید، همان چیزی است که بیمار می‌بیند.</span></div>" +
      '<div class="me"><span class="av">' + u.name.charAt(0) + "</span><div><b>" + u.name + "</b><small>" + u.role + "</small></div></div></header>" +
      '<div class="content in">' + html + "</div></div>" +
      '<nav class="tabbar">' + [["dash", "خانه", "home"], ["est", "برآوردها", "wallet"], ["unans", "سؤال‌ها", "msg"]].map(function (x) { return '<button data-go="' + x[0] + '"' + (V.name === x[0] ? ' class="on"' : "") + ">" + ic(x[2]) + x[1] + (c[x[0]] ? "<i></i>" : "") + "</button>"; }).join("") +
      '<button id="moreB"' + (["ins", "surg", "faq"].indexOf(V.name) >= 0 ? ' class="on"' : "") + ">" + ic("dots") + "بیشتر</button></nav></div>";
  }

  /* ---------- dashboard ---------- */
  function vDash() {
    var c = counts(), staleL = [];
    S.ins.forEach(function (x) { if (x.status !== "self" && x.status !== "unknown" && age(x.upd) > STALE) staleL.push(["ins", "بیمه " + x.n, x.upd]); });
    S.surg.forEach(function (x) { if (age(x.upd) > STALE) staleL.push(["surg", "تعرفه " + x.n, x.upd]); });
    S.faq.forEach(function (x) { if (age(x.ok) > STALE) staleL.push(["faq", "پرسش: " + x.q, x.ok]); });
    var rate = S.stats.q ? Math.round(S.stats.ok / S.stats.q * 100) : 0;
    var pend = S.est.filter(function (e) { return e.status === "pending"; });
    return head("داشبورد راهنمای بیماران", "سؤال‌هایی که بیماران بدون تماس پاسخ گرفتند و مواردی که به بررسی انسانی نیاز دارند.") +
      '<div class="kps">' + kpi("wallet", "si-b", "برآوردهای در انتظار", fa(c.est)) + kpi("msg", "si-r", "سؤال‌های بی‌پاسخ", fa(c.unans)) + kpi("alert", "si-v", "اطلاعات نیازمند بازبینی", fa(staleL.length), "بیش از " + fa(STALE) + " روز") + kpi("check", "si-g", "پاسخ بدون ارجاع", fa(rate) + "٪", fa(S.stats.ok) + " از " + fa(S.stats.q) + " جستجو") + "</div>" +
      '<div class="acts">' +
      '<section class="box act"><header><h2>' + ic("wallet") + "برآوردهای در انتظار <span>" + fa(pend.length) + '</span></h2></header><ul class="rows">' + (pend.length ? pend.slice(0, 5).map(estRow).join("") : '<li class="mut sm" style="padding:10px">موردی نیست.</li>') + "</ul></section>" +
      '<section class="box act bad"><header><h2>' + ic("alert") + "نیازمند بازبینی <span>" + fa(staleL.length) + '</span></h2></header><ul class="rows">' + (staleL.length ? staleL.slice(0, 5).map(function (x) { return '<li><button data-go="' + x[0] + '"><span class="ri">' + ic("clock") + "</span><div><b>" + esc(x[1]) + "</b><small>آخرین بازبینی: " + dd(x[2]) + "</small></div>" + ic("chev") + "</button></li>"; }).join("") : '<li class="mut sm" style="padding:10px">همه اطلاعات به‌روز است.</li>') + "</ul></section>" +
      '<section class="box act"><header><h2>' + ic("msg") + "آخرین سؤال‌های بی‌پاسخ <span>" + fa(c.unans) + '</span></h2></header><ul class="rows">' + S.unans.filter(function (u) { return !u.done; }).slice(-5).reverse().map(function (u) { return '<li><button data-go="unans"><span class="ri">' + ic("help") + "</span><div><b>" + esc(u.q) + "</b><small>" + dd(u.at) + (u.mobile ? " · منتظر پاسخ پیامکی" : "") + "</small></div>" + ic("chev") + "</button></li>"; }).join("") + "</ul></section></div>" +
      '<p class="fine left">' + ic("alert") + "قاعده: هر پاسخی که بیمه، مبلغ یا زمان را قطعی اعلام می‌کند باید مسئول و تاریخ بازبینی داشته باشد. موارد قدیمی‌تر از " + fa(STALE) + " روز هشدار می‌گیرند.</p>";
  }
  function estRow(e) { var g = K.find(S.surg, e.surg); return '<li><button data-est="' + e.id + '"><span class="ri">' + ic("user") + "</span><div><b>" + esc(e.name || "بیمار") + " · " + esc(g ? g.n.split(" (")[0] : "") + "</b><small>" + K.find(S.ins, e.base).n + " + " + K.find(S.ins, e.supp).n + " · " + dd(e.at) + "</small></div>" + st(EST[e.status]) + "</button></li>"; }

  /* ---------- estimates ---------- */
  function vEst() {
    var f = V.f || "pending", L = S.est.filter(function (e) { return f === "all" || e.status === f; }).sort(function (a, b) { return b.at - a.at; });
    return head("درخواست‌های برآورد هزینه", "مبالغ را طبق محاسبه واحد بیمه وارد و برای بیمار منتشر کنید.") +
      '<div class="tabs">' + [["pending", "در انتظار"], ["docs", "نیازمند مدرک"], ["ok", "منتشرشده"], ["all", "همه"]].map(function (t) { return '<button data-f="' + t[0] + '"' + (f === t[0] ? ' class="on"' : "") + ">" + t[1] + "</button>"; }).join("") + "</div>" +
      (L.length ? '<ul class="rows box">' + L.map(estRow).join("") + "</ul>" : '<div class="empty sm">' + ic("wallet") + "<b>درخواستی در این دسته نیست</b><p>بیماران از صفحه «راهنمای هوشمند» درخواست برآورد دقیق ثبت می‌کنند.</p></div>");
  }
  function estModal(id) {
    var e = K.find(S.est, id), g = K.find(S.surg, e.surg), b = K.find(S.ins, e.base), s = K.find(S.ins, e.supp), a = e.ans || e.snap;
    openModal('<div class="mp"><h2>' + ic("wallet") + "برآورد هزینه · " + esc(e.name || "بیمار") + '</h2><p class="mut sm" dir="rtl">موبایل <span dir="ltr">' + fa(e.mobile.slice(0, 4) + "•••" + e.mobile.slice(-4)) + "</span> · ثبت " + dd(e.at) + "</p>" +
      '<dl class="sum"><dt>نوع جراحی</dt><dd>' + esc(g.n) + "</dd><dt>بیمه پایه</dt><dd>" + b.n + "</dd><dt>بیمه تکمیلی</dt><dd>" + s.n + "</dd><dt>طرح</dt><dd>" + esc(e.plan || "—") + "</dd><dt>برآورد سیستم</dt><dd>" + toman(e.snap.T - e.snap.base - e.snap.supp) + " سهم بیمار</dd>" + (e.file ? "<dt>مدرک بیمار</dt><dd>" + esc(e.file) + "</dd>" : "") + "</dl>" +
      '<div class="two"><div><label class="fl">هزینه کل (تومان)</label><div class="inp ltr"><input id="eT" inputmode="numeric" value="' + money(a.T) + '"></div></div><div><label class="fl">سهم بیمه پایه</label><div class="inp ltr"><input id="eB" inputmode="numeric" value="' + money(a.base) + '"></div></div></div>' +
      '<div class="two"><div><label class="fl">سهم بیمه تکمیلی</label><div class="inp ltr"><input id="eS" inputmode="numeric" value="' + money(a.supp) + '"></div></div><div><label class="fl">اعتبار برآورد</label><select class="sel" id="eV"><option value="7">۷ روز</option><option value="14" selected>۱۴ روز</option><option value="30">۳۰ روز</option></select></div></div>' +
      '<p class="calc" id="eP"></p><label class="fl" for="eN">توضیح برای بیمار <span class="opt">(اختیاری)</span></label><textarea id="eN" rows="2" placeholder="مثلاً: لوازم مصرفی خاص جداگانه محاسبه می‌شود.">' + esc(e.ans ? e.ans.note : "") + "</textarea>" +
      '<details class="lg"><summary>درخواست مدرک به‌جای انتشار</summary><textarea id="eD" rows="2" placeholder="مثلاً: تصویر صفحه اول بیمه‌نامه تکمیلی و معرفی‌نامه بیمه را بارگذاری کنید.">' + esc(e.need) + '</textarea><button class="btn sm" id="eDoc" style="margin-top:8px">' + ic("alert") + "ثبت «نیازمند مدرک»</button></details></div>" +
      '<div class="m-foot"><button class="btn" data-close>بستن</button><button class="btn pri" id="eOk">' + ic("check") + "تأیید و انتشار برای بیمار</button></div>");
    var calc = function () { ["eT", "eB", "eS"].forEach(function (i) { var v = num($(i).value); $(i).value = v ? money(v) : ""; }); var p = num($("eT").value) - num($("eB").value) - num($("eS").value); $("eP").innerHTML = ic("wallet") + "سهم پرداخت بیمار: <b>" + toman(p) + "</b>"; return p; };
    ["eT", "eB", "eS"].forEach(function (i) { $(i).addEventListener("input", calc); }); calc();
    $("eOk").addEventListener("click", function () {
      var p = calc(); if (!(num($("eT").value) > 0) || p < 0) return toast("مبالغ را درست وارد کنید.", true);
      var vd = new Date(Date.now() + $("eV").value * 864e5);
      e.ans = { T: num($("eT").value), base: num($("eB").value), supp: num($("eS").value), note: $("eN").value.trim(), valid: dd(vd), by: me().name + " · " + me().role, at: Date.now() };
      e.status = "ok"; e.log.push({ t: "تأیید و انتشار برآورد", at: Date.now() }); save();
      K.notifyPatient(e.mobile, "برآورد هزینه شما آماده است", "برآورد تأییدشده هزینه " + g.n.split(" (")[0] + " در صفحه «راهنمای هوشمند بیماران» قابل مشاهده است. سهم پرداخت شما: " + toman(p) + ".");
      closeModal(); render(); toast("برآورد منتشر شد و به بیمار اطلاع داده شد.");
    });
    $("eDoc").addEventListener("click", function () {
      var t = $("eD").value.trim(); if (t.length < 6) return toast("مدرک موردنیاز را بنویسید.", true);
      e.status = "docs"; e.need = t; e.log.push({ t: "درخواست مدرک: " + t, at: Date.now() }); save();
      K.notifyPatient(e.mobile, "برای برآورد هزینه، مدرک لازم است", t);
      closeModal(); render(); toast("درخواست مدرک برای بیمار ارسال شد.");
    });
  }

  /* ---------- unanswered ---------- */
  function vUnans() {
    var L = S.unans.slice().sort(function (a, b) { return (a.done - b.done) || b.at - a.at; });
    return head("سؤال‌های بی‌پاسخ", "سؤال‌هایی که راهنمای هوشمند جوابی برایشان نداشت؛ نشان می‌دهد کدام اطلاعات هنوز ناقص است.") +
      (L.length ? '<div class="rqs">' + L.map(function (u) {
        return '<article class="rq"><header><span class="ri">' + ic("help") + "</span><div><b>" + esc(u.q) + "</b><small>" + dd(u.at) + (u.mobile ? ' · <span dir="ltr">' + fa(u.mobile.slice(0, 4) + "•••" + u.mobile.slice(-4)) + "</span>" : " · بدون شماره") + "</small></div>" + (u.done ? '<span class="st s-ok">پاسخ داده شد</span>' : '<span class="st s-rev">باز</span>') + "</header>" +
          (u.ans ? '<p class="sm">پاسخ: ' + esc(u.ans) + "</p>" : "") +
          (u.done ? "" : '<div class="rq-a"><button class="btn sm pri" data-tofaq="' + u.id + '">' + ic("plus") + 'افزودن به پرسش‌های پرتکرار</button><button class="btn sm" data-ans="' + u.id + '">' + ic("send") + "پاسخ مستقیم</button></div>") + "</article>";
      }).join("") + "</div>" : '<div class="empty sm">' + ic("check") + "<b>سؤال بی‌پاسخی نیست</b></div>");
  }
  function ansModal(id) {
    var u = K.find(S.unans, id);
    openModal('<div class="mp"><h2>' + ic("send") + "پاسخ به سؤال</h2><p class=\"mut sm\">" + esc(u.q) + "</p><textarea id=\"ua\" rows=\"4\" placeholder=\"پاسخ کوتاه و دقیق…\"></textarea><small class=\"hint\">" + (u.mobile ? "پاسخ برای بیمار پیامک می‌شود (نمایشی)." : "این سؤال شماره تماس ندارد؛ فقط بسته می‌شود.") + '</small></div><div class="m-foot"><button class="btn" data-close>انصراف</button><button class="btn pri" id="uOk">ثبت پاسخ</button></div>');
    $("uOk").addEventListener("click", function () { var t = $("ua").value.trim(); if (t.length < 4) return toast("پاسخ را بنویسید.", true); u.ans = t; u.done = true; save(); if (u.mobile) K.notifyPatient(u.mobile, "پاسخ سؤال شما", t); closeModal(); render(); toast("پاسخ ثبت شد."); });
  }

  /* ---------- insurers ---------- */
  function vIns() {
    return head("بیمه‌های طرف قرارداد", "وضعیت قرارداد و درصدهای برآورد را طبق قرارداد واقعی مرکز وارد کنید. اعداد فعلی نمونه است.") +
      ["base", "supp"].map(function (k) {
        return '<section class="box tbox"><header><h2>' + (k === "base" ? "بیمه‌های پایه" : "بیمه‌های تکمیلی") + '</h2></header><div class="tw"><table class="ftbl"><thead><tr><th>بیمه</th><th>وضعیت</th><th>' + (k === "base" ? "سهم از تعرفه" : "سهم از مابقی / سقف") + "</th><th>توضیح برای بیمار</th><th>آخرین به‌روزرسانی</th><th></th></tr></thead><tbody>" +
          S.ins.filter(function (x) { return x.kind === k; }).map(function (x) {
            return '<tr><td class="c-doc"><b>' + x.n + '</b></td><td data-l="وضعیت">' + st(INS[x.status]) + '</td><td data-l="سهم">' + (x.status === "active" ? fa(x.share) + "٪" + (x.cap ? " · سقف " + nf.format(x.cap / 1e6) + " م" : "") : "—") + '</td><td data-l="توضیح" class="sm">' + esc(x.note || "—") + '</td><td data-l="به‌روزرسانی" class="sm">' + dd(x.upd) + "<br>" + esc(x.by) + " " + stale(x.upd) + '</td><td class="c-act">' + (x.status === "self" || x.status === "unknown" ? "" : '<button class="btn sm" data-ein="' + x.id + '">ویرایش</button>') + "</td></tr>";
          }).join("") + "</tbody></table></div></section>";
      }).join("");
  }
  function insModal(id) {
    var x = K.find(S.ins, id);
    openModal('<div class="mp"><h2>' + ic("shield") + "ویرایش بیمه " + x.n + '</h2><label class="fl">وضعیت قرارداد</label><select class="sel" id="iS">' + ["active", "limited", "none"].map(function (k) { return '<option value="' + k + '"' + (x.status === k ? " selected" : "") + ">" + INS[k][1] + "</option>"; }).join("") + "</select>" +
      '<div class="two"><div><label class="fl">' + (x.kind === "base" ? "سهم از تعرفه (٪)" : "سهم از مابقی (٪)") + '</label><div class="inp ltr"><input id="iP" inputmode="numeric" value="' + fa(x.share) + '"></div></div>' + (x.kind === "supp" ? '<div><label class="fl">سقف تعهد (تومان)</label><div class="inp ltr"><input id="iC" inputmode="numeric" value="' + money(x.cap) + '"></div></div>' : "") + "</div>" +
      '<label class="fl">توضیح برای بیمار</label><textarea id="iN" rows="2">' + esc(x.note) + '</textarea><small class="hint">با ذخیره، تاریخ بازبینی و نام شما ثبت می‌شود.</small></div><div class="m-foot"><button class="btn" data-close>انصراف</button><button class="btn pri" id="iOk">ذخیره و تأیید</button></div>');
    $("iOk").addEventListener("click", function () { var p = num($("iP").value); if (p > 100) return toast("درصد نامعتبر است.", true); x.status = $("iS").value; x.share = p; if ($("iC")) x.cap = num($("iC").value); x.note = $("iN").value.trim(); x.upd = Date.now(); delete x.s; x.by = me().name + " · " + me().role; save(); closeModal(); render(); toast("ذخیره شد؛ از همین لحظه در راهنمای بیمار اعمال می‌شود."); });
  }

  /* ---------- surgeries ---------- */
  function vSurg() {
    return head("جراحی‌ها و تعرفه‌ها", "تعرفه برآوردی هر عمل و وضعیت معمول پوشش بیمه. اعداد فعلی فرضی است.") +
      '<section class="box tbox"><div class="tw"><table class="ftbl"><thead><tr><th>جراحی</th><th>تعرفه برآوردی (تومان)</th><th>پوشش معمول</th><th>شرط / توضیح</th><th>بازبینی</th><th></th></tr></thead><tbody>' +
      S.surg.map(function (g) { return '<tr><td class="c-doc"><b>' + esc(g.n) + '</b></td><td data-l="تعرفه" class="c-amt">' + money(g.t) + '</td><td data-l="پوشش">' + st(COV[g.cov]) + '</td><td data-l="شرط" class="sm">' + esc(g.cond || "—") + '</td><td data-l="بازبینی" class="sm">' + dd(g.upd) + " " + stale(g.upd) + '</td><td class="c-act"><button class="btn sm" data-esg="' + g.id + '">ویرایش</button></td></tr>'; }).join("") + "</tbody></table></div></section>";
  }
  function surgModal(id) {
    var g = K.find(S.surg, id);
    openModal('<div class="mp"><h2>' + ic("cal") + esc(g.n) + '</h2><label class="fl">تعرفه برآوردی کل (تومان)</label><div class="inp ltr"><input id="gT" inputmode="numeric" value="' + money(g.t) + '"></div>' +
      '<label class="fl">پوشش معمول بیمه</label><select class="sel" id="gC">' + ["yes", "cond", "no"].map(function (k) { return '<option value="' + k + '"' + (g.cov === k ? " selected" : "") + ">" + COV[k][1] + "</option>"; }).join("") + '</select><label class="fl">شرط پوشش (برای حالت شرطی)</label><textarea id="gN" rows="2">' + esc(g.cond || "") + '</textarea></div><div class="m-foot"><button class="btn" data-close>انصراف</button><button class="btn pri" id="gOk">ذخیره</button></div>');
    $("gT").addEventListener("input", function () { var v = num(this.value); this.value = v ? money(v) : ""; });
    $("gOk").addEventListener("click", function () { var t = num($("gT").value); if (!t) return toast("تعرفه را وارد کنید.", true); g.t = t; g.cov = $("gC").value; g.cond = $("gN").value.trim(); if (g.cov === "cond" && !g.cond) return toast("برای پوشش شرطی، شرط را بنویسید.", true); g.upd = Date.now(); delete g.s; save(); closeModal(); render(); toast("تعرفه ذخیره شد."); });
  }

  /* ---------- FAQ ---------- */
  function vFaq() {
    return head("پرسش‌های پرتکرار", "پاسخ‌های استاندارد؛ هر پاسخ مسئول و تاریخ آخرین تأیید دارد.") + '<button class="btn pri fab0" id="fNew">' + ic("plus") + "پرسش جدید</button>" +
      '<div class="rqs">' + S.faq.map(function (f) { return '<article class="rq"><header><span class="ri">' + ic(f.urgent ? "alert" : "help") + "</span><div><b>" + esc(f.q) + "</b><small>" + CAT[f.cat] + " · تأیید " + dd(f.ok) + " · " + esc(f.unit) + "</small></div>" + stale(f.ok) + '</header><p class="sm">' + esc(f.a) + '</p><div class="rq-a"><button class="btn sm" data-ef="' + f.id + '">ویرایش</button><button class="btn sm" data-cf="' + f.id + '">' + ic("check") + 'تأیید مجدد</button><button class="btn sm danger" data-df="' + f.id + '">حذف</button></div></article>'; }).join("") + "</div>";
  }
  function faqModal(id, preQ, fromU) {
    var f = id ? K.find(S.faq, id) : { q: preQ || "", a: "", cat: "ins" };
    openModal('<div class="mp"><h2>' + ic("help") + (id ? "ویرایش پرسش" : "پرسش جدید") + '</h2><label class="fl">پرسش</label><div class="inp"><input id="fQ" value="' + esc(f.q) + '"></div><label class="fl">دسته</label><select class="sel" id="fC">' + Object.keys(CAT).map(function (k) { return '<option value="' + k + '"' + (f.cat === k ? " selected" : "") + ">" + CAT[k] + "</option>"; }).join("") + '</select><label class="fl">پاسخ</label><textarea id="fA" rows="5">' + esc(f.a) + '</textarea><small class="hint">پاسخ پزشکی باید عمومی باشد و به دستور پزشک معالج ارجاع دهد.</small></div><div class="m-foot"><button class="btn" data-close>انصراف</button><button class="btn pri" id="fOk">ذخیره و تأیید</button></div>');
    $("fOk").addEventListener("click", function () {
      var q = $("fQ").value.trim(), a = $("fA").value.trim(); if (q.length < 5 || a.length < 10) return toast("پرسش و پاسخ را کامل بنویسید.", true);
      if (!id) { f = { id: ++S.seq, unit: me().name + " · " + me().role }; S.faq.push(f); }
      f.q = q; f.a = a; f.cat = $("fC").value; f.ok = Date.now(); delete f.s; f.unit = me().name + " · " + me().role;
      if (fromU) { var u = K.find(S.unans, fromU); u.done = true; u.ans = "به پرسش‌های پرتکرار اضافه شد"; if (u.mobile) K.notifyPatient(u.mobile, "پاسخ سؤال شما", a); }
      save(); closeModal(); render(); toast("پرسش ذخیره شد و در راهنمای بیمار نمایش داده می‌شود.");
    });
  }

  function more() {
    openModal('<div class="more"><span class="grab"></span><h2>بیشتر</h2>' + NAV.slice(3).map(function (x) { return '<button data-go="' + x[0] + '"><span class="ri">' + ic(x[2]) + "</span>" + x[1] + ic("chev") + "</button>"; }).join("") + '<button class="lo" id="lo2"><span class="ri">' + ic("out") + "</span>خروج</button></div>", "sheet");
    $("mCard").querySelectorAll("[data-go]").forEach(function (b) { b.addEventListener("click", function () { closeModal(); go(b.dataset.go); }); });
    $("lo2").addEventListener("click", function () { closeModal(); logout(); });
  }
  function logout() { try { localStorage.removeItem(SESS); } catch (e) { } V = { name: "login" }; render(); }

  function render() {
    S = K.load();
    if (!me()) return vLogin();
    var VW = { dash: vDash, est: vEst, unans: vUnans, ins: vIns, surg: vSurg, faq: vFaq };
    if (!VW[V.name]) V.name = "dash";
    app.innerHTML = shell(VW[V.name]());
    $("demo").hidden = true;
    var on = function (sel, fn) { document.querySelectorAll(sel).forEach(function (b) { b.addEventListener("click", function (e) { e.stopPropagation(); fn(b); }); }); };
    on("[data-go]", function (b) { go(b.dataset.go); });
    on("[data-est]", function (b) { estModal(+b.dataset.est); });
    on("[data-f]", function (b) { V.f = b.dataset.f; render(); });
    on("[data-ein]", function (b) { insModal(b.dataset.ein); });
    on("[data-esg]", function (b) { surgModal(b.dataset.esg); });
    on("[data-ef]", function (b) { faqModal(+b.dataset.ef); });
    on("[data-cf]", function (b) { var f = K.find(S.faq, +b.dataset.cf); f.ok = Date.now(); delete f.s; f.unit = me().name + " · " + me().role; save(); render(); toast("تاریخ تأیید به‌روز شد."); });
    on("[data-df]", function (b) { S.faq = S.faq.filter(function (f) { return f.id !== +b.dataset.df; }); save(); render(); toast("پرسش حذف شد."); });
    on("[data-tofaq]", function (b) { var u = K.find(S.unans, +b.dataset.tofaq); faqModal(null, u.q, u.id); });
    on("[data-ans]", function (b) { ansModal(+b.dataset.ans); });
    if ($("fNew")) $("fNew").addEventListener("click", function () { faqModal(null); });
    if ($("logout")) $("logout").addEventListener("click", logout);
    if ($("moreB")) $("moreB").addEventListener("click", more);
  }
  addEventListener("storage", function (e) { if (e.key === K.KEY && $("modal").hidden) render(); });
  render();
})();
