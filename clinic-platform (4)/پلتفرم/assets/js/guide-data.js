/* Pre-/post-operative patient guide — Dr. Kheirkhah Surgical Center
   MEDICAL CONTENT NOTE: general patient-education text only. Every page shows that the
   surgeon's / anesthesiologist's personal instructions take priority. Must be reviewed and
   approved by the center's medical team before publishing. Each text: [fa, en, ar]. */
(function () {
  function t(fa, en, ar) { return { fa: fa, en: en, ar: ar }; }
  var IMG = "assets/img/services/";

  window.GUIDE_CATS = [
    { id: "all", n: t("همه موارد", "All", "الكل") },
    { id: "gen", n: t("جراحی عمومی", "General surgery", "الجراحة العامة") },
    { id: "gi",  n: t("گوارش و معده", "Digestive", "الجهاز الهضمي") },
    { id: "uro", n: t("ارولوژی", "Urology", "المسالك البولية") },
    { id: "gyn", n: t("زنان و زایمان", "Gynecology", "النساء والولادة") },
    { id: "eye", n: t("چشم", "Eye", "العيون") },
    { id: "ent", n: t("گوش، حلق و بینی", "ENT", "الأنف والأذن والحنجرة") },
    { id: "aes", n: t("زیبایی", "Aesthetic", "التجميل") }
  ];

  /* shared sections */
  window.GUIDE_COMMON = {
    pre: [
      { i: "i-calendar",  n: t("آمادگی روز عمل", "Day-of-surgery prep", "التحضير ليوم العملية"),
        d: t("کارت ملی یا کارت شناسایی معتبر عکس‌دار، دستور بستری پزشک و مدارک پزشکی را همراه بیاورید.", "Bring your national ID or valid photo ID, your doctor's admission order and medical records.", "أحضر بطاقتك الوطنية أو هوية سارية بصورة، وأمر الدخول من الطبيب، وملفاتك الطبية.") },
      { i: "i-search",    n: t("آزمایش‌ها و بررسی‌ها", "Tests & check-ups", "التحاليل والفحوصات"),
        d: t("جواب آزمایش‌ها، نوار قلب و تصویربرداری‌هایی که پزشک خواسته را همراه داشته باشید.", "Bring any lab results, ECG and imaging your doctor requested.", "أحضر نتائج التحاليل وتخطيط القلب والأشعة التي طلبها الطبيب.") },
      { i: "i-clipboard", n: t("مصرف داروها", "Your medications", "الأدوية"),
        d: t("فهرست کامل داروهایتان را بیاورید. قطع یا ادامه هر دارو، به‌ویژه رقیق‌کننده‌های خون، فقط با نظر پزشک.", "Bring a full list of your medicines. Stop or continue any drug — especially blood thinners — only on your doctor's advice.", "أحضر قائمة كاملة بأدويتك. لا توقف أي دواء، خاصة مميعات الدم، إلا بتوجيه الطبيب.") },
      { i: "i-clock",     n: t("ناشتا بودن", "Fasting", "الصيام"),
        d: t("مدت دقیق ناشتایی را از پزشک یا متخصص بیهوشی بپرسید و دقیقاً رعایت کنید.", "Ask your surgeon or anesthesiologist for the exact fasting time and follow it precisely.", "اسأل الجرّاح أو طبيب التخدير عن مدة الصيام بدقة والتزم بها.") }
    ],
    post: [
      { i: "i-bed",       n: t("استراحت و حرکت", "Rest & movement", "الراحة والحركة"),
        d: t("حرکت سبک و راه رفتن زودهنگام، طبق اجازه تیم درمان، به بهبودی کمک می‌کند.", "Light, early walking — as your care team allows — helps recovery.", "المشي الخفيف المبكر، بحسب إذن الفريق الطبي، يساعد على التعافي.") },
      { i: "i-shield",    n: t("مراقبت از زخم", "Wound care", "العناية بالجرح"),
        d: t("محل عمل را تمیز و خشک نگه دارید و پانسمان را طبق دستور تعویض کنید.", "Keep the wound clean and dry and change dressings as instructed.", "حافظ على الجرح نظيفًا وجافًا وغيّر الضماد حسب التعليمات.") },
      { i: "i-heart",     n: t("داروها و درد", "Medicines & pain", "الأدوية والألم"),
        d: t("مسکن و داروها را فقط طبق نسخه مصرف کنید؛ دارویی را خودسرانه اضافه نکنید.", "Take pain relief and medicines only as prescribed; don't add drugs on your own.", "تناول المسكنات والأدوية حسب الوصفة فقط، ولا تضف أدوية من تلقاء نفسك.") },
      { i: "i-calendar",  n: t("ویزیت پیگیری", "Follow-up visit", "زيارة المتابعة"),
        d: t("زمان ویزیت بعد از عمل را هنگام ترخیص بپرسید و در موعد مراجعه کنید.", "Ask for your follow-up date at discharge and attend on time.", "اسأل عن موعد المتابعة عند الخروج واحضر في موعده.") }
    ],
    warn: [
      t("تب یا لرز", "Fever or chills", "حمى أو قشعريرة"),
      t("خونریزی یا ترشح از محل زخم", "Bleeding or discharge from the wound", "نزيف أو إفرازات من الجرح"),
      t("درد شدید یا رو به افزایش", "Severe or worsening pain", "ألم شديد أو متزايد"),
      t("تنگی نفس یا درد قفسه سینه", "Shortness of breath or chest pain", "ضيق تنفس أو ألم في الصدر"),
      t("تهوع و استفراغ مداوم", "Persistent nausea or vomiting", "غثيان أو قيء مستمر"),
      t("قرمزی، تورم یا گرمی اطراف زخم", "Redness, swelling or heat around the wound", "احمرار أو تورم أو سخونة حول الجرح")
    ],
    checklist: [
      t("کارت شناسایی و دستور بستری", "ID card & admission order", "الهوية وأمر الدخول"),
      t("جواب آزمایش‌ها و تصویربرداری", "Lab & imaging results", "نتائج التحاليل والأشعة"),
      t("فهرست داروهای مصرفی", "List of current medicines", "قائمة الأدوية الحالية"),
      t("رعایت ناشتایی طبق دستور", "Fasting as instructed", "الصيام حسب التعليمات"),
      t("همراه داشتن یک همراه بزرگسال", "An adult companion", "مرافق بالغ"),
      t("عدم همراه داشتن طلا و وجه نقد", "No jewellery or cash", "عدم إحضار مجوهرات أو نقود")
    ],
    videos: {
      pre:  [{ img: "assets/img/guide/v-doctor.jpg", n: t("معرفی عمل و مراحل آن", "The operation, step by step", "العملية ومراحلها"), d: t("توضیح ساده روش جراحی و مدت زمان آن", "A simple explanation of the procedure", "شرح مبسط لطريقة الجراحة") },
             { img: "assets/img/guide/v-prep.jpg", n: t("آمادگی‌های قبل از عمل", "Getting ready", "التحضيرات قبل العملية"), d: t("ناشتایی، داروها و روز پذیرش", "Fasting, medicines & admission day", "الصيام والأدوية ويوم الدخول") },
             { img: "assets/img/guide/v-or.jpg", n: t("آشنایی با اتاق عمل", "Inside the operating room", "التعرف على غرفة العمليات"), d: t("آنچه قبل از بیهوشی تجربه می‌کنید", "What to expect before anesthesia", "ما ستختبره قبل التخدير") }],
      post: [{ img: "assets/img/guide/v-doctor.jpg", n: t("مراقبت در خانه", "Caring for yourself at home", "الرعاية في المنزل"), d: t("روزهای اول بعد از ترخیص", "The first days after discharge", "الأيام الأولى بعد الخروج") },
             { img: "assets/img/guide/hero.jpg", n: t("مراقبت از زخم", "Wound care", "العناية بالجرح"), d: t("پانسمان و نشانه‌های عفونت", "Dressings & signs of infection", "الضماد وعلامات العدوى") },
             { img: "assets/img/guide/v-or.jpg", n: t("بازگشت به فعالیت", "Back to activity", "العودة إلى النشاط"), d: t("کار، ورزش و رانندگی", "Work, exercise & driving", "العمل والرياضة والقيادة") }]
    },
    audio: [t("توضیحات پزشک درباره عمل", "Doctor's explanation", "شرح الطبيب للعملية"), t("نکات تغذیه‌ای", "Nutrition tips", "نصائح غذائية"), t("پرسش‌های پرتکرار بیماران", "Frequent patient questions", "أسئلة المرضى الشائعة")]
  };

  function s(id, cat, img, hero, n, d, pre, post) { return { id: id, cat: cat, img: img, hero: hero || img, n: n, d: d, pre: pre, post: post }; }

  window.GUIDE_SURGERIES = [
    s("gallbladder", "gen", IMG + "gallbladder.jpg", "assets/img/guide/gallbladder-hero.jpg",
      t("جراحی کیسه صفرا", "Gallbladder Surgery", "جراحة المرارة"),
      t("لاپاراسکوپی کیسه صفرا", "Laparoscopic cholecystectomy", "استئصال المرارة بالمنظار"),
      [t("در روزهای قبل از عمل غذاهای سبک و کم‌چرب بهتر تحمل می‌شوند.", "Light, low-fat meals are usually better tolerated in the days before surgery.", "الوجبات الخفيفة قليلة الدهون أفضل تحملًا قبل العملية."),
       t("در صورت درد شدید شکم، تب یا زردی پیش از عمل فوراً اطلاع دهید.", "Report severe abdominal pain, fever or jaundice before surgery right away.", "أبلغ فورًا عن ألم بطني شديد أو حمى أو اصفرار قبل العملية.")],
      [t("در هفته‌های اول غذای سبک و کم‌چرب و وعده‌های کوچک‌تر توصیه می‌شود.", "Light, low-fat, smaller meals are advised in the first weeks.", "يُنصح بوجبات خفيفة قليلة الدهون وأصغر في الأسابيع الأولى."),
       t("درد شانه پس از لاپاراسکوپی شایع است و معمولاً طی چند روز کم می‌شود.", "Shoulder-tip pain after laparoscopy is common and usually eases within days.", "ألم الكتف بعد المنظار شائع ويخف عادة خلال أيام.")]),
    s("stomach", "gi", IMG + "stomach.jpg", null,
      t("جراحی معده و چاقی", "Gastric & Bariatric Surgery", "جراحة المعدة والسمنة"),
      t("اسلیو، بای‌پس و جراحی معده", "Sleeve, bypass & gastric surgery", "التكميم والتحويل وجراحة المعدة"),
      [t("رژیم پیش از عمل را دقیقاً طبق برنامه تیم درمان اجرا کنید.", "Follow the pre-operative diet exactly as your care team plans it.", "اتبع الحمية قبل العملية تمامًا حسب خطة الفريق الطبي."),
       t("مشاوره تغذیه پیش از عمل بخشی از آمادگی شماست.", "A nutrition consultation is part of your preparation.", "استشارة التغذية جزء من تحضيرك.")],
      [t("رژیم مرحله‌ای (مایعات، سپس غذای نرم) را طبق برنامه پیش ببرید.", "Progress your staged diet (liquids, then soft food) as scheduled.", "تدرّج في الحمية (سوائل ثم طعام لين) حسب البرنامج."),
       t("جرعه‌جرعه و در طول روز آب کافی بنوشید.", "Sip water steadily throughout the day.", "اشرب الماء رشفات طوال اليوم.")]),
    s("colon", "gi", IMG + "colon.jpg", null,
      t("جراحی روده بزرگ و کوچک", "Bowel Surgery", "جراحة الأمعاء"),
      t("نکات قبل و بعد از عمل", "Before & after surgery", "قبل العملية وبعدها"),
      [t("آماده‌سازی روده را فقط طبق دستور پزشک انجام دهید.", "Do bowel preparation only as your doctor instructs.", "قم بتحضير الأمعاء حسب تعليمات الطبيب فقط.")],
      [t("شروع غذا معمولاً تدریجی است؛ طبق دستور تیم درمان پیش بروید.", "Eating is usually restarted gradually — follow your care team.", "يُستأنف الطعام عادة تدريجيًا حسب الفريق الطبي."),
       t("نفخ یا عدم دفع گاز طولانی را اطلاع دهید.", "Report prolonged bloating or no passing of gas.", "أبلغ عن انتفاخ مطوّل أو عدم خروج الغازات.")]),
    s("appendix", "gen", IMG + "cat-gen.jpg", null,
      t("جراحی آپاندیس", "Appendix Surgery", "جراحة الزائدة الدودية"),
      t("لاپاراسکوپی آپاندیس", "Laparoscopic appendectomy", "استئصال الزائدة بالمنظار"),
      [t("درد شکم را با مسکن پنهان نکنید تا تشخیص دقیق باشد.", "Don't mask abdominal pain with painkillers before diagnosis.", "لا تُخفِ ألم البطن بالمسكنات قبل التشخيص.")],
      [t("تا زمان اجازه پزشک از بلند کردن اجسام سنگین خودداری کنید.", "Avoid heavy lifting until your doctor allows it.", "تجنب رفع الأشياء الثقيلة حتى يسمح الطبيب.")]),
    s("hernia", "gen", IMG + "hernia.jpg", null,
      t("جراحی فتق", "Hernia Repair", "إصلاح الفتق"),
      t("فتق شکمی، ناف و اینگوینال", "Abdominal, umbilical & inguinal", "فتق البطن والسرة والإربي"),
      [t("در صورت درد ناگهانی و سفت شدن برآمدگی فتق فوراً مراجعه کنید.", "Seek care immediately if the bulge becomes hard and suddenly painful.", "راجع فورًا إذا تصلّب الفتق وأصبح مؤلمًا فجأة.")],
      [t("از بلند کردن اجسام سنگین و زور زدن تا زمان اجازه پزشک خودداری کنید.", "Avoid heavy lifting and straining until your doctor allows.", "تجنب رفع الأثقال والإجهاد حتى يسمح الطبيب."),
       t("هنگام سرفه یا عطسه، با بالش آرام روی محل عمل فشار دهید.", "Support the wound with a pillow when coughing or sneezing.", "اسند الجرح بوسادة عند السعال أو العطس.")]),
    s("thyroid", "gen", IMG + "thyroid.jpg", null,
      t("جراحی تیروئید", "Thyroid Surgery", "جراحة الغدة الدرقية"),
      t("برداشت ندول و بیماری‌های تیروئید", "Nodules & thyroid disease", "العقيدات وأمراض الدرقية"),
      [t("داروهای تیروئید را فقط طبق نظر پزشک ادامه یا قطع کنید.", "Continue or stop thyroid medicine only as your doctor advises.", "تابع أو أوقف دواء الدرقية حسب توجيه الطبيب فقط.")],
      [t("گزگز اطراف لب یا انگشتان و گرفتگی عضلات را فوراً اطلاع دهید.", "Report tingling around the lips or fingers or muscle cramps at once.", "أبلغ فورًا عن تنميل حول الشفتين أو الأصابع أو تشنج العضلات."),
       t("تغییر خفیف صدا ممکن است موقت باشد؛ آن را در ویزیت پیگیری مطرح کنید.", "Mild voice change can be temporary; mention it at follow-up.", "قد يكون تغير الصوت الخفيف مؤقتًا؛ اذكره في المتابعة.")]),
    s("urology", "uro", IMG + "cat-uro.jpg", null,
      t("جراحی کلیه و مجاری ادراری", "Kidney & Urinary Surgery", "جراحة الكلى والمسالك"),
      t("سنگ‌شکن، یورتروسکوپی و سیستوسکوپی", "Lithotripsy, ureteroscopy & cystoscopy", "تفتيت الحصى وتنظير الحالب والمثانة"),
      [t("جواب آزمایش ادرار و تصویربرداری را همراه داشته باشید.", "Bring your urine test and imaging results.", "أحضر تحليل البول ونتائج الأشعة.")],
      [t("مایعات کافی طبق توصیه پزشک بنوشید.", "Drink enough fluids as your doctor recommends.", "اشرب سوائل كافية حسب توصية الطبيب."),
       t("کمی خون در ادرار ممکن است دیده شود؛ خونریزی شدید یا لخته را گزارش دهید.", "A little blood in the urine may occur; report heavy bleeding or clots.", "قد يظهر قليل من الدم في البول؛ أبلغ عن نزيف شديد أو جلطات.")]),
    s("gyn", "gyn", IMG + "cat-gyn.jpg", null,
      t("جراحی زنان و زایمان", "Gynecologic Surgery", "الجراحات النسائية"),
      t("نکات قبل و بعد از عمل", "Before & after surgery", "قبل العملية وبعدها"),
      [t("در صورت احتمال بارداری حتماً پیش از عمل اطلاع دهید.", "Tell the team before surgery if you could be pregnant.", "أبلغي الفريق قبل العملية إن كان هناك احتمال حمل.")],
      [t("خونریزی بیش از حد یا ترشح بدبو را گزارش دهید.", "Report heavy bleeding or foul-smelling discharge.", "أبلغي عن نزيف غزير أو إفرازات كريهة الرائحة."),
       t("بخش بستری زنان در طبقه اول مرکز است.", "The women's ward is on the center's 1st floor.", "قسم تنويم النساء في الطابق الأول.")]),
    s("aesthetic", "aes", IMG + "cat-aes.jpg", null,
      t("جراحی پلاستیک و زیبایی", "Plastic & Aesthetic Surgery", "جراحة التجميل"),
      t("بینی، لیپوساکشن و زیبایی", "Rhinoplasty, liposuction & more", "الأنف وشفط الدهون وغيرها"),
      [t("از چند روز قبل، مصرف سیگار را طبق توصیه پزشک کنار بگذارید.", "Stop smoking ahead of surgery as your doctor advises.", "توقف عن التدخين قبل العملية حسب نصيحة الطبيب.")],
      [t("گن یا لباس فشاری را طبق دستور و مدت تعیین‌شده بپوشید.", "Wear compression garments as and for as long as instructed.", "ارتدِ المشد الضاغط حسب التعليمات والمدة المحددة."),
       t("تورم و کبودی در روزهای اول طبیعی است و به‌تدریج کم می‌شود.", "Swelling and bruising are normal at first and fade gradually.", "التورم والكدمات طبيعية في البداية وتخف تدريجيًا.")]),
    s("eye", "eye", IMG + "eye.jpg", null,
      t("جراحی چشم", "Eye Surgery", "جراحة العيون"),
      t("آب‌مروارید، لیزیک و قرنیه", "Cataract, LASIK & cornea", "المياه البيضاء والليزك والقرنية"),
      [t("در روز عمل از آرایش چشم و لنز تماسی استفاده نکنید.", "No eye make-up or contact lenses on the day of surgery.", "لا مكياج للعين ولا عدسات لاصقة يوم العملية.")],
      [t("از مالیدن چشم خودداری کنید و قطره‌ها را دقیقاً طبق برنامه بریزید.", "Don't rub your eye; use drops exactly on schedule.", "لا تفرك عينك واستخدم القطرات حسب الجدول بدقة."),
       t("کاهش ناگهانی دید یا درد شدید چشم را فوراً گزارش دهید.", "Report sudden vision loss or severe eye pain immediately.", "أبلغ فورًا عن فقدان مفاجئ للرؤية أو ألم شديد بالعين.")]),
    s("ent", "ent", IMG + "ent.jpg", null,
      t("جراحی گوش، حلق و بینی", "ENT Surgery", "جراحة الأنف والأذن والحنجرة"),
      t("لوزه، سینوس و تیغه بینی", "Tonsils, sinus & septum", "اللوزتان والجيوب والحاجز"),
      [t("سرماخوردگی یا تب پیش از عمل را به پزشک اطلاع دهید.", "Tell your doctor about any cold or fever before surgery.", "أبلغ الطبيب بأي زكام أو حمى قبل العملية.")],
      [t("پس از جراحی لوزه، مایعات خنک و غذای نرم بهتر تحمل می‌شوند.", "After tonsil surgery, cool fluids and soft food are easier.", "بعد جراحة اللوزتين، السوائل الباردة والطعام اللين أسهل."),
       t("از فین کردن شدید و برخورد به بینی پرهیز کنید.", "Avoid forceful nose-blowing and knocks to the nose.", "تجنب نفخ الأنف بقوة وأي صدمة له.")]),
    s("other", "gen", IMG + "cat-cardio.jpg", null,
      t("سایر جراحی‌ها", "Other Procedures", "عمليات أخرى"),
      t("نکات عمومی قبل و بعد از عمل", "General before & after tips", "نصائح عامة قبل وبعد العملية"),
      [], [])
  ];
})();
