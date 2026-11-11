/* Home «خدمات تخصصی» — bento showcase rendered from SERVICE_CATS (services-data.js),
   so the home section always matches the services page (same names, floors, photos, links).
   The static cards in index.html stay as a no-JS / SEO fallback. */
(function () {
  "use strict";
  var box = document.getElementById("hxSvc"), tabs = document.querySelectorAll(".hx-tab");
  if (!box || !window.SERVICE_CATS) return;
  var html = document.documentElement;
  function t(fa, en, ar) { return { fa: fa, en: en, ar: ar }; }
  var SHORT = {
    gen: t("کیسه صفرا، فتق، معده و روده با روش کم‌تهاجمی", "Gallbladder, hernia, stomach & bowel — minimally invasive", "المرارة والفتق والمعدة والأمعاء بأقل تدخل"),
    plastic: t("جراحی‌های ترمیمی و زیبایی با تیم بیهوشی اختصاصی", "Reconstructive & cosmetic surgery with a dedicated anesthesia team", "جراحات ترميمية وتجميلية مع فريق تخدير مخصص"),
    ortho: t("جراحی استخوان و مفاصل", "Bone & joint surgery", "جراحة العظام والمفاصل"),
    uro: t("سنگ‌شکن، یورتروسکوپی و سیستوسکوپی", "Lithotripsy, ureteroscopy & cystoscopy", "تفتيت الحصى وتنظير الحالب والمثانة"),
    eye: t("قرنیه، لیزیک، اسمایل، شبکیه و آب‌مروارید", "Cornea, LASIK, SMILE, retina & cataract", "القرنية والليزك والسمايل والشبكية والساد"),
    ent: t("سینوس، بینی، لوزه و جراحی سر و گردن", "Sinus, nose, tonsils and head & neck surgery", "الجيوب والأنف واللوزتان وجراحة الرأس والعنق"),
    gyn: t("جراحی‌های تخصصی زنان و درمان ناباروری", "Specialist gynecologic surgery & infertility care", "جراحات النساء المتخصصة وعلاج العقم"),
    aes: t("جراحی زیبایی، لیزر سه‌طول‌موج، کاشت مو و ابرو", "Aesthetic surgery, triple-wavelength laser, hair & eyebrow transplant", "جراحة تجميلية وليزر ثلاثي الموجة وزراعة الشعر والحواجب"),
    anes: t("ارزیابی و مشاوره بیهوشی پیش از عمل", "Pre-operative anesthesia assessment & consultation", "تقييم واستشارة التخدير قبل العملية"),
    endo: t("آندوسکوپی و کولونوسکوپی تشخیصی و درمانی", "Diagnostic & therapeutic endoscopy and colonoscopy", "تنظير المعدة والقولون التشخيصي والعلاجي")
  };
  var FL = { fa: { "-1": "زیرزمین", 0: "همکف", 2: "طبقه دوم", 3: "طبقه سوم" }, en: { "-1": "Basement", 0: "Ground floor", 2: "2nd floor", 3: "3rd floor" }, ar: { "-1": "الطابق السفلي", 0: "الطابق الأرضي", 2: "الطابق الثاني", 3: "الطابق الثالث" } };
  var SEE = t("مشاهده خدمات", "View services", "عرض الخدمات");
  /* bento layout per group: f = featured (2×2), w = wide (2×1), others 1×1 */
  var SIZE = { gen: "f", ent: "w", gyn: "w", aes: "f", anes: "w", endo: "w" };
  var group = "surg";
  function L() { return ({ fa: 1, en: 1, ar: 1 })[html.lang] ? html.lang : "fa"; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function render() {
    var l = L(), i = 0;
    document.querySelectorAll(".hx-n").forEach(function (e) { e.textContent = l === "en" ? e.dataset.n : l === "ar" ? "٠١٢٣٤٥٦٧٨٩".charAt(+e.dataset.n) : "۰۱۲۳۴۵۶۷۸۹".charAt(+e.dataset.n); });
    box.innerHTML = window.SERVICE_CATS.filter(function (c) { return c.group === group; }).map(function (c) {
      var sz = SIZE[c.id] || "", n = ++i;
      var ben = sz === "f" && c.benefits ? '<ul class="hx-ben">' + c.benefits.map(function (b) { return '<li><svg><use href="#' + b.i + '"/></svg>' + esc(b.t[l]) + "</li>"; }).join("") + "</ul>" : "";
      return '<a class="hx-c ' + sz + ' g' + (n % 6) + '" href="services.html#' + c.id + '" style="--d:' + (n * 60) + 'ms">' +
        '<img src="' + c.img + '" alt="" loading="lazy">' +
        '<span class="hx-fl"><svg><use href="#i-building"/></svg>' + FL[l][c.floor] + "</span>" +
        '<span class="hx-i"><svg><use href="#' + c.icon + '"/></svg></span>' +
        '<div class="hx-t"><b>' + esc(c.name[l]) + "</b><p>" + esc((SHORT[c.id] || c.desc)[l]) + "</p>" + ben +
        '<span class="hx-go"><span>' + SEE[l] + '</span><i><svg><use href="#i-arrow"/></svg></i></span></div></a>';
    }).join("");
    box.classList.remove("in"); void box.offsetWidth; box.classList.add("in");
  }
  tabs.forEach(function (b) {
    b.addEventListener("click", function () {
      if (b.dataset.g === group) return;
      group = b.dataset.g;
      tabs.forEach(function (x) { var on = x === b; x.classList.toggle("on", on); x.setAttribute("aria-selected", on); });
      document.querySelector(".hx-tabs").dataset.on = group;
      render();
    });
  });
  html.classList.add("js-svc");
  document.querySelector(".h-svc").hidden = true;
  box.hidden = false;
  render();
  document.addEventListener("kh:lang", render);
})();
