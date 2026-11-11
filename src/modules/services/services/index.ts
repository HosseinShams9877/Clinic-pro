/**
 * services/index.ts — the read API over the services content catalog.
 *
 * Pure functions over static content, callable from Server Components with no
 * HTTP hop and no Prisma (REC-1: Phase 1 needs no database persistence; the
 * catalog is build-time data). The content is Zod-validated exactly once, here
 * at the module boundary (FOLDER_STRUCTURE.md §2 "Zod-validated at the module
 * boundary"), so a malformed edit fails the build instead of the render.
 */

import type { Locale } from "@/core/i18n/locales";

import { SERVICE_CATEGORY_ORDER, SERVICE_GROUP_ORDER } from "../constants";
import { serviceCategories } from "../content/categories";
import { ServiceCatalogSchema } from "../schemas";
import { categoryPath, floorLabel, pick } from "../lib";
import type { ServiceCategory, ServiceGroup } from "../types";

/** The single validation pass; throws (fails the build) on malformed content. */
const catalog: readonly ServiceCategory[] = ServiceCatalogSchema.parse(serviceCategories);

const byId: ReadonlyMap<string, ServiceCategory> = new Map(catalog.map((c) => [c.id, c]));

/** All ten categories in the reference's display order (surgical, then medical). */
export function getServiceCategories(): readonly ServiceCategory[] {
  return SERVICE_CATEGORY_ORDER.map((id) => byId.get(id)).filter(
    (c): c is ServiceCategory => c !== undefined,
  );
}

/** Categories of one group, in the reference's client-requested order. */
export function getServiceCategoriesByGroup(group: ServiceGroup): readonly ServiceCategory[] {
  const ids = SERVICE_GROUP_ORDER[group];
  return ids.map((id) => byId.get(id)).filter((c): c is ServiceCategory => c !== undefined);
}

/** One category by reference id, or undefined for an unknown id. */
export function getServiceCategory(id: string): ServiceCategory | undefined {
  return byId.get(id);
}

/** Locale-flavored variants — same data with the display string pre-picked. */
export interface LocalizedCategory {
  id: string;
  group: ServiceGroup;
  floor: number;
  image: string;
  icon: string;
  name: string;
  description: string;
  floorLabel: string;
  path: string;
  benefits: ReadonlyArray<{ icon: string; title: string }>;
  items: ReadonlyArray<{
    icon?: string;
    image?: string;
    name: string;
    description: string;
  }>;
}

function localize(category: ServiceCategory, locale: Locale): LocalizedCategory {
  return {
    id: category.id,
    group: category.group,
    floor: category.floor,
    image: category.image,
    icon: category.icon,
    name: pick(category.name, locale),
    description: pick(category.description, locale),
    floorLabel: floorLabel(category.floor, locale),
    path: categoryPath(category.id),
    benefits: category.benefits.map((b) => ({ icon: b.icon, title: pick(b.title, locale) })),
    items: category.items.map((i) => ({
      icon: i.icon,
      image: i.image,
      name: pick(i.name, locale),
      description: pick(i.description, locale),
    })),
  };
}

export function getLocalizedCategories(locale: Locale): readonly LocalizedCategory[] {
  return getServiceCategories().map((c) => localize(c, locale));
}

export function getLocalizedCategoriesByGroup(
  group: ServiceGroup,
  locale: Locale,
): readonly LocalizedCategory[] {
  return getServiceCategoriesByGroup(group).map((c) => localize(c, locale));
}

export function getLocalizedCategory(
  id: string,
  locale: Locale,
): LocalizedCategory | undefined {
  const category = byId.get(id);
  return category === undefined ? undefined : localize(category, locale);
}
