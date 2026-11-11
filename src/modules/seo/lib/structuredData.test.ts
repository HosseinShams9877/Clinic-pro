/**
 * structuredData.test.ts — the P1-14 "JSON-LD validated with a schema check" gate.
 *
 * Every builder output must parse against its Zod schema (tested implicitly by
 * the builders themselves — they .parse()), and each test additionally pins the
 * wiring facts that make the documents *correct*, not merely well-formed:
 *   - the organization @type is the reference's literal MedicalClinic,
 *   - the Service documents reference the organization by stable @id,
 *   - no SearchAction describes a site search that does not exist,
 *   - all ten categories produce a document in all three locales.
 */

import { describe, expect, it } from "vitest";

import { siteConfig } from "@/config/site.config";
import { SERVICE_CATEGORY_ORDER } from "@/modules/services/constants";
import { getLocalizedCategory } from "@/modules/services/services";
import {
  ORGANIZATION_ID,
  breadcrumbJsonLd,
  organizationJsonLd,
  serviceJsonLd,
  websiteJsonLd,
} from "./structuredData";
import {
  breadcrumbSchema,
  organizationSchema,
  serviceSchema,
  websiteSchema,
} from "../schemas/structuredData";

describe("organizationJsonLd", () => {
  const doc = organizationJsonLd();

  it("uses the reference's literal @type MedicalClinic (پلتفرم/index.html line 14)", () => {
    expect(doc["@type"]).toBe("MedicalClinic");
  });

  it("carries the reference's identifying facts verbatim", () => {
    expect(doc.name).toBe("مرکز جراحی فوق تخصصی دکتر خیرخواه");
    expect(doc.alternateName).toBe("Dr. Kheirkhah Super-Specialty Surgical Center");
    expect(doc.url).toBe("https://drkheirkhahhospital.ir");
    // Machine-readable form — the reference's own tel: href spelling.
    expect(doc.telephone).toBe("+983155154000");
    expect(doc.email).toBe("info@drkheirkhahhospital.ir");
  });

  it("declares the reference's opening hours: Sat–Thu, 07:30–20:00", () => {
    expect(doc.openingHoursSpecification).toHaveLength(1);
    const [spec] = doc.openingHoursSpecification;
    expect(spec!.opens).toBe("07:30");
    expect(spec!.closes).toBe("20:00");
    expect(spec!.dayOfWeek).toEqual([
      "Saturday",
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
    ]);
  });

  it("parses against the organization schema (the schema-check gate)", () => {
    expect(() => organizationSchema.parse(doc)).not.toThrow();
  });

  it("rejects a document with a drifted field (schemas are actually enforced)", () => {
    expect(() =>
      organizationSchema.parse({ ...doc, address: { ...doc.address, "@type": "Place" } }),
    ).toThrow();
  });
});

describe("websiteJsonLd", () => {
  const doc = websiteJsonLd();

  it("is a WebSite node published by the organization, fa canonical", () => {
    expect(doc["@type"]).toBe("WebSite");
    expect(doc.inLanguage).toBe("fa-IR");
    expect(doc.publisher["@id"]).toBe(ORGANIZATION_ID);
  });

  it("declares no SearchAction — site search does not exist in the implemented scope", () => {
    expect(doc).not.toHaveProperty("potentialAction");
  });

  it("parses against the website schema", () => {
    expect(() => websiteSchema.parse(doc)).not.toThrow();
  });
});

describe("serviceJsonLd", () => {
  it("produces a schema-valid Service document for all ten categories in all three locales", () => {
    for (const id of SERVICE_CATEGORY_ORDER) {
      for (const locale of ["fa", "en", "ar"] as const) {
        const doc = serviceJsonLd(id, locale);
        expect(doc["@type"]).toBe("Service");
        expect(() => serviceSchema.parse(doc)).not.toThrow();
      }
    }
  });

  it("names and describes the category in the page's own locale", () => {
    const category = getLocalizedCategory("gen", "fa");
    const doc = serviceJsonLd("gen", "fa");
    expect(doc.name).toBe(category?.name);
    expect(doc.description).toBe(category?.description);
    expect(doc.inLanguage).toBe("fa");
  });

  it("carries the other two locales' names as alternateName, not two extra documents", () => {
    const doc = serviceJsonLd("gen", "fa");
    const enName = getLocalizedCategory("gen", "en")?.name;
    const arName = getLocalizedCategory("gen", "ar")?.name;
    expect(doc.alternateName).toEqual([enName, arName]);
  });

  it("references the organization as provider and resolves to the category's own URL", () => {
    const doc = serviceJsonLd("plastic", "en");
    expect(doc.provider["@id"]).toBe(ORGANIZATION_ID);
    expect(doc["@id"]).toBe(`${siteConfig.url}/services/plastic`);
    expect(doc.url).toBe(`${siteConfig.url}/services/plastic`);
  });

  it("types the service by the catalog's group and serves the reference's city/region", () => {
    expect(serviceJsonLd("gen", "fa").serviceType).toBe("خدمات جراحی");
    expect(serviceJsonLd("aes", "fa").serviceType).toBe("خدمات پزشکی");
    expect(serviceJsonLd("gen", "fa").areaServed).toBe("کاشان, اصفهان");
  });

  it("throws on an unknown category id instead of emitting a broken document", () => {
    expect(() => serviceJsonLd("cardio", "fa")).toThrow(/unknown category/);
  });
});

describe("breadcrumbJsonLd", () => {
  it("mirrors the visible crumbs with sequential positions and absolute URLs", () => {
    const doc = breadcrumbJsonLd([
      { name: "خانه", path: "/" },
      { name: "خدمات", path: "/services" },
      { name: "جراحی عمومی", path: "/services/gen" },
    ]);
    expect(doc.itemListElement.map((item) => item.position)).toEqual([1, 2, 3]);
    expect(doc.itemListElement[2]!.item).toBe("https://drkheirkhahhospital.ir/services/gen");
    expect(() => breadcrumbSchema.parse(doc)).not.toThrow();
  });

  it("requires at least two items (a single-node trail is not a breadcrumb)", () => {
    expect(() =>
      breadcrumbJsonLd([
        { name: "خانه", path: "/" },
        { name: "خدمات", path: "/services" },
      ]),
    ).not.toThrow();
    expect(() => breadcrumbJsonLd([{ name: "خانه", path: "/" }])).toThrow();
  });
});
