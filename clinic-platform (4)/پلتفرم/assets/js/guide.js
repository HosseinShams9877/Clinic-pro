/* Patient guide — list (guide.html) & per-surgery page (guide-item.html?id=…). Loaded before main.js. */
(function () {
  "use strict";
  var html = document.documentElement, page = document.body.dataset.page;
  var S = window.GUIDE_SURGERIES || [], C = window.GUIDE_COMMON || {}, CATS = window.GUIDE_CATS || [];
  var $ = function (s) { return document.getElementById(s); };
  var UI = {
    fa: { j1: "آمادگی پیش از عمل", j2: "روز جراحی", j3: "مراقبت بعد از عمل", lTitle: "راهنمای کامل قبل و بعد از عمل", lSub: "عمل خود را انتخاب کنید و با نکات آموزشی و مراقبت‌های لازم، با آمادگی و اطمینان بیشتری مسیر درمان را طی کنید.",
      ph: "جستجوی نوع عمل یا نام جراحی…", tips: "نکات قبل و بعد از عمل", empty: "موردی پیدا نشد. با پذیرش تماس بگیرید.",
      iSub: "راهنمای کامل قبل و بعد از عمل", iLead: "ویدیوهای آموزشی، نکات مهم، چک‌لیست روز عمل و مراقبت‌های بعد از عمل را در این صفحه ببینید.", print: "چاپ راهنما",
      tPre: "قبل از عمل", tPost: "بعد از عمل", note: "این راهنما آموزشی و عمومی است؛ دستورات اختصاصی جراح و متخصص بیهوشی شما همیشه مقدم است.",
      vPre: "ویدیوهای آموزشی قبل از عمل", vPost: "ویدیوهای آموزشی بعد از عمل", hPre: "نکات مهم قبل از عمل", hPost: "مراقبت‌های بعد از عمل",
      spec: "نکات ویژه این عمل", chk: "چک‌لیست شخصی روز عمل", done: "{n} از {t} انجام شد",
      warnT: "این علائم را فوراً اطلاع دهید", warnBtn: "تماس با مرکز ۰۳۱-۵۵۱۵۴۰۰۰", audioT: "فایل‌های صوتی و متن‌های آموزشی", soon: "به‌زودی",
      more: "راهنمای سایر عمل‌ها", toast: "این محتوا در حال تولید است و به‌زودی اضافه می‌شود." },
    en: { j1: "Getting ready", j2: "Surgery day", j3: "Recovery & care", lTitle: "Your complete before & after surgery guide", lSub: "Choose your operation and get ready with clear tips and care instructions — so you go through treatment prepared and confident.",
      ph: "Search an operation…", tips: "Before & after tips", empty: "Nothing found. Please call admissions.",
      iSub: "Complete before & after surgery guide", iLead: "Educational videos, key tips, a day-of-surgery checklist and aftercare — all on one page.", print: "Print guide",
      tPre: "Before surgery", tPost: "After surgery", note: "This guide is general education; your own surgeon's and anesthesiologist's instructions always come first.",
      vPre: "Pre-operative videos", vPost: "Post-operative videos", hPre: "Key tips before surgery", hPost: "Care after surgery",
      spec: "Specific to this operation", chk: "My day-of-surgery checklist", done: "{n} of {t} done",
      warnT: "Report these signs right away", warnBtn: "Call the center +98 31 5515 4000", audioT: "Audio & reading material", soon: "Soon",
      more: "Guides for other operations", toast: "This content is being produced and will be added soon." },
    ar: { j1: "الاستعداد قبل العملية", j2: "يوم الجراحة", j3: "الرعاية بعد العملية", lTitle: "دليلك الكامل قبل العملية وبعدها", lSub: "اختر عمليتك واستعد بنصائح واضحة وتعليمات الرعاية، لتخوض رحلة العلاج باستعداد وطمأنينة أكبر.",
      ph: "ابحث عن نوع العملية…", tips: "نصائح قبل العملية وبعدها", empty: "لا توجد نتائج. يرجى الاتصال بالاستقبال.",
      iSub: "دليل كامل قبل العملية وبعدها", iLead: "فيديوهات تعليمية ونصائح مهمة وقائمة تحقق ليوم العملية والرعاية بعدها في صفحة واحدة.", print: "طباعة الدليل",
      tPre: "قبل العملية", tPost: "بعد العملية", note: "هذا الدليل تثقيفي عام؛ تعليمات جرّاحك وطبيب التخدير الخاصة بك هي الأولى دائمًا.",
      vPre: "فيديوهات ما قبل العملية", vPost: "فيديوهات ما بعد العملية", hPre: "نصائح مهمة قبل العملية", hPost: "الرعاية بعد العملية",
      spec: "خاص بهذه العملية", chk: "قائمة التحقق ليوم العملية", done: "تم {n} من {t}",
      warnT: "أبلغ فورًا عن هذه العلامات", warnBtn: "اتصل بالمركز ‎+98 31 5515 4000", audioT: "ملفات صوتية ونصوص تعليمية", soon: "قريبًا",
      more: "أدلة عمليات أخرى", toast: "هذا المحتوى قيد الإعداد وسيُضاف قريبًا." }
  };
  var DIG = { fa: "۰۱۲۳۴۵۶۷۸۹", ar: "٠١٢٣٤٥٦٧٨٩" };
  function L() { return html.lang in UI ? html.lang : "fa"; }
  function num(n, l) { var d = DIG[l]; return d ? String(n).replace(/\d/g, function (x) { return d[x]; }) : String(n); }
  function media(sx) {
    return sx.img ? '<img src="' + sx.img + '" alt="" loading="lazy">'
      : '<span class="si-mono"><svg><use href="#' + (sx.cat === "eye" ? "i-eye" : sx.cat === "ent" ? "i-ear" : "i-scalpel") + '"/></svg></span>';
  }
  function card(sx, l) {
    return '<a class="gsc" href="guide-item.html?id=' + sx.id + '"><div class="gc-m">' + media(sx) + '</div><div class="gc-b"><h3>' + sx.n[l] + "</h3><p>" + sx.d[l] +
      '</p><span class="gc-go"><svg class="arr"><use href="#i-arrow"/></svg></span></div></a>';
  }
  var tt;
  function toast(m) { var el = $("pToast"); el.textContent = m; el.classList.add("in"); clearTimeout(tt); tt = setTimeout(function () { el.classList.remove("in"); }, 3000); }
  function statics(l) { document.querySelectorAll("[data-g]").forEach(function (el) { el.textContent = UI[l][el.dataset.g]; }); }

  /* ================= LIST ================= */
  if (page === "list") {
    var cat = "all", q = "";
    var chips = $("gChips");
    CATS.forEach(function (c) {
      var b = document.createElement("button"); b.type = "button"; b.className = "dchip" + (c.id === "all" ? " on" : ""); b.dataset.cat = c.id;
      b.addEventListener("click", function () { cat = c.id; chips.querySelectorAll(".dchip").forEach(function (x) { x.classList.toggle("on", x === b); }); draw(); });
      chips.appendChild(b);
    });
    var norm = function (s) { return (s || "").toLowerCase().replace(/[يى]/g, "ی").replace(/ك/g, "ک").replace(/‌/g, "").trim(); };
    function draw() {
      var l = L(), nq = norm(q);
      var list = S.filter(function (x) { return (cat === "all" || x.cat === cat) && (!nq || norm(x.n.fa + x.n.en + x.n.ar + x.d.fa + x.d.en + x.d.ar).indexOf(nq) > -1); });
      $("gGrid").innerHTML = list.map(function (x, k) { return card(x, l).replace('class="gsc"', 'class="gsc" style="--k:' + k + '"'); }).join("");
      $("gEmpty").hidden = list.length > 0; $("gEmpty").textContent = UI[l].empty;
    }
    $("gSearch").addEventListener("input", function () { q = this.value; draw(); });
    var render = function () {
      var l = L(); statics(l); $("gSearch").placeholder = UI[l].ph;
      chips.querySelectorAll(".dchip").forEach(function (b) { b.textContent = CATS.filter(function (c) { return c.id === b.dataset.cat; })[0].n[l]; });
      draw();
    };
    var qq = new URLSearchParams(location.search).get("q"); if (qq) { $("gSearch").value = qq; q = qq; }
    document.addEventListener("kh:lang", render); render();
    return;
  }

  /* ================= ITEM ================= */
  var id = new URLSearchParams(location.search).get("id");
  var sx = S.filter(function (x) { return x.id === id; })[0] || S[0];
  var tab = location.hash === "#post" ? "post" : "pre";
  var KEY = "kh-chk-" + sx.id, done = {};
  try { done = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) {}

  $("giImg").src = sx.hero || "assets/img/guide/hero.jpg";
  if (!sx.img) $("giImg").src = "assets/img/guide/hero.jpg";

  document.querySelectorAll(".gtab").forEach(function (b) {
    b.addEventListener("click", function () { tab = b.dataset.tab; history.replaceState(null, "", "#" + tab); draw(true); });
  });

  function draw(anim) {
    var l = L(), u = UI[l];
    statics(l);
    document.title = sx.n[l] + " | " + u.iSub;
    $("giCrumb").textContent = sx.n[l]; $("giName").textContent = sx.n[l]; $("giImg").alt = sx.n[l];
    document.querySelectorAll(".gtab").forEach(function (b) { b.classList.toggle("on", b.dataset.tab === tab); });

    $("hVid").textContent = tab === "pre" ? u.vPre : u.vPost;
    $("gVids").innerHTML = C.videos[tab].map(function (v) {
      return '<button type="button" class="gvid"><div class="gv-m"><img src="' + v.img + '" alt="" loading="lazy"><span class="gv-play"><svg><use href="#i-play"/></svg></span><span class="gv-soon">' + u.soon +
        '</span></div><div class="gv-b"><b>' + v.n[l] + "</b><small>" + v.d[l] + "</small></div></button>";
    }).join("");

    $("hTips").textContent = tab === "pre" ? u.hPre : u.hPost;
    $("gTips").innerHTML = C[tab].map(function (x, k) {
      return '<article class="gtip" style="--k:' + k + '"><span class="gt-i"><svg><use href="#' + x.i + '"/></svg></span><b>' + x.n[l] + "</b><p>" + x.d[l] + "</p></article>";
    }).join("");
    var sp = sx[tab] || [];
    $("gSpec").innerHTML = sp.length ? '<li class="gs-h"><svg><use href="#i-plus"/></svg>' + u.spec + "</li>" + sp.map(function (x) { return "<li><i></i>" + x[l] + "</li>"; }).join("") : "";
    $("gSpec").hidden = !sp.length;

    $("gCheckBox").hidden = tab !== "pre";
    $("gCheck").innerHTML = C.checklist.map(function (x, k) {
      return '<li><label><input type="checkbox" data-k="' + k + '"' + (done[k] ? " checked" : "") + '><span class="box"><svg><use href="#i-check"/></svg></span><span>' + x[l] + "</span></label></li>";
    }).join("");
    prog();
    $("gWarnBox").hidden = tab !== "post";
    $("gWarn").innerHTML = C.warn.map(function (x) { return "<li><svg><use href=\"#i-alert\"/></svg>" + x[l] + "</li>"; }).join("");

    $("gAudio").innerHTML = C.audio.map(function (a, k) {
      var title = k === 0 ? a[l] + " · " + sx.n[l] : a[l];
      return '<button type="button" class="gaud"><span class="ga-t"><svg><use href="#i-mic"/></svg>' + title + '</span><span class="ga-row"><span class="ga-play"><svg><use href="#i-play"/></svg></span><span class="ga-wave">' +
        new Array(26).join("<i></i>") + '</span><span class="ga-soon">' + u.soon + "</span></span></button>";
    }).join("");

    $("gMore").innerHTML = S.filter(function (x) { return x.id !== sx.id; }).slice(0, 4).map(function (x) { return card(x, l); }).join("");

    document.querySelectorAll(".gvid,.gaud").forEach(function (b) { b.addEventListener("click", function () { toast(u.toast); }); });
    document.querySelectorAll("#gCheck input").forEach(function (c) {
      c.addEventListener("change", function () {
        done[c.dataset.k] = c.checked; try { localStorage.setItem(KEY, JSON.stringify(done)); } catch (e) {} prog();
      });
    });
    if (anim) document.querySelectorAll(".gbox").forEach(function (b) { b.classList.remove("swap"); void b.offsetWidth; b.classList.add("swap"); });
  }
  function prog() {
    var l = L(), t = C.checklist.length, n = 0;
    for (var k in done) if (done[k]) n++;
    $("gProg").textContent = UI[l].done.replace("{n}", num(n, l)).replace("{t}", num(t, l));
    $("gProg").classList.toggle("full", n === t);
  }
  document.addEventListener("kh:lang", function () { draw(false); });
  draw(false);
})();
