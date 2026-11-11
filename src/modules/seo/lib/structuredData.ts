/**
 * structuredData.ts (lib) — pure builders for the Phase 1 JSON-LD set
 * (SEO_ACCESSIBILITY_SECURITY.md §1.3):
 *
 *   MedicalClinic  → root layout (one per page, referenced by @id)
 *   WebSite        → home (NO SearchAction — search does not exist yet; §1.3
 *                    "schema must not describe nonexistent functionality")
 *   Service        → each of the ten category pages
 *   BreadcrumbList → each category page
 *
 * Every builder pipes its document through its Zod schema, so a malformed
 * document fails loudly instead of shipping to crawlers. All inputs come from
 * the Zod-validated services catalog or the provenance-tracked site config —
 * nothing is invented here.
 */

import { siteConfig } from "@/config/site.config";
import type { Locale } from "@/core/i18n/locales";
import { t } from "@/modules/i18n/messages";
import { getLocalizedCategory } from "@/modules/services/services";
import type { ServiceGroup } from "@/modules/services/types";
import { organizationStructuredData } from "../content/organization";
import {
  breadcrumbSchema,
  organizationSchema,
  serviceSchema,
  websiteSchema,
} from "../schemas/structuredData";

/** Stable node ids so the Service documents reference the organization. */
export const ORGANIZATION_ID = `${siteConfig.url}/#organization`;
const WEBSITE_ID = `${siteConfig.url}/#website`;

function withContext<T extends object>(document: T): T & { "@context": "https://schema.org" } {
  return { "@context": "https://schema.org", ...document };
}

/** The organization (root layout). The reference's exact field set. */
export function organizationJsonLd() {
  const document = withContext({ "@id": ORGANIZATION_ID, ...organizationStructuredData });
  return organizationSchema.parse(document);
}

/** The WebSite node (home). Deliberately no potentialAction/SearchAction. */
export function websiteJsonLd() {
  const document = withContext({
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: siteConfig.url,
    name: siteConfig.name,
    inLanguage: "fa-IR", // canonical (CLAUDE.md: fa is canonical)
    publisher: { "@id": ORGANIZATION_ID },
  });
  return websiteSchema.parse(document);
}

const GROUP_TYPE_KEY: Readonly<Record<ServiceGroup, "sg.surg" | "sg.med">> = {
  surg: "sg.surg",
  med: "sg.med",
};

/**
 * One Service document for a category page. The name and description are the
 * page's locale (inLanguage); the other two locales ride along as alternateName
 * so the trilingual catalog is represented without emitting three documents.
 */
export function serviceJsonLd(categoryId: string, locale: Locale) {
  const current = getLocalizedCategory(categoryId, locale);
  if (current === undefined) throw new Error(`structuredData: unknown category "${categoryId}"`);

  const others = (["fa", "en", "ar"] as const).filter((l) => l !== locale);
  const alternateName = others
    .map((l) => getLocalizedCategory(categoryId, l)?.name)
    .filter((name): name is string => name !== undefined);

  const document = withContext({
    "@type": "Service",
    "@id": `${siteConfig.url}${current.path}`,
    name: current.name,
    alternateName,
    description: current.description,
    inLanguage: locale,
    url: `${siteConfig.url}${current.path}`,
    provider: { "@id": ORGANIZATION_ID },
    serviceType: t(locale, GROUP_TYPE_KEY[current.group]),
    areaServed: `${siteConfig.address.addressLocality}, ${siteConfig.address.addressRegion}`,
  });
  return serviceSchema.parse(document);
}

/** A visible-crumb mirror as BreadcrumbList (category pages). */
export function breadcrumbJsonLd(items: ReadonlyArray<{ name: string; path: string }>) {
  const document = withContext({
    "@type": "BreadcrumbList",
    itemListElement: items.map(({ name, path }, index) => ({
      "@type": "ListItem" as const,
      position: index + 1,
      name,
      item: `${siteConfig.url}${path}`,
    })),
  });
  return breadcrumbSchema.parse(document);
}
