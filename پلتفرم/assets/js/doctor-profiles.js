/* Full profiles — keyed by DOCTORS[].id
   Content rule: only facts published on drkheirkhahhospital.ir (specialty / fellowship) + verified center facts.
   Fields marked TODO in comments must be confirmed by each doctor before going live
   (services list, years of experience, education, personal schedule). */
window.DOCTOR_PROFILES = {

  "taheri-nassaj": {
    hero: "assets/img/doctors/hero/taheri-nassaj.jpg", heroPos: "62% 30%",
    floor: { fa: "طبقه دوم", en: "2nd floor", ar: "الطابق الثاني" },
    tag:  { fa: "جراحی عمومی · فلوشیپ لاپاراسکوپی", en: "General Surgery · Laparoscopy Fellowship", ar: "الجراحة العامة · زمالة المنظار" },
    lead: {
      fa: "متخصص جراحی عمومی با فلوشیپ لاپاراسکوپی؛ جراحی‌های کم‌تهاجمی با برش‌های کوچک، درد کمتر و بازگشت سریع‌تر به زندگی روزمره.",
      en: "General surgeon with a laparoscopy fellowship — minimally invasive surgery through small incisions, with less pain and a faster return to daily life.",
      ar: "جرّاح عام حاصل على زمالة جراحة المنظار؛ جراحات طفيفة التوغل بشقوق صغيرة وألم أقل وعودة أسرع إلى الحياة اليومية."
    },
    about: {
      fa: "دکتر حسین طاهری نساج، متخصص جراحی عمومی و دارای فلوشیپ لاپاراسکوپی، از پزشکان مرکز جراحی فوق تخصصی دکتر خیرخواه است. جراحی‌های لاپاراسکوپی به‌جای برش بزرگ، با چند برش کوچک و دوربین انجام می‌شوند و معمولاً درد پس از عمل، مدت بستری و جای زخم کمتری دارند. اعمال جراحی ایشان در اتاق‌های عمل طبقه دوم مرکز انجام می‌شود؛ اتاق‌هایی با دیواره استیل، تهویه مرکزی و تجهیزات لاپاراسکوپی روز.",
      en: "Dr. Hossein Taheri Nassaj is a general surgeon with a fellowship in laparoscopic surgery at Dr. Kheirkhah Super-Specialty Surgical Center. Instead of one large incision, laparoscopic procedures use a few small incisions and a camera, usually meaning less post-operative pain, a shorter hospital stay and smaller scars. His operations take place in the center's 2nd-floor operating rooms, with stainless-steel walls, central ventilation and modern laparoscopic equipment.",
      ar: "الدكتور حسين طاهري نساج جرّاح عام حاصل على زمالة جراحة المنظار، من أطباء مركز الدكتور خيرخواه للجراحة فوق التخصصية. تُجرى عمليات المنظار عبر شقوق صغيرة وكاميرا بدلًا من شق كبير، مما يعني غالبًا ألمًا أقل بعد العملية وإقامة أقصر وندوبًا أصغر. تُجرى عملياته في غرف عمليات الطابق الثاني المجهزة بجدران فولاذية وتهوية مركزية وأجهزة منظار حديثة."
    },
    services: [ /* TODO confirm with doctor */
      { i: "i-scalpel", fa: ["کوله‌سیستکتومی لاپاراسکوپی", "خارج کردن کیسه صفرا با روش بسته"], en: ["Laparoscopic Cholecystectomy", "Gallbladder removal, keyhole method"], ar: ["استئصال المرارة بالمنظار", "إزالة المرارة بالطريقة المغلقة"] },
      { i: "i-shield", fa: ["ترمیم فتق", "فتق شکمی، کشاله ران و ناف"], en: ["Hernia Repair", "Abdominal, inguinal & umbilical"], ar: ["إصلاح الفتق", "فتق البطن والمغبن والسرة"] },
      { i: "i-plus", fa: ["آپاندکتومی لاپاراسکوپی", "برداشتن آپاندیس با برش کوچک"], en: ["Laparoscopic Appendectomy", "Appendix removal, small incisions"], ar: ["استئصال الزائدة بالمنظار", "إزالة الزائدة بشقوق صغيرة"] },
      { i: "i-layers", fa: ["جراحی دستگاه گوارش", "اعمال جراحی عمومی شکم"], en: ["Digestive Surgery", "General abdominal procedures"], ar: ["جراحة الجهاز الهضمي", "عمليات البطن العامة"] }
    ],
    creds: [
      { fa: "متخصص جراحی عمومی", en: "Specialist in General Surgery", ar: "اختصاصي الجراحة العامة" },
      { fa: "فلوشیپ جراحی لاپاراسکوپی (درون‌بین)", en: "Fellowship in Laparoscopic Surgery", ar: "زمالة جراحة المنظار" }
    ]
  },

  "farajipour": {
    hero: "assets/img/doctors/hero/farajipour.jpg", heroPos: "50% 30%",
    floor: { fa: "طبقه سوم", en: "3rd floor", ar: "الطابق الثالث" },
    tag:  { fa: "فوق تخصص قرنیه · لیزیک، لازک و اسمایل", en: "Cornea Sub-specialist · LASIK, LASEK & SMILE", ar: "فوق اختصاصي القرنية · الليزك واللازك والسمايل" },
    lead: {
      fa: "فوق تخصص قرنیه؛ اصلاح عیوب انکساری با لیزیک، لازک و اسمایل و تشخیص و درمان بیماری‌های قرنیه.",
      en: "Cornea sub-specialist — refractive correction with LASIK, LASEK and SMILE, and diagnosis and treatment of corneal disease.",
      ar: "فوق اختصاصي القرنية؛ تصحيح عيوب الانكسار بالليزك واللازك والسمايل وتشخيص أمراض القرنية وعلاجها."
    },
    about: {
      fa: "دکتر حسن فرجی‌پور، فوق تخصص قرنیه، از پزشکان مرکز جراحی فوق تخصصی دکتر خیرخواه است. حوزه فعالیت ایشان اصلاح عیوب انکساری چشم (نزدیک‌بینی، دوربینی و آستیگمات) با روش‌های لیزیک، لازک و اسمایل و همچنین درمان بیماری‌های قرنیه است. انتخاب روش مناسب پس از معاینه و بررسی ضخامت و نقشه قرنیه انجام می‌شود. اعمال جراحی چشم در طبقه سوم مرکز و با میکروسکوپ و تجهیزات تخصصی انجام می‌شود.",
      en: "Dr. Hassan Farajipour is a cornea sub-specialist at Dr. Kheirkhah Super-Specialty Surgical Center. His work covers correction of refractive errors (myopia, hyperopia and astigmatism) with LASIK, LASEK and SMILE, as well as treatment of corneal disease. The right method is chosen after examination and corneal thickness and topography assessment. Eye surgery is performed on the center's 3rd floor with surgical microscopes and specialist equipment.",
      ar: "الدكتور حسن فرجي بور فوق اختصاصي القرنية في مركز الدكتور خيرخواه للجراحة فوق التخصصية. يشمل عمله تصحيح عيوب الانكسار (قصر النظر وطوله واللابؤرية) بالليزك واللازك والسمايل، إضافة إلى علاج أمراض القرنية. يُختار الأسلوب المناسب بعد الفحص وقياس سماكة القرنية وخريطتها. تُجرى عمليات العيون في الطابق الثالث بالمجهر الجراحي والأجهزة التخصصية."
    },
    services: [ /* LASIK/LASEK/SMILE from the official site; 4th item TODO confirm */
      { i: "i-eye", fa: ["لیزیک (LASIK)", "اصلاح نزدیک‌بینی، دوربینی و آستیگمات"], en: ["LASIK", "Myopia, hyperopia & astigmatism"], ar: ["الليزك (LASIK)", "تصحيح قصر النظر وطوله واللابؤرية"] },
      { i: "i-laser", fa: ["لازک (LASEK)", "مناسب قرنیه‌های نازک‌تر"], en: ["LASEK", "Suited to thinner corneas"], ar: ["اللازك (LASEK)", "مناسب للقرنيات الأرق"] },
      { i: "i-laser", fa: ["اسمایل (SMILE)", "اصلاح بینایی با برش بسیار کوچک"], en: ["SMILE", "Vision correction via a tiny incision"], ar: ["السمايل (SMILE)", "تصحيح النظر بشق صغير جدًا"] },
      { i: "i-shield", fa: ["بیماری‌های قرنیه", "تشخیص و درمان تخصصی"], en: ["Corneal Disease", "Specialist diagnosis & treatment"], ar: ["أمراض القرنية", "تشخيص وعلاج تخصصي"] }
    ],
    creds: [
      { fa: "متخصص چشم‌پزشکی", en: "Specialist in Ophthalmology", ar: "اختصاصي طب العيون" },
      { fa: "فوق تخصص (فلوشیپ) قرنیه و جراحی‌های انکساری", en: "Sub-specialty in Cornea & Refractive Surgery", ar: "فوق اختصاص القرنية وجراحات الانكسار" }
    ]
  },

  "nezam-zavareh": {
    hero: "assets/img/doctors/hero/nezam-zavareh.jpg", heroPos: "56% 25%",
    floor: { fa: "طبقه دوم", en: "2nd floor", ar: "الطابق الثاني" },
    tag:  { fa: "متخصص زنان، زایمان و نازایی", en: "OB-GYN & Infertility", ar: "النساء والولادة والعقم" },
    lead: {
      fa: "متخصص زنان، زایمان و نازایی؛ همراهی در مسیر بارداری، درمان ناباروری و جراحی‌های تخصصی زنان در محیطی امن و آرام.",
      en: "Obstetrician, gynecologist and infertility specialist — care through pregnancy, infertility treatment and specialist gynecologic surgery in a safe, calm setting.",
      ar: "اختصاصية النساء والولادة والعقم؛ مرافقة في رحلة الحمل وعلاج العقم والجراحات النسائية التخصصية في بيئة آمنة وهادئة."
    },
    about: {
      fa: "دکتر جمیله نظام‌زواره، متخصص زنان، زایمان و نازایی، از پزشکان مرکز جراحی فوق تخصصی دکتر خیرخواه است. حوزه فعالیت ایشان شامل مراقبت‌های دوران بارداری و زایمان، بررسی و درمان ناباروری و جراحی‌های تخصصی زنان است. جراحی‌های زنان در اتاق‌های عمل طبقه دوم مرکز انجام می‌شود و بخش بستری زنان با ۲۵ تخت در طبقه اول، دوران پس از عمل را در محیطی آرام و مجزا فراهم می‌کند.",
      en: "Dr. Jamileh Nezam-Zavareh is an obstetrician, gynecologist and infertility specialist at Dr. Kheirkhah Super-Specialty Surgical Center. Her work includes pregnancy and childbirth care, infertility assessment and treatment, and specialist gynecologic surgery. Gynecologic operations take place in the 2nd-floor operating rooms, and the 25-bed women's ward on the 1st floor offers a calm, separate space for recovery.",
      ar: "الدكتورة جميلة نظام زواره اختصاصية النساء والولادة والعقم في مركز الدكتور خيرخواه للجراحة فوق التخصصية. يشمل عملها رعاية الحمل والولادة وتقييم العقم وعلاجه والجراحات النسائية التخصصية. تُجرى الجراحات النسائية في غرف عمليات الطابق الثاني، ويوفّر قسم تنويم النساء بسعة ٢٥ سريرًا في الطابق الأول بيئة هادئة ومستقلة للتعافي."
    },
    services: [ /* TODO confirm with doctor */
      { i: "i-heart", fa: ["مراقبت بارداری و زایمان", "همراهی از آغاز بارداری تا زایمان"], en: ["Pregnancy & Childbirth", "Care from conception to delivery"], ar: ["رعاية الحمل والولادة", "مرافقة من بداية الحمل حتى الولادة"] },
      { i: "i-women", fa: ["درمان ناباروری", "بررسی علل و برنامه درمان"], en: ["Infertility Treatment", "Assessment and treatment plan"], ar: ["علاج العقم", "تقييم الأسباب وخطة العلاج"] },
      { i: "i-scalpel", fa: ["جراحی‌های تخصصی زنان", "در اتاق عمل اختصاصی زنان"], en: ["Gynecologic Surgery", "In a dedicated gynecology OR"], ar: ["الجراحات النسائية", "في غرفة عمليات نسائية مخصصة"] },
      { i: "i-clipboard", fa: ["سلامت و معاینات زنان", "معاینه و پیگیری دوره‌ای"], en: ["Women's Health Check-ups", "Routine exams & follow-up"], ar: ["فحوصات صحة المرأة", "فحص ومتابعة دورية"] }
    ],
    creds: [
      { fa: "متخصص زنان و زایمان", en: "Specialist in Obstetrics & Gynecology", ar: "اختصاصية النساء والولادة" },
      { fa: "فعالیت تخصصی در درمان نازایی", en: "Clinical focus on infertility", ar: "تخصص سريري في علاج العقم" }
    ]
  },

  "aghadoust": {
    hero: "assets/img/doctors/hero/aghadoust.jpg", heroPos: "50% 30%",
    floor: { fa: "طبقه سوم", en: "3rd floor", ar: "الطابق الثالث" },
    tag:  { fa: "فلوشیپ شبکیه (ویتره و رتین)", en: "Vitreoretinal Fellowship", ar: "زمالة الشبكية والجسم الزجاجي" },
    lead: {
      fa: "چشم‌پزشک با فلوشیپ تخصصی شبکیه (ویتره و رتین)؛ تشخیص و جراحی بیماری‌های شبکیه و زجاجیه با تجهیزات تخصصی چشم.",
      en: "Ophthalmologist with a vitreoretinal fellowship — diagnosis and surgery of retinal and vitreous disease with specialist eye equipment.",
      ar: "طبيب عيون حاصل على زمالة الشبكية والجسم الزجاجي؛ تشخيص وجراحة أمراض الشبكية والجسم الزجاجي بأجهزة العيون التخصصية."
    },
    about: {
      fa: "دکتر داوود آقادوست، دارای فلوشیپ تخصصی شبکیه (ویتره و رتین)، از پزشکان مرکز جراحی فوق تخصصی دکتر خیرخواه است. شبکیه لایه حساس پشت چشم است و بیماری‌هایی مانند جداشدگی شبکیه یا عوارض چشمی دیابت، تشخیص و درمان به‌موقع و تخصصی می‌خواهند. جراحی‌های چشم در طبقه سوم مرکز و با میکروسکوپ جراحی و تجهیزات اختصاصی چشم انجام می‌شود.",
      en: "Dr. Davoud Aghadoust holds a vitreoretinal fellowship and practices at Dr. Kheirkhah Super-Specialty Surgical Center. The retina is the sensitive layer at the back of the eye, and conditions such as retinal detachment or diabetic eye disease need timely, specialist diagnosis and treatment. Eye surgery is performed on the center's 3rd floor with surgical microscopes and dedicated ophthalmic equipment.",
      ar: "الدكتور داود آقادوست حاصل على زمالة الشبكية والجسم الزجاجي، ويعمل في مركز الدكتور خيرخواه للجراحة فوق التخصصية. الشبكية هي الطبقة الحساسة في مؤخرة العين، وتحتاج أمراض مثل انفصال الشبكية أو مضاعفات السكري على العين إلى تشخيص وعلاج تخصصي في الوقت المناسب. تُجرى عمليات العيون في الطابق الثالث بالمجهر الجراحي وأجهزة العيون المخصصة."
    },
    services: [ /* TODO confirm with doctor */
      { i: "i-eye", fa: ["ویترکتومی", "جراحی زجاجیه و شبکیه"], en: ["Vitrectomy", "Vitreous & retina surgery"], ar: ["استئصال الجسم الزجاجي", "جراحة الجسم الزجاجي والشبكية"] },
      { i: "i-shield", fa: ["جداشدگی شبکیه", "تشخیص و درمان جراحی"], en: ["Retinal Detachment", "Diagnosis & surgical repair"], ar: ["انفصال الشبكية", "التشخيص والإصلاح الجراحي"] },
      { i: "i-heart", fa: ["رتینوپاتی دیابتی", "پیگیری و درمان عوارض چشمی دیابت"], en: ["Diabetic Retinopathy", "Monitoring & treatment"], ar: ["اعتلال الشبكية السكري", "المتابعة والعلاج"] },
      { i: "i-search", fa: ["معاینه تخصصی شبکیه", "بررسی کامل ته چشم"], en: ["Retina Examination", "Full fundus assessment"], ar: ["فحص الشبكية التخصصي", "تقييم كامل لقاع العين"] }
    ],
    creds: [
      { fa: "متخصص چشم‌پزشکی", en: "Specialist in Ophthalmology", ar: "اختصاصي طب العيون" },
      { fa: "فلوشیپ تخصصی شبکیه (ویتره و رتین)", en: "Vitreoretinal (Retina) Fellowship", ar: "زمالة الشبكية والجسم الزجاجي" }
    ]
  }
};
