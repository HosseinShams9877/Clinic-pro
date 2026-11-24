"use client";

import { FormEvent, useEffect, useState } from "react";

import { Icon } from "@/components/shared/Icon";
import type { Locale } from "@/core/i18n/locales";

const COPY = {
  fa: { title: "نظرات بیماران", empty: "اولین نفری باشید که تجربه‌تان را ثبت می‌کنید", emptySub: "نظرات پس از تأیید پذیرش و احراز مراجعه منتشر می‌شوند.", placeholder: "تجربه خود از ویزیت یا عمل را بنویسید…", submit: "ثبت نظر", thanks: "سپاس! نظر شما پس از تأیید منتشر می‌شود.", pick: "لطفاً امتیاز را انتخاب کنید." },
  en: { title: "Patient reviews", empty: "Be the first to share your experience", emptySub: "Reviews are published after admissions approval and visit verification.", placeholder: "Write about your visit or surgery experience…", submit: "Submit review", thanks: "Thank you! Your review will appear after approval.", pick: "Please choose a rating." },
  ar: { title: "آراء المرضى", empty: "كن أول من يسجل تجربته", emptySub: "تُنشر الآراء بعد موافقة الاستقبال والتحقق من المراجعة.", placeholder: "اكتب تجربتك مع الزيارة أو العملية…", submit: "إرسال الرأي", thanks: "شكرًا! سيُنشر تقييمك بعد المراجعة.", pick: "يرجى اختيار التقييم." },
} as const;

export function DoctorReviews({ locale }: { locale: Locale }) {
  const copy = COPY[locale];
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!rating) {
      setToast(copy.pick);
      return;
    }
    setToast(copy.thanks);
    event.currentTarget.reset();
    setRating(0);
    setHovered(0);
  }

  return (
    <>
      <section className="pcard" id="reviews">
        <h2 className="ph2"><Icon name="i-chat" /><span>{copy.title}</span></h2>
        <div className="prev">
          <div className="prev-empty">
            <div className="stars" aria-hidden="true">{Array.from({ length: 5 }, (_, index) => <Icon name="i-star" key={index} />)}</div>
            <b>{copy.empty}</b><span>{copy.emptySub}</span>
          </div>
          <form className="prev-form" onSubmit={submit}>
            <div className="rate" role="radiogroup">
              {Array.from({ length: 5 }, (_, index) => {
                const value = index + 1;
                return <button type="button" className={`${value <= hovered ? "hov" : ""} ${value <= rating ? "on" : ""}`.trim() || undefined} aria-label={String(value)} key={value} onClick={() => setRating(value)} onMouseEnter={() => setHovered(value)} onMouseLeave={() => setHovered(0)}><Icon name="i-star" /></button>;
              })}
            </div>
            <textarea rows={3} placeholder={copy.placeholder} />
            <button className="btn btn-primary btn-sm" type="submit">{copy.submit}</button>
          </form>
        </div>
      </section>
      <div className={`ptoast${toast ? " in" : ""}`} role="status">{toast}</div>
    </>
  );
}
