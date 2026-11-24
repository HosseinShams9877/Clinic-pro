/* Doctors page — render, filter, search, quick-view. Loaded BEFORE main.js (listens to "kh:lang"). */
(function () {
  "use strict";
  var DOCS = window.DOCTORS || [], CATS = window.DOCTOR_CATS || {};
  var html = document.documentElement;
  var grid = document.getElementById("docGrid"), chips = document.getElementById("docChips");
  var search = document.getElementById("docSearch"), countEl = document.getElementById("docCount");
  var empty = document.getElementById("docEmpty"), modal = document.getElementById("docModal");
  var UI = {
    fa: { profile: "مشاهده پروفایل", founder: "مؤسس مرکز", soon: "تصویر به‌زودی", count: "{n} پزشک" },
    en: { profile: "View profile", founder: "Founder", soon: "Photo coming soon", count: "{n} doctors" },
    ar: { profile: "عرض الملف", founder: "مؤسس المركز", soon: "الصورة قريبًا", count: "{n} طبيب" }
  };
  var DIG = { fa: "۰۱۲۳۴۵۶۷۸۹", ar: "٠١٢٣٤٥٦٧٨٩" };
  var lang = "fa", cat = "all", q = "";

  function L() { return html.lang in UI ? html.lang : "fa"; }
  function num(n) { var s = DIG[lang]; return s ? String(n).replace(/\d/g, function (d) { return s[d]; }) : String(n); }
  function norm(s) {
    return (s || "").toLowerCase().replace(/[يى]/g, "ی").replace(/ك/g, "ک").replace(/[ة]/g, "ه").replace(/[أإآ]/g, "ا")
      .replace(/‌/g, "").replace(/دکتر|د\.|dr\./g, "").replace(/\s+/g, " ").trim();
  }
  function initial(d) {
    var parts = d.name[lang].replace(/^(دکتر|د\.|Dr\.)\s*/, "").trim().split(/\s+/);
    return (parts[parts.length - 1] || "").charAt(0);
  }

  /* ---------- build once ---------- */
  var counts = { all: DOCS.length };
  DOCS.forEach(function (d) { if (d.cat) counts[d.cat] = (counts[d.cat] || 0) + 1; });

  Object.keys(CATS).forEach(function (k) {
    if (k !== "all" && !counts[k]) return;
    var b = document.createElement("button");
    b.className = "dchip" + (k === "all" ? " on" : ""); b.type = "button"; b.dataset.cat = k; b.setAttribute("role", "tab");
    b.innerHTML = '<span class="t"></span><span class="n"></span>';
    b.addEventListener("click", function () {
      cat = k; chips.querySelectorAll(".dchip").forEach(function (x) { x.classList.toggle("on", x === b); });
      apply();
    });
    chips.appendChild(b);
  });

  var cards = DOCS.map(function (d, i) {
    var el = document.createElement("article");
    el.className = "doc"; el.tabIndex = 0; el.dataset.i = i;
    el.innerHTML =
      '<div class="doc-ph">' +
        (d.photo ? '<img src="' + d.photo + '" alt="" loading="lazy">'
                 : '<div class="mono"><svg class="mono-arch" viewBox="0 0 100 120" aria-hidden="true"><path d="M8 118V52C8 26 30 10 50 2c20 8 42 24 42 50v66"/></svg><b class="mono-l"></b><small class="mono-s"></small></div>') +
        (d.founder ? '<span class="doc-badge"></span>' : "") +
      "</div>" +
      '<div class="doc-b"><h3></h3><p></p>' +
        '<button type="button" class="doc-btn"><svg><use href="#i-user"/></svg><span></span></button>' +
      "</div>";
    var full = (window.DOCTOR_PROFILES || {})[d.id];
    if (full) el.classList.add("has-profile");
    function go() { if (full) location.href = "doctor.html?id=" + encodeURIComponent(d.id); else open(d); }
    el.addEventListener("click", go);
    el.addEventListener("keydown", function (e) { if (e.key === "Enter") go(); });
    grid.appendChild(el);
    return el;
  });

  /* ---------- language-dependent text ---------- */
  function texts() {
    lang = L(); var ui = UI[lang];
    chips.querySelectorAll(".dchip").forEach(function (b) {
      b.querySelector(".t").textContent = CATS[b.dataset.cat][lang];
      b.querySelector(".n").textContent = num(counts[b.dataset.cat] || 0);
    });
    cards.forEach(function (el, i) {
      var d = DOCS[i];
      el.querySelector("h3").textContent = d.name[lang];
      el.querySelector("p").textContent = d.spec[lang];
      el.querySelector(".doc-btn span").textContent = ui.profile;
      el.setAttribute("aria-label", d.name[lang] + " — " + d.spec[lang]);
      var img = el.querySelector("img"); if (img) img.alt = d.name[lang];
      var l = el.querySelector(".mono-l"); if (l) { l.textContent = initial(d); el.querySelector(".mono-s").textContent = ui.soon; }
      var bdg = el.querySelector(".doc-badge"); if (bdg) bdg.textContent = ui.founder;
    });
    apply();
    if (!modal.hidden && current) fill(current);
  }

  /* ---------- filter + search ---------- */
  function apply() {
    var nq = norm(q), shown = 0;
    cards.forEach(function (el, i) {
      var d = DOCS[i];
      var hay = norm([d.name.fa, d.name.en, d.name.ar, d.spec.fa, d.spec.en, d.spec.ar].join(" "));
      var ok = (cat === "all" || d.cat === cat) && (!nq || hay.indexOf(nq) > -1);
      el.hidden = !ok;
      if (ok) { el.style.setProperty("--k", shown % 10); el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop"); shown++; }
    });
    countEl.textContent = UI[lang].count.replace("{n}", num(shown));
    empty.hidden = shown > 0;
  }
  var t;
  search.addEventListener("input", function () { clearTimeout(t); t = setTimeout(function () { q = search.value; apply(); }, 120); });

  /* ---------- quick view ---------- */
  var current = null, lastFocus = null;
  function fill(d) {
    var ph = document.getElementById("dmPh");
    ph.innerHTML = d.photo ? '<img src="' + d.photo + '" alt="' + d.name[lang] + '">'
      : '<div class="mono"><svg class="mono-arch" viewBox="0 0 100 120"><path d="M8 118V52C8 26 30 10 50 2c20 8 42 24 42 50v66"/></svg><b class="mono-l">' + initial(d) + "</b></div>";
    document.getElementById("dmName").textContent = d.name[lang];
    document.getElementById("dmSpec").textContent = d.spec[lang];
    var c = document.getElementById("dmCat");
    c.textContent = d.cat ? CATS[d.cat][lang] : ""; c.hidden = !d.cat;
    var lk = document.getElementById("dmLink"); lk.href = d.url || "#"; lk.hidden = !d.url;
  }
  function open(d) {
    current = d; lastFocus = document.activeElement; fill(d);
    modal.hidden = false; document.body.style.overflow = "hidden";
    requestAnimationFrame(function () { modal.classList.add("in"); modal.querySelector(".dm-x").focus(); });
  }
  function close() {
    modal.classList.remove("in"); document.body.style.overflow = "";
    setTimeout(function () { modal.hidden = true; if (lastFocus) lastFocus.focus(); }, 250);
  }
  modal.querySelectorAll("[data-close]").forEach(function (b) { b.addEventListener("click", close); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !modal.hidden) close(); });

  /* ---------- living layer: reveal + tilt + glow ---------- */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("seen"); io.unobserve(x.target); } });
    }, { threshold: .1 });
    cards.forEach(function (c) { io.observe(c); });
  } else cards.forEach(function (c) { c.classList.add("seen"); });

  if (window.matchMedia("(pointer: fine)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    cards.forEach(function (c) {
      c.addEventListener("mousemove", function (e) {
        var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        c.style.setProperty("--rx", (-y * 8).toFixed(2) + "deg"); c.style.setProperty("--ry", (x * 8).toFixed(2) + "deg");
        c.style.setProperty("--gx", (e.clientX - r.left) + "px"); c.style.setProperty("--gy", (e.clientY - r.top) + "px");
      });
      c.addEventListener("mouseleave", function () { c.style.setProperty("--rx", "0deg"); c.style.setProperty("--ry", "0deg"); });
    });
  }

  document.addEventListener("kh:lang", texts);
  texts();
  var qc = new URLSearchParams(location.search).get("cat");
  var qq = new URLSearchParams(location.search).get("q");
  if (qq) { search.value = qq; q = qq; apply(); }
  if (qc) { var qb = chips.querySelector('[data-cat="' + qc + '"]'); if (qb) qb.click(); }
})();
