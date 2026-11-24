"use client";

import { FormEvent, useRef, useState } from "react";

import type { Locale } from "@/core/i18n/locales";
import translations from "@/modules/publicSite/content/reference-translations.json";
import { Icon, type IconName } from "./Icon";

const MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
const TOPICS: ReadonlyArray<{ key: string; icon: IconName }> = [
  { key: "cb.i1", icon: "i-star" },
  { key: "cb.i2", icon: "i-sparkle" },
  { key: "cb.i3", icon: "i-calendar" },
  { key: "cb.i4", icon: "i-heart" },
];
const TOPIC_FA = ["جشنواره‌ها و تخفیف‌ها", "خدمات زیبایی و لیزر", "یادآوری چکاپ و ویزیت", "نکات سلامت"] as const;
const TIERS = [
  ["b", "cb.tB", "برنزی", "0213"],
  ["s", "cb.tS", "نقره‌ای", "1405"],
  ["g", "cb.tG", "طلایی", "1399"],
] as const;

function latinDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

export function HomeClubSection({ locale }: { locale: Locale }) {
  const messages = (locale === "fa" ? {} : translations[locale]) as Record<string, string>;
  const tx = (key: string, fallback: string) => messages[key] || fallback;
  const formRef = useRef<HTMLFormElement>(null);
  const mobileRef = useRef<HTMLInputElement>(null);
  const [invalid, setInvalid] = useState(false);
  const [complete, setComplete] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    let mobile = latinDigits(String(new FormData(form).get("mob") || "")).replace(/\D/g, "");
    if (mobile.length === 10 && mobile.startsWith("9")) mobile = `0${mobile}`;
    if (!/^09\d{9}$/.test(mobile)) {
      setInvalid(true);
      mobileRef.current?.focus();
      return;
    }

    const data = new FormData(form);
    const member = {
      mobile,
      topics: data.getAll("topic").map(String),
      birthMonth: String(data.get("bm") || ""),
      at: new Date().toISOString(),
      tier: "bronze",
    };
    try {
      const stored = JSON.parse(localStorage.getItem("kh-club-members") || "[]") as Array<{ mobile?: string }>;
      localStorage.setItem(
        "kh-club-members",
        JSON.stringify([...stored.filter((item) => item.mobile !== mobile), member]),
      );
    } catch {
      // The reference silently continues when storage is unavailable.
    }
    setComplete(true);
  }

  function reset() {
    formRef.current?.reset();
    setInvalid(false);
    setComplete(false);
    requestAnimationFrame(() => mobileRef.current?.focus());
  }

  return (
    <section className="container h-sec cb-sec" id="club">
      <div className="cb-box">
        <div className="cb-vis" aria-hidden="true">
          <div className="cb-tiers">
            {TIERS.map(([className, key, fallback, suffix]) => (
              <div className={`cb-tier ${className}`} key={className}>
                <div className="cb-tier-h"><Icon name="i-crown" /><span>{tx("cb.card", "کارت عضویت")}</span></div>
                <b>{tx(key, fallback)}</b><i className="cb-chipd" /><small dir="ltr">KH •••• {suffix}</small>
              </div>
            ))}
          </div>
          <p className="cb-lvl">{tx("cb.lvl", "با هر مراجعه، امتیاز و سطح عضویت شما بالاتر می‌رود.")}</p>
        </div>
        <form className="cb-form" noValidate ref={formRef} onSubmit={submit}>
          <span className="cb-k"><Icon name="i-crown" /><span>{tx("cb.k", "باشگاه تاج خیرخواه")}</span></span>
          <h2><span>{tx("cb.t1", "اولین نفری باشید")}</span> <em>{tx("cb.t2", "که باخبر می‌شود")}</em></h2>
          <p className="cb-lead">{tx("cb.p", "از جشنواره‌ها، تخفیف‌های مناسبتی و خدمات تازه مرکز با پیامک باخبر شوید. عضویت رایگان است و فقط پیام‌هایی را می‌گیرید که خودتان انتخاب می‌کنید.")}</p>
          <div className="cb-in" hidden={complete}>
            <span className="cb-lab">{tx("cb.iT", "دوست دارید درباره چه چیزی خبردار شوید؟")}</span>
            <div className="cb-chips">
              {TOPICS.map(({ key, icon }, index) => (
                <label className="cb-chip" key={key}>
                  <input type="checkbox" name="topic" value={key} defaultChecked={index === 0} />
                  <span><Icon name={icon} /><span>{tx(key, TOPIC_FA[index] ?? "")}</span></span>
                </label>
              ))}
            </div>
            <div className="cb-row">
              <label className="cb-fld cb-mob"><span>{tx("cb.mob", "شماره موبایل")}</span><input ref={mobileRef} className={invalid ? "bad" : undefined} name="mob" type="tel" inputMode="numeric" maxLength={11} dir="ltr" placeholder="09xx xxx xxxx" autoComplete="tel" onInput={() => setInvalid(false)} /></label>
              <label className="cb-fld"><span>{tx("cb.bm", "ماه تولد (اختیاری؛ برای پیشنهاد ویژه تولد)")}</span><select name="bm"><option value="">{tx("cb.bm0", "انتخاب کنید")}</option>{MONTHS.map((month, index) => <option value={index + 1} key={month}>{month}</option>)}</select></label>
              <button className="btn cb-go" type="submit"><Icon name="i-crown" /><span>{tx("cb.go", "عضویت رایگان")}</span></button>
            </div>
            <p className="cb-err" hidden={!invalid}>{tx("cb.err", "شماره موبایل را درست وارد کنید (مثل ۰۹۱۲۱۲۳۴۵۶۷).")}</p>
            <small className="cb-off">{tx("cb.off", "هر وقت بخواهید، با یک پیامک «لغو» از باشگاه خارج می‌شوید.")}</small>
          </div>
          <div className="cb-ok" hidden={!complete}><span className="cb-ok-i"><Icon name="i-check" /></span><div><h3>{tx("cb.okT", "به باشگاه تاج خوش آمدید")}</h3><p>{tx("cb.okP", "عضویت شما ثبت شد. خبر جشنواره‌ها و پیشنهادهای ویژه با پیامک به همین شماره می‌رسد.")}</p><button type="button" className="cb-again" onClick={reset}>{tx("cb.again", "عضویت شماره دیگر")}</button></div></div>
        </form>
      </div>
    </section>
  );
}
