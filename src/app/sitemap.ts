/**
 * app/sitemap.ts — the whole of this site's XML sitemap (P1-14).
 *
 * Thirteen entries: the home page, the Services landing, one per catalog
 * category, and the loan page (added with the owner's 2026-11-18
 * loan-feature extension). The list is derived from ROUTES + the
 * Zod-validated catalog, so a route that is not actually built cannot
 * appear here (there is nothing else to advertise — the panels and
 * search of the reference are out of scope, and a sitemap may not point
 * at pages that do not exist).
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
import profiles from "@/modules/publicSite/content/doctor-profiles.json";
import guide from "@/modules/publicSite/content/guide.json";

const CATEGORY_PRIORITY = 0.8;
const HOME_DOCTOR_IDS = ["kheirkhah", "aghadoust", "mohammad-eidi", "abolhassani"];

export default function sitemap(): MetadataRoute.Sitemap {
  const categoryEntries: MetadataRoute.Sitemap = getServiceCategories().map((category) => ({
    url: `${siteConfig.url}${categoryPath(category.id)}`,
    changeFrequency: "monthly",
    priority: CATEGORY_PRIORITY,
    alternates: { languages: trilingual(categoryPath(category.id)) },
  }));

  const publicLandings = [
    ROUTES.about,
    ROUTES.servicesSurgical,
    ROUTES.servicesMedical,
    ROUTES.doctors,
    ROUTES.guide,
    ROUTES.assistant,
    ROUTES.clinics,
    ROUTES.visiting,
    ROUTES.patientRights,
    ROUTES.admission,
  ].map((path) => entry(path, 0.9));
  const doctorEntries = [...new Set([...Object.keys(profiles), ...HOME_DOCTOR_IDS])].map((id) => entry(`${ROUTES.doctors}/${id}`, 0.8));
  const guideEntries = guide.surgeries.map((item) => entry(`${ROUTES.guide}/${item.id}`, 0.8));

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
    ...publicLandings,
    ...categoryEntries,
    ...doctorEntries,
    ...guideEntries,
    {
      url: `${siteConfig.url}${ROUTES.internationalPatients}`,
      changeFrequency: "monthly",
      priority: 0.9,
      alternates: { languages: { fa: `${siteConfig.url}${ROUTES.internationalPatients}` } },
    },
    entry(ROUTES.loan, 0.9),
  ];
}

function entry(path: string, priority: number): MetadataRoute.Sitemap[number] {
  return {
    url: `${siteConfig.url}${path}`,
    changeFrequency: "monthly",
    priority,
    alternates: { languages: trilingual(path) },
  };
}

/** fa canonical, en and ar via the ?lang= switch the middleware mirrors. */
function trilingual(path: string): Record<(typeof LOCALES)[number], string> {
  return {
    fa: `${siteConfig.url}${path}`,
    en: `${siteConfig.url}${path}?lang=en`,
    ar: `${siteConfig.url}${path}?lang=ar`,
  };
}
