import type { Locale } from "@/core/i18n/locales";

export interface InternationalPatientsCopy {
  pageTitle: string;
  homeTeaser: {
    title: string;
    lead: string;
    action: string;
  };
  hero: {
    title: readonly [string, string];
    lead: string;
    primaryAction: string;
    secondaryAction: string;
    imageAlt: string;
    imageCaption: string;
  };
  services: {
    title: string;
    lead: string;
    surgical: string;
    medical: string;
    doctors: string;
  };
  journey: {
    title: string;
    lead: string;
    steps: ReadonlyArray<{ title: string; body: string }>;
  };
  checklist: {
    title: string;
    body: string;
    admissionAction: string;
  };
  faq: {
    title: string;
    items: ReadonlyArray<{ question: string; answer: string }>;
  };
  contact: {
    title: string;
    address: string;
    phoneLabel: string;
    emergency: string;
    callAction: string;
    guideAction: string;
  };
}

/**
 * Canonical Persian copy is transcribed from the owner-provided
 * `international-patients.html` reference. English and Arabic are faithful
 * translations of that same copy; no service, guarantee, price, or medical
 * claim has been added.
 */
export const internationalPatientsCopy = {
  fa: {
    pageTitle: "بیماران بین‌الملل",
    homeTeaser: {
      title: "بیماران بین‌الملل؛ هماهنگی پیش از سفر",
      lead: "مراحل بررسی اولیه، مدارک مورد نیاز، پذیرش و پیگیری درمان را پیش از برنامه‌ریزی سفر به کاشان ببینید.",
      action: "راهنمای بیماران بین‌الملل",
    },
    hero: {
      title: ["پیش از سفر،", "مسیر درمان را روشن کنید."],
      lead:
        "اگر برای درمان از خارج از ایران به کاشان سفر می‌کنید، ابتدا با پذیرش مرکز جراحی دکتر خیرخواه هماهنگ کنید. بررسی مدارک، امکان ارائه خدمت و زمان مراجعه باید پیش از برنامه‌ریزی سفر مشخص شود.",
      primaryAction: "تماس برای هماهنگی اولیه",
      secondaryAction: "آشنایی با مراحل مراجعه",
      imageAlt: "ساختمان مرکز جراحی دکتر خیرخواه در کاشان",
      imageCaption: "مرکز جراحی دکتر خیرخواه · کاشان",
    },
    services: {
      title: "چه خدماتی را می‌توانید بررسی کنید؟",
      lead:
        "حوزه‌های جراحی و خدمات پزشکی مرکز را ببینید. امکان پذیرش هر بیمار و انتخاب درمان، پس از بررسی وضعیت او توسط پزشک مشخص می‌شود.",
      surgical: "خدمات جراحی",
      medical: "خدمات پزشکی",
      doctors: "آشنایی با پزشکان",
    },
    journey: {
      title: "از اولین تماس تا پیگیری پس از درمان",
      lead: "پیش از خرید بلیت یا رزرو محل اقامت، زمان و شرایط مراجعه را با مرکز تأیید کنید.",
      steps: [
        {
          title: "تماس و معرفی درخواست",
          body:
            "نوع خدمت مورد نظر، خلاصه مشکل، کشور محل اقامت و راه ارتباطی در دسترس خود را به پذیرش اعلام کنید. زبان مورد نیاز و امکان هماهنگی مترجم در همین مرحله بررسی می‌شود.",
        },
        {
          title: "آماده‌سازی و بررسی مدارک",
          body:
            "گزارش‌های پزشکی، نتایج بررسی‌های قبلی و فهرست داروها را آماده کنید. روش امن تحویل مدارک و نیاز احتمالی به ترجمه را از مرکز بپرسید؛ مدارک حساس را در مسیر عمومی ارسال نکنید.",
        },
        {
          title: "هماهنگی نوبت و برآورد اولیه",
          body:
            "پس از بررسی اولیه، درباره امکان مراجعه، ارزیابی حضوری و حدود هزینه با مرکز هماهنگ کنید. برآورد اولیه به معنای تشخیص قطعی، تأیید عمل یا قیمت نهایی نیست.",
        },
        {
          title: "مراجعه و پذیرش",
          body:
            "اصل گذرنامه یا مدرک شناسایی معتبر، مدارک پزشکی و دستور بستری در صورت صدور را همراه داشته باشید. شرایط همراه، پرداخت و پوشش بیمه را پیش از مراجعه بررسی کنید.",
        },
        {
          title: "ترخیص و ادامه مراقبت",
          body:
            "پیش از خروج، دستورهای مکتوب مراقبت، نسخه دارویی، مدارک درمان و زمان پیگیری را دریافت کنید. زمان مناسب سفر و پرواز پس از عمل را پزشک معالج تعیین می‌کند.",
        },
      ],
    },
    checklist: {
      title: "پیش از حرکت، این موارد را هماهنگ کنید",
      body:
        "نوبت تأییدشده، مدارک و ترجمه مورد نیاز، روش پرداخت، شرایط بیمه، مدت احتمالی حضور و نیاز به همراه. درباره خدماتی مانند مترجم، اقامت یا رفت‌وآمد نیز مستقیماً از مرکز استعلام بگیرید؛ در این صفحه تعهدی برای ارائه رایگان این خدمات وجود ندارد.",
      admissionAction: "راهنمای پذیرش و ترخیص",
    },
    faq: {
      title: "پرسش‌های پیش از سفر",
      items: [
        {
          question: "آیا مشاوره اولیه جای معاینه را می‌گیرد؟",
          answer:
            "خیر. بررسی اولیه برای هماهنگی است و تصمیم درمانی به ارزیابی پزشک و در صورت نیاز معاینه حضوری بستگی دارد.",
        },
        {
          question: "هزینه درمان و بیمه چگونه مشخص می‌شود؟",
          answer:
            "برای اطلاع از حدود هزینه، به واحد درآمد و ترخیص مراجعه کنید. پذیرش بیمه خارجی و مدارک لازم برای بازپرداخت باید پیش از سفر با مرکز و بیمه‌گر بررسی شود.",
        },
        {
          question: "آیا ویزا، هتل و ترانسفر تضمین می‌شود؟",
          answer:
            "در این صفحه چنین خدمتی تضمین نشده است. شرایط ورود و اقامت را از مراجع رسمی و امکانات احتمالی هماهنگی را از پذیرش مرکز بپرسید.",
        },
        {
          question: "چه زمانی می‌توانم به کشور خود برگردم؟",
          answer:
            "زمان بازگشت به نوع درمان و وضعیت شما بستگی دارد. تأیید پزشک معالج و هماهنگی پیگیری پس از درمان ضروری است.",
        },
      ],
    },
    contact: {
      title: "هماهنگی با پذیرش مرکز",
      address: "کاشان، خیابان امیرکبیر، کوچه شهید ظهیری",
      phoneLabel: "شماره تماس درج‌شده مرکز:",
      emergency:
        "برای وضعیت اورژانسی منتظر پاسخ یا نوبت مرکز نمانید و به خدمات فوریت‌های پزشکی محل حضور خود مراجعه کنید.",
      callAction: "تماس با پذیرش",
      guideAction: "راهنمای قبل و بعد از عمل",
    },
  },
  en: {
    pageTitle: "International patients",
    homeTeaser: {
      title: "International patients: coordinate before travelling",
      lead: "Review the initial assessment, required documents, admission, and treatment follow-up before planning your trip to Kashan.",
      action: "International patient guide",
    },
    hero: {
      title: ["Before you travel,", "make your treatment path clear."],
      lead:
        "If you are travelling to Kashan from outside Iran for treatment, first coordinate with admissions at Dr. Kheirkhah Surgical Center. Your documents, eligibility for the requested service, and visit timing must be reviewed before you plan your trip.",
      primaryAction: "Call for initial coordination",
      secondaryAction: "See the visit steps",
      imageAlt: "Dr. Kheirkhah Surgical Center building in Kashan",
      imageCaption: "Dr. Kheirkhah Surgical Center · Kashan",
    },
    services: {
      title: "Which services can you explore?",
      lead:
        "Explore the center’s surgical fields and medical services. Whether a patient can be admitted and which treatment is appropriate are determined after a physician reviews their condition.",
      surgical: "Surgical services",
      medical: "Medical services",
      doctors: "Meet the doctors",
    },
    journey: {
      title: "From the first call to follow-up after treatment",
      lead: "Confirm the timing and conditions of your visit with the center before buying a ticket or booking accommodation.",
      steps: [
        {
          title: "Contact admissions and explain your request",
          body:
            "Tell admissions which service you need, briefly describe the problem, state your country of residence, and provide a reliable way to contact you. The required language and whether an interpreter can be coordinated are reviewed at this stage.",
        },
        {
          title: "Prepare and review your documents",
          body:
            "Prepare your medical reports, previous test results, and medication list. Ask the center how to deliver documents securely and whether translation may be needed; do not send sensitive documents through public channels.",
        },
        {
          title: "Coordinate the appointment and preliminary estimate",
          body:
            "After the initial review, coordinate with the center about whether a visit is possible, the in-person assessment, and the approximate cost. A preliminary estimate is not a final diagnosis, approval for surgery, or a final price.",
        },
        {
          title: "Arrival and admission",
          body:
            "Bring your original passport or another valid identity document, medical records, and an admission order if one has been issued. Review companion, payment, and insurance conditions before arrival.",
        },
        {
          title: "Discharge and continuing care",
          body:
            "Before leaving, receive written care instructions, your prescription, treatment records, and the follow-up schedule. Your treating physician determines when it is appropriate to travel or fly after surgery.",
        },
      ],
    },
    checklist: {
      title: "Coordinate these items before you leave",
      body:
        "A confirmed appointment, required documents and translations, payment method, insurance conditions, the likely length of stay, and whether you need a companion. Ask admissions directly about possible interpreter, accommodation, or transport coordination; this page does not promise that these services are provided free of charge.",
      admissionAction: "Admission and discharge guide",
    },
    faq: {
      title: "Questions before travelling",
      items: [
        {
          question: "Does the initial consultation replace an examination?",
          answer:
            "No. The initial review is for coordination. Treatment decisions depend on a physician’s assessment and, when needed, an in-person examination.",
        },
        {
          question: "How are treatment costs and insurance determined?",
          answer:
            "Contact the revenue and discharge unit for an approximate cost. Acceptance of foreign insurance and the documents required for reimbursement must be checked with the center and the insurer before travel.",
        },
        {
          question: "Are visas, hotels, and transfers guaranteed?",
          answer:
            "No such service is guaranteed on this page. Check entry and accommodation conditions with official authorities and ask the center’s admissions team about any possible coordination.",
        },
        {
          question: "When can I return to my country?",
          answer:
            "The timing depends on your treatment and condition. Approval from your treating physician and coordination of follow-up care are essential.",
        },
      ],
    },
    contact: {
      title: "Coordinate with the center’s admissions team",
      address: "Shahid Zahiri Alley, Amir Kabir Street, Kashan",
      phoneLabel: "Center telephone number:",
      emergency:
        "For an emergency, do not wait for a reply or an appointment from the center; seek local emergency medical care where you are.",
      callAction: "Call admissions",
      guideAction: "Before and after surgery guide",
    },
  },
  ar: {
    pageTitle: "المرضى الدوليون",
    homeTeaser: {
      title: "المرضى الدوليون؛ التنسيق قبل السفر",
      lead: "تعرّفوا على خطوات المراجعة الأولية والمستندات المطلوبة والقبول ومتابعة العلاج قبل التخطيط للسفر إلى كاشان.",
      action: "دليل المرضى الدوليين",
    },
    hero: {
      title: ["قبل السفر،", "اجعلوا مسار العلاج واضحًا."],
      lead:
        "إذا كنتم تسافرون إلى كاشان من خارج إيران للعلاج، فنسّقوا أولًا مع قسم الاستقبال في مركز الدكتور خيرخواه للجراحة. يجب مراجعة المستندات وإمكان تقديم الخدمة وموعد المراجعة قبل التخطيط للسفر.",
      primaryAction: "الاتصال للتنسيق الأولي",
      secondaryAction: "التعرّف على مراحل المراجعة",
      imageAlt: "مبنى مركز الدكتور خيرخواه للجراحة في كاشان",
      imageCaption: "مركز الدكتور خيرخواه للجراحة · كاشان",
    },
    services: {
      title: "ما الخدمات التي يمكنكم الاطلاع عليها؟",
      lead:
        "تعرّفوا على مجالات الجراحة والخدمات الطبية في المركز. تُحدَّد إمكانات قبول كل مريض والعلاج المناسب بعد أن يراجع الطبيب حالته.",
      surgical: "الخدمات الجراحية",
      medical: "الخدمات الطبية",
      doctors: "التعرّف على الأطباء",
    },
    journey: {
      title: "من الاتصال الأول حتى المتابعة بعد العلاج",
      lead: "أكّدوا موعد المراجعة وشروطها مع المركز قبل شراء التذكرة أو حجز مكان الإقامة.",
      steps: [
        {
          title: "الاتصال وشرح الطلب",
          body:
            "أبلغوا الاستقبال بنوع الخدمة المطلوبة، وملخص المشكلة، وبلد الإقامة، ووسيلة اتصال موثوقة. وتُراجع في هذه المرحلة اللغة المطلوبة وإمكان تنسيق مترجم.",
        },
        {
          title: "إعداد المستندات ومراجعتها",
          body:
            "جهّزوا التقارير الطبية ونتائج الفحوص السابقة وقائمة الأدوية. اسألوا المركز عن الطريقة الآمنة لتسليم المستندات والحاجة المحتملة إلى الترجمة؛ ولا ترسلوا المستندات الحساسة عبر قنوات عامة.",
        },
        {
          title: "تنسيق الموعد والتقدير الأولي",
          body:
            "بعد المراجعة الأولية، نسّقوا مع المركز بشأن إمكان الحضور والتقييم الحضوري والتكلفة التقريبية. ولا يُعدّ التقدير الأولي تشخيصًا نهائيًا أو موافقة على العملية أو سعرًا نهائيًا.",
        },
        {
          title: "الحضور والقبول",
          body:
            "أحضروا أصل جواز السفر أو وثيقة هوية سارية، والمستندات الطبية، وأمر الدخول إلى المستشفى إن صدر. راجعوا شروط المرافق والدفع والتغطية التأمينية قبل الحضور.",
        },
        {
          title: "الخروج واستمرار الرعاية",
          body:
            "قبل المغادرة، استلموا تعليمات الرعاية المكتوبة والوصفة الدوائية ومستندات العلاج وموعد المتابعة. ويحدّد الطبيب المعالج الوقت المناسب للسفر أو الطيران بعد العملية.",
        },
      ],
    },
    checklist: {
      title: "نسّقوا هذه الأمور قبل المغادرة",
      body:
        "الموعد المؤكَّد، والمستندات والترجمات المطلوبة، وطريقة الدفع، وشروط التأمين، والمدة المحتملة للإقامة، والحاجة إلى مرافق. واسألوا المركز مباشرة عن إمكان تنسيق مترجم أو إقامة أو تنقّل؛ فهذه الصفحة لا تتعهد بتقديم هذه الخدمات مجانًا.",
      admissionAction: "دليل القبول والخروج",
    },
    faq: {
      title: "أسئلة قبل السفر",
      items: [
        {
          question: "هل تغني الاستشارة الأولية عن الفحص؟",
          answer:
            "لا. المراجعة الأولية مخصّصة للتنسيق، ويعتمد القرار العلاجي على تقييم الطبيب والفحص الحضوري عند الحاجة.",
        },
        {
          question: "كيف تُحدَّد تكلفة العلاج والتأمين؟",
          answer:
            "للاستفسار عن التكلفة التقريبية، تواصلوا مع وحدة الإيرادات والخروج. ويجب التحقق قبل السفر من قبول التأمين الأجنبي والمستندات اللازمة للاسترداد مع المركز وشركة التأمين.",
        },
        {
          question: "هل التأشيرة والفندق والنقل مضمونة؟",
          answer:
            "لا تضمن هذه الصفحة أيًا من هذه الخدمات. تحقّقوا من شروط الدخول والإقامة لدى الجهات الرسمية، واسألوا قسم الاستقبال عن إمكانات التنسيق المتاحة.",
        },
        {
          question: "متى يمكنني العودة إلى بلدي؟",
          answer:
            "يعتمد موعد العودة على نوع العلاج وحالتكم. وتبقى موافقة الطبيب المعالج وتنسيق المتابعة بعد العلاج أمرين ضروريين.",
        },
      ],
    },
    contact: {
      title: "التنسيق مع قسم الاستقبال في المركز",
      address: "كاشان، شارع أمير كبير، زقاق الشهيد ظهيري",
      phoneLabel: "رقم هاتف المركز:",
      emergency:
        "في الحالات الطارئة، لا تنتظروا رد المركز أو موعده، وراجعوا خدمات الطوارئ الطبية في مكان وجودكم.",
      callAction: "الاتصال بالاستقبال",
      guideAction: "دليل ما قبل العملية وما بعدها",
    },
  },
} as const satisfies Record<Locale, InternationalPatientsCopy>;
