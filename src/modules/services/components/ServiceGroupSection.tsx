/**
 * ServiceGroupSection.tsx — one group block of the /services landing
 * (the reference's `.sgrp`, services.html lines 126–136).
 *
 * Heading = group label + the group's reference subtitle (sg.surgS / sg.medS);
 * body = the group's category cards in the reference's client-requested
 * order. The section id (#surgical / #medical) is what the header sub-links
 * and the landing breadcrumbs target, exactly like the reference.
 */

import type { Locale } from "@/core/i18n/locales";
import { t, type MessageKey } from "@/modules/i18n/messages";
import { getLocalizedCategoriesByGroup } from "@/modules/services/services";
import type { ServiceGroup } from "@/modules/services/types";
import { Icon, type IconName } from "@/components/shared/Icon";
import { ServiceCategoryCard } from "./ServiceCategoryCard";

const GROUP_ICON: Readonly<Record<ServiceGroup, IconName>> = { surg: "i-scalpel", med: "i-steth" };
const GROUP_SECTION_ID: Readonly<Record<ServiceGroup, string>> = { surg: "surgical", med: "medical" };

export function ServiceGroupSection({ group, locale }: { group: ServiceGroup; locale: Locale }) {
  const categories = getLocalizedCategoriesByGroup(group, locale);
  const titleKey: MessageKey = group === "surg" ? "sg.surg" : "sg.med";
  const subtitleKey: MessageKey = group === "surg" ? "sg.surgS" : "sg.medS";

  return (
    <section id={GROUP_SECTION_ID[group]} className="scats-wrap flex scroll-mt-24 flex-col gap-6">
      <div className="flex items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary">
          <Icon name={GROUP_ICON[group]} size={28} />
        </span>
        <div>
          <h2 className="text-[24px] font-extrabold text-foreground">{t(locale, titleKey)}</h2>
          <p className="text-[13.5px] text-muted">{t(locale, subtitleKey)}</p>
        </div>
      </div>
      {/* Surgical grid: 3 columns wide; medical group: 3 in the reference's `g3`. */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <ServiceCategoryCard key={category.id} category={category} />
        ))}
      </div>
    </section>
  );
}
