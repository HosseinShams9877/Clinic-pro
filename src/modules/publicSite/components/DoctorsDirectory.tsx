"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { toLocaleDigits } from "@/core/i18n/digits";
import type { Locale } from "@/core/i18n/locales";
import { Icon } from "@/components/shared/Icon";
import doctorsSource from "../content/doctors.json";
import profilesSource from "../content/doctor-profiles.json";
import type { PublicDoctor, PublicDoctorCategory } from "../types";

const doctors = doctorsSource.doctors as PublicDoctor[];
const categories = doctorsSource.categories as Record<string, PublicDoctorCategory>;
const profileIds = new Set(Object.keys(profilesSource));

const UI = {
  fa: {
    profile: "مشاهده پروفایل",
    quick: "اطلاعات پزشک",
    founder: "مؤسس مرکز",
    count: "{n} پزشک",
    empty: "پزشکی با این مشخصات پیدا نشد",
    emptySub: "نام دیگری را امتحان کنید یا با پذیرش تماس بگیرید.",
    clinic: "مرکز جراحی فوق تخصصی دکتر خیرخواه · کاشان",
    hours: "شنبه تا پنجشنبه · ۷:۳۰ تا ۲۰:۰۰",
    request: "درخواست نوبت",
    full: "پروفایل کامل در سایت رسمی",
    close: "بستن",
  },
  en: {
    profile: "View profile",
    quick: "Doctor details",
    founder: "Founder",
    count: "{n} doctors",
    empty: "No doctor matches your search",
    emptySub: "Try another name or call our admissions desk.",
    clinic: "Dr. Kheirkhah Surgical Center · Kashan",
    hours: "Saturday – Thursday · 07:30 – 20:00",
    request: "Request an appointment",
    full: "Full profile on official site",
    close: "Close",
  },
  ar: {
    profile: "عرض الملف",
    quick: "معلومات الطبيب",
    founder: "مؤسس المركز",
    count: "{n} طبيب",
    empty: "لم يتم العثور على طبيب بهذه المواصفات",
    emptySub: "جرّب اسمًا آخر أو اتصل بالاستقبال.",
    clinic: "مركز الدكتور خيرخواه للجراحة · كاشان",
    hours: "السبت – الخميس · ٧:٣٠ – ٢٠:٠٠",
    request: "طلب موعد",
    full: "الملف الكامل في الموقع الرسمي",
    close: "إغلاق",
  },
} as const;

function normalized(value: string) {
  return value
    .toLocaleLowerCase()
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[ة]/g, "ه")
    .replace(/[أإآ]/g, "ا")
    .replace(/‌/g, "")
    .replace(/دکتر|د\.|dr\./gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function monogram(doctor: PublicDoctor, locale: Locale) {
  const parts = doctor.name[locale].replace(/^(دکتر|د\.|Dr\.)\s*/, "").trim().split(/\s+/);
  return parts.at(-1)?.charAt(0) || "";
}

export function DoctorsDirectory({
  locale,
  initialCategory = "all",
  initialQuery = "",
}: {
  locale: Locale;
  initialCategory?: string;
  initialQuery?: string;
}) {
  const ui = UI[locale];
  const validInitialCategory = categories[initialCategory] ? initialCategory : "all";
  const [category, setCategory] = useState(validInitialCategory);
  const [query, setQuery] = useState(initialQuery);
  const [selected, setSelected] = useState<PublicDoctor | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const counts = useMemo(() => {
    const next: Record<string, number> = { all: doctors.length };
    doctors.forEach((doctor) => {
      next[doctor.cat] = (next[doctor.cat] || 0) + 1;
    });
    return next;
  }, []);

  const visibleDoctors = useMemo(() => {
    const needle = normalized(query);
    return doctors.filter((doctor) => {
      if (category !== "all" && doctor.cat !== category) return false;
      if (!needle) return true;
      return normalized(
        `${doctor.name.fa} ${doctor.name.en} ${doctor.name.ar} ${doctor.spec.fa} ${doctor.spec.en} ${doctor.spec.ar}`,
      ).includes(needle);
    });
  }, [category, query]);

  useEffect(() => {
    if (!selected) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [selected]);

  return (
    <>
      <section className="dtools-wrap">
        <div className="container">
          <div className="dtools">
            <label className="dsearch">
              <Icon name="i-search" />
              <input
                type="search"
                autoComplete="off"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={
                  locale === "fa"
                    ? "جستجوی نام پزشک یا تخصص…"
                    : locale === "en"
                      ? "Search a doctor's name or specialty…"
                      : "ابحث عن اسم الطبيب أو التخصص…"
                }
              />
            </label>
            <div className="dchips" role="tablist">
              {Object.entries(categories).map(([id, label]) =>
                id !== "all" && !counts[id] ? null : (
                  <button
                    key={id}
                    type="button"
                    className={`dchip${category === id ? " on" : ""}`}
                    role="tab"
                    aria-selected={category === id}
                    onClick={() => setCategory(id)}
                  >
                    <span className="t">{label[locale]}</span>
                    <span className="n">{toLocaleDigits(locale, counts[id] || 0)}</span>
                  </button>
                ),
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="container dlist">
        <p className="dcount" aria-live="polite">
          {ui.count.replace("{n}", toLocaleDigits(locale, visibleDoctors.length))}
        </p>
        <div className="dgrid">
          {visibleDoctors.map((doctor, index) => {
            const hasProfile = profileIds.has(doctor.id);
            return (
              <article
                key={`${doctor.id}-${doctor.name.en}`}
                className={`doc seen pop${hasProfile ? " has-profile" : ""}`}
                style={{ "--k": index % 10 } as React.CSSProperties}
              >
                <div className="doc-ph">
                  {doctor.photo ? (
                    <Image
                      src={doctor.photo}
                      alt={doctor.name[locale]}
                      fill
                      sizes="(max-width: 640px) 45vw, (max-width: 960px) 30vw, 230px"
                    />
                  ) : (
                    <div className="mono" aria-hidden="true">
                      <svg className="mono-arch" viewBox="0 0 100 120">
                        <path d="M8 118V52C8 26 30 10 50 2c20 8 42 24 42 50v66" />
                      </svg>
                      <b className="mono-l">{monogram(doctor, locale)}</b>
                    </div>
                  )}
                  {doctor.founder ? <span className="doc-badge">{ui.founder}</span> : null}
                </div>
                <div className="doc-b">
                  <h2>{doctor.name[locale]}</h2>
                  <p>{doctor.spec[locale]}</p>
                  {hasProfile ? (
                    <Link className="doc-btn" href={`/doctors/${doctor.id}`}>
                      <Icon name="i-user" />
                      <span>{ui.profile}</span>
                    </Link>
                  ) : (
                    <button type="button" className="doc-btn" onClick={() => setSelected(doctor)}>
                      <Icon name="i-user" />
                      <span>{ui.quick}</span>
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {visibleDoctors.length === 0 ? (
          <div className="dempty">
            <Icon name="i-search" />
            <b>{ui.empty}</b>
            <span>{ui.emptySub}</span>
          </div>
        ) : null}

        <div className="dcta">
          <div>
            <b>
              {locale === "fa"
                ? "برای انتخاب پزشک مناسب راهنمایی می‌خواهید؟"
                : locale === "en"
                  ? "Need help choosing the right doctor?"
                  : "هل تحتاج مساعدة في اختيار الطبيب المناسب؟"}
            </b>
            <span>
              {locale === "fa"
                ? "کارشناسان پذیرش، شما را به متخصص مناسب ارجاع می‌دهند."
                : locale === "en"
                  ? "Our admissions team will refer you to the right specialist."
                  : "سيرشدك فريق الاستقبال إلى الاختصاصي المناسب."}
            </span>
          </div>
          <a href="tel:+983155154000" className="btn btn-accent">
            <span>{ui.request}</span>
            <span className="btn-ico">
              <Icon name="i-phone" />
            </span>
          </a>
        </div>
      </section>

      {selected ? (
        <div className="dmodal in">
          <button className="dm-back" aria-label={ui.close} onClick={() => setSelected(null)} />
          <div className="dm-card" role="dialog" aria-modal="true" aria-labelledby="dm-name">
            <button
              ref={closeRef}
              className="dm-x"
              type="button"
              aria-label={ui.close}
              onClick={() => setSelected(null)}
            >
              <Icon name="i-x" />
            </button>
            <div className="dm-ph">
              {selected.photo ? (
                <Image
                  src={selected.photo}
                  alt={selected.name[locale]}
                  fill
                  sizes="(max-width: 640px) 100vw, 440px"
                />
              ) : (
                <div className="mono" aria-hidden="true">
                  <svg className="mono-arch" viewBox="0 0 100 120">
                    <path d="M8 118V52C8 26 30 10 50 2c20 8 42 24 42 50v66" />
                  </svg>
                  <b className="mono-l">{monogram(selected, locale)}</b>
                </div>
              )}
            </div>
            <div className="dm-body">
              <span className="dm-cat">{categories[selected.cat]?.[locale]}</span>
              <h2 id="dm-name">{selected.name[locale]}</h2>
              <p>{selected.spec[locale]}</p>
              <ul className="dm-facts">
                <li>
                  <Icon name="i-building" />
                  <span>{ui.clinic}</span>
                </li>
                <li>
                  <Icon name="i-clock" />
                  <span>{ui.hours}</span>
                </li>
              </ul>
              <div className="dm-actions">
                <a className="btn btn-primary" href="tel:+983155154000">
                  <Icon name="i-calendar" />
                  <span>{ui.request}</span>
                </a>
                {selected.url ? (
                  <a className="btn btn-line" href={selected.url} target="_blank" rel="noopener noreferrer">
                    <Icon name="i-ext" />
                    <span>{ui.full}</span>
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
