/**
 * types/index.ts — TypeScript types for the services module, derived from the
 * Zod schemas so the runtime contract and the compile-time contract cannot drift.
 */

import type { z } from "zod";

import type {
  LocaleTextSchema,
  ServiceBenefitSchema,
  ServiceCatalogSchema,
  ServiceCategorySchema,
  SubServiceSchema,
} from "../schemas";

export type LocaleText = z.infer<typeof LocaleTextSchema>;
export type ServiceBenefit = z.infer<typeof ServiceBenefitSchema>;
export type SubService = z.infer<typeof SubServiceSchema>;
export type ServiceCategory = z.infer<typeof ServiceCategorySchema>;
export type ServiceCatalog = z.infer<typeof ServiceCatalogSchema>;

/** The two reference groups (services-data.js ORDER): surgical and medical. */
export type ServiceGroup = "surg" | "med";
