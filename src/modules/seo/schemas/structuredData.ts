/**
 * structuredData.ts (schemas) — the JSON-LD contract (P1-14).
 *
 * The checklist's "JSON-LD validated with a schema check" gate: every document
 * the site emits (organization, WebSite, Service, BreadcrumbList) must parse
 * against its Zod schema. This catches a drifted builder at test time instead
 * of shipping malformed structured data to crawlers.
 *
 * Only the structural and type-level facts are pinned (valid @types, required
 * properties, the org/website/service wiring); content strings are verified by
 * the content-parity tests, not here.
 */

import { z } from "zod";

const context = z.literal("https://schema.org");

export const organizationSchema = z.object({
  "@context": context,
  "@type": z.literal("MedicalClinic"),
  "@id": z.string().url(),
  name: z.string().min(1),
  alternateName: z.string().min(1),
  url: z.string().url(),
  telephone: z.string(),
  email: z.string().email(),
  foundingDate: z.string(),
  address: z.object({
    "@type": z.literal("PostalAddress"),
    streetAddress: z.string().min(1),
    addressLocality: z.string().min(1),
    addressRegion: z.string().min(1),
    addressCountry: z.string().min(1),
  }),
  openingHoursSpecification: z.array(
    z.object({
      "@type": z.literal("OpeningHoursSpecification"),
      dayOfWeek: z.array(z.string()).min(1),
      opens: z.string(),
      closes: z.string(),
    }),
  ),
  medicalSpecialty: z.array(z.string()).min(1),
});

export const websiteSchema = z.object({
  "@context": context,
  "@type": z.literal("WebSite"),
  "@id": z.string().url(),
  url: z.string().url(),
  name: z.string().min(1),
  inLanguage: z.string(),
  publisher: z.object({ "@id": z.string().url() }),
});

export const serviceSchema = z.object({
  "@context": context,
  "@type": z.literal("Service"),
  "@id": z.string().url(),
  name: z.string().min(1),
  description: z.string().min(1),
  inLanguage: z.enum(["fa", "en", "ar"]),
  url: z.string().url(),
  provider: z.object({ "@id": z.string().url() }),
  serviceType: z.string().min(1),
  areaServed: z.string().min(1),
  // Optional: the other two locales' names (schema.org alternateName).
  alternateName: z.array(z.string()).optional(),
});

export const breadcrumbSchema = z.object({
  "@context": context,
  "@type": z.literal("BreadcrumbList"),
  itemListElement: z
    .array(
      z.object({
        "@type": z.literal("ListItem"),
        position: z.number().int().min(1),
        name: z.string().min(1),
        item: z.string().url(),
      }),
    )
    .min(2),
});

export type OrganizationJsonLd = z.infer<typeof organizationSchema>;
export type WebsiteJsonLd = z.infer<typeof websiteSchema>;
export type ServiceJsonLd = z.infer<typeof serviceSchema>;
export type BreadcrumbJsonLd = z.infer<typeof breadcrumbSchema>;
