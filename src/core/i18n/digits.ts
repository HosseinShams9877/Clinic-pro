/**
 * digits.ts — localized digit rendering (LOCALIZATION_AND_CALENDAR.md §2).
 *
 * The reference renders digits in the script of each locale (Persian digits
 * for fa, Arabic-Indic digits for ar, ASCII for en — see e.g. "۷" vs "7" in
 * the stats strip, and home.js `n()` which does exactly this conversion).
 *
 * This is a RENDER-BOUNDARY conversion only. Storage, URLs, query params,
 * `href`s, `datetime` attributes, phone numbers in `tel:` URIs and any
 * machine-readable value stays ASCII; only human-facing text is converted.
 */

import type { Locale } from "./locales";

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/** The digit glyphs of each locale, indexed 0–9. */
const NATIVE_DIGITS: Readonly<Record<Locale, string>> = {
  fa: FA_DIGITS,
  ar: AR_DIGITS,
  en: "0123456789",
};

/**
 * Render a number (or numeric string) in the locale's digits.
 * Non-digit characters pass through untouched, so this is safe to run over
 * mixed strings such as "07:30–20:00" or "+98 31 5515 4000" — although by
 * convention it is applied to display values, never to `tel:`/`href` values.
 */
export function toLocaleDigits(locale: Locale, value: string | number): string {
  const table = NATIVE_DIGITS[locale];
  let out = "";
  for (const ch of String(value)) {
    const code = ch.charCodeAt(0);
    const isAsciiDigit = code >= 48 && code <= 57;
    out += isAsciiDigit ? (table[code - 48] ?? ch) : ch;
  }
  return out;
}

/**
 * Normalize a string that may contain Persian or Arabic-Indic digits back to
 * ASCII digits. Used when a user-visible value must be compared or parsed.
 */
export function toAsciiDigits(input: string): string {
  let out = "";
  for (const ch of input) {
    const fa = FA_DIGITS.indexOf(ch);
    if (fa >= 0) {
      out += fa;
      continue;
    }
    const ar = AR_DIGITS.indexOf(ch);
    if (ar >= 0) {
      out += ar;
      continue;
    }
    out += ch;
  }
  return out;
}
