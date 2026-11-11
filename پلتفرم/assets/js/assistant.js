/* =========================================================
   Smart patient guide — public + personal view (DEMO)
   Answers come only from staff-confirmed data (assistant-data.js)
   or the patient's own record. Nothing is guessed.
   ========================================================= */
(function () {
  "use strict";
  var K = window.KHA, S = K.load(), fa = K.fa;
  var $ = function (id) { return document.getElementById(id); };
  var nf = new Intl.NumberFormat("fa-IR");
  function money(n) { return nf.format(Math.round(n)); }
  function toman(n) { return money(n) + " تومان"; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function ic(id) { return '<svg><use href="#a-' + id + '"/></svg>'; }
  var jFull = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { day: "numeric", month: "long", year: "numeric" });
  function dd(ts) { return jFull.format(new Date(ts)); }
  function toast(t, bad) { var el = $("aToast"); el.textContent = t; el.className = "a-toast in" + (bad ? " bad" : ""); clearTimeout(toast.t); toast.t = setTimeout(function () { el.className = "a-toast"; }, 3200); }
  var CATS = [["all", "همه پرسش‌ها", "help"], ["ins", "بیمه و هزینه", "shield"], ["time", "نوبت و مراجعه", "cal"], ["pre", "قبل از عمل", "book"], ["post", "بعد از عمل", "check"], ["docs", "مدارک و آزمایش", "doc"]];
  var LOGIN = "patient-panel.html?next=assistant";
  var W = { base: "", supp: "", surg: "", plan: "" };
  try { var saved = JSON.parse(sessionStorage.getItem("kh-ast-w")); if (saved) W = saved; } catch (e) { }
  function keepW() { try { sessionStorage.setItem("kh-ast-w", JSON.stringify(W)); } catch (e) { } }

  /* ================= views ================= */
  var view = $("aView"), home = $("aHome");
  function route() {
    S = K.load();
    var h = location.hash.replace("#", "");
    var flows = { ins: vForm, result: vResult, cost: vCost, me: vMe };
    if ((h === "result" || h === "cost") && !(W.base && W.supp && W.surg)) { location.replace("#ins"); return; }
    document.body.classList.toggle("a-in-flow", !!flows[h]);
    if (flows[h]) $("aRes").hidden = true;
    if (flows[h]) { home.hidden = true; view.hidden = false; view.innerHTML = flows[h](); bindView(h); scrollTo(0, 0); }
    else { home.hidden = false; view.hidden = true; view.innerHTML = ""; renderPersonal(); renderFaq(); if (h === "faq") setTimeout(function () { $("faq").scrollIntoView({ behavior: "smooth" }); }, 50); }
  }
  addEventListener("hashchange", route);

  function steps(n) {
    return '<ol class="a-steps">' + ["اطلاعات بیمه", "نتیجه بررسی", "برآورد هزینه"].map(function (t, i) { var k = i + 1; return '<li class="' + (k === n ? "on" : k < n ? "done" : "") + '"><span>' + (k < n ? ic("check") : fa(k)) + "</span>" + t + "</li>"; }).join("") + "</ol>";
  }
  function crumb(t) { return '<a class="a-back" href="#">' + ic("back") + "راهنمای هوشمند بیماران</a>" + (t ? "<h1>" + t + "</h1>" : ""); }
  function opts(kind, sel) { return S.ins.filter(function (x) { return x.kind === kind; }).map(function (x) { return '<option value="' + x.id + '"' + (x.id === sel ? " selected" : "") + ">" + x.n + "</option>"; }).join(""); }

  /* ---- step 1: form ---- */
  function vForm() {
    return '<section class="a-flow">' + crumb("بررسی پوشش بیمه و هزینه") + steps(1) +
      '<div class="a-card a-split"><div class="a-form"><h2>اطلاعات خود را وارد کنید</h2><p class="a-mut">برای بررسی پوشش و برآورد هزینه، اطلاعات زیر را انتخاب کنید.</p>' +
      '<label class="a-fl" for="wBase">بیمه پایه شما چیست؟</label><div class="a-sel">' + ic("shield") + '<select id="wBase"><option value="">انتخاب کنید…</option>' + opts("base", W.base) + "</select></div>" +
      '<label class="a-fl" for="wSupp">بیمه تکمیلی شما چیست؟</label><div class="a-sel">' + ic("shield") + '<select id="wSupp"><option value="">انتخاب کنید…</option>' + opts("supp", W.supp) + "</select></div>" +
      '<label class="a-fl" for="wSurg">نوع جراحی موردنظر</label><div class="a-sel">' + ic("cal") + '<select id="wSurg"><option value="">انتخاب کنید…</option>' + S.surg.map(function (g) { return '<option value="' + g.id + '"' + (g.id === W.surg ? " selected" : "") + ">" + g.n + "</option>"; }).join("") + "</select></div>" +
      '<label class="a-fl" for="wPlan">نام طرح یا قرارداد بیمه تکمیلی <span>(اختیاری)</span></label><div class="a-sel">' + ic("doc") + '<input id="wPlan" value="' + esc(W.plan) + '" placeholder="مثلاً: بیمه‌گروهی شرکت …"></div>' +
      '<div class="a-btns"><button class="a-btn pri" id="wGo">' + ic("search") + 'بررسی پوشش بیمه</button><a class="a-btn" href="#">قبلی</a></div></div>' +
      '<aside class="a-side"><img src="assets/img/guide/v-prep.jpg" alt=""><p>' + ic("lock") + "اطلاعات وارد‌شده فقط برای پاسخ‌دهی استفاده می‌شود و بدون ورود به حساب ذخیره نمی‌شود.</p></aside></div></section>";
  }
  function badgeState(st) { return { ok: ["ok", "check", "مشمول پوشش (طبق قرارداد نمونه)"], inq: ["warn", "clock", "نیازمند استعلام"], self: ["mut", "x", "ندارد"], none: ["bad", "x", "طرف قرارداد مرکز نیست"], no: ["bad", "x", "معمولاً تحت پوشش نیست"] }[st]; }
  function headState(r, g) {
    if (r.state === "nocov") return ["bad", "alert", "این عمل معمولاً تحت پوشش بیمه نیست", "جراحی‌هایی که فقط جنبه زیبایی دارند معمولاً مشمول بیمه پایه و بیشتر بیمه‌های تکمیلی نیستند. هزینه کامل را در برآورد ببینید."];
    if (r.state === "partial") return ["warn", "clock", "بخشی از پوشش شما نیازمند استعلام است", "اطلاعات قطعی برای همه بیمه‌های شما در سیستم ثبت نشده است؛ برآورد زیر بدون آن بخش محاسبه شده است."];
    if (r.state === "cond") return ["warn", "alert", "پوشش «" + g.n.split(" (")[0] + "» شرطی است", g.cond];
    if (r.baseState === "self" && r.suppState === "self") return ["mut", "help", "بدون بیمه، هزینه به‌صورت آزاد محاسبه می‌شود", "برآورد هزینه کامل عمل را در مرحله بعد ببینید."];
    return ["ok", "check", "مرکز با بیمه‌های انتخابی شما طرف قرارداد است و این عمل معمولاً مشمول پوشش است", "این نتیجه بر اساس اطلاعات عمومی قراردادهاست؛ پوشش نهایی پس از بررسی بیمه‌نامه شما تأیید می‌شود."];
  }
  function trust(n) { return '<div class="a-trust"><b>سطح اعتبار این پاسخ</b><ol>' + ["اطلاعات عمومی", "برآورد اولیه", "پاسخ تأییدشده واحد بیمه"].map(function (t, i) { return '<li class="' + (i < n ? "done" : i === n ? "on" : "") + '"><span>' + fa(i + 1) + "</span>" + t + "</li>"; }).join("") + "</ol></div>"; }
  function upd() { var x = S.ins.concat([]).sort(function (a, b) { return b.upd - a.upd; })[0]; return '<p class="a-upd">' + ic("clock") + "آخرین به‌روزرسانی اطلاعات بیمه: " + dd(x.upd) + " · " + esc(x.by) + ' · <b>اطلاعات و درصدها نمونه نمایشی است</b></p>'; }

  /* ---- step 2: result ---- */
  function vResult() {
    var r = K.estimate(S, W.base, W.supp, W.surg); if (!r) return vForm();
    var b = K.find(S.ins, W.base), s = K.find(S.ins, W.supp), g = K.find(S.surg, W.surg), h = headState(r, g);
    var row = function (t, st, extra) { var x = badgeState(st); return '<li><span class="a-ri ' + x[0] + '">' + ic(x[1]) + "</span><div><b>" + t + "</b><small>" + extra + '</small></div><em class="a-tag ' + x[0] + '">' + x[2] + "</em></li>"; };
    return '<section class="a-flow">' + crumb("نتیجه بررسی بیمه") + steps(2) +
      '<div class="a-card"><div class="a-state ' + h[0] + '">' + ic(h[1]) + "<div><h2>" + h[2] + "</h2><p>" + esc(h[3]) + "</p></div></div>" +
      '<dl class="a-chips"><div><dt>نوع جراحی</dt><dd>' + g.n.split(" (")[0] + "</dd></div><div><dt>بیمه پایه</dt><dd>" + b.n + "</dd></div><div><dt>بیمه تکمیلی</dt><dd>" + s.n + "</dd></div>" + (W.plan ? "<div><dt>طرح</dt><dd>" + esc(W.plan) + "</dd></div>" : "") + "</dl>" +
      '<h3 class="a-h3">جزئیات پوشش</h3><ul class="a-cov">' +
      row("پوشش بیمه پایه · " + b.n, r.baseState, r.baseState === "ok" ? "حدود " + fa(b.share) + "٪ از تعرفه (درصد نمونه)" : r.baseState === "no" ? "این نوع عمل معمولاً مشمول تعهد بیمه پایه نیست" : b.note || "—") +
      row("پوشش بیمه تکمیلی · " + s.n, r.suppState, r.suppState === "ok" ? fa(s.share) + "٪ مابقی، تا سقف " + toman(s.cap) + " (نمونه)" : r.suppState === "no" ? "بیشتر طرح‌های تکمیلی این عمل را پوشش نمی‌دهند" : s.note || "—") +
      row("فرانشیز و سقف تعهدات", "inq", "طبق طرح بیمه‌نامه شما؛ در برآورد دقیق محاسبه می‌شود") +
      row("نیاز به معرفی‌نامه", (b.status === "limited" ? "inq" : "ok").replace("ok", "ok"), b.status === "limited" ? "برای " + b.n + " معرفی‌نامه لازم است" : "طبق اطلاعات ثبت‌شده، معمولاً لازم نیست") + "</ul>" +
      (r.notes.length ? '<div class="a-note">' + ic("alert") + "<div><b>توجه</b>" + r.notes.map(function (n) { return "<p>" + esc(n) + "</p>"; }).join("") + "</div></div>" : "") +
      trust(1) + upd() +
      '<div class="a-btns"><a class="a-btn pri" href="#cost">' + ic("wallet") + 'مشاهده برآورد هزینه</a><button class="a-btn" id="reqEst">' + ic("send") + "درخواست بررسی دقیق توسط واحد بیمه</button></div></div></section>";
  }

  /* ---- step 3: cost ---- */
  function vCost() {
    var r = K.estimate(S, W.base, W.supp, W.surg); if (!r) { location.hash = "ins"; return ""; }
    var g = K.find(S.surg, W.surg), b = K.find(S.ins, W.base), s = K.find(S.ins, W.supp);
    var line = function (t, v, st) { return "<tr><td>" + t + "</td><td>" + (st === "inq" ? '<em class="a-tag warn">نیازمند استعلام</em>' : st === "no" ? '<em class="a-tag mut">۰</em>' : toman(v)) + "</td></tr>"; };
    return '<section class="a-flow">' + crumb("برآورد هزینه جراحی") + steps(3) +
      '<div class="a-card"><div class="a-ch"><span class="a-bi">' + ic("wallet") + "</span><div><h2>برآورد هزینه " + esc(g.n.split(" (")[0]) + '</h2><p class="a-mut">بر اساس تعرفه نمونه مرکز و اطلاعات بیمه‌ای که انتخاب کردید.</p></div></div>' +
      '<table class="a-tbl"><tbody>' + "<tr><td>هزینه کل عمل (تعرفه برآوردی مرکز)</td><td>" + toman(r.T) + "</td></tr>" +
      line("سهم بیمه پایه (" + b.n + ")", r.base, r.state === "nocov" ? "no" : r.baseState === "inq" ? "inq" : "") +
      line("سهم بیمه تکمیلی (" + s.n + ")", r.supp, r.state === "nocov" ? "no" : r.suppState === "inq" ? "inq" : "") +
      '<tr class="a-pay"><td>' + (r.state === "partial" ? "حداکثر سهم شما (تا پیش از استعلام)" : "سهم تقریبی پرداخت شما") + "</td><td>" + toman(r.pay) + "</td></tr></tbody></table>" +
      (r.state === "partial" ? '<p class="a-mut sm">' + ic("help") + "اگر استعلام بیمه مثبت باشد، سهم شما از این مبلغ کمتر خواهد شد.</p>" : "") +
      '<details class="a-ex"><summary>' + ic("alert") + "هزینه‌های خارج از پوشش (در صورت نیاز)</summary><ul>" + S.excl.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul></details>" +
      '<div class="a-note mut">' + ic("help") + "<div><p><b>این عدد قطعی نیست.</b> مبلغ نهایی به فرانشیز، سقف باقی‌مانده تعهدات بیمه، لوازم مصرفی و هزینه واقعی عمل بستگی دارد. تعرفه و درصدها در این نسخه نمایشی فرضی هستند.</p></div></div>" +
      trust(2) +
      '<div class="a-btns"><button class="a-btn pri" id="reqEst">' + ic("send") + 'ثبت درخواست برآورد دقیق</button><a class="a-btn" href="guide-item.html?id=' + g.g + '">' + ic("book") + "راهنمای این جراحی</a></div></div></section>";
  }

  /* ---- personal ---- */
  var TRACK = [["submitted", "ثبت درخواست"], ["review", "بررسی مدارک توسط پذیرش"], ["coord", "هماهنگی و تماس"], ["confirmed", "تعیین زمان جراحی"]];
  function apptCard(p) {
    var r = p.reqs.filter(function (x) { return x.status !== "canceled"; })[0];
    if (!r) return '<article class="a-pc"><h3>' + ic("cal") + 'نوبت من</h3><p class="a-mut">هنوز درخواست جراحی ثبت نکرده‌اید.</p><a class="a-btn sm" href="patient-panel.html?go=new">ثبت درخواست جراحی</a></article>';
    if (r.status === "confirmed" && r.surgery) {
      return '<article class="a-pc ok"><div class="a-okh">' + ic("check") + "<div><b>نوبت شما تأیید شده است</b><small>لطفاً در تاریخ و ساعت مشخص‌شده در مرکز حاضر شوید.</small></div></div>" +
        '<dl class="a-ap"><div><dt>تاریخ جراحی</dt><dd>' + r.surgery.date + '</dd></div><div class="hi"><dt>ساعت حضور در مرکز</dt><dd>' + r.surgery.time + "</dd></div><div><dt>محل مراجعه</dt><dd>" + esc(r.surgery.place) + "</dd></div><div><dt>پزشک</dt><dd>" + esc(r.surgery.doc) + "</dd></div></dl>" +
        '<p class="a-mut sm">' + ic("help") + "ساعت حضور برای پذیرش و آمادگی است و با ساعت شروع عمل یکی نیست.</p>" +
        '<div class="a-btns"><a class="a-btn pri sm" href="guide.html">' + ic("book") + 'راهنمای قبل از عمل</a><a class="a-btn sm" href="patient-panel.html?go=reqs">جزئیات درخواست</a></div></article>';
    }
    if (r.status === "done") return '<article class="a-pc ok"><div class="a-okh">' + ic("check") + '<div><b>عمل شما انجام شده است</b><small>برای مراقبت در منزل، راهنمای بعد از عمل را ببینید.</small></div></div><div class="a-btns"><a class="a-btn pri sm" href="guide.html">' + ic("book") + 'راهنمای بعد از عمل</a><a class="a-btn sm" href="patient-panel.html?go=reqs">' + (r.survey ? "نظر شما ثبت شده است" : "ثبت نظر درباره خدمات") + "</a></div></article>";
    var idx = TRACK.map(function (t) { return t[0]; }).indexOf(r.status === "docs" ? "review" : r.status);
    return '<article class="a-pc"><h3>' + ic("cal") + "نوبت من</h3><p>" + (r.status === "docs" ? '<b class="a-red">پذیرش منتظر تکمیل مدارک شماست.</b> ' : "") + "درخواست شما در مرحله «" + TRACK[Math.max(0, idx)][1] + "» است؛ <b>زمان مراجعه هنوز تعیین نشده است.</b></p>" +
      '<ol class="a-tl">' + TRACK.map(function (t, i) { return '<li class="' + (i < idx ? "done" : i === idx ? "on" : "") + '"><span>' + (i < idx ? ic("check") : "") + "</span>" + t[1] + "</li>"; }).join("") + "</ol>" +
      '<p class="a-mut sm">' + ic("bell") + "به‌محض تعیین زمان، از طریق پیامک و پنل به شما اطلاع داده می‌شود؛ نیازی به تماس نیست.</p>" +
      '<a class="a-btn sm" href="patient-panel.html?go=reqs">پیگیری در پنل بیمار</a></article>';
  }
  function estCard(p) {
    var e = S.est.filter(function (x) { return x.mobile === p.mobile; }).sort(function (a, b) { return b.at - a.at; })[0];
    if (!e) return '<article class="a-pc"><h3>' + ic("wallet") + 'برآورد هزینه من</h3><p class="a-mut">برای دیدن هزینه تقریبی و ثبت درخواست برآورد دقیق، بیمه و نوع عمل خود را انتخاب کنید.</p><a class="a-btn sm pri" href="#ins">بررسی بیمه و هزینه</a></article>';
    var g = K.find(S.surg, e.surg), head = '<h3>' + ic("wallet") + "برآورد هزینه من</h3><p class=\"a-mut sm\">" + esc(g ? g.n.split(" (")[0] : "") + " · ثبت " + dd(e.at) + "</p>";
    if (e.status === "pending") return '<article class="a-pc">' + head + '<div class="a-st warn">' + ic("clock") + "<div><b>در حال بررسی بیمه</b><p>واحد بیمه در حال بررسی اطلاعات شماست. به‌محض آماده‌شدن نتیجه، اعلان دریافت می‌کنید.</p></div></div></article>";
    if (e.status === "docs") return '<article class="a-pc">' + head + '<div class="a-st bad">' + ic("alert") + "<div><b>اطلاعات کافی نیست</b><p>" + esc(e.need) + '</p></div></div><label class="a-btn sm pri a-up">' + ic("up") + 'بارگذاری مدرک<input type="file" id="estUp" data-id="' + e.id + '" accept="image/jpeg,image/png,application/pdf" hidden></label></article>';
    var a = e.ans;
    return '<article class="a-pc ok">' + head + '<div class="a-st ok">' + ic("check") + "<div><b>برآورد تأییدشده آماده است</b><p>اعتبار تا " + esc(a.valid) + " · تأیید: " + esc(a.by) + "</p></div></div>" +
      '<table class="a-tbl sm"><tbody><tr><td>هزینه کل</td><td>' + toman(a.T) + "</td></tr><tr><td>سهم بیمه پایه</td><td>" + toman(a.base) + "</td></tr><tr><td>سهم بیمه تکمیلی</td><td>" + toman(a.supp) + '</td></tr><tr class="a-pay"><td>سهم پرداخت شما</td><td>' + toman(a.T - a.base - a.supp) + "</td></tr></tbody></table>" +
      (a.note ? '<p class="a-mut sm">' + esc(a.note) + "</p>" : "") + '<p class="a-mut sm">تسویه نهایی ممکن است با هزینه واقعی عمل متفاوت باشد.</p></article>';
  }
  function vMe() {
    var p = K.patient();
    if (!p) return '<section class="a-flow">' + crumb("نوبت و اطلاعات من") + '<div class="a-card a-login"><div><span class="a-bi big">' + ic("lock") + "</span><h2>ورود به حساب بیمار</h2><p class=\"a-mut\">برای مشاهده نوبت، ساعت حضور، وضعیت درخواست و برآورد هزینه شخصی، با شماره موبایل و کد تأیید وارد شوید.</p>" +
      '<a class="a-btn pri" href="' + LOGIN + '">' + ic("phone") + 'ورود با کد تأیید</a><p class="a-mut sm">' + ic("shield") + "اطلاعات شخصی شما بدون ورود امن نمایش داده نمی‌شود.</p></div><img src=\"assets/img/patient-hero.jpg\" alt=\"\"></div></section>";
    return '<section class="a-flow">' + crumb("نوبت و اطلاعات من") + '<p class="a-hello">سلام ' + esc((p.user.name || "").split(" ")[0] || "بیمار گرامی") + " عزیز؛ اطلاعات زیر مستقیم از پرونده شما خوانده شده است.</p>" +
      '<div class="a-pgrid">' + apptCard(p) + estCard(p) + "</div>" +
      '<div class="a-note mut">' + ic("bell") + "<div><p><b>اطلاع‌رسانی خودکار:</b> دریافت برگه پزشک، نتیجه بررسی بیمه، تعیین زمان جراحی، یادآوری روز قبل از مراجعه و آماده‌شدن جواب آزمایش بدون نیاز به تماس، از طریق پیامک و پنل به شما اطلاع داده می‌شود.</p></div></div></section>";
  }

  /* ---- estimate request ---- */
  function createEst(p) {
    var r = K.estimate(S, W.base, W.supp, W.surg); if (!r) return false;
    var open = S.est.filter(function (e) { return e.mobile === p.mobile && e.surg === W.surg && e.status !== "ok"; })[0];
    if (open) { toast("برای این عمل درخواست باز دارید؛ نتیجه در «نوبت من» نمایش داده می‌شود."); return true; }
    S.est.push({ id: ++S.seq, mobile: p.mobile, name: p.user.name || "", base: W.base, supp: W.supp, plan: W.plan, surg: W.surg, snap: { T: r.T, base: r.base, supp: r.supp }, at: Date.now(), status: "pending", need: "", ans: null, log: [{ t: "ثبت درخواست توسط بیمار", at: Date.now() }] });
    S.stats.est++; K.save(S);
    K.notifyPatient(p.mobile, "درخواست برآورد هزینه ثبت شد", "درخواست برآورد هزینه شما در صف واحد بیمه قرار گرفت. نتیجه در پنل و صفحه راهنمای هوشمند نمایش داده می‌شود.");
    return true;
  }
  function reqEst() {
    var p = K.patient();
    if (!p) {
      try { sessionStorage.setItem("kh-ast-pending", "1"); } catch (e) { }
      openM('<h2>' + ic("lock") + 'ورود لازم است</h2><p class="a-mut">برای ثبت درخواست برآورد دقیق، وارد حساب بیمار شوید. اطلاعات بیمه‌ای که انتخاب کرده‌اید حفظ می‌شود و پس از ورود، درخواست خودکار ثبت می‌شود.</p><div class="a-btns"><a class="a-btn pri" href="' + LOGIN + '">ورود با کد تأیید</a><button class="a-btn" data-close>انصراف</button></div>');
      return;
    }
    if (createEst(p)) { toast("درخواست برآورد دقیق ثبت شد و به واحد بیمه ارسال شد."); location.hash = "me"; }
  }

  function bindView(h) {
    if (h === "ins") {
      ["wBase", "wSupp", "wSurg", "wPlan"].forEach(function (id) { $(id).addEventListener("change", function () { W[{ wBase: "base", wSupp: "supp", wSurg: "surg", wPlan: "plan" }[id]] = this.value; keepW(); }); });
      $("wGo").addEventListener("click", function () {
        W.base = $("wBase").value; W.supp = $("wSupp").value; W.surg = $("wSurg").value; W.plan = $("wPlan").value.trim(); keepW();
        if (!W.base || !W.supp || !W.surg) return toast("بیمه پایه، بیمه تکمیلی و نوع جراحی را انتخاب کنید.", true);
        location.hash = view.dataset.next || "result"; view.dataset.next = "";
      });
    }
    if ($("reqEst")) $("reqEst").addEventListener("click", reqEst);
    if ($("estUp")) $("estUp").addEventListener("change", function () {
      var f = this.files[0]; if (!f) return; if (f.size > 10 * 1048576) return toast("حجم فایل بیش از ۱۰ مگابایت است.", true);
      var e = K.find(S.est, +this.dataset.id); e.status = "pending"; e.file = f.name; e.log.push({ t: "بارگذاری مدرک: " + f.name, at: Date.now() }); K.save(S); route(); toast("مدرک ارسال شد؛ درخواست دوباره در صف بررسی است.");
    });
  }

  /* ================= home: personal strip ================= */
  function renderPersonal() {
    var el = $("aMe"), p = K.patient();
    if (!p) { el.innerHTML = '<div class="a-strip">' + ic("lock") + '<p>برای دیدن نوبت، ساعت حضور و برآورد هزینه <b>خودتان</b>، وارد حساب بیمار شوید.</p><a class="a-btn sm pri" href="' + LOGIN + '">ورود</a></div>'; return; }
    var r = p.reqs.filter(function (x) { return x.status !== "canceled"; })[0], e = S.est.filter(function (x) { return x.mobile === p.mobile; }).sort(function (a, b) { return b.at - a.at; })[0];
    var t1 = !r ? "درخواست جراحی ندارید" : r.status === "confirmed" && r.surgery ? "نوبت شما: " + r.surgery.date + " · حضور ساعت " + r.surgery.time : "زمان مراجعه هنوز تعیین نشده است";
    var t2 = !e ? "برآوردی درخواست نکرده‌اید" : e.status === "ok" ? "برآورد تأییدشده آماده است" : e.status === "docs" ? "برآورد: نیاز به تکمیل مدارک" : "برآورد: در حال بررسی بیمه";
    el.innerHTML = '<a class="a-strip me" href="#me"><span class="a-av">' + esc((p.user.name || "؟").charAt(0)) + "</span><div><b>" + esc(p.user.name || "بیمار گرامی") + "</b><small>" + ic("cal") + t1 + "</small><small>" + ic("wallet") + t2 + "</small></div><em>" + ic("back") + "</em></a>";
  }

  /* ================= FAQ ================= */
  var FQ = { cat: "all", q: "" };
  function renderFaq() {
    var list = S.faq.filter(function (f) { return FQ.cat === "all" || f.cat === FQ.cat; });
    if (FQ.q) { var m = K.faqMatch(S, FQ.q); list = list.filter(function (f) { return m.indexOf(f) >= 0; }); }
    $("fCats").innerHTML = CATS.map(function (c) { var n = c[0] === "all" ? S.faq.length : S.faq.filter(function (f) { return f.cat === c[0]; }).length; return '<button data-c="' + c[0] + '"' + (FQ.cat === c[0] ? ' class="on"' : "") + ">" + ic(c[2]) + c[1] + "<i>" + fa(n) + "</i></button>"; }).join("");
    $("fList").innerHTML = list.length ? list.map(function (f) { return faqItem(f, false); }).join("") : '<p class="a-mut">پرسشی با این عبارت پیدا نشد. سؤال خود را در جستجوی بالای صفحه بنویسید تا برای کارشناس ارسال شود.</p>';
    $("fCats").querySelectorAll("[data-c]").forEach(function (b) { b.addEventListener("click", function () { FQ.cat = b.dataset.c; renderFaq(); }); });
  }
  function act(a) { return { ins: ["#ins", "بررسی بیمه من"], cost: ["#ins", "برآورد هزینه"], me: ["#me", "نوبت من"], guide: ["guide.html", "راهنمای جراحی‌ها"] }[a]; }
  function faqItem(f, open) {
    var a = f.act ? act(f.act) : f.link ? [f.link, "مشاهده"] : null;
    return '<details class="a-fq' + (f.urgent ? " urgent" : "") + '"' + (open ? " open" : "") + "><summary>" + (f.urgent ? ic("alert") : ic("help")) + "<span>" + esc(f.q) + "</span>" + ic("chev") + "</summary><div><p>" + esc(f.a) + "</p>" +
      (f.urgent ? '<a class="a-btn sm danger" href="tel:+983155154000">' + ic("phone") + "تماس فوری با مرکز</a> " : "") + (a ? '<a class="a-btn sm" href="' + a[0] + '">' + a[1] + "</a>" : "") +
      '<small class="a-ok">' + ic("check") + "آخرین تأیید: " + dd(f.ok) + " · " + esc(f.unit) + "</small></div></details>";
  }

  /* ================= smart search ================= */
  var res = $("aRes"), qIn = $("aq"), tmr;
  function cardFor(k, p, g) {
    var C = {
      urgent: ['<a class="a-ans urgent" href="tel:+983155154000">', "alert", "علائم هشدار؛ منتظر پاسخ آنلاین نمانید", "در صورت تب، خونریزی، درد شدید یا تنگی نفس فوراً با مرکز (۰۳۱-۵۵۱۵۴۰۰۰) یا اورژانس ۱۱۵ تماس بگیرید.", "تماس فوری"],
      ins: ['<a class="a-ans" href="#ins">', "shield", "بررسی بیمه من", "بیمه پایه، تکمیلی و نوع عمل را انتخاب کنید تا وضعیت قرارداد و پوشش را ببینید.", "شروع بررسی"],
      cost: ['<a class="a-ans" href="#ins" data-pre="' + (g ? g.id : "") + '">', "wallet", g ? "برآورد هزینه " + g.n.split(" (")[0] : "برآورد هزینه جراحی", "سهم بیمه پایه، تکمیلی و سهم تقریبی شما را ببینید.", "محاسبه برآورد"],
      me: ['<a class="a-ans" href="#me">', "cal", "نوبت و ساعت حضور من", "", "مشاهده"],
      guide: ['<a class="a-ans" href="' + (g ? "guide-item.html?id=" + g.g : "guide.html") + '">', "book", g ? "راهنمای قبل و بعد از " + g.n.split(" (")[0] : "راهنمای قبل و بعد از عمل", "آمادگی، ناشتایی، مراقبت‌ها و علائم هشدار؛ دستور پزشک معالج شما اولویت دارد.", "مشاهده راهنما"],
      track: ['<a class="a-ans" href="#me">', "clock", "پیگیری درخواست جراحی", "وضعیت درخواست، مدارک موردنیاز و مرحله فعلی را بدون تماس ببینید.", "پیگیری"],
      lab: ['<a class="a-ans" href="patient-panel.html?go=labs">', "flask", "جواب آزمایش‌های من", "جواب‌های آماده را در پنل بیمار مشاهده و دانلود کنید.", "مشاهده"]
    }[k];
    if (k === "me") {
      var r = p && p.reqs.filter(function (x) { return x.status !== "canceled"; })[0];
      C[3] = !p ? "برای دیدن نوبت خودتان وارد حساب شوید؛ ساعت حضور ثبت‌شده پذیرش نمایش داده می‌شود." : r && r.status === "confirmed" && r.surgery ? "ساعت حضور ثبت‌شده شما: " + r.surgery.time + " · " + r.surgery.date : "زمان مراجعه شما هنوز تعیین نشده است؛ پس از قطعی شدن، پیامک دریافت می‌کنید.";
    }
    return C[0] + '<span class="a-bi">' + ic(C[1]) + "</span><div><b>" + C[2] + "</b><p>" + C[3] + "</p></div><em>" + C[4] + ic("back") + "</em></a>";
  }
  function search(q, count) {
    q = (q || "").trim();
    if (q.length < 2) { res.hidden = true; return; }
    var ints = K.intents(q), faqs = K.faqMatch(S, q), g = K.surgMatch(S, q)[0], p = K.patient();
    if (g && ints.indexOf("cost") < 0 && ints.indexOf("guide") < 0) ints.push("guide");
    var cards = ints.map(function (k) { return cardFor(k, p, g); }).join("");
    var ok = !!(cards || faqs.length);
    res.hidden = false;
    res.innerHTML = '<div class="a-rh"><b>' + (ok ? "پاسخ‌های مرتبط با «" + esc(q) + "»" : "پاسخ مستقیمی پیدا نشد") + '</b><button class="a-x" id="rClose" aria-label="بستن">' + ic("x") + "</button></div>" +
      (cards ? '<div class="a-ans-g">' + cards + "</div>" : "") +
      (faqs.length ? '<div class="a-fqs">' + faqs.map(function (f, i) { return faqItem(f, i === 0); }).join("") + "</div>" : "") +
      '<div class="a-ask"><p>' + (ok ? "جواب سؤالتان را پیدا نکردید؟" : "سؤال شما برای کارشناس مرکز ارسال می‌شود تا پاسخ دهد و به پرسش‌های پرتکرار اضافه شود.") + "</p>" +
      (p ? "" : '<input id="askM" inputmode="numeric" maxlength="11" placeholder="شماره موبایل برای دریافت پاسخ (اختیاری)">') + '<button class="a-btn sm" id="askB">' + ic("send") + "ارسال سؤال برای کارشناس</button></div>";
    $("rClose").addEventListener("click", function () { res.hidden = true; qIn.value = ""; });
    res.querySelectorAll("[data-pre]").forEach(function (a) { a.addEventListener("click", function () { if (a.dataset.pre) { W.surg = a.dataset.pre; keepW(); } view.dataset.next = "cost"; }); });
    $("askB").addEventListener("click", function () {
      var m = p ? p.mobile : String($("askM").value || "").replace(/[۰-۹]/g, function (d) { return "۰۱۲۳۴۵۶۷۸۹".indexOf(d); }).replace(/\D/g, "");
      if (m && !/^09\d{9}$/.test(m)) return toast("شماره موبایل درست نیست.", true);
      S = K.load(); S.unans.push({ id: ++S.seq, q: q, mobile: m, at: Date.now(), done: false }); K.save(S);
      toast(m ? "سؤال شما ثبت شد؛ پاسخ کارشناس پیامک می‌شود." : "سؤال شما برای کارشناس ثبت شد.");
      $("askB").disabled = true; $("askB").textContent = "ارسال شد";
    });
    if (count) { S = K.load(); S.stats.q++; if (ok) S.stats.ok++; K.save(S); }
  }
  qIn.addEventListener("input", function () { clearTimeout(tmr); tmr = setTimeout(function () { search(qIn.value, false); }, 220); });
  qIn.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); search(qIn.value, true); } });
  document.querySelectorAll("[data-q]").forEach(function (b) { b.addEventListener("click", function () { qIn.value = b.dataset.q; search(b.dataset.q, true); qIn.focus(); }); });
  $("fq").addEventListener("input", function () { FQ.q = this.value.trim(); renderFaq(); });
  document.querySelectorAll("[data-flow]").forEach(function (a) { a.addEventListener("click", function () { if (a.dataset.flow === "cost") view.dataset.next = "cost"; }); });

  /* ---- modal ---- */
  function openM(html) { $("aM").hidden = false; $("aMc").innerHTML = html; }
  $("aM").addEventListener("click", function (e) { if (e.target.closest("[data-close]")) $("aM").hidden = true; });

  /* after login: auto-file the pending estimate request */
  (function () {
    var p = K.patient(), pend = null; try { pend = sessionStorage.getItem("kh-ast-pending"); } catch (e) { }
    if (p && pend && W.base && W.supp && W.surg) { try { sessionStorage.removeItem("kh-ast-pending"); } catch (e) { } if (createEst(p)) setTimeout(function () { toast("درخواست برآورد دقیق شما ثبت شد."); }, 300); }
    var q = new URLSearchParams(location.search).get("q"); if (q) { qIn.value = q; setTimeout(function () { search(q, true); }, 50); }
  })();
  addEventListener("storage", function (e) { if (e.key === K.KEY || e.key === K.PKEY) route(); });
  route();
})();
