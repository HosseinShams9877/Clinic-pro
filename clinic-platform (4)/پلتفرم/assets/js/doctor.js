/* Doctor profile page — doctor.html?id=<doctor id>. Loaded BEFORE main.js. */
(function () {
  "use strict";
  var html = document.documentElement;
  var DOCS = window.DOCTORS || [], PROF = window.DOCTOR_PROFILES || {}, CATS = window.DOCTOR_CATS || {};
  var id = new URLSearchParams(location.search).get("id");
  var doc = DOCS.filter(function (d) { return d.id === id; })[0] || DOCS.filter(function (d) { return PROF[d.id]; })[0];
  var P = PROF[doc.id] || {};
  var $ = function (s) { return document.getElementById(s); };
  var DIG = { fa: "۰۱۲۳۴۵۶۷۸۹", ar: "٠١٢٣٤٥٦٧٨٩" };

  var T = {
    fa: { days: ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"], closed: "تعطیل", member: "عضو کادر پزشکی مرکز جراحی فوق تخصصی دکتر خیرخواه · کاشان", soon: "سوابق کامل تحصیلی و حرفه‌ای پس از تأیید پزشک تکمیل می‌شود.", toastRev: "سپاس! نظر شما پس از تأیید منتشر می‌شود.", toastVid: "ویدیوی معرفی پزشک به‌زودی اضافه می‌شود.", pickStar: "لطفاً امتیاز را انتخاب کنید.",
      faq: [["چطور از {n} نوبت بگیرم؟", "از طریق دکمه «رزرو نوبت» یا تماس با پذیرش مرکز به شماره ۰۳۱-۵۵۱۵۴۰۰۰، شنبه تا پنجشنبه از ساعت ۷:۳۰ تا ۲۰:۰۰."],
            ["برای ویزیت یا عمل چه مدارکی همراه داشته باشم؟", "کارت ملی یا کارت شناسایی معتبر عکس‌دار، دستور بستری پزشک (در صورت عمل)، مدارک و سوابق پزشکی و فهرست داروهای مصرفی."],
            ["اعمال جراحی در کجای مرکز انجام می‌شود؟", "در اتاق‌های عمل {f} مرکز؛ با دیواره استیل، کف‌پوش ژئوفلور و تهویه مرکزی با آلودگی صفر."],
            ["اگر خارج از کاشان یا ایران زندگی کنم چه کنم؟", "می‌توانید مدارک پزشکی خود را به‌صورت آنلاین ارسال کنید تا پیش از سفر بررسی و زمان مراجعه هماهنگ شود."]] },
    en: { days: ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], closed: "Closed", member: "Medical staff, Dr. Kheirkhah Super-Specialty Surgical Center · Kashan", soon: "Full education and career history will be added once confirmed by the doctor.", toastRev: "Thank you! Your review will appear after approval.", toastVid: "The doctor's video introduction is coming soon.", pickStar: "Please choose a rating.",
      faq: [["How do I book an appointment with {n}?", "Use the “Book appointment” button or call admissions on +98 31 5515 4000, Saturday to Thursday, 07:30–20:00."],
            ["What should I bring to a visit or surgery?", "National ID or valid photo ID, your doctor's admission order (for surgery), medical records and a list of your current medications."],
            ["Where are operations performed?", "In the center's {f} operating rooms, with stainless-steel walls, Geofloor flooring and zero-contamination central ventilation."],
            ["I live outside Kashan or abroad — what should I do?", "You can upload your medical records online so they are reviewed and your visit is scheduled before you travel."]] },
    ar: { days: ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"], closed: "مغلق", member: "عضو الكادر الطبي في مركز الدكتور خيرخواه للجراحة فوق التخصصية · كاشان", soon: "سيُستكمل السجل التعليمي والمهني الكامل بعد تأكيد الطبيب.", toastRev: "شكرًا! سيُنشر تقييمك بعد المراجعة.", toastVid: "سيُضاف فيديو تعريفي بالطبيب قريبًا.", pickStar: "يرجى اختيار التقييم.",
      faq: [["كيف أحجز موعدًا مع {n}؟", "عبر زر «حجز موعد» أو بالاتصال بالاستقبال على ‎+98 31 5515 4000‎ من السبت إلى الخميس، ٧:٣٠–٢٠:٠٠."],
            ["ما المستندات التي أحضرها للزيارة أو العملية؟", "البطاقة الوطنية أو هوية سارية بصورة، أمر الدخول من الطبيب (للعمليات)، السجلات الطبية وقائمة الأدوية الحالية."],
            ["أين تُجرى العمليات الجراحية؟", "في غرف عمليات {f} بالمركز، بجدران فولاذية وأرضيات Geofloor وتهوية مركزية بتلوث صفري."],
            ["أعيش خارج كاشان أو خارج إيران، ماذا أفعل؟", "يمكنك رفع ملفاتك الطبية عبر الإنترنت لمراجعتها وتحديد موعد زيارتك قبل السفر."]] }
  };
  function L() { return html.lang in T ? html.lang : "fa"; }
  function num(s, l) { var d = DIG[l]; return d ? String(s).replace(/\d/g, function (x) { return d[x]; }) : String(s); }
  function bare(name) { return name.replace(/^(دکتر|د\.|Dr\.)\s*/, ""); }
  function tx(o, l) { return o ? (o[l] || o.fa) : ""; }

  /* static images */
  $("pHero").style.backgroundImage = 'url("' + (P.hero || doc.photo) + '")';
  if (P.heroPos) $("pHero").style.backgroundPosition = P.heroPos;
  $("pPhoto").src = doc.photo || P.hero;
  $("pVideoImg").src = P.hero || doc.photo;

  function render() {
    var l = L(), t = T[l];
    document.title = doc.name[l] + " | " + (l === "en" ? "Dr. Kheirkhah Surgical Center" : l === "ar" ? "مركز الدكتور خيرخواه" : "مرکز جراحی فوق تخصصی دکتر خیرخواه");
    $("pCrumb").textContent = doc.name[l];
    $("pName").textContent = bare(doc.name[l]);
    $("pName2").textContent = doc.name[l];
    $("pTag").textContent = tx(P.tag, l) || doc.spec[l];
    $("pLead").textContent = tx(P.lead, l) || doc.spec[l];
    $("pCat").textContent = doc.cat ? CATS[doc.cat][l] : doc.spec[l];
    $("pFloor").textContent = tx(P.floor, l);
    $("pAbout").textContent = tx(P.about, l);
    $("pPhoto").alt = doc.name[l];
    $("pHero").setAttribute("aria-label", doc.name[l]);

    $("pServices").innerHTML = (P.services || []).map(function (s, k) {
      var v = s[l] || s.fa;
      return '<article class="psv" style="--k:' + k + '"><span class="psv-i"><svg><use href="#' + s.i + '"/></svg></span><b>' + v[0] + "</b><small>" + v[1] + "</small></article>";
    }).join("");

    var creds = (P.creds || []).map(function (c) { return { t: c[l] || c.fa, i: "i-award" }; });
    creds.push({ t: t.member, i: "i-building" });
    $("pCreds").innerHTML = creds.map(function (c) {
      return '<li><span class="tl-i"><svg><use href="#' + c.i + '"/></svg></span><b>' + c.t + "</b></li>";
    }).join("") + '<li class="tl-soon"><span class="tl-i"><svg><use href="#i-clock"/></svg></span><span>' + t.soon + "</span></li>";

    var f = tx(P.floor, l);
    $("pFaq").innerHTML = t.faq.map(function (q, k) {
      return "<details" + (k === 0 ? " open" : "") + "><summary><span>" + q[0].replace("{n}", doc.name[l]) + '</span><svg><use href="#i-plus"/></svg></summary><p>' + q[1].replace("{f}", f) + "</p></details>";
    }).join("");

    /* days — center hours (Sat–Thu 07:30–20:00), today highlighted */
    var now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tehran" })), today = (now.getDay() + 1) % 7; // JS 6=Sat → 0
    $("pDays").innerHTML = t.days.map(function (d, k) {
      var open = k < 6;
      return '<li class="' + (open ? "" : "off") + (k === today ? " today" : "") + '"><span><i></i>' + d + "</span><b dir=\"ltr\">" + (open ? num("07:30 – 20:00", l) : t.closed) + "</b></li>";
    }).join("");

    /* related doctors (same category, with photo first) */
    var rel = DOCS.filter(function (d) { return d.id !== doc.id && d.cat && d.cat === doc.cat; })
      .sort(function (a, b) { return (b.photo ? 1 : 0) - (a.photo ? 1 : 0); }).slice(0, 5);
    $("pRelWrap").hidden = !rel.length;
    $("pRel").innerHTML = rel.map(function (d) {
      var href = PROF[d.id] ? "doctor.html?id=" + d.id : "doctors.html";
      var ph = d.photo ? '<img src="' + d.photo + '" alt="' + d.name[l] + '" loading="lazy">'
        : '<div class="mono"><svg class="mono-arch" viewBox="0 0 100 120"><path d="M8 118V52C8 26 30 10 50 2c20 8 42 24 42 50v66"/></svg><b class="mono-l">' + bare(d.name[l]).split(/\s+/).pop().charAt(0) + "</b></div>";
      return '<a class="doc seen" href="' + href + '"><div class="doc-ph">' + ph + '</div><div class="doc-b"><h3>' + d.name[l] + "</h3><p>" + d.spec[l] + '</p><span class="doc-btn"><svg><use href="#i-user"/></svg><span>' + ({ fa: "مشاهده پروفایل", en: "View profile", ar: "عرض الملف" })[l] + "</span></span></div></a>";
    }).join("");
  }

  /* tabs: smooth scroll + scrollspy */
  var tabs = Array.prototype.slice.call(document.querySelectorAll("#pTabs a"));
  tabs.forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      var el = document.querySelector(a.getAttribute("href"));
      window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - 170, behavior: "smooth" });
    });
  });
  if ("IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (en) {
      en.forEach(function (x) {
        if (x.isIntersecting) tabs.forEach(function (a) { a.classList.toggle("on", a.getAttribute("href") === "#" + x.target.id); });
      });
    }, { rootMargin: "-35% 0px -55% 0px" });
    tabs.forEach(function (a) { spy.observe(document.querySelector(a.getAttribute("href"))); });
  }

  /* toast */
  var tt;
  function toast(m) { var el = $("pToast"); el.textContent = m; el.classList.add("in"); clearTimeout(tt); tt = setTimeout(function () { el.classList.remove("in"); }, 3200); }
  $("pVideo").addEventListener("click", function () { toast(T[L()].toastVid); });

  /* rating form (demo — no backend) */
  var rating = 0, stars = Array.prototype.slice.call(document.querySelectorAll("#rate button"));
  stars.forEach(function (b) {
    b.addEventListener("click", function () { rating = +b.dataset.v; stars.forEach(function (s) { s.classList.toggle("on", +s.dataset.v <= rating); }); });
    b.addEventListener("mouseenter", function () { stars.forEach(function (s) { s.classList.toggle("hov", +s.dataset.v <= +b.dataset.v); }); });
    b.addEventListener("mouseleave", function () { stars.forEach(function (s) { s.classList.remove("hov"); }); });
  });
  $("revForm").addEventListener("submit", function (e) {
    e.preventDefault();
    if (!rating) { toast(T[L()].pickStar); return; }
    toast(T[L()].toastRev); this.reset(); rating = 0; stars.forEach(function (s) { s.classList.remove("on"); });
  });

  /* hero parallax */
  var hero = $("pHero");
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches && window.matchMedia("(min-width: 961px)").matches) {
    addEventListener("scroll", function () { if (scrollY < 900) hero.style.setProperty("--py", (scrollY * 0.18).toFixed(1) + "px"); }, { passive: true });
  }

  document.addEventListener("kh:lang", render);
  render();
})();
