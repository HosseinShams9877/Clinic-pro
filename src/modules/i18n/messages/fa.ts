/**
 * fa.ts — Persian message catalog (CANONICAL).
 *
 * Provenance: every fa value below is transcribed verbatim from the reference
 * (پلتفرم/index.html, پلتفرم/services.html, پلتفرم/assets/js/home.js,
 * پلتفرم/assets/js/services.js). fa is the language the reference content was
 * authored in (i18n.js line 1: "Persian (fa) is read from the HTML itself").
 *
 * Only keys that are used inside the Phase 1 implementation boundary
 * (SERVICES_SCOPE.md §4) are included. Out-of-scope reference keys (doctors,
 * booking, loan, club, international patients, staff portals, …) are
 * deliberately absent.
 *
 * New keys (not present in the reference, UI chrome only — translations of a
 * UI label, not of medical/clinic content):
 *   a11y.skip, a11y.menu, lang.label, err.* (404/error boundary pages)
 *
 * THE KEY SET OF THIS FILE IS THE CONTRACT. en.ts and ar.ts must declare
 * exactly these keys; `messages` in index.ts enforces this at compile time and
 * the key-completeness test enforces it at run time.
 */

export const fa = {
  /* page <title> / meta — reference: index.html <head>, services.html <head> */
  "meta.title": "مرکز جراحی فوق تخصصی دکتر خیرخواه | کاشان",
  "meta.description":
    "مرکز جراحی فوق تخصصی دکتر خیرخواه در کاشان؛ ۷ اتاق عمل مجهز، بیش از ۴۰ پزشک متخصص و فوق تخصص در جراحی چشم، گوش و حلق و بینی، زنان، ارولوژی، ارتوپدی، جنرال و زیبایی.",
  "meta.services": "خدمات | مرکز جراحی فوق تخصصی دکتر خیرخواه",
  "meta.servicesDescription":
    "معرفی ۶۶ پزشک متخصص و فوق تخصص مرکز جراحی دکتر خیرخواه کاشان در رشته‌های زنان و نازایی، چشم، گوش و حلق و بینی، جراحی عمومی، ارولوژی، قلب و بیهوشی.",

  /* brand / chrome */
  "brand.small": "مرکز جراحی فوق تخصصی",
  "brand.name": "دکتر خیرخواه",
  "a11y.skip": "رفتن به محتوای اصلی",
  "a11y.menu": "منو",
  "a11y.top": "بازگشت به بالا",
  "lang.label": "زبان",

  /* 404 / error boundary pages (no reference 404 exists; UI chrome, not clinic content) */
  "err.notFoundTitle": "صفحه مورد نظر یافت نشد",
  "err.notFoundBody": "این صفحه در سایت مرکز جراحی فوق تخصصی دکتر خیرخواه وجود ندارد.",
  "err.errorTitle": "مشکلی پیش آمد",
  "err.errorBody": "در بارگذاری این صفحه مشکلی پیش آمد. لطفاً دوباره تلاش کنید.",
  "err.retry": "تلاش دوباره",

  /* primary navigation (Q4: home + services groups + contact) */
  "nav.home": "خانه",
  "nav.services": "خدمات",
  "nav.contact": "تماس با ما",
  "nav.svcSurg": "خدمات جراحی",
  "nav.svcMed": "خدمات پزشکی",

  /* CTAs — booking CTA replaced by tel: per Q1 */
  "cta.request": "درخواست نوبت",
  /* header CTA — reference: index.html line 122 / services.html line 96 */
  "cta.book": "نوبت و مشاوره",

  /* hero */
  "h.k": "مرکز جراحی فوق تخصصی در کاشان",
  "h.t1": "تاج سلامتی،",
  "h.t2": "سزاوار شماست",
  "h.lead":
    "مرکز جراحی فوق‌تخصصی و زیبایی دکتر خیرخواه، به‌عنوان نخستین مرکز جراحی نوین کشور با طراحی، نقشه و متریال مطابق با استانداردهای آلمان، دارای ۷ اتاق عمل مجهز و بخش‌های مجزا برای جراحی چشم، گوش و حلق و بینی، جراحی زیبایی، جراحی عمومی، جراحی مجاری ادراری و سنگ‌شکنی، جراحی ارتوپدی و جراحی زنان است.",
  "h.phone": "راهنمایی تلفنی",

  /* stats strip */
  "h.since": "از سال ۱۳۹۹",
  "h.sinceS": "همراه شما",
  "st.n1": "۷",
  "st.l1": "اتاق عمل مجهز",
  "st.n2": "+۶۰",
  "st.l2": "پزشک متخصص و فوق تخصص",
  "st.n3": "۴۰",
  "st.l3": "تخت بستری",

  /* help band (only the in-scope services card) */
  "help.title": "چطور می‌توانیم به شما کمک کنید؟",
  "h.helpS": "پزشک مورد نظر خود را پیدا کنید، با خدمات ما آشنا شوید یا راهنمای مراجعه را ببینید.",
  "h.c2": "خدمات جراحی",
  "h.c2s": "آشنایی با خدمات ما",

  /* services summary on home */
  "sv.kicker": "خدمات ما",
  "h.svT": "خدمات تخصصی مرکز جراحی",
  "h.svS": "ارائه طیف گسترده‌ای از خدمات جراحی با روش‌های نوین و تجهیزات پیشرفته",
  "sv.all": "مشاهده همه خدمات",
  "h.see": "مشاهده خدمات",
  "sv.1": "جراحی چشم",
  "sv.2": "گوش، حلق و بینی",
  "sv.3": "زنان، زایمان و ناباروری",
  "sv.4": "کلیه و مجاری ادراری",
  "sv.6": "ارتوپدی",
  "sv.7": "کلینیک بیهوشی",
  "h.s1": "قرنیه، لیزیک، اسمایل، شبکیه و آب‌مروارید",
  "h.s2": "سینوس، بینی، لوزه و جراحی سر و گردن",
  "h.s3": "جراحی‌های تخصصی زنان و درمان ناباروری",
  "h.s4t": "جراحی عمومی و لاپاراسکوپی",
  "h.s4": "کیسه صفرا، فتق، معده و روده با روش کم‌تهاجمی",
  "h.s5": "سنگ‌شکن، یورتروسکوپی و سیستوسکوپی",
  "h.s6t": "زیبایی، لیزر، کاشت مو و ابرو",
  "h.s6": "جراحی بینی، لیپوساکشن، لیزر، کاشت مو و ابرو",
  "h.s7": "ارزیابی و مشاوره بیهوشی پیش از عمل",
  "h.s8": "جراحی استخوان و مفاصل",

  /* bento one-liners — reference: home-svc.js SHORT (per category id) */
  "short.gen": "کیسه صفرا، فتق، معده و روده با روش کم‌تهاجمی",
  "short.plastic": "جراحی‌های ترمیمی و زیبایی با تیم بیهوشی اختصاصی",
  "short.ortho": "جراحی استخوان و مفاصل",
  "short.uro": "سنگ‌شکن، یورتروسکوپی و سیستوسکوپی",
  "short.eye": "قرنیه، لیزیک، اسمایل، شبکیه و آب‌مروارید",
  "short.ent": "سینوس، بینی، لوزه و جراحی سر و گردن",
  "short.gyn": "جراحی‌های تخصصی زنان و درمان ناباروری",
  "short.aes": "جراحی زیبایی، لیزر سه‌طول‌موج، کاشت مو و ابرو",
  "short.anes": "ارزیابی و مشاوره بیهوشی پیش از عمل",
  "short.endo": "آندوسکوپی و کولونوسکوپی تشخیصی و درمانی",

  /* care banner */
  "care.title": "در تمام مراحل کنار شما هستیم",
  "h.careP":
    "از مشاوره اولیه تا ترخیص، تیم ما با احترام و صداقت در کنار شماست تا تجربه‌ای مطمئن و آرام داشته باشید.",
  "h.p1": "مشاوره",
  "h.p2": "پذیرش",
  "h.p3": "جراحی",
  "h.p4": "مراقبت و پیگیری",

  /* patient steps (item 4 "online booking" dropped — booking is out of scope) */
  "gd.kicker": "راهنمای بیماران",
  "gd.title": "مراحل مراجعه و پذیرش",
  "gd.sub": "آنچه برای یک مراجعه آسوده و بدون دغدغه باید بدانید.",
  "h.g1": "ساعات مراجعه و ملاقات",
  "h.g1s": "ساعات پذیرش و ملاقات بیماران",
  "h.g1d": "پذیرش: شنبه تا پنجشنبه ۷:۳۰ تا ۲۰:۰۰ · ملاقات: همه‌روزه ۱۵ تا ۱۶:۳۰",
  "h.g2": "آمادگی قبل از جراحی",
  "h.g2s": "نکات مهم قبل از عمل",
  "h.g2d": "ناشتایی، داروها و آزمایش‌ها را طبق دستور پزشک آماده کنید.",
  /* guide link — reference: index.html line 269 (guide.html is out of scope;
     the string is kept so the label stays canonical when used in-scope) */
  "h.g2l": "راهنمای کامل ←",
  "h.g3": "مدارک لازم",
  "h.g3s": "مدارک مورد نیاز برای پذیرش",
  "gd.1d":
    "کارت ملی یا کارت شناسایی معتبر عکس‌دار، دستور بستری پزشک، مدارک پزشکی و فهرست داروهای مصرفی.",
  /* fourth step — reference: index.html line 271. Its patient-panel.html?go=new
     target is out of scope; the strings ship so the step can render with an
     in-scope substituted action (tel), per the fidelity directive's
     "no fake routes, but exact UI behavior" constraint. */
  "h.g4": "نوبت‌دهی آنلاین",
  "h.g4s": "ثبت درخواست جراحی بدون مراجعه حضوری",
  "h.g4d":
    "برگه معرفی پزشک را آنلاین ارسال کنید؛ همکاران ما ظرف ۲۴ تا ۴۸ ساعت کاری برای تعیین زمان عمل با شما تماس می‌گیرند.",
  "h.g4a": "ثبت درخواست نوبت",

  /* why us */
  "hs.k": "ایمنی بیمار",
  "hs.t": "استانداردهای بهداشت و ایمنی مرکز دکتر خیرخواه",
  "hs.p": "از طراحی اتاق عمل تا روز ترخیص، ایمنی بیمار در همه مراحل رعایت می‌شود.",
  "std.1": "دیوارهای استیل و کف‌پوش ژئوفلور",
  "std.1d": "تمام اتاق‌های عمل و ریکاوری با دیواره استیل و کف‌پوش ژئوفلور",
  "std.2": "تهویه مرکزی با آلودگی صفر",
  "std.2d": "هواساز حرفه‌ای و فیلتراسیون پیشرفته در مرکز اتاق عمل",
  "std.3": "استریلیزاسیون مرکزی (CSR)",
  "std.3d": "اتوکلاو و پلاسما، با آسانسور اختصاصی ست‌های جراحی تا اتاق عمل",
  "hs.4": "ارزیابی بیهوشی پیش از هر عمل",
  "hs.4d":
    "متخصص بیهوشی پیش از جراحی وضعیت شما را بررسی می‌کند و قبل، حین و بعد از عمل مراقب شماست.",
  "hs.5": "دستبند شناسایی برای هر بیمار",
  "hs.5d":
    "از لحظه پذیرش تا خروج، هویت بیمار با دستبند شناسایی کنترل می‌شود تا هیچ اشتباهی رخ ندهد.",
  "hs.6": "تأسیسات بیرون از فضای درمان",
  "hs.6d":
    "موتورخانه، برق و اکسیژن‌ساز در طبقه‌ای جدا قرار دارند تا هر خرابی احتمالی به بخش‌های درمانی آسیب نزند.",

  /* contact strip */
  "h.ctT": "آماده پاسخ‌گویی به شما هستیم",
  "h.ctS": "برای نوبت، مشاوره یا هر سؤالی با پذیرش مرکز تماس بگیرید.",
  "h.addrS": "کاشان، خیابان امیرکبیر، کوچه شهید ظهیری",
  "ct.hours": "شنبه تا پنجشنبه · ۷:۳۰ تا ۲۰:۰۰",
  "ct.map": "مسیریابی روی نقشه",
  "h.qaCall": "تماس",

  /* services landing page */
  "sv2.k": "خدمات تخصصی و فوق تخصصی",
  "sv2.t1": "خدمات ما",
  "sv2.t2": "در مسیر سلامت شما",
  "sv2.p":
    "ارائه خدمات جراحی و درمانی در ۷ اتاق عمل مجهز و با تیمی از پزشکان متخصص و فوق تخصص.",
  "sv2.f1": "+۶۰ پزشک متخصص و فوق تخصص",
  "sv2.f2": "تجهیزات مدرن و پیشرفته",
  "sv2.f3": "اتاق عمل با آلودگی صفر",
  "sg.surg": "خدمات جراحی",
  "sg.surgS": "هفت حوزه جراحی تخصصی و فوق تخصصی در اتاق‌های عمل مرکز",
  "sg.med": "خدمات پزشکی",
  "sg.medS": "زیبایی و لیزر، بیهوشی، و آندوسکوپی و کولونوسکوپی",

  /* category detail / ask strip */
  "sv2.items": "خدمات این حوزه",
  "sv2.askK": "مشاوره تخصصی",
  "sv2.askT": "سؤالی درباره خدمات دارید؟",
  "sv2.askP":
    "کارشناسان پذیرش آماده پاسخ‌گویی به سؤالات شما و راهنمایی برای انتخاب پزشک و روش درمانی مناسب هستند.",
  "sv2.call": "تماس با ما",
  /* sd-cta / video / online consult — reference: services.html lines 142–146.
     sv2.online's index.html#international target is out of scope; the string
     ships for an in-scope substituted action. */
  "sv2.book": "درخواست نوبت و مشاوره",
  "sv2.docs": "مشاهده پزشکان این حوزه",
  "sv2.vid": "معرفی خدمات",
  "sv2.online": "ارسال مدارک و مشاوره آنلاین",
  /* video placeholder toast — reference: services.js VID.fa */
  "sv2.vidSoon": "ویدیوی معرفی این بخش به‌زودی اضافه می‌شود.",
  "sv2.a1": "پاسخ‌گویی در ساعات کاری",
  "sv2.a1s": "شنبه تا پنجشنبه · ۷:۳۰ تا ۲۰:۰۰",
  "sv2.a2": "راهنمایی کامل",
  "sv2.a2s": "درباره روش درمان، پذیرش و بستری",
  "sv2.a3": "تعیین وقت آسان",
  "sv2.a3s": "تلفنی یا آنلاین",

  /* floor labels — reference: services.js line 6 (FL.fa) */
  "floor.basm": "طبقه زیرزمین (منفی یک)",
  "floor.ground": "طبقه همکف",
  "floor.second": "طبقه دوم",
  "floor.third": "طبقه سوم",
  /* short floor labels — reference: home-svc.js FL.SHORT (bento chips) */
  "floorS.basm": "زیرزمین",
  "floorS.ground": "همکف",
  "floorS.second": "طبقه دوم",
  "floorS.third": "طبقه سوم",

  /* live admissions status — reference: home.js T.fa */
  "status.open": "پذیرش هم‌اکنون باز است",
  "status.closed": "پذیرش هم‌اکنون بسته است",
  "status.left": "{h} ساعت و {m} دقیقه تا پایان پذیرش",
  "status.leftM": "{m} دقیقه تا پایان پذیرش",
  "status.opens": "بازگشایی {d} ساعت ۷:۳۰",
  "status.today": "امروز",
  "status.tomorrow": "فردا",
  "status.sat": "شنبه",

  /* footer (departments column pruned to in-scope links, quick-links column dropped) */
  "ft.p":
    "ارائه خدمات درمانی ایمن و اثربخش با نیروی انسانی متخصص و تجهیزات نوین، مطابق با استانداردهای ملی و بین‌المللی و با پایبندی به منشور حقوق بیمار.",
  "ft.h1": "بخش‌ها",
  "ft.l2": "کلینیک بیهوشی",
  "ft.l3": "اتاق عمل جنرال",
  "ft.h3": "ساعات کاری",
  "ft.days": "شنبه تا پنجشنبه",
  "ft.time": "۷:۳۰ – ۲۰:۰۰",
  "ft.visit": "ساعات ملاقات",
  "ft.vtime": "۱۵:۰۰ – ۱۶:۳۰",
  "ft.copy": "© تمامی حقوق برای مرکز جراحی فوق تخصصی دکتر خیرخواه محفوظ است.",
  "ft.company": "شرکت پزشکان مهراندیش خیرخواه",

  "nav.guide": "راهنمای بیماران",

  /* =========================================================
     Loan feature (2026-11-18). Provenance:
     - ln.* and lp.* values are transcribed verbatim from the reference
       (پلتفرم/index.html #loan, پلتفرم/loan.html), en/ar from
       پلتفرم/assets/js/i18n-extra.js — the same pipeline as every other
       reference section.
     - ADAPTATIONS (the reference copy describes the advisor-assisted
       flow; the feature adds a direct digital request): ln.st1..st4
       (home stepper) and lp.h1..h4 ("how it works") describe the actual
       flow: inquiry → amount+OTP → bank registration → confirmation.
     - lw.*, loan.meta and the ln.nc* entry keys are NEW UI chrome for
       the digital flow (labels and errors, not medical/clinic content).
     ========================================================= */
  "loan.meta": "وام درمانی بانک تجارت | مرکز جراحی فوق تخصصی دکتر خیرخواه",
  "loan.metaDescription":
    "وام درمانی بانک تجارت برای هزینه جراحی در مرکز جراحی دکتر خیرخواه: پرداخت مستقیم بانک به مرکز و بازپرداخت قسطی. با کد ملی خود اعتبارتان را استعلام کنید.",

  /* home loan section — reference: index.html #loan (adapted stepper) */
  "ln.k": "وام درمانی سریع",
  "ln.t1": "هزینه عمل‌تان را",
  "ln.t2": "قسطی بپردازید",
  "ln.p": "با وام درمانی بانک تجارت، بانک هزینه جراحی را مستقیم به مرکز پرداخت می‌کند و شما آن را قسطی برمی‌گردانید. کارشناسان ما از اول تا آخر کنارتان هستند.",
  "ln.b1": "پرداخت مستقیم بانک به مرکز",
  "ln.b2": "بدون نیاز به پول نقد برای شروع درمان",
  "ln.b3": "همراهی کارشناس مرکز در همه مراحل",
  "ln.st1": "استعلام اعتبار با کد ملی",
  "ln.st2": "ثبت مبلغ و دریافت کد یکبار مصرف",
  "ln.st3": "ثبت درخواست در بانک تجارت",
  "ln.st4": "پرداخت مستقیم بانک به مرکز",
  "ln.more": "آشنایی کامل با وام درمانی",
  /* home side entry: the reference's callback form, rewired to the
     digital flow's first field (national code instead of mobile). */
  "ln.fT": "درخواست وام درمانی",
  "ln.fP": "کد ملی خود را وارد کنید تا اعتبار قابل استفاده‌تان را استعلام کنید و درخواستتان را مستقیم ثبت کنید.",
  "ln.nc": "کد ملی",
  "ln.ncPh": "۱۲۳۴۵۶۷۸۹۰",
  "ln.start": "شروع درخواست",
  "ln.ncErr": "کد ملی را درست وارد کنید (۱۰ رقم).",
  "ln.privNc": "کد ملی شما فقط برای استعلام اعتبار در بانک تجارت استفاده می‌شود.",

  /* /loan page — reference: loan.html (adapted how-it-works) */
  "lp.t": "وام درمانی بانک تجارت",
  "lp.p": "هزینه جراحی را لازم نیست یکجا بپردازید. بانک تجارت مبلغ را مستقیم به مرکز پرداخت می‌کند و شما آن را قسطی برمی‌گردانید؛ کارشناس مرکز در همه مراحل کنار شماست.",
  "lp.f1": "پرداخت مستقیم به مرکز",
  "lp.f2": "بازپرداخت قسطی",
  "lp.bk": "پرداخت هزینه عمل",
  "lp.bv": "قسطی، با بانک تجارت",
  "lp.hT": "چطور کار می‌کند؟",
  "lp.h1": "کد ملی‌تان را وارد می‌کنید و اعتبار قابل استفاده‌تان در بانک تجارت استعلام می‌شود.",
  "lp.h2": "مبلغ درخواستی را مشخص می‌کنید و کد یکبار مصرفی که بانک به شماره همراهتان می‌فرستد را تأیید می‌کنید.",
  "lp.h3": "درخواست شما در بانک تجارت ثبت می‌شود و مبلغ مستقیم به حساب مرکز پرداخت می‌گردد.",
  "lp.h4": "کارشناس مرکز در تکمیل مدارک و قطعی کردن زمان عمل کنار شماست.",
  "lp.wT": "برای چه کسانی؟",
  "lp.w1": "بیمارانی که پوشش بیمه دارند و می‌خواهند سهم خود از هزینه عمل را قسطی بپردازند.",
  "lp.w2": "مشتریان بانک تجارت؛ شرایط دقیق و سقف وام را بانک تعیین می‌کند و کارشناس ما برایتان توضیح می‌دهد.",
  "lp.dT": "مدارکی که معمولاً لازم است",
  "lp.d1": "کارت ملی",
  "lp.d2": "دستور بستری یا نامه پزشک",
  "lp.d3": "برآورد هزینه از واحد ترخیص مرکز",
  "lp.d4": "مدارکی که بانک تجارت طبق ضوابط خود می‌خواهد",
  "lp.qT": "پرسش‌های پرتکرار",
  "lp.q1": "پول وام به حساب من واریز می‌شود؟",
  "lp.a1": "نه. بانک مبلغ را مستقیم به حساب مرکز پرداخت می‌کند تا هزینه عمل شما تسویه شود؛ شما فقط اقساط را به بانک می‌پردازید.",
  "lp.q2": "با بیمه هم قابل استفاده است؟",
  "lp.a2": "بله. ابتدا سهم بیمه کسر می‌شود و وام برای سهمی است که خودتان باید بپردازید.",
  "lp.q3": "مبلغ، سود و تعداد اقساط چقدر است؟",
  "lp.a3": "این موارد را بانک تجارت بر اساس ضوابط خود تعیین می‌کند. کارشناس ما در تماس، شرایط به‌روز را برای شما توضیح می‌دهد.",
  "lp.q4": "چقدر طول می‌کشد؟",
  "lp.a4": "پس از ثبت درخواست و تأیید کد، کارشناس ظرف ۲۴ ساعت کاری با شما تماس می‌گیرد و مدارک لازم را می‌گوید.",
  "lp.note": "شرایط نهایی وام، از جمله سقف مبلغ، سود و اقساط، را بانک تجارت تعیین می‌کند.",

  /* loan wizard — new UI chrome for the digital flow (faithful to the
     reference's .ln-* design vocabulary, rendered on .ln-form styles). */
  "lw.title": "درخواست وام درمانی",
  "lw.js": "برای ثبت درخواست لطفاً جاوا اسکریپت مرورگر خود را فعال کنید.",
  "lw.s1": "کد ملی",
  "lw.s2": "استعلام اعتبار",
  "lw.s3": "مبلغ و کد تأیید",
  "lw.s4": "تکمیل",
  "lw.back": "بازگشت",
  "lw.editNc": "تغییر کد ملی",
  "lw.creditOf": "اعتبار {name}",
  "lw.balance": "مانده قابل استفاده",
  "lw.creditAmount": "سقف اعتبار",
  "lw.customer": "به نام",
  "lw.chooseAmount": "مبلغ درخواست",
  "lw.amountHint": "مبلغ به ریال و حداکثر مانده اعتبار قابل استفاده است.",
  "lw.chooseCredit": "اعتبار مورد نظر",
  "lw.amount": "مبلغ درخواست (ریال)",
  "lw.amountErr": "مبلغ را به صورت عدد صحیح و حداکثر مانده اعتبار وارد کنید.",
  "lw.sendOtp": "دریافت کد یکبار مصرف",
  "lw.sending": "در حال ارسال…",
  "lw.otpSent": "کد یکبار مصرف به شماره {mobile} ارسال شد.",
  "lw.otp": "کد یکبار مصرف",
  "lw.otpPh": "مثلاً ۵۲۳۲۰",
  "lw.verify": "تأیید و ثبت درخواست",
  "lw.verifying": "در حال ثبت…",
  "lw.resend": "ارسال مجدد کد",
  "lw.processing": "درخواست در حال ثبت است…",
  "lw.polling": "در حال پیگیری وضعیت تراکنش در بانک…",
  "lw.successTitle": "درخواست وام ثبت شد",
  "lw.pendingTitle": "درخواست ثبت شد",
  "lw.pendingBody": "درخواست شما در بانک تجارت ثبت شد و در انتظار تأیید نهایی است. کارشناس مرکز ظرف ۲۴ ساعت کاری با شما تماس می‌گیرد.",
  "lw.refNum": "شماره پیگیری",
  "lw.txId": "شناسه تراکنش",
  "lw.amountPaid": "مبلغ درخواست",
  "lw.failedTitle": "درخواست ناموفق بود",
  "lw.retry": "تلاش دوباره",
  "lw.newRequest": "درخواست جدید",
  "lw.errNetwork": "ارتباط با سامانه بانک برقرار نشد؛ لطفاً لحظاتی بعد تلاش کنید.",
  "lw.errTooMany": "تعداد درخواست‌ها از حد مجاز گذشته است؛ کمی صبر کنید و دوباره تلاش کنید.",
  "lw.errGeneric": "خطایی رخ داد؛ لطفاً دوباره تلاش کنید.",
  "lw.noCredits": "اعتبار قابل استفاده‌ای برای این کد ملی یافت نشد.",
  "lw.stPENDING": "در انتظار",
  "lw.stPROCESSING": "در حال پردازش",
  "lw.stCOMPLETED": "کامل شد",
  "lw.stCONFIRMED": "تأیید شد",
  "lw.stFAILED": "ناموفق",
  "lw.stREFUNDED": "برگشت خورد",
  "lw.stRETRY": "در حال تلاش مجدد",
  "lw.submit": "ادامه",
};
