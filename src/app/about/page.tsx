import { getLocale } from "@/core/i18n/getLocale";
import { StaticReferencePage } from "@/modules/publicSite/components/StaticReferencePage";
import { staticReferenceMetadata } from "@/modules/publicSite/lib/staticMetadata";

export const metadata = staticReferenceMetadata("about", "/about");

export default async function AboutPage() {
  return <StaticReferencePage page="about" locale={await getLocale()} />;
}
