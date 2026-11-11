/* Services page — category tabs drive the detail + sub-service grid. */
(function () {
  "use strict";
  var html = document.documentElement, CATS = window.SERVICE_CATS || [];
  var $ = function (s) { return document.getElementById(s); };
  var FL = { fa: { "-1": "طبقه زیرزمین (منفی یک)", 0: "طبقه همکف", 2: "طبقه دوم", 3: "طبقه سوم" }, en: { "-1": "Basement (level −1)", 0: "Ground floor", 2: "2nd floor", 3: "3rd floor" }, ar: { "-1": "الطابق السفلي (−1)", 0: "الطابق الأرضي", 2: "الطابق الثاني", 3: "الطابق الثالث" } };
  var VID = { fa: "ویدیوی معرفی این بخش به‌زودی اضافه می‌شود.", en: "This department's video is coming soon.", ar: "سيُضاف فيديو هذا القسم قريبًا." };
  function fromHash() {
    var h = (location.hash || "").slice(1);
    if (h === "surgical") return CATS.filter(function (c) { return c.group === "surg"; })[0];
    if (h === "medical") return CATS.filter(function (c) { return c.group === "med"; })[0];
    return CATS.filter(function (c) { return c.id === h; })[0];
  }
  var cur = fromHash() || CATS[0];
  function L() { return html.lang in FL ? html.lang : "fa"; }

  var cats = document.querySelector(".scats-wrap");
  CATS.forEach(function (c) {
    var b = document.createElement("button");
    b.type = "button"; b.className = "scat"; b.dataset.id = c.id; b.setAttribute("role", "tab");
    b.innerHTML = '<span class="sc-i"><svg><use href="#' + c.icon + '"/></svg></span><b></b>' +
      (c.img ? '<img src="' + c.img + '" alt="" loading="lazy">' : '<span class="sc-mono"><svg><use href="#' + c.icon + '"/></svg></span>') +
      '<span class="sc-go"><svg class="arr"><use href="#i-arrow"/></svg></span>';
    b.addEventListener("click", function () {
      cur = c; history.replaceState(null, "", "#" + c.id); render(true);
      if (innerWidth < 960) $("sDetail").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    $(c.group === "med" ? "sCatsM" : "sCatsS").appendChild(b);
  });

  function render(anim) {
    var l = L(), c = cur;
    cats.querySelectorAll(".scat").forEach(function (b) {
      var x = CATS.filter(function (k) { return k.id === b.dataset.id; })[0];
      b.querySelector("b").textContent = x.name[l];
      b.classList.toggle("on", x === c); b.setAttribute("aria-selected", x === c);
    });
    $("sdCrumb").textContent = c.name[l];
    $("sdName").textContent = c.name[l];
    $("sdVidName").textContent = c.name[l];
    $("sdDesc").textContent = c.desc[l];
    $("sdFloor").textContent = FL[l][c.floor];
    $("sdVideo").querySelector("img").src = c.img || "assets/img/services/or.jpg";
    $("sdDocs").href = "doctors.html?cat=" + c.doc;
    $("sdBen").innerHTML = c.benefits.map(function (b) { return '<li><svg><use href="#' + b.i + '"/></svg><span>' + b.t[l] + "</span></li>"; }).join("");
    $("sItems").innerHTML = c.items.map(function (it, k) {
      var media = it.img ? '<img src="' + it.img + '" alt="" loading="lazy">' : '<span class="si-mono"><svg><use href="#' + it.icon + '"/></svg></span>';
      return '<article class="si" style="--k:' + k + '"><div class="si-m">' + media + '</div><div class="si-b"><h3>' + it.n[l] + "</h3><p>" + it.d[l] +
        '</p><a class="si-go" href="tel:+983155154000" aria-label="' + it.n[l] + '"><svg class="arr"><use href="#i-arrow"/></svg></a></div></article>';
    }).join("");
    if (anim) { var d = $("sDetail"); d.classList.remove("swap"); void d.offsetWidth; d.classList.add("swap"); }
  }

  var tt;
  $("sdVideo").addEventListener("click", function () {
    var el = $("pToast"); el.textContent = VID[L()]; el.classList.add("in");
    clearTimeout(tt); tt = setTimeout(function () { el.classList.remove("in"); }, 3000);
  });
  document.addEventListener("kh:lang", function () { render(false); });
  window.addEventListener("hashchange", function () {
    var c = fromHash(); if (!c) return; cur = c; render(true);
    var h = location.hash.slice(1), el = document.getElementById(h === "surgical" || h === "medical" ? h : "sDetail");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  render(false);
})();
