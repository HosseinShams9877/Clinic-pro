/* =========================================================
   Quality & patient-satisfaction reports (management) — DEMO
   Reads survey responses written by the patient portal (survey-data.js).
   ========================================================= */
(function () {
  "use strict";
  var K = window.KHS, SESS = "kh-q-session";
  var $ = function (id) { return document.getElementById(id); };
  var app = $("app"), FA = "۰۱۲۳۴۵۶۷۸۹";
  function fa(s) { return String(s == null ? "" : s).replace(/\d/g, function (d) { return FA[d]; }).replace(/\./g, "٫"); }
  function f1(x) { return fa((Math.round(x * 10) / 10).toFixed(1)); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function ic(id) { return '<svg><use href="#i-' + id + '"/></svg>'; }
  var jFull = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { day: "numeric", month: "long", year: "numeric" }), jMon = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { month: "long" }),
      jNum = new Intl.DateTimeFormat("en-u-ca-persian", { year: "numeric", month: "numeric" });
  function ym(ts) { var o = {}; jNum.formatToParts(new Date(ts)).forEach(function (p) { if (p.type === "year" || p.type === "month") o[p.type] = +p.value.replace(/[۰-۹]/g, function (d) { return FA.indexOf(d); }); }); return o.year * 100 + o.month; }
  var USERS = { "09131260001": { name: "مریم صادقی", role: "مسئول بهبود کیفیت" }, "09131260002": { name: "مدیریت مرکز", role: "مدیر داخلی" } };
  var TH = 3.5, D = 864e5;
  var SEC = {}; K.allSections().forEach(function (s) { SEC[s.k] = s; });
  function me() { var u = null; try { u = USERS[localStorage.getItem(SESS)]; } catch (e) { } return u; }
  function toast(t, bad) { var el = $("toast"); el.textContent = t; el.className = "toast in" + (bad ? " bad" : ""); clearTimeout(toast.t); toast.t = setTimeout(function () { el.className = "toast"; }, 3000); }
  function openModal(h) { $("mCard").innerHTML = h; $("modal").className = "modal"; $("modal").hidden = false; document.body.classList.add("m-open"); }
  function closeModal() { $("modal").hidden = true; document.body.classList.remove("m-open"); }
  $("modal").addEventListener("click", function (e) { if (e.target.closest("[data-close]")) closeModal(); });
  var V = { name: "dash", per: 90, type: "all", doc: "", sec: "" };
  function go(n) { V.name = n; render(); scrollTo(0, 0); }

  /* ---------- data ---------- */
  function inRange(r, from, to) { return r.at >= from && r.at < to; }
  function filt(list, from, to) { return list.filter(function (r) { return inRange(r, from, to) && (V.type === "all" || r.type === V.type) && (!V.doc || r.doc === V.doc); }); }
  function mean(list) { var v = list.map(K.overall).filter(function (x) { return x > 0; }); return v.length ? v.reduce(function (a, b) { return a + b; }, 0) / v.length : null; }
  function needs(r) { return r.contact && Object.keys(r.scores).some(function (k) { return r.scores[k] > 0 && r.scores[k] <= 2; }) && !(r.follow && r.follow.done); }
  function delta(a, b, unit) { if (a == null || b == null) return ""; var d = a - b; if (Math.abs(d) < (unit ? 1 : 0.05)) return '<em class="dl eq">بدون تغییر</em>'; return '<em class="dl ' + (d > 0 ? "up" : "dn") + '">' + (d > 0 ? "▲ " : "▼ ") + (unit ? fa(Math.abs(Math.round(d))) : f1(Math.abs(d))) + " نسبت به دوره قبل</em>"; }

  /* ---------- login ---------- */
  function vLogin() {
    var card = !V.otp ? '<h1>گزارش رضایت بیماران</h1><p class="sub">مدیریت کیفیت · فقط مدیران و مسئول بهبود کیفیت.</p><label class="fl" for="mob">شماره موبایل</label><div class="inp ltr">' + ic("phone") + '<input id="mob" inputmode="numeric" maxlength="11" placeholder="۰۹۱۳۱۲۶۰۰۰۱"></div><button class="btn pri block" id="getOtp">دریافت کد تأیید</button>' +
      '<details class="demo-nums"><summary>' + ic("users") + "شماره‌های نمایشی</summary><div>" + Object.keys(USERS).map(function (m) { return '<button type="button" data-fill="' + m + '"><b>' + USERS[m].name + "</b><small>" + USERS[m].role + '</small><span dir="ltr">' + fa(m) + "</span></button>"; }).join("") + "</div></details>"
      : '<h1>کد تأیید</h1><p class="sub">نسخه نمایشی · کد: <b dir="ltr">' + fa(V.otp) + '</b></p><div class="otp" id="otp">' + "<input inputmode='numeric' maxlength='1' aria-label='رقم'>".repeat(5) + '</div><button class="btn pri block" id="verify">ورود</button>';
    app.innerHTML = '<div class="auth"><a class="logo" href="index.html"><span>' + ic("logo") + '</span><div><small>مرکز جراحی فوق تخصصی</small><b>دکتر خیرخواه</b></div></a><section class="card narrow" style="margin:30px auto 0">' + card + "</section></div>";
    var en = function (s) { return String(s).replace(/[۰-۹]/g, function (d) { return FA.indexOf(d); }).replace(/\D/g, ""); };
    if (!V.otp) {
      var send = function () { var m = en($("mob").value); if (!USERS[m]) return toast("این شماره دسترسی به گزارش‌های کیفیت ندارد.", true); V.mobile = m; V.otp = String(10000 + Math.floor(Math.random() * 89999)); vLogin(); };
      $("getOtp").addEventListener("click", send); $("mob").addEventListener("keydown", function (e) { if (e.key === "Enter") send(); });
      document.querySelectorAll("[data-fill]").forEach(function (b) { b.addEventListener("click", function () { $("mob").value = fa(b.dataset.fill); }); });
      return;
    }
    var ins = Array.prototype.slice.call(document.querySelectorAll("#otp input")); ins[0].focus();
    ins.forEach(function (inp, i) { inp.addEventListener("input", function () { inp.value = fa(en(inp.value).slice(-1)); if (inp.value && ins[i + 1]) ins[i + 1].focus(); if (ins.every(function (x) { return x.value; })) $("verify").click(); }); });
    $("verify").addEventListener("click", function () { if (en(ins.map(function (x) { return x.value; }).join("")) !== V.otp) return toast("کد درست نیست.", true); try { localStorage.setItem(SESS, V.mobile); } catch (e) { } V.otp = null; go("dash"); });
  }

  /* ---------- shell ---------- */
  function shell(html, S) {
    var u = me(), nf = S.resp.filter(needs).length;
    var nav = [["dash", "گزارش رضایت", "home"], ["fb", "نظرات و پیگیری", "msg"]];
    return '<div class="shell"><aside class="side"><a class="logo" href="index.html"><span>' + ic("logo") + '</span><div><small>مرکز جراحی فوق تخصصی</small><b>دکتر خیرخواه</b></div></a><p class="side-t">مدیریت کیفیت</p><nav class="snav">' +
      nav.map(function (x) { return '<button data-go="' + x[0] + '"' + (V.name === x[0] ? ' class="on"' : "") + ">" + ic(x[2]) + x[1] + (x[0] === "fb" && nf ? '<i class="dot">' + fa(nf) + "</i>" : "") + "</button>"; }).join("") +
      '</nav><button class="out" id="logout">' + ic("out") + "خروج</button></aside>" +
      '<div class="main"><header class="bar"><a class="logo m-only" href="index.html"><span>' + ic("logo") + "</span><b>کیفیت</b></a><div class=\"tday\">" + ic("check") + "<span>داده‌ها از نظرسنجی پنل بیمار پس از هر خدمت</span></div>" +
      '<div class="me"><span class="av">' + u.name.charAt(0) + "</span><div><b>" + u.name + "</b><small>" + u.role + "</small></div></div></header>" +
      '<div class="content in">' + html + "</div></div>" +
      '<nav class="tabbar">' + nav.map(function (x) { return '<button data-go="' + x[0] + '"' + (V.name === x[0] ? ' class="on"' : "") + ">" + ic(x[2]) + x[1] + (x[0] === "fb" && nf ? "<i></i>" : "") + "</button>"; }).join("") + '<button id="lo2">' + ic("out") + "خروج</button></nav></div>";
  }
  function filters(S) {
    var docs = {}; S.resp.forEach(function (r) { if (r.doc) docs[r.doc] = 1; });
    var sel = function (id, val, o) { return '<select class="sel sm" id="' + id + '" aria-label="' + id + '">' + o.map(function (x) { return '<option value="' + x[0] + '"' + (String(x[0]) === String(val) ? " selected" : "") + ">" + x[1] + "</option>"; }).join("") + "</select>"; };
    return '<div class="fbar qbar">' + sel("fPer", V.per, [[30, "۳۰ روز اخیر"], [90, "۹۰ روز اخیر"], [180, "۶ ماه اخیر"]]) + sel("fType", V.type, [["all", "همه خدمات"], ["surgery", "جراحی"], ["lab", "آزمایشگاه"]]) +
      (V.type !== "lab" ? sel("fDoc", V.doc, [["", "همه پزشکان"]].concat(Object.keys(docs).map(function (d) { return [d, d]; }))) : "") +
      '<button class="btn sm" id="csv">' + ic("dl") + "خروجی CSV</button></div>";
  }

  /* ---------- report ---------- */
  function vDash(S) {
    var now = Date.now(), from = now - V.per * D, cur = filt(S.resp, from, now), prev = filt(S.resp, from - V.per * D, from);
    var m = mean(cur), mp = mean(prev), n = K.nps(cur), np = K.nps(prev), follow = cur.filter(needs).length;
    var secs = (V.type === "all" ? K.allSections() : K.sec(V.type)).map(function (s) { var a = K.avg(cur, s.k), b = K.avg(prev, s.k); return a ? { s: s, a: a, b: b } : null; }).filter(Boolean).sort(function (x, y) { return y.a.m - x.a.m; });
    var strong = secs.filter(function (x) { return x.a.m >= 4.2; }).slice(0, 3), weak = secs.slice().reverse().filter(function (x) { return x.a.m < 3.9; }).slice(0, 3);
    if (!V.sec || !secs.some(function (x) { return x.s.k === V.sec; })) V.sec = (weak[0] || secs[secs.length - 1] || { s: {} }).s.k;
    var html = '<div class="ph"><h1>گزارش رضایت بیماران</h1><p>میانگین نمره هر بخش از ۵، بر اساس نظرسنجی پس از جراحی و آزمایشگاه.</p></div>' + filters(S);
    if (!cur.length) return html + '<div class="empty">' + ic("msg") + "<b>در این بازه پاسخی ثبت نشده است</b></div>";
    html += '<div class="kps">' +
      kp("users", "si-b", "تعداد پاسخ", fa(cur.length), "نرخ مشارکت کل " + fa(Math.round(S.resp.length / S.invites * 100)) + "٪") +
      kp("check", "si-g", "میانگین رضایت کل", f1(m) + ' <small>از ۵</small>', delta(m, mp)) +
      kp("send", "si-v", "شاخص معرفی به دیگران (NPS)", (n > 0 ? "+" : "") + fa(n), delta(n, np, true)) +
      kp("call", "si-r", "نیازمند پیگیری", fa(follow), "رضایت پایین + اجازه تماس") + "</div>";
    html += '<div class="qsw"><section class="box qs good"><header><h2>' + ic("check") + "نقاط قوت</h2></header>" + (strong.length ? '<ul class="qlist">' + strong.map(function (x) { return "<li><b>" + x.s.n + '</b><span class="qv">' + f1(x.a.m) + "</span>" + delta(x.a.m, x.b && x.b.m) + "</li>"; }).join("") + "</ul>" : '<p class="mut sm">بخشی با میانگین ۴٫۲ یا بیشتر نیست.</p>') + "</section>" +
      '<section class="box qs bad"><header><h2>' + ic("alert") + "نیازمند بهبود</h2></header>" + (weak.length ? '<ul class="qlist">' + weak.map(function (x) { var top = topReason(cur, x.s.k); return '<li><button data-sec="' + x.s.k + '"><b>' + x.s.n + '</b><span class="qv">' + f1(x.a.m) + "</span>" + delta(x.a.m, x.b && x.b.m) + (top ? '<small>بیشترین دلیل: «' + esc(top[0]) + "» (" + fa(top[1]) + " مورد)</small>" : "") + "</button></li>"; }).join("") + "</ul>" : '<p class="mut sm">همه بخش‌ها بالاتر از ۳٫۹ هستند.</p>') + "</section></div>";
    /* section bars */
    html += '<section class="box tbox"><header><h2>میانگین نمره هر بخش</h2><button class="more" id="tblT">' + (V.tbl ? "نمایش نمودار" : "نمایش جدول") + "</button></header>" +
      (V.tbl ? '<div class="tw"><table class="ftbl it"><thead><tr><th>بخش</th><th>میانگین (از ۵)</th><th>راضی (۴ و ۵)</th><th>تعداد پاسخ</th><th>دوره قبل</th></tr></thead><tbody>' + secs.map(function (x) { return "<tr><td>" + x.s.n + "</td><td>" + f1(x.a.m) + "</td><td>" + fa(Math.round(x.a.sat * 100)) + "٪</td><td>" + fa(x.a.n) + "</td><td>" + (x.b ? f1(x.b.m) : "—") + "</td></tr>"; }).join("") + "</tbody></table></div>"
        : '<div class="hb" role="list">' + secs.map(function (x) {
          var low = x.a.m < TH, w = (x.a.m / 5 * 100).toFixed(1);
          return '<button class="hb-r' + (low ? " low" : "") + (V.sec === x.s.k ? " sel" : "") + '" role="listitem" data-sec="' + x.s.k + '" data-tip="' + esc(x.s.n + " · میانگین " + f1(x.a.m) + " از ۵ · " + fa(Math.round(x.a.sat * 100)) + "٪ راضی · " + fa(x.a.n) + " پاسخ") + '"><span class="hb-l">' + x.s.n + "</span>" +
            '<span class="hb-t"><i style="width:' + w + '%"></i><em class="hb-th" style="inset-inline-start:' + (TH / 5 * 100) + '%"></em></span><span class="hb-v">' + f1(x.a.m) + "</span>" +
            (low ? '<span class="hb-f">' + ic("alert") + "زیر حد مطلوب</span>" : '<span class="hb-p">' + fa(Math.round(x.a.sat * 100)) + "٪ راضی</span>") + "</button>";
        }).join("") + '</div><p class="hb-n">خط عمودی: حد مطلوب ' + f1(TH) + " · روی هر بخش بزنید تا دلایل نارضایتی آن را ببینید.</p>") + "</section>";
    /* reasons + trend */
    var rs = reasons(cur, V.sec), mx = rs.length ? rs[0][1] : 1;
    html += '<div class="dgrid3"><section class="box"><header><h2>دلایل نارضایتی · ' + (SEC[V.sec] ? SEC[V.sec].n : "") + "</h2></header>" +
      (rs.length ? '<ul class="rsn">' + rs.map(function (r) { return '<li data-tip="' + esc(r[0] + " · " + fa(r[1]) + " مورد") + '"><span>' + esc(r[0]) + '</span><span class="rb"><i style="width:' + (r[1] / mx * 100).toFixed(1) + '%"></i></span><b>' + fa(r[1]) + "</b></li>"; }).join("") + "</ul><p class=\"hb-n\">از پاسخ‌هایی که به این بخش نمره ۱ یا ۲ داده‌اند.</p>" : '<p class="mut sm">در این بازه نمره پایینی برای این بخش ثبت نشده است.</p>') + "</section>" +
      '<section class="box"><header><h2>روند میانگین رضایت · ۶ ماه</h2></header>' + trend(S) + "</section></div>";
    /* doctors */
    if (V.type !== "lab") {
      var byDoc = {}; cur.filter(function (r) { return r.type === "surgery" && r.doc; }).forEach(function (r) { (byDoc[r.doc] = byDoc[r.doc] || []).push(r); });
      var rows = Object.keys(byDoc).map(function (d) { return { d: d, L: byDoc[d] }; }).sort(function (a, b) { return b.L.length - a.L.length; });
      html += '<section class="box tbox"><header><h2>به تفکیک پزشک (جراحی)</h2><small class="mut">برای حفظ اعتبار، پزشکان با کمتر از ۵ پاسخ نمره ندارند.</small></header><div class="tw"><table class="ftbl it"><thead><tr><th>پزشک</th><th>پاسخ</th><th>توضیح پزشک</th><th>نتیجه عمل</th><th>رضایت کل</th><th>NPS</th></tr></thead><tbody>' +
        rows.map(function (x) { var ok = x.L.length >= 5, a = K.avg(x.L, "surgeon"), o = K.avg(x.L, "outcome"); return "<tr><td><b>" + esc(x.d) + "</b></td><td>" + fa(x.L.length) + "</td>" + (ok ? "<td>" + (a ? f1(a.m) : "—") + "</td><td>" + (o ? f1(o.m) : "—") + "</td><td>" + f1(mean(x.L)) + "</td><td>" + fa(K.nps(x.L)) + "</td>" : '<td colspan="4" class="mut sm">کمتر از ۵ پاسخ</td>') + "</tr>"; }).join("") + "</tbody></table></div></section>";
    }
    html += '<p class="fine left">' + ic("alert") + "پاسخ‌های اولیه این نسخه نمونه و ساختگی هستند تا ساختار گزارش دیده شود؛ نظرهایی که از پنل بیمار ثبت کنید بلافاصله به آن اضافه می‌شوند.</p>";
    return html;
  }
  function kp(icn, cls, l, v, sub) { return '<div class="kp"><span class="si ' + cls + '">' + ic(icn) + "</span><div><small>" + l + "</small><b>" + v + "</b>" + (sub ? "<em>" + sub + "</em>" : "") + "</div></div>"; }
  function reasons(list, k) { var c = {}; list.forEach(function (r) { (r.reasons[k] || []).forEach(function (t) { c[t] = (c[t] || 0) + 1; }); }); return Object.keys(c).map(function (t) { return [t, c[t]]; }).sort(function (a, b) { return b[1] - a[1]; }); }
  function topReason(list, k) { return reasons(list, k)[0]; }
  function trend(S) {
    var months = [], d = new Date();
    for (var i = 0; i < 6; i++) { var y = ym(d); if (!months.some(function (x) { return x.y === y; })) months.unshift({ y: y, n: jMon.format(d) }); d = new Date(d.getTime() - 30 * D); }
    while (months.length > 6) months.shift();
    var L = S.resp.filter(function (r) { return (V.type === "all" || r.type === V.type) && (!V.doc || r.doc === V.doc); });
    months.forEach(function (m) { var x = L.filter(function (r) { return ym(r.at) === m.y; }); m.v = mean(x); m.c = x.length; });
    return '<div class="qtr" role="img" aria-label="روند میانگین رضایت ماهانه">' + months.map(function (m, i) {
      return '<div class="qc' + (i === months.length - 1 ? " cur" : "") + '" data-tip="' + esc(m.n + " · میانگین " + (m.v ? f1(m.v) : "—") + " · " + fa(m.c) + " پاسخ") + '"><span class="qb"><i style="height:' + (m.v ? (m.v / 5 * 100).toFixed(1) : 0) + '%"><em>' + (m.v ? f1(m.v) : "") + "</em></i></span><small>" + m.n + "</small></div>";
    }).join("") + '</div><p class="hb-n">ستون‌ها از صفر تا ۵ · ماه جاری ممکن است ناقص باشد.</p>';
  }

  /* ---------- feedback list ---------- */
  function vFb(S) {
    var f = V.ff || "need", L = S.resp.slice().sort(function (a, b) { return b.at - a.at; }).filter(function (r) {
      if (f === "need") return needs(r);
      if (f === "low") return K.overall(r) < 3;
      if (f === "cmt") return r.comment;
      return true;
    }).slice(0, 60);
    return '<div class="ph"><h1>نظرات و پیگیری</h1><p>پاسخ‌هایی که نمره پایین داده‌اند و اجازه تماس داده‌اند باید پیگیری و نتیجه آن ثبت شود.</p></div>' +
      '<div class="tabs">' + [["need", "نیازمند پیگیری"], ["low", "رضایت پایین"], ["cmt", "دارای نظر متنی"], ["all", "همه"]].map(function (t) { return '<button data-ff="' + t[0] + '"' + (f === t[0] ? ' class="on"' : "") + ">" + t[1] + "</button>"; }).join("") + "</div>" +
      (L.length ? '<div class="rqs">' + L.map(function (r) {
        var o = K.overall(r), lows = Object.keys(r.scores).filter(function (k) { return r.scores[k] > 0 && r.scores[k] <= 2; });
        return '<article class="rq"><header><span class="qsc ' + (o < 3 ? "b" : o < 4 ? "m" : "g") + '">' + f1(o) + "</span><div><b>" + (r.anon ? "بی‌نام" : esc(r.name)) + " · " + (r.type === "surgery" ? "جراحی" : "آزمایشگاه") + "</b><small>" + jFull.format(new Date(r.at)) + (r.doc ? " · " + esc(r.doc) : "") + " · NPS " + fa(r.nps) + "</small></div>" +
          (needs(r) ? '<span class="st s-docs">پیگیری نشده</span>' : r.follow && r.follow.done ? '<span class="st s-ok">پیگیری شد</span>' : "") + "</header>" +
          (lows.length ? '<ul class="lows">' + lows.map(function (k) { return "<li><b>" + SEC[k].n + " · " + fa(r.scores[k]) + "</b>" + ((r.reasons[k] || []).length ? " — " + r.reasons[k].map(esc).join("، ") : "") + (r.notes && r.notes[k] ? '<small>«' + esc(r.notes[k]) + "»</small>" : "") + "</li>"; }).join("") + "</ul>" : "") +
          (r.comment ? '<p class="cmt">«' + esc(r.comment) + "»</p>" : "") +
          (r.follow && r.follow.done ? '<p class="mut sm">' + ic("check") + esc(r.follow.note) + " · " + esc(r.follow.by) + "</p>" : "") +
          (needs(r) ? '<div class="rq-a"><span class="mut sm">' + ic("call") + (r.mobile ? '<span dir="ltr">' + fa(r.mobile) + "</span>" : "شماره در پرونده بیمار") + '</span><button class="btn sm pri" data-fu="' + r.id + '">ثبت نتیجه پیگیری</button></div>' : "") + "</article>";
      }).join("") + "</div>" : '<div class="empty sm">' + ic("check") + "<b>موردی در این دسته نیست</b></div>");
  }
  function fuModal(id) {
    openModal('<div class="mp"><h2>' + ic("call") + 'ثبت نتیجه پیگیری</h2><textarea id="fu" rows="3" placeholder="مثلاً: با بیمار تماس گرفته شد؛ موضوع ترخیص به سرپرستار بخش ارجاع شد."></textarea></div><div class="m-foot"><button class="btn" data-close>انصراف</button><button class="btn pri" id="fuOk">ثبت</button></div>');
    $("fuOk").addEventListener("click", function () { var t = $("fu").value.trim(); if (t.length < 6) return toast("نتیجه پیگیری را بنویسید.", true); var S = K.load(), r = S.resp.filter(function (x) { return x.id === id; })[0]; r.follow = { done: true, note: t, by: me().name, at: Date.now() }; K.save(S); closeModal(); render(); toast("پیگیری ثبت شد."); });
  }
  function csv(S) {
    var now = Date.now(), L = filt(S.resp, now - V.per * D, now), keys = (V.type === "all" ? K.allSections() : K.sec(V.type)).map(function (s) { return s.k; });
    var rows = [["تاریخ", "خدمت", "پزشک", "رضایت کل"].concat(keys.map(function (k) { return SEC[k].n; })).concat(["NPS", "نظر"])];
    L.forEach(function (r) { rows.push([jFull.format(new Date(r.at)), r.type === "surgery" ? "جراحی" : "آزمایشگاه", r.doc || "", (Math.round(K.overall(r) * 10) / 10).toString()].concat(keys.map(function (k) { return r.scores[k] == null ? "" : r.scores[k] === 0 ? "مربوط نبود" : r.scores[k]; })).concat([r.nps, r.comment || ""])); });
    var text = "﻿" + rows.map(function (r) { return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(","); }).join("\n");
    var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" })); a.download = "satisfaction-report.csv"; document.body.appendChild(a); a.click(); a.remove();
    toast("فایل CSV با " + fa(L.length) + " پاسخ ساخته شد.");
  }

  /* ---------- tooltip ---------- */
  var tip = document.createElement("div"); tip.className = "qtip"; tip.hidden = true; document.body.appendChild(tip);
  function bindTips() {
    document.querySelectorAll("[data-tip]").forEach(function (el) {
      var show = function () { var r = el.getBoundingClientRect(); tip.textContent = el.dataset.tip; tip.hidden = false; tip.style.top = (r.top + scrollY - tip.offsetHeight - 8) + "px"; tip.style.left = Math.max(8, Math.min(innerWidth - tip.offsetWidth - 8, r.left + r.width / 2 - tip.offsetWidth / 2)) + "px"; };
      el.addEventListener("mouseenter", show); el.addEventListener("focus", show);
      el.addEventListener("mouseleave", function () { tip.hidden = true; }); el.addEventListener("blur", function () { tip.hidden = true; });
    });
  }

  function render() {
    tip.hidden = true;
    if (!me()) return vLogin();
    var S = K.load();
    app.innerHTML = shell(V.name === "fb" ? vFb(S) : vDash(S), S);
    var on = function (sel, ev, fn) { document.querySelectorAll(sel).forEach(function (b) { b.addEventListener(ev, function () { fn(b); }); }); };
    on("[data-go]", "click", function (b) { go(b.dataset.go); });
    on("[data-sec]", "click", function (b) { V.sec = b.dataset.sec; render(); });
    on("[data-ff]", "click", function (b) { V.ff = b.dataset.ff; render(); });
    on("[data-fu]", "click", function (b) { fuModal(+b.dataset.fu); });
    if ($("fPer")) $("fPer").addEventListener("change", function () { V.per = +this.value; render(); });
    if ($("fType")) $("fType").addEventListener("change", function () { V.type = this.value; V.doc = ""; V.sec = ""; render(); });
    if ($("fDoc")) $("fDoc").addEventListener("change", function () { V.doc = this.value; render(); });
    if ($("tblT")) $("tblT").addEventListener("click", function () { V.tbl = !V.tbl; render(); });
    if ($("csv")) $("csv").addEventListener("click", function () { csv(S); });
    var lo = function () { try { localStorage.removeItem(SESS); } catch (e) { } render(); };
    if ($("logout")) $("logout").addEventListener("click", lo);
    if ($("lo2")) $("lo2").addEventListener("click", lo);
    bindTips();
  }
  addEventListener("storage", function (e) { if (e.key === K.KEY && $("modal").hidden) render(); });
  render();
})();
