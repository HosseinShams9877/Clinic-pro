/**
 * layout.tsx — the root layout.
 *
 * One server component that bakes the resolved locale into <html lang dir>
 * server-side on every request (LOCALIZATION_AND_CALENDAR.md §1, approved
 * Q7): fa/ar render RTL, en renders LTR. There are no locale-prefixed routes;
 * the locale comes from ?lang= (mirrored to a cookie by middleware) → the
 * `lang` cookie → Accept-Language → fa.
 *
 * Fonts self-host via next/font/local over the copies in src/assets/fonts
 * (A2: copied out of the read-only reference; never hotlinked). The CSS
 * variables they expose (--font-vazirmatn / --font-nastaliq) are consumed by
 * the @theme bridge in styles/globalCss/tokens.css.
 */

import type { Metadata } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import { headers } from "next/headers";

import { siteConfig, ROUTES } from "@/config/site.config";
import { getLocale } from "@/core/i18n/getLocale";
import { LOCALES } from "@/core/i18n/locales";
import { t } from "@/modules/i18n/messages";
import { organizationJsonLd } from "@/modules/seo/lib/structuredData";
import { JsonLd } from "@/components/shared/JsonLd";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { LivingEffects } from "@/components/shared/LivingEffects";
import { MagneticButtons } from "@/components/shared/MagneticButtons";
import { MenuSpy } from "@/components/shared/MenuSpy";
import { ScrollProgress } from "@/components/shared/ScrollProgress";
import { Providers } from "./providers";
import "./globals.css";

const vazirmatn = localFont({
  src: "../assets/fonts/Vazirmatn-Variable.woff2",
  variable: "--font-vazirmatn",
  display: "swap",
  weight: "100 900",
  fallback: ["Tahoma", "ui-sans-serif", "system-ui", "sans-serif"],
});

const notoNastaliq = localFont({
  src: "../assets/fonts/NotoNastaliqUrdu-Bold.woff2",
  variable: "--font-nastaliq",
  display: "swap",
  weight: "700",
  fallback: ["serif"],
});

/** <html lang> values; ar and fa are RTL, en is LTR. */
const HTML_LANG: Readonly<Record<(typeof LOCALES)[number], string>> = { fa: "fa", en: "en", ar: "ar" };
const DIR: Readonly<Record<(typeof LOCALES)[number], "rtl" | "ltr">> = {
  fa: "rtl",
  ar: "rtl",
  en: "ltr",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: t("fa", "meta.title"),
    template: `%s | ${siteConfig.name}`,
  },
  description: t("fa", "meta.description"),
  applicationName: siteConfig.name,
  alternates: {
    canonical: "/",
    languages: { fa: "/", en: "/?lang=en", ar: "/?lang=ar" },
  },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    locale: "fa_IR",
  },
};

/** The organization's structured data — one document for every page (P1-14). */
const organizationLd = organizationJsonLd();

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  // The middleware mirrors the request path into a request header; the header
  // needs it to mark the current section's menu link active, the way the
  // reference hardcodes `class="active"` on index.html / services.html.
  const headerStore = await headers();
  const pathname = headerStore.get("x-pathname") ?? ROUTES.home;

  return (
    <html
      lang={HTML_LANG[locale]}
      dir={DIR[locale]}
      className={`${vazirmatn.variable} ${notoNastaliq.variable}`}
      suppressHydrationWarning
    >
      <body>
        {/* Skip link — the first focusable element (a11y.skip). */}
        <a className="skip-link" href="#main-content">
          {t(locale, "a11y.skip")}
        </a>
        {/* Client provider tree — React Query for the live badge only. */}
        <Providers>
          <SiteHeader locale={locale} pathname={pathname} />
          <main id="main-content">{children}</main>
          <SiteFooter locale={locale} />
        </Providers>
        {/* Living layer (P1-12): decorative only — content is server-rendered
            and fully visible without these islands. All read their gates
            (prefers-reduced-motion / pointer: fine) client-side; all render
            no content. MenuSpy + MagneticButtons are the B-6 fidelity port of
            main.js's scroll-spy and magnetic primary buttons. */}
        <ScrollProgress />
        <LivingEffects />
        <MenuSpy />
        <MagneticButtons />
        {/* The organization's structured data (P1-14), on every route. */}
        <JsonLd document={organizationLd} />
      </body>
    </html>
  );
}
