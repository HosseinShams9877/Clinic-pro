/**
 * sitemap.test.ts — the P1-14 "sitemap URL list asserted" gate.
 *
 * The sitemap is the site's complete advertisement to crawlers, so it must
 * contain exactly the thirteen built routes and nothing else: no panels, no
 * search, no route beyond the implementation boundary. /loan was added by
 * the owner's 2026-11-18 loan-feature extension (LOAN_FEATURE_REPORT.md).
 */

import { describe, expect, it } from "vitest";

import { siteConfig } from "@/config/site.config";
import { SERVICE_CATEGORY_ORDER } from "@/modules/services/constants";
import profiles from "@/modules/publicSite/content/doctor-profiles.json";
import guide from "@/modules/publicSite/content/guide.json";
import sitemap from "./sitemap";
import robots from "./robots";

const EXPECTED_PATHS = [
  "/",
  "/services",
  "/about",
  "/services/surgical",
  "/services/medical",
  "/doctors",
  "/guide",
  "/assistant",
  "/clinics",
  "/visiting",
  "/patient-rights",
  "/admission",
  ...SERVICE_CATEGORY_ORDER.map((id) => `/services/${id}`),
  ...[...new Set([...Object.keys(profiles), "kheirkhah", "aghadoust", "mohammad-eidi", "abolhassani"])].map((id) => `/doctors/${id}`),
  ...guide.surgeries.map((item) => `/guide/${item.id}`),
  "/international-patients",
  "/loan",
];

describe("sitemap()", () => {
  const entries = sitemap();

  it("lists every built public route — nothing out of scope", () => {
    expect(entries.map((entry) => entry.url)).toEqual(
      EXPECTED_PATHS.map((path) => `${siteConfig.url}${path}`),
    );
    expect(entries).toHaveLength(EXPECTED_PATHS.length);
  });

  it("includes all ten category routes in the catalog's display order", () => {
    const categoryUrls = entries.slice(12, 22).map((entry) => entry.url);
    expect(categoryUrls).toEqual(
      SERVICE_CATEGORY_ORDER.map((id) => `${siteConfig.url}/services/${id}`),
    );
  });

  it("emits no lastModified — no modification date exists in the reference to invent", () => {
    for (const entry of entries) {
      expect(entry).not.toHaveProperty("lastModified");
    }
  });

  it("declares the trilingual alternates for every route (fa canonical, en/ar via ?lang=)", () => {
    for (const entry of entries) {
      if (entry.url.endsWith("/international-patients")) {
        expect(entry.alternates?.languages).toEqual({ fa: entry.url });
      } else {
        expect(entry.alternates?.languages).toEqual({
          fa: entry.url,
          en: `${entry.url}?lang=en`,
          ar: `${entry.url}?lang=ar`,
        });
      }
    }
  });

  it("ranks home above the landing pages above the category pages", () => {
    expect(entries[0]!.priority).toBe(1);
    expect(entries[1]!.priority).toBe(0.9);
    expect(entries[2]!.priority).toBe(0.9);
    expect(entries.at(-1)!.priority).toBe(0.9);
    expect(entries.filter((entry) => entry.priority === 0.8)).toHaveLength(29);
  });
});

describe("robots()", () => {
  const policy = robots();

  it("allows everything and points at the sitemap on the canonical origin", () => {
    expect(policy.rules).toEqual({ userAgent: "*", allow: "/" });
    expect(policy.sitemap).toBe(`${siteConfig.url}/sitemap.xml`);
  });

  it("mentions no admin, booking, or member-panel path — none exist in this scope", () => {
    const flat = JSON.stringify(policy);
    expect(flat).not.toMatch(/panel|admin|booking|club|member|account/i);
  });
});
