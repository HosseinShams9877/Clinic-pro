/**
 * metadata.ts — the per-route metadata shape (P1-14, SEO_ACCESSIBILITY_SECURITY.md
 * §1.2): title, description, canonical, the trilingual hrefLang alternates,
 * plus text-only openGraph and a twitter card.
 *
 * No og:image is emitted: the reference has no social-image asset and none was
 * approved — inventing an image URL would violate the no-invention rule. Every
 * string still comes from verified content (message tables or the catalog).
 *
 * Titles stay fa-canonical (§1.5); the alternates carry the en/ar mappings.
 */

import type { Metadata } from "next";

import { siteConfig } from "@/config/site.config";

/** OG/Twitter share the site's canonical locale tag. */
const OG_LOCALE = "fa_IR";

/**
 * One route's metadata. `path` is the canonical (no query) route; title and
 * description are already localized to the canonical fa.
 */
export function routeMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: path,
      languages: { fa: path, en: `${path}?lang=en`, ar: `${path}?lang=ar` },
    },
    openGraph: {
      title,
      description,
      url: path,
      siteName: siteConfig.name,
      locale: OG_LOCALE,
      type: "website",
    },
    twitter: { card: "summary", title, description },
  };
}
