"use client";

import { useState } from "react";

import type { Locale } from "@/core/i18n/locales";
import { Icon } from "./Icon";

const COPY = {
  fa: { doctors: "پزشکان", guide: "راهنمای عمل", placeholder: "جستجوی پزشک، خدمت یا کلیدواژه…", label: "جستجو" },
  en: { doctors: "Doctors", guide: "Surgery guide", placeholder: "Search a doctor, service or keyword…", label: "Search" },
  ar: { doctors: "الأطباء", guide: "دليل العمليات", placeholder: "ابحث عن طبيب أو خدمة أو كلمة مفتاحية…", label: "بحث" },
} as const;

export function HomeSearch({ locale }: { locale: Locale }) {
  const copy = COPY[locale];
  const [target, setTarget] = useState<"doctors" | "guide">("doctors");
  const [query, setQuery] = useState("");

  return (
    <form
      className="hh-search"
      action={target === "guide" ? "/guide" : "/doctors"}
      method="get"
    >
      <select
        aria-label={copy.label}
        value={target}
        onChange={(event) => setTarget(event.target.value as "doctors" | "guide")}
      >
        <option value="doctors">{copy.doctors}</option>
        <option value="guide">{copy.guide}</option>
      </select>
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={copy.placeholder}
        aria-label={copy.label}
      />
      <button className="hh-go" type="submit" aria-label={copy.label}>
        <Icon name="i-search" />
      </button>
    </form>
  );
}
