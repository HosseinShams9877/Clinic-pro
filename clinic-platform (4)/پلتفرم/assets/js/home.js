/* Home page — live & useful bits. Loaded after main.js. */
(function () {
  "use strict";
  var html = document.documentElement, $ = function (s) { return document.getElementById(s); };
  var DIG = { fa: "۰۱۲۳۴۵۶۷۸۹", ar: "٠١٢٣٤٥٦٧٨٩" };
  function L() { return ({ fa: 1, en: 1, ar: 1 })[html.lang] ? html.lang : "fa"; }
  function n(x) { var d = DIG[L()]; return d ? String(x).replace(/\d/g, function (c) { return d[c]; }) : String(x); }
  var T = {
    fa: { open: "پذیرش هم‌اکنون باز است", closed: "پذیرش هم‌اکنون بسته است", left: "{h} ساعت و {m} دقیقه تا پایان پذیرش", leftM: "{m} دقیقه تا پایان پذیرش", opens: "بازگشایی {d} ساعت ۷:۳۰", today: "امروز", tomorrow: "فردا", sat: "شنبه" },
    en: { open: "Admissions open now", closed: "Admissions closed now", left: "Closes in {h}h {m}m", leftM: "Closes in {m} min", opens: "Opens {d} at 07:30", today: "today", tomorrow: "tomorrow", sat: "Saturday" },
    ar: { open: "الاستقبال مفتوح الآن", closed: "الاستقبال مغلق الآن", left: "يغلق بعد {h} س و{m} د", leftM: "يغلق بعد {m} دقيقة", opens: "يفتح {d} الساعة ٧:٣٠", today: "اليوم", tomorrow: "غدًا", sat: "السبت" }
  };

  /* ---- live admissions status with countdown (Tehran time, Sat–Thu 07:30–20:00) ---- */
  function status() {
    var t = T[L()], now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tehran" }));
    var mins = now.getHours() * 60 + now.getMinutes(), day = now.getDay(); // 5 = Friday
    var open = day !== 5 && mins >= 450 && mins < 1200, sub;
    if (open) {
      var r = 1200 - mins, h = Math.floor(r / 60), m = r % 60;
      sub = h ? t.left.replace("{h}", n(h)).replace("{m}", n(m)) : t.leftM.replace("{m}", n(m));
    } else {
      var d = mins < 450 && day !== 5 ? t.today : (day === 4 && mins >= 1200) || day === 5 ? (day === 5 ? t.tomorrow : t.sat) : t.tomorrow;
      sub = t.opens.replace("{d}", d);
    }
    $("hOpen").textContent = open ? t.open : t.closed;
    $("openLeft").textContent = sub;
    $("hDot").classList.toggle("off", !open);
  }
  status(); setInterval(status, 30000);

  /* ---- help search ---- */
  $("hSearch").addEventListener("submit", function (e) {
    e.preventDefault();
    var q = $("hSearchQ").value.trim(), t = $("hSearchIn").value;
    location.href = (t === "guide" ? "guide.html" : "doctors.html") + (q ? "?q=" + encodeURIComponent(q) : "");
  });

  /* ---- floating quick actions ---- */
  var qa = $("qa");
  function onScroll() { qa.classList.toggle("show", scrollY > 500); }
  addEventListener("scroll", onScroll, { passive: true }); onScroll();
  $("qaTop").addEventListener("click", function () { scrollTo({ top: 0, behavior: "smooth" }); });

  /* ---- gentle parallax on hero photo (desktop) ---- */
  var img = document.querySelector(".h-img img");
  if (img && matchMedia("(min-width:961px)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    addEventListener("scroll", function () { if (scrollY < 700) img.style.setProperty("--hy", (scrollY * 0.12).toFixed(1) + "px"); }, { passive: true });
  }

  document.addEventListener("kh:lang", function () { setTimeout(status, 0); });
})();
