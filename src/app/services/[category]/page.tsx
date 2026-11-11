/**
 * app/services/[category]/page.tsx — one category detail page.
 *
 * Pre-rendered for all ten reference category ids (generateStaticParams), so
 * every Services link resolves to a real, fully rendered page — no stubs
 * (CLAUDE.md §2 rule 4). Unknown ids fall through to notFound(). Content is
 * read from the Zod-validated module catalog; metadata and a BreadcrumbList
 * are generated from the same source.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ROUTES } from "@/config/site.config";
import { getLocale } from "@/core/i18n/getLocale";
import { t } from "@/modules/i18n/messages";
import { Icon } from "@/components/shared/Icon";
import { JsonLd } from "@/components/shared/JsonLd";
import { ServiceDetailPanel } from "@/modules/services/components/ServiceDetailPanel";
import { SubServiceGrid } from "@/modules/services/components/SubServiceGrid";
import { getLocalizedCategory } from "@/modules/services/services";
import { SERVICE_CATEGORY_ORDER } from "@/modules/services/constants";
import { routeMetadata } from "@/modules/seo/lib/metadata";
import { breadcrumbJsonLd, serviceJsonLd } from "@/modules/seo/lib/structuredData";

export function generateStaticParams() {
  return SERVICE_CATEGORY_ORDER.map((id) => ({ category: id }));
}

/** Per-category metadata; runs for each generated route, same params as the page. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: id } = await params;
  const category = getLocalizedCategory(id, "fa");
  if (category === undefined) return { title: t("fa", "meta.services") };

  return routeMetadata({ title: category.name, description: category.description, path: category.path });
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category: id } = await params;
  const locale = await getLocale();
  const category = getLocalizedCategory(id, locale);
  if (category === undefined) notFound();

  return (
    <div className="container">
      {/* Breadcrumbs — the reference's sd-crumb; structured data lives in
          the JSON-LD block generated alongside (BreadcrumbList). */}
      <nav className="flex items-center gap-2 pt-8 text-[12.5px] text-muted" aria-label="breadcrumb">
        <Link href={ROUTES.home} className="transition-colors hover:text-primary">
          {t(locale, "nav.home")}
        </Link>
        <span>/</span>
        <Link href={ROUTES.services} className="transition-colors hover:text-primary">
          {t(locale, "nav.services")}
        </Link>
        <span>/</span>
        <b className="text-foreground" aria-current="page">
          {category.name}
        </b>
      </nav>

      <ServiceDetailPanel category={category} locale={locale} />
      <SubServiceGrid category={category} />

      {/* Back-to-services — same-bounds alternative to the reference's
          out-of-scope bottom links. */}
      <div className="pb-16">
        <Link
          href={ROUTES.services}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-5 py-3 text-[14px] font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <Icon name="i-arrow" size={18} className="arr" />
          {t(locale, "sv.all")}
        </Link>
      </div>

      {/* Structured data (P1-14): the Service document plus a BreadcrumbList
          whose entries mirror the visible nav above, both built from the same
          catalog the page renders. */}
      <JsonLd document={serviceJsonLd(id, locale)} />
      <JsonLd
        document={breadcrumbJsonLd([
          { name: t(locale, "nav.home"), path: ROUTES.home },
          { name: t(locale, "nav.services"), path: ROUTES.services },
          { name: category.name, path: category.path },
        ])}
      />
    </div>
  );
}
