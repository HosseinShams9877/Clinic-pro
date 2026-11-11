/**
 * site.config.ts — the single home for site-wide constants
 * (FOLDER_STRUCTURE.md: "src/config/site.config.ts is the single home for
 * site constants"). Nothing in this file is translatable UI text — localized
 * strings live in src/modules/i18n/messages. Everything here is a fact taken
 * VERBATIM from the reference (پلتفرم/), with the source line recorded.
 */

import type { MessageKey } from "@/modules/i18n/messages";

export const siteConfig = {
  /** fa canonical name (reference JSON-LD "name", index.html line 14). */
  name: "مرکز جراحی فوق تخصصی دکتر خیرخواه",
  /** Reference JSON-LD "alternateName". */
  alternateName: "Dr. Kheirkhah Super-Specialty Surgical Center",
  /** Reference brand.small + brand.name, used in the header wordmark. */
  brandKickerKey: "brand.small" as MessageKey,
  brandNameKey: "brand.name" as MessageKey,

  /** Canonical production origin (reference JSON-LD "url"). */
  url: "https://drkheirkhahhospital.ir",
  /** Reference JSON-LD "telephone", machine-readable form. */
  phone: "+983155154000",
  /** Human-facing form (index.html line 322, dir="ltr"): "031 - 5515 4000". */
  phoneDisplay: "031 - 5515 4000",
  /** Reference JSON-LD "email". */
  email: "info@drkheirkhahhospital.ir",

  /** Reference JSON-LD "foundingDate" (Gregorian) = h.since "از سال ۱۳۹۹". */
  foundingYear: 2020,
  foundingJalaliYear: 1399,

  address: {
    /** index.html line 323 (h.addrS): کاشان، خیابان امیرکبیر، کوچه شهید ظهیری. */
    streetAddressKey: "h.addrS" as MessageKey,
    /** Reference JSON-LD postal address fields. */
    streetAddressFull: "خیابان امیرکبیر، کوچه شهید ظهیری (مخمل دهم)",
    addressLocality: "کاشان",
    addressRegion: "اصفهان",
    addressCountry: "IR",
  },

  /**
   * Opening hours (ct.hours: شنبه تا پنجشنبه · ۷:۳۰ تا ۲۰:۰۰, JSON-LD
   * openingHoursSpecification Sat–Thu 07:30–20:00). Mirrored as pure facts for
   * the open/closed predicate in src/core/openHours.ts and the sitemap.
   */
  openHours: {
    /** Days of week, 0=Sunday … 6=Saturday (JS Date.getDay). */
    openDays: [6, 0, 1, 2, 3, 4] as readonly number[], // Sat–Thu
    closedDay: 5, // Friday
    openMinutes: 450, // 07:30
    closeMinutes: 1200, // 20:00
    timeZone: "Asia/Tehran",
    /** Message keys for the rendered string. */
    hoursKey: "ct.hours" as MessageKey,
  },

  /** External map directions link, verbatim (index.html line 327). */
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Kashan+Amir+Kabir+Street+Dr+Kheirkhah+Surgical+Center",

  /** Reference meta.title template: "<page> | <name>" (services.html line 13). */
  titleTemplateKey: "meta.title" as MessageKey,
} as const;

/**
 * The routes this site builds (Q4 scope: home + services landing + the ten
 * category pages). Source of truth for the sitemap and the nav, so no out-of-
 * scope route can sneak in (implementation boundary, CLAUDE.md §2 rule 4).
 */
export const ROUTES = {
  home: "/",
  services: "/services",
  /** /services/<id> for each of the ten reference category ids. */
} as const;
