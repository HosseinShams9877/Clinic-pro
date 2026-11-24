import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/shared/JsonLd";
import { siteConfig } from "@/config/site.config";
import { getLocale } from "@/core/i18n/getLocale";
import { GuideItemContent } from "@/modules/publicSite/components/GuideItemContent";
import guideSource from "@/modules/publicSite/content/guide.json";
import type { GuideCommonContent, GuideSurgery } from "@/modules/publicSite/types";
import { routeMetadata } from "@/modules/seo/lib/metadata";

const surgeries = guideSource.surgeries as GuideSurgery[];
const common = guideSource.common as GuideCommonContent;

export function generateStaticParams() {
  return surgeries.map((item) => ({ id: item.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const item = surgeries.find((guide) => guide.id === id);
  if (!item) return {};
  return routeMetadata({
    title: item.n.fa,
    description: item.d.fa,
    path: `/guide/${id}`,
  });
}

export default async function GuideItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = surgeries.find((guide) => guide.id === id);
  if (!item) notFound();
  const locale = await getLocale();
  const related = surgeries.filter((guide) => guide.id !== id && guide.cat === item.cat).slice(0, 4);
  const procedureJsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalProcedure",
    name: item.n.fa,
    alternateName: [item.n.en, item.n.ar],
    description: item.d.fa,
    url: new URL(`/guide/${id}`, siteConfig.url).toString(),
    procedureType: "https://schema.org/SurgicalProcedure",
  };

  return (
    <div className="page-doctors page-guide">
      <GuideItemContent locale={locale} item={item} common={common} related={related} />
      <JsonLd document={procedureJsonLd} />
    </div>
  );
}
