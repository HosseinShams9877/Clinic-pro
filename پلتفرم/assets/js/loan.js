/* وام درمانی بانک تجارت — lead form (home section + loan.html). DEMO: leads are kept in localStorage «kh-loan-leads»;
   in production they go to the server and appear for the loan/insurance advisor. */
(function () {
  "use strict";
  var KEY = "kh-loan-leads";
  function en(s) { return String(s || "").replace(/[۰-۹]/g, function (d) { return "۰۱۲۳۴۵۶۷۸۹".indexOf(d); }).replace(/[٠-٩]/g, function (d) { return "٠١٢٣٤٥٦٧٨٩".indexOf(d); }); }
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
  function save(a) { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) { } }
  document.querySelectorAll(".ln-form").forEach(function (f) {
    var mob = f.elements.mob, err = f.querySelector(".ln-err"), inn = f.querySelector(".ln-f-in"), ok = f.querySelector(".ln-ok");
    mob.addEventListener("input", function () { err.hidden = true; mob.classList.remove("bad"); });
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var m = en(mob.value).replace(/\D/g, "");
      if (m.length === 10 && m.charAt(0) === "9") m = "0" + m;
      if (!/^09\d{9}$/.test(m)) { err.hidden = false; mob.classList.add("bad"); mob.focus(); return; }
      var a = load();
      a.push({ id: Date.now(), mobile: m, name: (f.elements.name.value || "").trim(), op: (f.elements.op.value || "").trim(), src: f.dataset.src || "", at: new Date().toISOString(), status: "new" });
      save(a);
      inn.hidden = true; ok.hidden = false; f.classList.add("done");
    });
    f.querySelector(".ln-again").addEventListener("click", function () { f.reset(); ok.hidden = true; inn.hidden = false; f.classList.remove("done"); mob.focus(); });
  });
})();

/* باشگاه تاج — SMS sign-up (home #club). DEMO store: localStorage «kh-club-members». */
(function () {
  "use strict";
  var f = document.querySelector(".cb-form"); if (!f) return;
  var KEY = "kh-club-members";
  function en(s) { return String(s || "").replace(/[۰-۹]/g, function (d) { return "۰۱۲۳۴۵۶۷۸۹".indexOf(d); }).replace(/[٠-٩]/g, function (d) { return "٠١٢٣٤٥٦٧٨٩".indexOf(d); }); }
  var mob = f.elements.mob, err = f.querySelector(".cb-err"), inn = f.querySelector(".cb-in"), ok = f.querySelector(".cb-ok");
  mob.addEventListener("input", function () { err.hidden = true; mob.classList.remove("bad"); });
  f.addEventListener("submit", function (e) {
    e.preventDefault();
    var m = en(mob.value).replace(/\D/g, ""); if (m.length === 10 && m.charAt(0) === "9") m = "0" + m;
    if (!/^09\d{9}$/.test(m)) { err.hidden = false; mob.classList.add("bad"); mob.focus(); return; }
    var topics = Array.prototype.slice.call(f.querySelectorAll('input[name="topic"]:checked')).map(function (x) { return x.value; });
    var a; try { a = JSON.parse(localStorage.getItem(KEY)) || []; } catch (x) { a = []; }
    a = a.filter(function (r) { return r.mobile !== m; });
    a.push({ mobile: m, topics: topics, birthMonth: f.elements.bm.value || "", at: new Date().toISOString(), tier: "bronze" });
    try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (x) { }
    inn.hidden = true; ok.hidden = false;
  });
  f.querySelector(".cb-again").addEventListener("click", function () { f.reset(); ok.hidden = true; inn.hidden = false; mob.focus(); });
})();
