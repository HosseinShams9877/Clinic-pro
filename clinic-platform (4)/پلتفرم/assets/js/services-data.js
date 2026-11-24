/* Services of Dr. Kheirkhah Surgical Center — content limited to what the center publishes
   (surgical suite, equipment per floor, clinics). Each item: [fa, en, ar]. */
(function () {
  function t(fa, en, ar) { return { fa: fa, en: en, ar: ar }; }
  var B = {
    scar:  { i: "i-scalpel", t: t("برش کوچک‌تر", "Smaller incisions", "شقوق أصغر") },
    fast:  { i: "i-heart",   t: t("بهبودی سریع‌تر", "Faster recovery", "تعافٍ أسرع") },
    safe:  { i: "i-shield",  t: t("اتاق عمل با آلودگی صفر", "Zero-contamination OR", "غرفة عمليات بتلوث صفري") },
    equip: { i: "i-plus",    t: t("تجهیزات روز", "Modern equipment", "أجهزة حديثة") },
    ward:  { i: "i-bed",     t: t("بخش بستری مجزا", "Dedicated ward", "قسم تنويم مستقل") },
    micro: { i: "i-eye",     t: t("میکروسکوپ جراحی", "Surgical microscope", "مجهر جراحي") }
  };
  window.SERVICE_CATS = [
    { id: "gen", doc: "gen", img: "assets/img/services/cat-gen.jpg", icon: "i-scalpel", floor: 2,
      name: t("جراحی عمومی و لاپاراسکوپی", "General & Laparoscopic Surgery", "الجراحة العامة والمنظار"),
      desc: t("طیف گسترده‌ای از جراحی‌های عمومی و گوارش با روش‌های کم‌تهاجمی لاپاراسکوپی؛ برش‌های کوچک، درد کمتر و بازگشت سریع‌تر به زندگی روزمره.",
              "A broad range of general and digestive surgery using minimally invasive laparoscopic techniques — small incisions, less pain and a faster return to daily life.",
              "مجموعة واسعة من الجراحات العامة وجراحات الجهاز الهضمي بتقنيات المنظار طفيفة التوغل؛ شقوق صغيرة وألم أقل وعودة أسرع إلى الحياة اليومية."),
      benefits: [{ i: "i-scalpel", t: t("برش کوچک‌تر با لاپاراسکوپی", "Smaller laparoscopic incisions", "شقوق أصغر بالمنظار") }, { i: "i-heart", t: t("بازگشت سریع‌تر به زندگی روزمره", "Faster return to daily life", "عودة أسرع للحياة اليومية") }, { i: "i-bed", t: t("بخش بستری مجزای مردان و زنان", "Separate men's & women's wards", "أقسام تنويم منفصلة للرجال والنساء") }],
      items: [
        { img: "assets/img/services/gallbladder.jpg", n: t("جراحی کیسه صفرا", "Gallbladder Surgery", "جراحة المرارة"), d: t("به روش لاپاراسکوپی با حداقل تهاجم", "Laparoscopic, minimally invasive", "بالمنظار وبأقل تدخل") },
        { img: "assets/img/services/hernia.jpg", n: t("جراحی فتق", "Hernia Repair", "إصلاح الفتق"), d: t("انواع فتق شکمی و اینگوینال", "Abdominal & inguinal hernias", "فتق البطن والفتق الإربي") },
        { img: "assets/img/services/colon.jpg", n: t("جراحی روده", "Bowel Surgery", "جراحة الأمعاء"), d: t("بیماری‌های روده بزرگ و کوچک", "Small & large bowel conditions", "أمراض الأمعاء الدقيقة والغليظة") },
        { img: "assets/img/services/stomach.jpg", n: t("جراحی معده و چاقی", "Gastric & Bariatric Surgery", "جراحة المعدة والسمنة"), d: t("جراحی دستگاه گوارش و جراحی چاقی", "Digestive & weight-loss surgery", "جراحة الجهاز الهضمي والسمنة") },
        { img: "assets/img/services/thyroid.jpg", n: t("جراحی تیروئید", "Thyroid Surgery", "جراحة الغدة الدرقية"), d: t("برداشت ندول و بیماری‌های تیروئید", "Nodules & thyroid disease", "العقيدات وأمراض الغدة الدرقية") }
      ] },
    { id: "gyn", doc: "gyn", img: "assets/img/services/cat-gyn.jpg", icon: "i-women", floor: 2,
      name: t("زنان، زایمان و ناباروری", "Gynecology & Infertility", "النساء والولادة والعقم"),
      desc: t("جراحی‌های تخصصی زنان در اتاق عمل اختصاصی و درمان ناباروری؛ با بخش بستری ۲۵ تخته زنان در طبقه‌ای مجزا و آرام.",
              "Specialist gynecologic surgery in a dedicated OR and infertility treatment, with a 25-bed women's ward on its own calm floor.",
              "جراحات نسائية تخصصية في غرفة عمليات مخصصة وعلاج العقم، مع قسم تنويم نسائي بسعة ٢٥ سريرًا في طابق مستقل وهادئ."),
      benefits: [{ i: "i-women", t: t("اتاق عمل اختصاصی زنان", "Dedicated gynecology OR", "غرفة عمليات نسائية مخصصة") }, { i: "i-bed", t: t("بخش بستری ۲۵ تخته زنان", "25-bed women's ward", "قسم نساء بـ٢٥ سريراً") }, { i: "i-heart", t: t("درمان نازایی در کنار جراحی", "Infertility care alongside surgery", "علاج العقم إلى جانب الجراحة") }],
      items: [
        { icon: "i-scalpel", n: t("جراحی‌های تخصصی زنان", "Gynecologic Surgery", "الجراحات النسائية"), d: t("در اتاق عمل اختصاصی زنان", "In a dedicated gynecology OR", "في غرفة عمليات نسائية مخصصة") },
        { icon: "i-women", n: t("درمان ناباروری", "Infertility Treatment", "علاج العقم"), d: t("بررسی و برنامه درمان", "Assessment & treatment plan", "التقييم وخطة العلاج") },
        { icon: "i-heart", n: t("بارداری و زایمان", "Pregnancy & Childbirth", "الحمل والولادة"), d: t("مراقبت تا زمان زایمان", "Care through delivery", "رعاية حتى الولادة") },
        { icon: "i-bed", n: t("بستری زنان", "Women's Ward", "تنويم النساء"), d: t("۲۵ تخت در طبقه اول", "25 beds, 1st floor", "٢٥ سريرًا في الطابق الأول") }
      ] },
    { id: "uro", doc: "uro", img: "assets/img/services/cat-uro.jpg", icon: "i-kidney", floor: 2,
      name: t("ارولوژی و مجاری ادراری", "Urology", "المسالك البولية"),
      desc: t("درمان سنگ و بیماری‌های کلیه و مجاری ادراری با یورتروسکوپ، سیستوسکوپ و دستگاه سنگ‌شکن در اتاق‌های عمل طبقه دوم.",
              "Treatment of kidney stones and urinary tract disease with ureteroscopy, cystoscopy and lithotripsy in the 2nd-floor operating rooms.",
              "علاج حصى الكلى وأمراض المسالك البولية بتنظير الحالب والمثانة وجهاز تفتيت الحصى في غرف عمليات الطابق الثاني."),
      benefits: [{ i: "i-kidney", t: t("سنگ‌شکن کلیه در مرکز", "In-house lithotripsy", "تفتيت الحصى داخل المركز") }, { i: "i-search", t: t("یورتروسکوپی و سیستوسکوپی", "Ureteroscopy & cystoscopy", "تنظير الحالب والمثانة") }, { i: "i-scalpel", t: t("درمان بدون جراحی باز", "No open surgery needed", "علاج دون جراحة مفتوحة") }],
      items: [
        { icon: "i-kidney", n: t("سنگ‌شکن کلیه", "Kidney Lithotripsy", "تفتيت حصى الكلى"), d: t("خرد کردن سنگ بدون جراحی باز", "Stone breaking without open surgery", "تفتيت الحصى دون جراحة مفتوحة") },
        { icon: "i-search", n: t("یورتروسکوپی", "Ureteroscopy", "تنظير الحالب"), d: t("درمان سنگ حالب با آندوسکوپ", "Endoscopic ureteral stones", "علاج حصى الحالب بالمنظار") },
        { icon: "i-eye", n: t("سیستوسکوپی", "Cystoscopy", "تنظير المثانة"), d: t("بررسی و درمان مثانه", "Bladder diagnosis & treatment", "تشخيص وعلاج المثانة") },
        { icon: "i-scalpel", n: t("جراحی مجاری ادراری", "Urinary Tract Surgery", "جراحة المسالك البولية"), d: t("اعمال جراحی کلیه و مجاری", "Kidney & tract procedures", "عمليات الكلى والمسالك") }
      ] },
    { id: "ortho", doc: "ortho", img: "assets/img/services/or.jpg", icon: "i-bone", floor: 2,
      name: t("ارتوپدی", "Orthopedics", "جراحة العظام"),
      desc: t("جراحی‌های استخوان و مفاصل در اتاق‌های عمل طبقه دوم با دیواره استیل و فیلتراسیون پیشرفته هوا.",
              "Bone and joint surgery in the 2nd-floor operating rooms with steel walls and advanced air filtration.",
              "جراحات العظام والمفاصل في غرف عمليات الطابق الثاني بجدران فولاذية وترشيح هواء متقدم."),
      benefits: [{ i: "i-bone", t: t("جراحی استخوان و مفاصل", "Bone & joint surgery", "جراحة العظام والمفاصل") }, { i: "i-search", t: t("آرتروسکوپی با برش کوچک", "Keyhole arthroscopy", "تنظير المفصل بشق صغير") }, { i: "i-air", t: t("اتاق عمل با فیلتراسیون پیشرفته هوا", "Advanced air-filtered OR", "غرفة عمليات بترشيح هواء متقدم") }],
      items: [
        { icon: "i-bone", n: t("جراحی شکستگی‌ها", "Fracture surgery", "جراحة الكسور"), d: t("فیکس کردن استخوان", "Bone fixation", "تثبيت العظام") },
        { icon: "i-scalpel", n: t("جراحی مفاصل", "Joint surgery", "جراحة المفاصل"), d: t("زانو، شانه و لگن", "Knee, shoulder & hip", "الركبة والكتف والورك") },
        { icon: "i-search", n: t("آرتروسکوپی", "Arthroscopy", "تنظير المفصل"), d: t("جراحی مفصل با برش کوچک", "Keyhole joint surgery", "جراحة المفصل بشق صغير") }
      ] },
    { id: "plastic", doc: "plastic", img: "assets/img/services/hero.jpg", icon: "i-scalpel", floor: 2,
      name: t("جراحی پلاستیک و زیبایی", "Plastic & Cosmetic Surgery", "الجراحة التجميلية والترميمية"),
      desc: t("جراحی‌های پلاستیک، ترمیمی و زیبایی در اتاق‌های عمل طبقه دوم، با تیم بیهوشی و بخش بستری مجزا.",
              "Plastic, reconstructive and cosmetic surgery in the 2nd-floor operating rooms, with a dedicated anesthesia team and ward.",
              "الجراحة التجميلية والترميمية في غرف عمليات الطابق الثاني مع فريق تخدير وقسم تنويم مستقل."),
      benefits: [{ i: "i-scalpel", t: t("جراحی زیبایی و ترمیمی", "Cosmetic & reconstructive", "تجميلية وترميمية") }, { i: "i-steth", t: t("تیم بیهوشی اختصاصی", "Dedicated anesthesia team", "فريق تخدير مخصص") }, { i: "i-bed", t: t("بستری و مراقبت پس از عمل", "Inpatient aftercare", "تنويم ورعاية بعد العملية") }],
      items: [
        { icon: "i-scalpel", n: t("لیپوساکشن", "Liposuction", "شفط الدهون"), d: t("فرم‌دهی بدن", "Body contouring", "نحت الجسم") },
        { icon: "i-scalpel", n: t("ابدومینوپلاستی", "Abdominoplasty", "شد البطن"), d: t("جراحی زیبایی شکم", "Tummy tuck", "تجميل البطن") },
        { icon: "i-eye", n: t("بلفاروپلاستی", "Blepharoplasty", "تجميل الجفون"), d: t("جراحی زیبایی پلک", "Eyelid surgery", "جراحة الجفون") },
        { icon: "i-shield", n: t("جراحی‌های ترمیمی", "Reconstructive surgery", "الجراحة الترميمية"), d: t("ترمیم بافت و اسکار", "Tissue & scar repair", "ترميم الأنسجة والندبات") }
      ] },
    { id: "aes", doc: "plastic", img: "assets/img/services/cat-aes.jpg", icon: "i-laser", floor: 3,
      name: t("خدمات زیبایی، لیزر و کاشت مو و ابرو", "Aesthetics, Laser, Hair & Brow", "التجميل والليزر وزراعة الشعر والحواجب"),
      desc: t("جراحی‌های زیبایی در طبقات مجزا، کلینیک لیزر با دستگاه Honkon سه‌طول‌موجی و کلینیک کاشت مو و ابرو.",
              "Aesthetic surgery on separate floors, a laser clinic with the triple-wavelength Honkon system, and a hair & eyebrow transplant clinic.",
              "جراحات تجميلية في طوابق مستقلة، عيادة ليزر بجهاز Honkon ثلاثي الأطوال الموجية، وعيادة زراعة الشعر والحواجب."),
      benefits: [{ i: "i-laser", t: t("لیزر سه‌طول‌موج HONKON", "Triple-wavelength HONKON laser", "ليزر HONKON ثلاثي الموجات") }, { i: "i-hair", t: t("کاشت مو و ابرو به روش FIT و FUT", "FIT & FUT hair & brow transplant", "زراعة الشعر والحواجب بتقنيتي FIT وFUT") }, { i: "i-plus", t: t("بیش از ۱۰ خدمت پوست و مو", "10+ skin & hair treatments", "أكثر من ١٠ علاجات للبشرة والشعر") }],
      items: [
        { icon: "i-ear", n: t("جراحی زیبایی بینی", "Rhinoplasty", "تجميل الأنف"), d: t("در اتاق عمل ENT طبقه سوم", "In the 3rd-floor ENT OR", "في غرفة عمليات الأنف بالطابق الثالث") },
        { icon: "i-scalpel", n: t("لیپوساکشن", "Liposuction", "شفط الدهون"), d: t("با تجهیزات لیپوست و لیپوساکشن", "With modern liposuction devices", "بأجهزة شفط الدهون الحديثة") },
        { icon: "i-laser", n: t("کلینیک لیزر", "Laser Clinic", "عيادة الليزر"), d: t("Honkon · الکساندرایت، دایود، انیاگ", "Honkon · Alexandrite, Diode, Nd:YAG", "Honkon · ألكسندرايت، دايود، إندياغ") },
        { icon: "i-hair", n: t("کاشت مو و ابرو", "Hair & Eyebrow Transplant", "زراعة الشعر والحواجب"), d: t("کلینیک اختصاصی کاشت", "Dedicated transplant clinic", "عيادة زراعة مخصصة") }
      ] },
    { id: "eye", doc: "eye", img: "assets/img/services/eye.jpg", icon: "i-eye", floor: 3,
      name: t("جراحی چشم", "Eye Surgery", "جراحة العيون"),
      desc: t("جراحی قرنیه، لیزیک، لازک و اسمایل، شبکیه و آب‌مروارید با میکروسکوپ چشمی و فیکو در اتاق‌های عمل طبقه سوم.",
              "Cornea, LASIK, LASEK & SMILE, retina and cataract surgery with ophthalmic microscopes and phaco in the 3rd-floor operating rooms.",
              "جراحة القرنية والليزك واللازك والسمايل والشبكية والمياه البيضاء بالمجهر والفاكو في غرف عمليات الطابق الثالث."),
      benefits: [{ i: "i-eye", t: t("میکروسکوپ جراحی چشم", "Ophthalmic surgical microscope", "مجهر جراحي للعيون") }, { i: "i-laser", t: t("لیزیک، لازک و اسمایل", "LASIK, LASEK & SMILE", "الليزك واللازك والسمايل") }, { i: "i-building", t: t("اتاق عمل اختصاصی چشم در طبقه سوم", "Dedicated 3rd-floor eye OR", "غرفة عمليات عيون مخصصة في الطابق الثالث") }],
      items: [
        { icon: "i-laser", n: t("لیزیک، لازک و اسمایل", "LASIK, LASEK & SMILE", "الليزك واللازك والسمايل"), d: t("اصلاح عیوب انکساری", "Refractive correction", "تصحيح عيوب الانكسار") },
        { icon: "i-eye", n: t("جراحی قرنیه", "Cornea Surgery", "جراحة القرنية"), d: t("فوق تخصص قرنیه", "By a cornea sub-specialist", "على يد فوق اختصاصي القرنية") },
        { icon: "i-shield", n: t("جراحی شبکیه", "Retina Surgery", "جراحة الشبكية"), d: t("ویتره و رتین", "Vitreoretinal", "الشبكية والجسم الزجاجي") },
        { icon: "i-search", n: t("آب‌مروارید (فیکو)", "Cataract (Phaco)", "المياه البيضاء (فاكو)"), d: t("با دستگاه فیکو", "Phacoemulsification", "بجهاز الفاكو") }
      ] },
    { id: "ent", doc: "ent", img: "assets/img/services/ent.jpg", icon: "i-ear", floor: 3,
      name: t("گوش، حلق و بینی", "Ear, Nose & Throat", "الأنف والأذن والحنجرة"),
      desc: t("جراحی‌های گوش، حلق و بینی و سر و گردن، آندوسکوپی سینوس و جراحی زیبایی بینی با آندوسکوپ تخصصی در طبقه سوم.",
              "ENT and head & neck surgery, endoscopic sinus surgery and rhinoplasty with specialist endoscopes on the 3rd floor.",
              "جراحات الأنف والأذن والحنجرة والرأس والعنق وتنظير الجيوب وتجميل الأنف بمناظير تخصصية في الطابق الثالث."),
      benefits: [{ i: "i-search", t: t("آندوسکوپ تخصصی سینوس", "Specialist sinus endoscopes", "مناظير جيوب أنفية متخصصة") }, { i: "i-ear", t: t("جراحی زیبایی و عملکردی بینی", "Cosmetic & functional rhinoplasty", "تجميل الأنف الوظيفي والجمالي") }, { i: "i-shield", t: t("جراحی سر و گردن", "Head & neck surgery", "جراحة الرأس والعنق") }],
      items: [
        { icon: "i-search", n: t("آندوسکوپی سینوس", "Endoscopic Sinus Surgery", "تنظير الجيوب الأنفية"), d: t("بدون برش خارجی", "No external incision", "دون شق خارجي") },
        { icon: "i-ear", n: t("جراحی بینی", "Nasal Surgery", "جراحة الأنف"), d: t("زیبایی و انحراف تیغه", "Rhinoplasty & septum", "التجميل وانحراف الحاجز") },
        { icon: "i-scalpel", n: t("لوزه و آدنوئید", "Tonsils & Adenoids", "اللوزتان واللحمية"), d: t("جراحی حلق", "Throat surgery", "جراحة الحلق") },
        { icon: "i-shield", n: t("جراحی سر و گردن", "Head & Neck Surgery", "جراحة الرأس والعنق"), d: t("توسط جراحان ENT", "By ENT surgeons", "على يد جراحي الأنف والأذن") }
      ] },
    { id: "endo", doc: "gi", img: "assets/img/services/stomach.jpg", icon: "i-search", floor: -1,
      name: t("آندوسکوپی و کولونوسکوپی", "Endoscopy & Colonoscopy", "التنظير الداخلي وتنظير القولون"),
      desc: t("خدمات اسکوپی در طبقه زیرزمین؛ آندوسکوپی دستگاه گوارش فوقانی و کولونوسکوپی برای تشخیص و درمان.",
              "Scopy services on the basement floor — upper GI endoscopy and colonoscopy for diagnosis and treatment.",
              "خدمات المناظير في الطابق السفلي: تنظير الجهاز الهضمي العلوي وتنظير القولون للتشخيص والعلاج."),
      benefits: [{ i: "i-search", t: t("تشخیص دقیق با دید مستقیم", "Accurate, direct-view diagnosis", "تشخيص دقيق بالرؤية المباشرة") }, { i: "i-scalpel", t: t("برداشتن پولیپ حین اسکوپی", "Polyp removal during the scope", "استئصال السلائل أثناء التنظير") }, { i: "i-clock", t: t("روش سرپایی و کوتاه", "Short outpatient procedure", "إجراء قصير دون تنويم") }],
      items: [
        { icon: "i-search", n: t("آندوسکوپی", "Upper GI endoscopy", "التنظير العلوي"), d: t("بررسی مری، معده و اثنی‌عشر", "Esophagus, stomach & duodenum", "المريء والمعدة والاثني عشر") },
        { icon: "i-search", n: t("کولونوسکوپی", "Colonoscopy", "تنظير القولون"), d: t("بررسی روده بزرگ", "Large bowel examination", "فحص الأمعاء الغليظة") },
        { icon: "i-scalpel", n: t("برداشتن پولیپ و نمونه‌برداری", "Polyp removal & biopsy", "استئصال السلائل والخزعة"), d: t("حین اسکوپی", "During the scope", "أثناء التنظير") },
        { icon: "i-clipboard", n: t("آمادگی پیش از اسکوپی", "Scope preparation", "التحضير للتنظير"), d: t("ناشتایی و آمادگی روده", "Fasting & bowel prep", "الصيام وتحضير الأمعاء") }
      ] },
    { id: "anes", doc: "anes", img: "assets/img/guide/v-doctor.jpg", icon: "i-steth", floor: 0,
      name: t("کلینیک بیهوشی", "Anesthesia Clinic", "عيادة التخدير"),
      desc: t("کلینیک بیهوشی در طبقه همکف؛ ارزیابی و مشاوره بیهوشی پیش از عمل زیر نظر متخصصان بیهوشی مرکز.",
              "Anesthesia clinic on the ground floor — pre-operative anesthesia assessment and consultation with our anesthesiologists.",
              "عيادة التخدير في الطابق الأرضي؛ تقييم واستشارة التخدير قبل العملية بإشراف أخصائيي التخدير في المركز."),
      benefits: [{ i: "i-steth", t: t("ارزیابی جامع پیش از بیهوشی", "Full pre-anesthesia assessment", "تقييم شامل قبل التخدير") }, { i: "i-shield", t: t("مراقبت قبل، حین و بعد از عمل", "Care before, during & after surgery", "رعاية قبل العملية وأثناءها وبعدها") }, { i: "i-team", t: t("۸ متخصص بیهوشی", "8 anesthesiologists", "٨ أخصائيي تخدير") }],
      items: [
        { icon: "i-steth", n: t("مشاوره بیهوشی پیش از عمل", "Pre-op anesthesia consultation", "استشارة التخدير قبل العملية"), d: t("دیدار با متخصص بیهوشی", "Meet the anesthesiologist", "لقاء أخصائي التخدير") },
        { icon: "i-clipboard", n: t("بررسی سوابق و داروها", "History & medication review", "مراجعة السوابق والأدوية"), d: t("ارزیابی جامع پیش از بیهوشی", "Full pre-anesthesia assessment", "تقييم شامل قبل التخدير") },
        { icon: "i-shield", n: t("آموزش آمادگی پیش از عمل", "Pre-op preparation guidance", "إرشادات الاستعداد للعملية"), d: t("ناشتایی، داروها و خطرها", "Fasting, medicines & risks", "الصيام والأدوية والمخاطر") }
      ] }
  ];
  /* two groups: «خدمات جراحی» and «خدمات پزشکی» (order as requested by the client) */
  var ORDER = { surg: ["gen", "plastic", "ortho", "uro", "eye", "ent", "gyn"], med: ["aes", "anes", "endo"] };
  var byId = {}; window.SERVICE_CATS.forEach(function (c) { byId[c.id] = c; });
  window.SERVICE_CATS = ORDER.surg.map(function (id) { byId[id].group = "surg"; return byId[id]; })
    .concat(ORDER.med.map(function (id) { byId[id].group = "med"; return byId[id]; }));

})();
