import type { Locale } from "@/core/i18n/locales";

interface ServicePathCopy {
  title: string;
  description: string;
  action: string;
  imageAlt: string;
}

interface ServicesPageCopy {
  gateway: {
    pageTitle: string;
    title: string;
    lead: string;
    pathsLabel: string;
    surgical: ServicePathCopy;
    medical: ServicePathCopy;
    helpTitle: string;
    helpLead: string;
    callAction: string;
  };
  groups: {
    surgicalLead: string;
    medicalLead: string;
  };
}

/**
 * The Persian strings are transcribed from the current reference gateway and
 * group pages. English and Arabic faithfully translate that same content;
 * they do not add services, outcomes, or medical claims.
 */
export const servicesPageCopy = {
  fa: {
    gateway: {
      pageTitle: "خدمات",
      title: "خدمات مرکز؛ دو مسیر روشن",
      lead:
        "برای شناخت حوزه‌های درمان، خدمات پزشکی و خدمات جراحی را جداگانه ببینید. انتخاب روش مناسب درمان، با ارزیابی پزشک انجام می‌شود.",
      pathsLabel: "انتخاب خدمات",
      surgical: {
        title: "خدمات جراحی",
        description:
          "جراحی عمومی و لاپاراسکوپی، چشم، گوش و حلق و بینی، زنان، ارولوژی، ارتوپدی و جراحی پلاستیک.",
        action: "مشاهده حوزه‌های جراحی",
        imageAlt: "اتاق عمل مرکز",
      },
      medical: {
        title: "خدمات پزشکی",
        description:
          "مشاوره بیهوشی، آندوسکوپی و کولونوسکوپی، خدمات پوست و مو و کلینیک زیبایی.",
        action: "مشاهده خدمات پزشکی",
        imageAlt: "مشاوره و ارزیابی پزشکی",
      },
      helpTitle: "برای انتخاب مسیر به راهنمایی نیاز دارید؟",
      helpLead: "با پذیرش مرکز تماس بگیرید تا درباره مراجعه و انتخاب تخصص راهنمایی شوید.",
      callAction: "تماس با پذیرش",
    },
    groups: {
      surgicalLead:
        "آشنایی با حوزه‌های جراحی مرکز؛ انتخاب روش مناسب پس از معاینه و نظر پزشک مشخص می‌شود.",
      medicalLead:
        "ارزیابی بیهوشی، خدمات پوست و مو، لیزر و اسکوپی؛ حوزه مورد نظر را انتخاب کنید.",
    },
  },
  en: {
    gateway: {
      pageTitle: "Services",
      title: "Center services: two clear paths",
      lead:
        "Explore the center’s medical and surgical fields separately. The appropriate treatment method is selected after a physician’s assessment.",
      pathsLabel: "Choose a service path",
      surgical: {
        title: "Surgical services",
        description:
          "General and laparoscopic surgery, ophthalmology, ear, nose and throat, gynecology, urology, orthopedics, and plastic surgery.",
        action: "Explore surgical fields",
        imageAlt: "The center’s operating room",
      },
      medical: {
        title: "Medical services",
        description:
          "Anesthesia consultation, endoscopy and colonoscopy, skin and hair services, and the aesthetics clinic.",
        action: "Explore medical services",
        imageAlt: "Medical consultation and assessment",
      },
      helpTitle: "Need help choosing a path?",
      helpLead: "Call admissions for guidance about your visit and the appropriate specialty.",
      callAction: "Call admissions",
    },
    groups: {
      surgicalLead:
        "Explore the center’s surgical fields; the appropriate method is determined after examination and a physician’s assessment.",
      medicalLead:
        "Anesthesia assessment, skin and hair services, laser, and endoscopy; choose the field you need.",
    },
  },
  ar: {
    gateway: {
      pageTitle: "الخدمات",
      title: "خدمات المركز؛ مساران واضحان",
      lead:
        "تعرّفوا على مجالات العلاج من خلال الخدمات الطبية والخدمات الجراحية كلٌّ على حدة. ويُختار العلاج المناسب بعد تقييم الطبيب.",
      pathsLabel: "اختيار مسار الخدمات",
      surgical: {
        title: "الخدمات الجراحية",
        description:
          "الجراحة العامة والمناظير، والعيون، والأنف والأذن والحنجرة، والنسائية، والمسالك البولية، والعظام، والجراحة التجميلية.",
        action: "عرض المجالات الجراحية",
        imageAlt: "غرفة العمليات في المركز",
      },
      medical: {
        title: "الخدمات الطبية",
        description:
          "استشارة التخدير، والتنظير الداخلي وتنظير القولون، وخدمات الجلد والشعر، وعيادة التجميل.",
        action: "عرض الخدمات الطبية",
        imageAlt: "الاستشارة والتقييم الطبي",
      },
      helpTitle: "هل تحتاجون إلى مساعدة في اختيار المسار؟",
      helpLead: "اتصلوا بقسم الاستقبال للحصول على إرشاد بشأن المراجعة واختيار التخصص.",
      callAction: "الاتصال بالاستقبال",
    },
    groups: {
      surgicalLead:
        "تعرّفوا على مجالات الجراحة في المركز؛ وتُحدَّد الطريقة المناسبة بعد الفحص ورأي الطبيب.",
      medicalLead:
        "تقييم التخدير وخدمات الجلد والشعر والليزر والتنظير؛ اختاروا المجال المطلوب.",
    },
  },
} as const satisfies Record<Locale, ServicesPageCopy>;
