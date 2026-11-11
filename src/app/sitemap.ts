/**
 * app/sitemap.ts — the whole of this site's XML sitemap (P1-14).
 *
 * Twelve entries and no more: the home page, the Services landing, and one per
 * catalog category. The list is derived from ROUTES + the Zod-validated
 * catalog, so a route that is not actually built cannot appear here (there is
 * nothing else to advertise — the panels and search of the reference are out
 * of scope, and a sitemap may not point at pages that do not exist).
 *
 * No lastModified is emitted: nothing in the reference records a modification
 * date for this content, and writing a fabricated one would break provenance
 * (CLAUDE.md §2 rule 2). changeFrequency/priority are honest page-weight
 * hints only.
 */

import type { MetadataRoute } from "next";

import { siteConfig, ROUTES } from "@/config/site.config";
import { LOCALES } from "@/core/i18n/locales";
import { getServiceCategories } from "@/modules/services/services";
import { categoryPath } from "@/modules/services/lib";

const CATEGORY_PRIORITY = 0.8;

export default function sitemap(): MetadataRoute.Sitemap {
  const categoryEntries: MetadataRoute.Sitemap = getServiceCategories().map((category) => ({
    url: `${siteConfig.url}${categoryPath(category.id)}`,
    changeFrequency: "monthly",
    priority: CATEGORY_PRIORITY,
    alternates: { languages: trilingual(categoryPath(category.id)) },
  }));

  return [
    {
      url: `${siteConfig.url}${ROUTES.home}`,
      changeFrequency: "monthly",
      priority: 1,
      alternates: { languages: trilingual(ROUTES.home) },
    },
    {
      url: `${siteConfig.url}${ROUTES.services}`,
      changeFrequency: "monthly",
      priority: 0.9,
      alternates: { languages: trilingual(ROUTES.services) },
    },
    ...categoryEntries,
  ];
}

/** fa canonical, en and ar via the ?lang= switch the middleware mirrors. */
function trilingual(path: string): Record<(typeof LOCALES)[number], string> {
  return {
    fa: `${siteConfig.url}${path}`,
    en: `${siteConfig.url}${path}?lang=en`,
    ar: `${siteConfig.url}${path}?lang=ar`,
  };
}
