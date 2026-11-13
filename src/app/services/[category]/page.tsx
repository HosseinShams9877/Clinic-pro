/**
 * app/services/[category]/page.tsx — one category detail page.
 *
 * Pre-rendered for all ten reference category ids (generateStaticParams), so
 * every Services link resolves to a real, fully rendered page — no stubs
 * (CLAUDE.md §2 rule 4). Unknown ids fall through to notFound().
 *
 * The B-4 fidelity port: the page IS the reference's detail view
 * (services.html L135–157): `section.container.sdetail` (ServiceDetailPanel)
 * followed by `section.container.sitems-wrap` (SubServiceGrid), with the
 * category's own breadcrumb living inside the panel (the reference's
 * `.sd-crumb`). The app-only back-to-the-landing affordance closes the page
 * (the reference's single-page model never needed one) in the reference's own
 * `.btn .btn-line` treatment.
 *
 * Content is read from the Zod-validated module catalog; metadata and a
 * BreadcrumbList are generated from the same source.
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
    <>
      <ServiceDetailPanel category={category} locale={locale} />
      <SubServiceGrid category={category} locale={locale} />

      {/* Back-to-services — the app's route model adds the exit the reference's
          single page never needed; the reference's own button treatment. */}
      <section className="container svc-back">
        <Link href={ROUTES.services} className="btn btn-line">
          <Icon name="i-arrow" className="arr" />
          <span>{t(locale, "sv.all")}</span>
        </Link>
      </section>

      {/* Structured data (P1-14): the Service document plus a BreadcrumbList
          whose entries mirror the visible nav inside the panel, both built
          from the same catalog the page renders. */}
      <JsonLd document={serviceJsonLd(id, locale)} />
      <JsonLd
        document={breadcrumbJsonLd([
          { name: t(locale, "nav.home"), path: ROUTES.home },
          { name: t(locale, "nav.services"), path: ROUTES.services },
          { name: category.name, path: category.path },
        ])}
      />
    </>
  );
}
