/**
 * getLocale.ts — server-side locale resolution
 * (LOCALIZATION_AND_CALENDAR.md §1 and §7).
 *
 * Resolution order, highest priority first:
 *   1. `?lang=` query override  (lets a link pin a locale, e.g. /services?lang=en)
 *   2. `lang` cookie           (set by the client language switcher)
 *   3. `Accept-Language` header (quality-value aware)
 *   4. fa                      (canonical default)
 *
 * The resolved locale is baked server-side into <html lang dir> by the root
 * layout. It is never read from the URL path — there are no locale-prefixed
 * routes.
 */

import { cookies, headers } from "next/headers";

import { DEFAULT_LOCALE, type Locale, LOCALES, isLocale } from "./locales";

export const LOCALE_COOKIE = "lang";
export const LOCALE_QUERY_PARAM = "lang";

/** Parse an Accept-Language header into locales, best quality first. */
function parseAcceptLanguage(header: string | null): Locale[] {
  if (!header) return [];

  const entries = header
    .split(",")
    .map((part) => {
      const [tagRaw, qRaw] = part.trim().split(";q=");
      const tag = (tagRaw ?? "").trim().toLowerCase();
      const q = qRaw === undefined ? 1 : Number.parseFloat(qRaw);
      return { tag, q: Number.isFinite(q) ? q : 0 };
    })
    .filter((entry) => entry.tag.length > 0)
    .sort((a, b) => b.q - a.q);

  const matched: Locale[] = [];

  for (const entry of entries) {
    // Exact tag: "fa", "en", "ar".
    if (isLocale(entry.tag)) {
      matched.push(entry.tag);
      continue;
    }
    // Subtag prefix: "fa-IR" → "fa", "en-US" → "en".
    const prefix = entry.tag.split("-")[0];
    if (prefix !== undefined && isLocale(prefix)) {
      matched.push(prefix);
    }
  }

  return matched;
}

/**
 * Resolve the locale for the current request.
 *
 * @param searchParams the URL search params of the current request, so a
 *   `?lang=` override can win over the cookie. Pass `{}` when the caller has
 *   no search params.
 */
export async function getLocale(
  searchParams: Record<string, string | string[] | undefined> = {},
): Promise<Locale> {
  // 1. ?lang= override
  const queryRaw = searchParams[LOCALE_QUERY_PARAM];
  const queryValue = Array.isArray(queryRaw) ? queryRaw[0] : queryRaw;
  if (isLocale(queryValue)) return queryValue;

  // 2. cookie
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isLocale(cookieValue)) return cookieValue;

  // 3. Accept-Language
  const headerStore = await headers();
  const accepted = parseAcceptLanguage(headerStore.get("accept-language"));
  if (accepted.length > 0) return accepted[0] as Locale;

  // 4. canonical default
  return DEFAULT_LOCALE;
}

/**
 * The list of alternate locales for hreflang generation, minus the given one.
 */
export function alternateLocales(locale: Locale): Locale[] {
  return LOCALES.filter((candidate) => candidate !== locale);
}
