/**
 * locales.ts — the locale taxonomy (LOCALIZATION_AND_CALENDAR.md §1).
 *
 * fa is canonical: it is the language the reference content was authored in,
 * and the only locale whose strings are transcribed verbatim from `پلتفرم/`.
 * en and ar are translations of fa under the exact same message keys.
 *
 * There are NO locale-prefixed routes in this app (Q7). The locale is resolved
 * server-side per-request and baked into <html lang dir>.
 */

export const LOCALES = ["fa", "en", "ar"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "fa";

export const LOCALE_LABELS: Readonly<Record<Locale, string>> = {
  fa: "فارسی",
  en: "English",
  ar: "العربية",
};

/** Short labels used by the reference's language switcher (FA / EN / AR). */
export const LOCALE_SHORT_LABELS: Readonly<Record<Locale, string>> = {
  fa: "FA",
  en: "EN",
  ar: "AR",
};

export function isLocale(value: string | undefined | null): value is Locale {
  return value !== undefined && value !== null && (LOCALES as readonly string[]).includes(value);
}

export const DIRECTION: Readonly<Record<Locale, "rtl" | "ltr">> = {
  fa: "rtl",
  ar: "rtl",
  en: "ltr",
};

/** HTML lang tag; ar uses the same tag as its label. */
export const HTML_LANG: Readonly<Record<Locale, string>> = {
  fa: "fa",
  en: "en",
  ar: "ar",
};
