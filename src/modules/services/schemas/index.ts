/**
 * schemas/index.ts — Zod validation for the services content catalog.
 *
 * The catalog is static data shipped in the bundle, but every API edge and
 * every content boundary still gets a Zod schema (SEO_ACCESSIBILITY_SECURITY.md
 * §5 / API_ARCHITECTURE.md). `services/index.ts` runs this parse once at import
 * so a malformed content edit fails the build rather than rendering broken UI,
 * and the /api/status handler re-uses these types for its response envelope.
 */

import { z } from "zod";

/** A translatable string — fa canonical, en/ar required (LOCALIZATION_AND_CALENDAR.md §2). */
export const LocaleTextSchema = z.object({
  fa: z.string().min(1),
  en: z.string().min(1),
  ar: z.string().min(1),
});

export const ServiceBenefitSchema = z.object({
  icon: z.string().min(1),
  title: LocaleTextSchema,
});

export const SubServiceSchema = z.object({
  /** Icon-led items carry `icon`; the general-surgery items carry `image` instead. */
  icon: z.string().min(1).optional(),
  image: z.string().min(1).optional(),
  name: LocaleTextSchema,
  description: LocaleTextSchema,
}).refine((item) => Boolean(item.icon) !== Boolean(item.image), {
  message: "A sub-service must carry exactly one of `icon` or `image`",
});

export const ServiceCategorySchema = z.object({
  id: z.string().min(1),
  image: z.string().min(1),
  icon: z.string().min(1),
  /** Physical floor: -1 basement, 0 ground, 2 second, 3 third (services.js FL). */
  floor: z.number().int(),
  group: z.enum(["surg", "med"]),
  name: LocaleTextSchema,
  description: LocaleTextSchema,
  benefits: z.array(ServiceBenefitSchema).min(1).max(3),
  items: z.array(SubServiceSchema).min(1),
});

export const ServiceCatalogSchema = z.array(ServiceCategorySchema);

/** Response envelope shared by the content reads and (shape-wise) by API edges. */
export const ServiceCategoryIdsSchema = z.array(z.string().min(1));
