import type { Metadata } from "next";
import Link from "next/link";

import { Icon } from "@/components/shared/Icon";
import { getLocale } from "@/core/i18n/getLocale";
import { DoctorsDirectory } from "@/modules/publicSite/components/DoctorsDirectory";
import { routeMetadata } from "@/modules/seo/lib/metadata";

export const metadata: Metadata = routeMetadata({
  title: "تیم پزشکان",
  description:
    "معرفی ۶۶ پزشک متخصص و فوق تخصص مرکز جراحی دکتر خیرخواه کاشان در رشته‌های زنان و نازایی، چشم، گوش و حلق و بینی، جراحی عمومی، ارولوژی، قلب و بیهوشی.",
  path: "/doctors",
});

const HERO = {
  fa: {
    first: "تیم",
    second: "پزشکان",
    third: "ما",
    sub: "با تیمی از پزشکان متخصص و فوق تخصص، در کنار شما برای سلامتی و زندگی بهتر",
    doctors: "پزشک متخصص",
    specialties: "رشته تخصصی",
    rooms: "اتاق عمل مجهز",
  },
  en: {
    first: "Meet Our",
    second: "Doctors",
    third: "",
    sub: "A team of specialists and sub-specialists, by your side for better health and a better life",
    doctors: "Specialist doctors",
    specialties: "Specialties",
    rooms: "Equipped ORs",
  },
  ar: {
    first: "فريق",
    second: "أطبائنا",
    third: "",
    sub: "فريق من الأطباء الاختصاصيين وفوق الاختصاصيين إلى جانبكم لصحة وحياة أفضل",
    doctors: "طبيب اختصاصي",
    specialties: "تخصصًا",
    rooms: "غرف عمليات مجهزة",
  },
} as const;

export default async function DoctorsPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; q?: string }>;
}) {
  const locale = await getLocale();
  const query = await searchParams;
  const hero = HERO[locale];

  return (
    <div className="page-doctors">
      <section className="dhero">
        <Icon name="i-steth" className="dh-deco dh-steth" />
        <Icon name="i-plus" className="dh-deco dh-plus" />
        <span className="dh-dots" aria-hidden="true" />
        <div className="container dh-inner">
          <nav className="crumbs" aria-label="breadcrumb">
            <Link href="/">{locale === "fa" ? "خانه" : locale === "en" ? "Home" : "الرئيسية"}</Link>
            <span>/</span>
            <b>{locale === "fa" ? "پزشکان" : locale === "en" ? "Doctors" : "الأطباء"}</b>
          </nav>
          <div className="dh-mark">
            <i />
            <span>
              <Icon name="i-team" />
            </span>
            <i />
          </div>
          <h1>
            <span>{hero.first}</span> <em>{hero.second}</em> <span>{hero.third}</span>
          </h1>
          <p>{hero.sub}</p>
          <ul className="dh-stats">
            <li>
              <b>۶۶</b>
              <span>{hero.doctors}</span>
            </li>
            <li>
              <b>۱۲</b>
              <span>{hero.specialties}</span>
            </li>
            <li>
              <b>۷</b>
              <span>{hero.rooms}</span>
            </li>
          </ul>
        </div>
      </section>
      <DoctorsDirectory locale={locale} initialCategory={query.cat} initialQuery={query.q} />
    </div>
  );
}
