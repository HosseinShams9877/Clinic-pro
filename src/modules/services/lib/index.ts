/**
 * lib/index.ts — pure helpers over the services catalog (FOLDER_STRUCTURE.md:
 * no React, no Fetch, no side effects — fully unit-testable).
 */

import type { Locale } from "@/core/i18n/locales";
import { t, type MessageKey } from "@/modules/i18n/messages";

import { floorMessageKey } from "../constants";
import type { LocaleText, ServiceCategory, ServiceGroup } from "../types";

/** Resolve the localized string of a LocaleText, falling back to canonical fa. */
export function pick(text: LocaleText, locale: Locale): string {
  return text[locale] ?? text.fa;
}

/** Localized floor label, e.g. 2 → "طبقه دوم" / "2nd floor" / "الطابق الثاني". */
export function floorLabel(floor: number, locale: Locale): string {
  const key = floorMessageKey(floor);
  if (key === undefined) return String(floor);
  return t(locale, key);
}

/** The slug of a category = its reference id (CLAUDE.md §5: slugs = reference ids). */
export function categorySlug(category: Pick<ServiceCategory, "id">): string {
  return category.id;
}

/** The route of a category detail page. */
export function categoryPath(id: string): string {
  return `/services/${id}`;
}

/** Localized group name ("خدمات جراحی" / "Surgical services" / …). */
export function groupLabel(group: ServiceGroup, locale: Locale): string {
  const key: MessageKey = group === "surg" ? "nav.svcSurg" : "nav.svcMed";
  return t(locale, key);
}

/** True when the id is one of the ten reference category ids. */
export function isKnownCategoryId(id: string): boolean {
  return KNOWN_IDS.has(id);
}

const KNOWN_IDS: ReadonlySet<string> = new Set([
  "gen", "plastic", "ortho", "uro", "eye", "ent", "gyn", "aes", "anes", "endo",
]);
