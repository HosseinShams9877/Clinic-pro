/* about.html & clinics.html: highlight the section tab in view; clinics: render anesthesiologists from doctors-data.js */
(function () {
  "use strict";
  var tabs = document.querySelector(".ix-tabs.sticky");
  if (tabs) {
    var links = Array.prototype.slice.call(tabs.querySelectorAll('a[href^="#"]'));
    var spy = function () {
      var y = window.innerHeight * 0.35, cur = null;
      links.forEach(function (a) {
        var el = document.querySelector(a.getAttribute("href"));
        if (el) { var r = el.getBoundingClientRect(); if (r.top <= y && r.bottom > y) cur = a; }
      });
      links.forEach(function (a) { a.classList.toggle("on", a === cur); });
    };
    window.addEventListener("scroll", spy, { passive: true }); spy();
  }

  var box = document.getElementById("anesDrs");
  if (!box || !window.DOCTORS) return;
  var P = window.DOCTOR_PROFILES || {};
  function lang() { var l = document.documentElement.lang; return l === "en" || l === "ar" ? l : "fa"; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function render() {
    var L = lang();
    box.innerHTML = window.DOCTORS.filter(function (d) { return d.cat === "anes"; }).map(function (d) {
      var href = P[d.id] ? "doctor.html?id=" + encodeURIComponent(d.id) : "doctors.html?cat=anes";
      var nm = d.name[L] || d.name.fa, ini = (d.name.fa || "").replace("دکتر ", "").charAt(0);
      var av = d.photo ? '<span class="av" style="background-image:url(' + esc(d.photo) + ')"></span>' : '<span class="av">' + esc(ini) + "</span>";
      return '<a class="ix-dr" href="' + href + '">' + av + "<div><b>" + esc(nm) + "</b><small>" + esc(d.spec[L] || d.spec.fa) + "</small></div></a>";
    }).join("");
  }
  render();
  document.addEventListener("kh:lang", render);
})();
