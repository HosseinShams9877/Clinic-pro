/**
 * metadata.test.ts — the per-route metadata shape (P1-14, SEO §1.2/§1.5).
 *
 * Pins that every route gets canonical + trilingual hrefLang alternates, a
 * text-only OpenGraph/Twitter block, and that no og:image is invented (the
 * reference ships no social image; inventing a URL would breach the
 * no-invention rule).
 */

import { describe, expect, it } from "vitest";

import { t } from "@/modules/i18n/messages";
import { routeMetadata } from "./metadata";

describe("routeMetadata", () => {
  const meta = routeMetadata({
    title: t("fa", "meta.services"),
    description: t("fa", "meta.servicesDescription"),
    path: "/services",
  });

  it("forwards the route's localized title and description verbatim", () => {
    expect(meta.title).toBe(t("fa", "meta.services"));
    expect(meta.description).toBe(t("fa", "meta.servicesDescription"));
  });

  it("sets the canonical and the trilingual hrefLang alternates", () => {
    expect(meta.alternates).toEqual({
      canonical: "/services",
      languages: { fa: "/services", en: "/services?lang=en", ar: "/services?lang=ar" },
    });
  });

  it("emits a text-only OpenGraph block with the fa canonical locale", () => {
    expect(meta.openGraph).toMatchObject({
      title: t("fa", "meta.services"),
      url: "/services",
      locale: "fa_IR",
      type: "website",
    });
  });

  it("emits a summary Twitter card mirroring the OG text", () => {
    expect(meta.twitter).toEqual({
      card: "summary",
      title: t("fa", "meta.services"),
      description: t("fa", "meta.servicesDescription"),
    });
  });

  it("declares no og:image — the reference has no social image to copy", () => {
    expect(meta.openGraph).not.toHaveProperty("images");
    expect(meta.twitter).not.toHaveProperty("images");
  });

  it("never emits a hardcoded title: the same call with catalog text carries it through", () => {
    const category = routeMetadata({
      title: "جراحی عمومی",
      description: "بخش جراحی عمومی",
      path: "/services/gen",
    });
    expect(category.title).toBe("جراحی عمومی");
    expect(category.alternates?.languages?.ar).toBe("/services/gen?lang=ar");
  });
});
