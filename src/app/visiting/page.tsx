import { getLocale } from "@/core/i18n/getLocale";
import { StaticReferencePage } from "@/modules/publicSite/components/StaticReferencePage";
import { staticReferenceMetadata } from "@/modules/publicSite/lib/staticMetadata";

export const metadata = staticReferenceMetadata("visiting", "/visiting");

export default async function VisitingPage() {
  return <StaticReferencePage page="visiting" locale={await getLocale()} />;
}
