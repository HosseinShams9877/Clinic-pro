/**
 * app/robots.ts — the robots policy (P1-14).
 *
 * Everything this site builds is public and crawlable, so the rule allows all
 * and points at the sitemap. It deliberately mentions nothing else: the
 * reference's admin/booking/club panels are outside the implementation
 * boundary and do not exist here, so they cannot be referenced (and the
 * sitemap itself lists only the twelve built routes).
 */

import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site.config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
