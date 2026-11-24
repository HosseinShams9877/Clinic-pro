import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Icon, type IconName } from "@/components/shared/Icon";
import { JsonLd } from "@/components/shared/JsonLd";
import { siteConfig } from "@/config/site.config";
import { toLocaleDigits } from "@/core/i18n/digits";
import { getLocale } from "@/core/i18n/getLocale";
import type { Locale } from "@/core/i18n/locales";
import doctorsSource from "@/modules/publicSite/content/doctors.json";
import profilesSource from "@/modules/publicSite/content/doctor-profiles.json";
import { DoctorReviews } from "@/modules/publicSite/components/DoctorReviews";
import type { PublicDoctor, PublicDoctorProfile } from "@/modules/publicSite/types";
import { routeMetadata } from "@/modules/seo/lib/metadata";

const doctors = doctorsSource.doctors as PublicDoctor[];
const categories = doctorsSource.categories as Record<string, Record<Locale, string>>;
const profiles = profilesSource as Record<string, PublicDoctorProfile>;
const homeDoctorIds = new Set(["kheirkhah", "aghadoust", "mohammad-eidi", "abolhassani"]);

function profileFor(doctor: PublicDoctor): PublicDoctorProfile | undefined {
  if (profiles[doctor.id]) return profiles[doctor.id];
  if (!homeDoctorIds.has(doctor.id)) return undefined;
  return {
    hero: doctor.photo || "",
    floor: { fa: "", en: "", ar: "" },
    tag: doctor.spec,
    lead: doctor.spec,
    about: { fa: "", en: "", ar: "" },
    services: [],
    creds: [],
  };
}

const UI = {
  fa: {
    home: "خانه",
    doctors: "پزشکان",
    doctor: "دکتر",
    specialty: "حوزه تخصصی",
    rooms: "۷ اتاق عمل",
    roomsSub: "مجهز و پیشرفته",
    safety: "ایمنی اتاق عمل",
    safetySub: "اتاق عمل با آلودگی صفر",
    floor: "محل اعمال جراحی",
    about: "درباره",
    services: "خدمات و تخصص‌ها",
    faq: "سؤالات متداول",
    mission:
      "ارائه خدمات درمانی ایمن و اثربخش با نیروی انسانی متخصص و تجهیزات نوین، مطابق استانداردهای ملی و بین‌المللی و با پایبندی به منشور حقوق بیمار و حفظ کرامت انسانی.",
    missionBy: "رسالت مرکز جراحی فوق تخصصی دکتر خیرخواه",
    book: "رزرو نوبت",
    phone: "تماس با پذیرش",
    address: "آدرس و مسیریابی",
    days: "روزهای پذیرش مرکز",
    daysNote: "برای هماهنگی روز حضور پزشک با پذیرش تماس بگیرید.",
    closed: "تعطیل",
    relatedKicker: "پزشکان هم‌رشته",
    relatedTitle: "پزشکان دیگر این بخش",
    allDoctors: "مشاهده همه پزشکان",
  },
  en: {
    home: "Home",
    doctors: "Doctors",
    doctor: "Dr.",
    specialty: "Specialty",
    rooms: "7 Operating Rooms",
    roomsSub: "Fully equipped",
    safety: "Operating-room safety",
    safetySub: "Zero-contamination ORs",
    floor: "Where surgery is done",
    about: "About",
    services: "Services & Expertise",
    faq: "FAQ",
    mission:
      "Delivering safe and effective care through expert staff and modern equipment, in line with national and international standards, with full commitment to the Patient Rights Charter and human dignity.",
    missionBy: "Mission of Dr. Kheirkhah Super-Specialty Surgical Center",
    book: "Book Appointment",
    phone: "Call admissions",
    address: "Address & directions",
    days: "Center admission days",
    daysNote: "Call admissions to arrange the doctor's visiting day.",
    closed: "Closed",
    relatedKicker: "Same specialty",
    relatedTitle: "Other doctors in this department",
    allDoctors: "View all doctors",
  },
  ar: {
    home: "الرئيسية",
    doctors: "الأطباء",
    doctor: "د.",
    specialty: "التخصص",
    rooms: "٧ غرف عمليات",
    roomsSub: "مجهزة بالكامل",
    safety: "سلامة غرفة العمليات",
    safetySub: "غرف عمليات بتلوث صفري",
    floor: "مكان إجراء العمليات",
    about: "عن",
    services: "الخدمات والتخصصات",
    faq: "الأسئلة الشائعة",
    mission:
      "تقديم رعاية آمنة وفعالة بكوادر خبيرة وتجهيزات حديثة وفق المعايير الوطنية والدولية، مع الالتزام الكامل بميثاق حقوق المريض وكرامته.",
    missionBy: "رسالة مركز الدكتور خيرخواه للجراحة فوق التخصصية",
    book: "حجز موعد",
    phone: "اتصل بالاستقبال",
    address: "العنوان والاتجاهات",
    days: "أيام استقبال المركز",
    daysNote: "اتصل بالاستقبال لتنسيق يوم حضور الطبيب.",
    closed: "مغلق",
    relatedKicker: "نفس التخصص",
    relatedTitle: "أطباء آخرون في هذا القسم",
    allDoctors: "عرض جميع الأطباء",
  },
} as const;

const DAY_NAMES: Record<Locale, readonly string[]> = {
  fa: ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"],
  en: ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  ar: ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"],
};

const FAQ: Record<Locale, readonly [string, string][]> = {
  fa: [
    ["چطور از {n} نوبت بگیرم؟", "از طریق دکمه «رزرو نوبت» یا تماس با پذیرش مرکز به شماره ۰۳۱-۵۵۱۵۴۰۰۰، شنبه تا پنجشنبه از ساعت ۷:۳۰ تا ۲۰:۰۰."],
    ["برای ویزیت یا عمل چه مدارکی همراه داشته باشم؟", "کارت ملی یا کارت شناسایی معتبر عکس‌دار، دستور بستری پزشک (در صورت عمل)، مدارک و سوابق پزشکی و فهرست داروهای مصرفی."],
    ["اعمال جراحی در کجای مرکز انجام می‌شود؟", "در اتاق‌های عمل {f} مرکز؛ با دیواره استیل، کف‌پوش ژئوفلور و تهویه مرکزی با آلودگی صفر."],
  ],
  en: [
    ["How do I book an appointment with {n}?", "Use the “Book appointment” button or call admissions on +98 31 5515 4000, Saturday to Thursday, 07:30–20:00."],
    ["What should I bring to a visit or surgery?", "National ID or valid photo ID, your doctor's admission order (for surgery), medical records and a list of your current medications."],
    ["Where are operations performed?", "In the center's {f} operating rooms, with stainless-steel walls, Geofloor flooring and zero-contamination central ventilation."],
  ],
  ar: [
    ["كيف أحجز موعدًا مع {n}؟", "عبر زر «حجز موعد» أو بالاتصال بالاستقبال على ‎+98 31 5515 4000‎ من السبت إلى الخميس، ٧:٣٠–٢٠:٠٠."],
    ["ما المستندات التي أحضرها للزيارة أو العملية؟", "البطاقة الوطنية أو هوية سارية بصورة، أمر الدخول من الطبيب (للعمليات)، السجلات الطبية وقائمة الأدوية الحالية."],
    ["أين تُجرى العمليات الجراحية؟", "في غرف عمليات {f} بالمركز، بجدران فولاذية وأرضيات Geofloor وتهوية مركزية بتلوث صفري."],
  ],
};

export function generateStaticParams() {
  return [...new Set([...Object.keys(profiles), ...homeDoctorIds])].map((id) => ({ id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const doctor = doctors.find((item) => item.id === id);
  const profile = doctor ? profileFor(doctor) : undefined;
  if (!doctor || !profile) return {};
  return routeMetadata({
    title: doctor.name.fa,
    description: profile.lead.fa,
    path: `/doctors/${id}`,
  });
}

export default async function DoctorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doctor = doctors.find((item) => item.id === id);
  const profile = doctor ? profileFor(doctor) : undefined;
  if (!doctor || !profile) notFound();

  const locale = await getLocale();
  const ui = UI[locale];
  const related = doctors.filter((item) => item.id !== id && item.cat === doctor.cat).slice(0, 5);
  const physicianJsonLd = {
    "@context": "https://schema.org",
    "@type": "Physician",
    name: doctor.name.fa,
    alternateName: [doctor.name.en, doctor.name.ar],
    description: profile.lead.fa,
    ...(profile.hero ? { image: new URL(profile.hero, siteConfig.url).toString() } : {}),
    url: new URL(`/doctors/${id}`, siteConfig.url).toString(),
    medicalSpecialty: categories[doctor.cat]?.en || doctor.spec.en,
    affiliation: { "@id": `${siteConfig.url}/#organization` },
  };

  return (
    <div className="page-doctors page-profile">
      <section className="phero">
        <div
          className="phero-img"
          role="img"
          aria-label={doctor.name[locale]}
          style={profile.hero ? { backgroundImage: `url("${profile.hero}")`, backgroundPosition: profile.heroPos } : undefined}
        />
        <div className="phero-fx" aria-hidden="true">
          <i />
          <i />
        </div>
        <div className="container phero-in">
          <nav className="crumbs" aria-label="breadcrumb">
            <Link href="/">{ui.home}</Link>
            <span>/</span>
            <Link href="/doctors">{ui.doctors}</Link>
            <span>/</span>
            <b>{doctor.name[locale]}</b>
          </nav>
          <div className="phero-txt">
            <span className="ph-dr">{ui.doctor}</span>
            <h1>{doctor.name[locale].replace(/^(دکتر|د\.|Dr\.)\s*/, "")}</h1>
            <span className="ph-tag">{profile.tag[locale]}</span>
            <p className="ph-lead">{profile.lead[locale]}</p>
            <ul className="ph-stats">
              <li>
                <Icon name="i-steth" />
                <b>{categories[doctor.cat]?.[locale] || doctor.spec[locale]}</b>
                <span>{ui.specialty}</span>
              </li>
              <li>
                <Icon name="i-building" />
                <b>{ui.rooms}</b>
                <span>{ui.roomsSub}</span>
              </li>
              <li>
                <Icon name="i-shield" />
                <b>{ui.safety}</b>
                <span>{ui.safetySub}</span>
              </li>
              <li>
                <Icon name="i-layers" />
                <b>{profile.floor[locale]}</b>
                <span>{ui.floor}</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <div className="container pwrap">
        <div className="pmain">
          <nav className="ptabs">
            <a href="#about" className="on">{ui.about}</a>
            {profile.services.length ? <a href="#services">{ui.services}</a> : null}
            <a href="#reviews">{locale === "fa" ? "نظرات بیماران" : locale === "en" ? "Patient reviews" : "آراء المرضى"}</a>
            <a href="#faq">{ui.faq}</a>
          </nav>

          <section className="pcard pabout" id="about">
            <div className="pa-ph">
              {doctor.photo || profile.hero ? (
                <Image
                  src={doctor.photo || profile.hero}
                  alt={doctor.name[locale]}
                  width={800}
                  height={896}
                  sizes="(max-width: 760px) 260px, 280px"
                />
              ) : <span className="hd-noph"><Icon name="i-user" /></span>}
              <span className="pa-frame" aria-hidden="true" />
            </div>
            <div className="pa-txt">
              <h2>
                <span>{ui.about}</span> <span>{doctor.name[locale]}</span>
              </h2>
              <p>{profile.about[locale]}</p>
              <blockquote className="pa-quote">
                <Icon name="i-quote" />
                <p>{ui.mission}</p>
                <cite>{ui.missionBy}</cite>
              </blockquote>
            </div>
          </section>

          {profile.services.length ? (
            <section className="pcard" id="services">
              <h2 className="ph2">
                <Icon name="i-steth" />
                <span>{ui.services}</span>
              </h2>
              <div className="psvc">
                {profile.services.map((service) => {
                  const value = service[locale];
                  return (
                    <article className="psv" key={value[0]}>
                      <span className="psv-i">
                        <Icon name={service.i as IconName} />
                      </span>
                      <b>{value[0] ?? ""}</b>
                      <small>{value[1] ?? ""}</small>
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}

          <DoctorReviews locale={locale} />

          <section className="pcard" id="faq">
            <h2 className="ph2">
              <Icon name="i-clipboard" />
              <span>{ui.faq}</span>
            </h2>
            <div className="faq">
              {FAQ[locale].map(([question, answer], index) => (
                <details key={question} open={index === 0}>
                  <summary>
                    <span>{question.replace("{n}", doctor.name[locale])}</span>
                    <Icon name="i-plus" />
                  </summary>
                  <p>{answer.replace("{f}", profile.floor[locale])}</p>
                </details>
              ))}
            </div>
          </section>
        </div>

        <aside className="pside">
          <div className="ps-card ps-book">
            <a className="ps-main" href={`tel:${siteConfig.phone}`}>
              <Icon name="i-calendar" />
              <span>{ui.book}</span>
            </a>
            <a className="ps-row" href={`tel:${siteConfig.phone}`}>
              <Icon name="i-phone" />
              <span>
                {ui.phone} <small dir="ltr">031-55154000</small>
              </span>
              <Icon name="i-arrow" className="arr" />
            </a>
            <a className="ps-row" href={siteConfig.mapsUrl} target="_blank" rel="noopener noreferrer">
              <Icon name="i-pin" />
              <span>{ui.address}</span>
              <Icon name="i-arrow" className="arr" />
            </a>
          </div>

          <div className="ps-card">
            <h3 className="ps-h">
              <Icon name="i-calendar" />
              <span>{ui.days}</span>
            </h3>
            <ul className="ps-days">
              {DAY_NAMES[locale].map((day, index) => (
                <li key={day} className={index === 6 ? "off" : undefined}>
                  <span>
                    <i />
                    {day}
                  </span>
                  <b dir="ltr">{index === 6 ? ui.closed : toLocaleDigits(locale, "07:30 – 20:00")}</b>
                </li>
              ))}
            </ul>
            <p className="ps-note">{ui.daysNote}</p>
          </div>
        </aside>
      </div>

      <section className="container prel">
        <div className="sec-head">
          <div>
            <span className="kicker">{ui.relatedKicker}</span>
            <h2>{ui.relatedTitle}</h2>
          </div>
          <Link href={`/doctors?cat=${doctor.cat}`} className="link-more">
            <span>{ui.allDoctors}</span>
            <Icon name="i-arrow" className="arr" />
          </Link>
        </div>
        <div className="dgrid prel-grid">
          {related.map((item) => (
            <Link
              className="doc seen"
              key={`${item.id}-${item.name.en}`}
              href={profiles[item.id] ? `/doctors/${item.id}` : `/doctors?cat=${item.cat}`}
            >
              <div className="doc-ph">
                {item.photo ? (
                  <Image
                    src={item.photo}
                    alt={item.name[locale]}
                    fill
                    sizes="(max-width: 640px) 45vw, (max-width: 1100px) 30vw, 210px"
                  />
                ) : (
                  <div className="mono" aria-hidden="true">
                    <svg className="mono-arch" viewBox="0 0 100 120">
                      <path d="M8 118V52C8 26 30 10 50 2c20 8 42 24 42 50v66" />
                    </svg>
                    <b className="mono-l">{item.name[locale].replace(/^(دکتر|د\.|Dr\.)\s*/, "").charAt(0)}</b>
                  </div>
                )}
              </div>
              <div className="doc-b">
                <h3>{item.name[locale]}</h3>
                <p>{item.spec[locale]}</p>
                <span className="doc-btn">
                  <Icon name="i-user" />
                  <span>{profiles[item.id] ? ui.allDoctors : categories[item.cat]?.[locale]}</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <JsonLd document={physicianJsonLd} />
    </div>
  );
}
