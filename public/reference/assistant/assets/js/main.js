(function () {
  "use strict";
  var html = document.documentElement;
  var DIR = { fa: "rtl", ar: "rtl", en: "ltr" };

  /* ---------- i18n: Persian is captured from the DOM on load ---------- */
  var TKEY = html.getAttribute("data-title-key") || "meta.title";
  var fa = {}; fa[TKEY] = document.title;
  document.querySelectorAll("[data-i18n]").forEach(function (el) { fa[el.dataset.i18n] = el.innerHTML; });
  document.querySelectorAll("[data-i18n-ph]").forEach(function (el) { fa[el.dataset.i18nPh] = el.placeholder; });
  var dict = { fa: fa, en: (window.I18N || {}).en || {}, ar: (window.I18N || {}).ar || {} };

  function setLang(lang) {
    if (!dict[lang]) lang = "fa";
    var d = dict[lang];
    html.lang = lang;
    html.dir = DIR[lang];
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var v = d[el.dataset.i18n]; if (v != null) el.innerHTML = v;
    });
    document.querySelectorAll("[data-i18n-ph]").forEach(function (el) {
      var v = d[el.dataset.i18nPh]; if (v != null) el.placeholder = v;
    });
    if (d[TKEY]) document.title = d[TKEY];
    document.getElementById("langLabel").textContent = lang.toUpperCase();
    document.querySelectorAll("[data-lang]").forEach(function (b) { b.classList.toggle("on", b.dataset.lang === lang); });
    try { localStorage.setItem("kh-lang", lang); } catch (e) {}
    document.dispatchEvent(new CustomEvent("kh:lang", { detail: lang }));
  }

  var start = new URLSearchParams(location.search).get("lang");
  if (!start) { try { start = localStorage.getItem("kh-lang"); } catch (e) {} }
  if (start && start !== "fa") setLang(start); else setLang("fa");

  /* ---------- Language dropdown ---------- */
  var lang = document.getElementById("lang");
  var langBtn = lang.querySelector(".lang-btn");
  langBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    var open = lang.classList.toggle("open");
    langBtn.setAttribute("aria-expanded", open);
  });
  lang.querySelectorAll("[data-lang]").forEach(function (b) {
    b.addEventListener("click", function () { setLang(b.dataset.lang); lang.classList.remove("open"); });
  });
  document.addEventListener("click", function () { lang.classList.remove("open"); menu.classList.remove("open"); });

  /* ---------- Mobile menu ---------- */
  var menu = document.getElementById("menu");
  document.getElementById("burger").addEventListener("click", function (e) { e.stopPropagation(); menu.classList.toggle("open"); });
  menu.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { menu.classList.remove("open"); }); });
  menu.querySelectorAll(".sub-tg").forEach(function (b) {
    b.addEventListener("click", function (e) {
      e.stopPropagation();
      var li = b.parentNode, o = li.classList.toggle("open");
      b.setAttribute("aria-expanded", o);
    });
  });

  /* ---------- Sticky header ---------- */
  var header = document.querySelector(".site-header");
  window.addEventListener("scroll", function () { header.classList.toggle("stuck", window.scrollY > 420); }, { passive: true });

  /* ---------- Active menu link on scroll ----------
     A link is active only while its own section crosses the middle of the screen.
     Outside any linked section (hero, other blocks) only «خانه» is active at the very top. */
  var links = Array.prototype.slice.call(menu.querySelectorAll('a[href^="#"]'));
  var spyT = links.map(function (l) { var id = l.getAttribute("href").slice(1); return { l: l, el: id && id !== "top" ? document.getElementById(id) : null }; });
  function spy() {
    var mid = window.innerHeight * 0.45, cur = null;
    spyT.forEach(function (t) { if (!t.el) return; var r = t.el.getBoundingClientRect(); if (r.top <= mid && r.bottom > mid) cur = t.l; });
    if (!cur && window.scrollY < 300) spyT.forEach(function (t) { if (t.l.getAttribute("href") === "#top") cur = t.l; });
    links.forEach(function (l) { l.classList.toggle("active", l === cur); });
  }
  window.addEventListener("scroll", spy, { passive: true });
  window.addEventListener("resize", spy);
  spy();
  if ("IntersectionObserver" in window) {
    /* ---------- Reveal on scroll ---------- */
    var items = document.querySelectorAll(".stat,.help,.svc,.std-media,.std-text,.floor,.dr,.care,.gcard,.intl-steps li,.faq details,.contact-card");
    var rv = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); rv.unobserve(en.target); } });
    }, { threshold: 0.12 });
    items.forEach(function (el, i) {
      el.classList.add("reveal");
      el.style.transitionDelay = (i % 4) * 70 + "ms";
      rv.observe(el);
    });
  }

  /* ---------- Doctor chips (UI state for the demo) ---------- */
  document.querySelectorAll(".chip").forEach(function (c) {
    c.addEventListener("click", function () {
      document.querySelectorAll(".chip").forEach(function (x) { x.classList.remove("on"); });
      c.classList.add("on");
    });
  });
})();

/* =========================================================
   LIVING LAYER
   ========================================================= */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;
  var html = document.documentElement;

  /* ---------- scroll progress ---------- */
  var bar = document.querySelector(".scroll-progress");
  function onScroll() {
    var max = document.documentElement.scrollHeight - innerHeight;
    bar.style.setProperty("--sp", max > 0 ? (scrollY / max).toFixed(4) : 0);
  }
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* ---------- digits helpers (fa / ar / en) ---------- */
  var SETS = { fa: "۰۱۲۳۴۵۶۷۸۹", ar: "٠١٢٣٤٥٦٧٨٩" };
  function toLatin(s) {
    return s.replace(/[۰-۹]/g, function (d) { return SETS.fa.indexOf(d); })
            .replace(/[٠-٩]/g, function (d) { return SETS.ar.indexOf(d); });
  }
  function localize(n) {
    var set = SETS[html.lang]; var s = String(n);
    return set ? s.replace(/\d/g, function (d) { return set[d]; }) : s;
  }

  /* ---------- count-up numbers ---------- */
  function countUp(el) {
    if (reduce) return;
    var raw = el.textContent.trim(), latin = toLatin(raw);
    var m = latin.match(/\d+/); if (!m) return;
    var target = +m[0], pre = raw.slice(0, latin.indexOf(m[0])), post = raw.slice(latin.indexOf(m[0]) + m[0].length);
    var from = target > 1000 ? target - 40 : 0, t0 = null, dur = target > 1000 ? 1400 : 1600;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = pre + localize(Math.round(from + (target - from) * e)) + post;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { countUp(x.target); co.unobserve(x.target); } });
    }, { threshold: .6 });
    document.querySelectorAll("[data-count]").forEach(function (el) { co.observe(el); });
  }

  /* ---------- live open / closed status (Tehran time) ---------- */
  var CLOSED = { fa: "پذیرش هم‌اکنون بسته است", en: "Admissions closed now", ar: "الاستقبال مغلق الآن" };
  var OPEN = { fa: "پذیرش هم‌اکنون باز است", en: "Admissions open now", ar: "الاستقبال مفتوح الآن" };
  function updateOpen() {
    var el = document.getElementById("openState"); if (!el) return;
    var now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tehran" }));
    var mins = now.getHours() * 60 + now.getMinutes(), day = now.getDay(); // 5 = Friday
    var open = day !== 5 && mins >= 450 && mins < 1200;
    var lang = html.lang in OPEN ? html.lang : "fa";
    el.textContent = (open ? OPEN : CLOSED)[lang];
    var dot = document.querySelector(".live-dot"); if (dot) dot.classList.toggle("off", !open);
  }
  updateOpen(); setInterval(updateOpen, 60000);
  new MutationObserver(function () { setTimeout(updateOpen, 0); }).observe(html, { attributes: true, attributeFilter: ["lang"] });

  if (reduce) return;

  /* ---------- rising gold particles ---------- */
  var pc = document.querySelector(".hero-particles");
  if (pc) {
    var n = innerWidth < 640 ? 14 : 28;
    for (var i = 0; i < n; i++) {
      var p = document.createElement("i"), s = (Math.random() * 3 + 1.5).toFixed(1);
      p.style.cssText = "left:" + (Math.random() * 100).toFixed(1) + "%;width:" + s + "px;height:" + s + "px;" +
        "animation-duration:" + (Math.random() * 10 + 9).toFixed(1) + "s;animation-delay:-" + (Math.random() * 18).toFixed(1) + "s;" +
        "--dx:" + (Math.random() * 120 - 60).toFixed(0) + "px";
      pc.appendChild(p);
    }
  }

  /* ---------- hero mouse parallax ---------- */
  var hero = document.querySelector(".hero"), vis = document.querySelector(".hero-visual");
  if (hero && vis && finePointer) {
    vis.querySelectorAll("[data-depth]").forEach(function (el) { el.style.setProperty("--d", el.dataset.depth); });
    var raf;
    hero.addEventListener("mousemove", function (e) {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function () {
        var r = hero.getBoundingClientRect();
        vis.style.setProperty("--mx", ((e.clientX - r.left) / r.width - .5).toFixed(3));
        vis.style.setProperty("--my", ((e.clientY - r.top) / r.height - .5).toFixed(3));
      });
    });
    hero.addEventListener("mouseleave", function () { vis.style.setProperty("--mx", 0); vis.style.setProperty("--my", 0); });
  }

  if (!finePointer) return;

  /* ---------- glow that follows cursor on cards ---------- */
  document.querySelectorAll(".svc,.gcard,.hcard").forEach(function (c) {
    c.addEventListener("mousemove", function (e) {
      var r = c.getBoundingClientRect();
      c.style.setProperty("--gx", e.clientX - r.left + "px");
      c.style.setProperty("--gy", e.clientY - r.top + "px");
    });
  });

  /* ---------- 3D tilt on doctor cards ---------- */
  document.querySelectorAll(".dr").forEach(function (c) {
    c.addEventListener("mousemove", function (e) {
      var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      c.style.transform = "rotateY(" + (x * 10).toFixed(2) + "deg) rotateX(" + (-y * 10).toFixed(2) + "deg) translateY(-6px)";
    });
    c.addEventListener("mouseleave", function () { c.style.transform = ""; });
  });

  /* ---------- magnetic primary buttons ---------- */
  document.querySelectorAll(".hero .btn, .btn-primary").forEach(function (b) {
    b.classList.add("magnetic");
    b.addEventListener("mousemove", function (e) {
      var r = b.getBoundingClientRect();
      b.style.transform = "translate(" + ((e.clientX - r.left - r.width / 2) * .18).toFixed(1) + "px," + ((e.clientY - r.top - r.height / 2) * .3).toFixed(1) + "px)";
    });
    b.addEventListener("mouseleave", function () { b.style.transform = ""; });
  });
})();
