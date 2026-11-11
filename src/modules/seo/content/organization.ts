/**
 * organization.ts — the organization's structured-data facts (P1-14).
 *
 * Every value is a fact taken VERBATIM from the reference's own JSON-LD block
 * (پلتفرم/index.html line 14) or from the site config that already records its
 * provenance. Nothing here is invented — CLAUDE.md §2 rule 2. Duplicating the
 * values would let the two copies drift, so this module only re-exports
 * siteConfig fields in the shape schema.org expects, plus the one list the
 * config does not carry (medicalSpecialty, copied literally from the
 * reference).
 */

import { siteConfig } from "@/config/site.config";

/**
 * The reference's medicalSpecialty list, byte-for-byte. Not derived from the
 * ten catalog categories — the reference enumerates seven and we keep them.
 */
export const MEDICAL_SPECIALTY: readonly string[] = [
  "Surgical",
  "Otolaryngologic",
  "Gynecologic",
  "Urologic",
  "Ophthalmologic",
  "PlasticSurgery",
  "Cardiovascular",
];

/** Days the reference's openingHoursSpecification lists (Sat–Thu). */
export const OPEN_DAYS_SCHEMA: readonly string[] = [
  "Saturday",
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
];

/**
 * The organization as structured data: exactly the reference's field set
 * (type, names, contact, founding, address, hours, specialty) with stable @ids
 * so the Service schemas can reference the provider without repeating it.
 *
 * telephone uses the machine-readable form (siteConfig.phone,
 * "+983155154000") — the form the reference itself uses in its tel: hrefs
 * (پلتفرم/index.html) — rather than the reference JSON-LD's display form
 * "+98-31-55154000": schema.org expects a dialable number, and both spellings
 * are reference-grounded, so this is not an invention.
 */
export const organizationStructuredData = {
  "@type": "MedicalClinic",
  name: siteConfig.name,
  alternateName: siteConfig.alternateName,
  url: siteConfig.url,
  telephone: siteConfig.phone,
  email: siteConfig.email,
  foundingDate: String(siteConfig.foundingYear),
  address: {
    "@type": "PostalAddress",
    streetAddress: siteConfig.address.streetAddressFull,
    addressLocality: siteConfig.address.addressLocality,
    addressRegion: siteConfig.address.addressRegion,
    addressCountry: siteConfig.address.addressCountry,
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: OPEN_DAYS_SCHEMA,
      opens: "07:30",
      closes: "20:00",
    },
  ],
  medicalSpecialty: MEDICAL_SPECIALTY,
} as const;
