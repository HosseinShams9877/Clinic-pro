/**
 * ServiceGroupSection.tsx — one group block of the /services landing
 * (the reference's `.sgrp`, services.html lines 125–132).
 *
 * The B-3 fidelity port: `.sgrp` + `.sgrp-h` (icon tile `span.sgrp-i` —
 * `.med` for the medical group — plus `h2` group label and `small` group
 * subtitle) and the `.scats` grid. The reference distinguishes the two
 * grids by id and class: the surgical group is `#sCatsS` (7 columns), the
 * medical group is `.g3#sCatsM` (3 columns) — both rules are ported into
 * reference.css, so the port reuses the exact same hooks.
 *
 * The two `.sgrp` blocks are siblings inside the same
 * `section.container.scats-wrap`, which is what the ported
 * `.sgrp+.sgrp{margin-top:34px}` rhythm keys on.
 */

import type { Locale } from "@/core/i18n/locales";
import { t, type MessageKey } from "@/modules/i18n/messages";
import { getLocalizedCategoriesByGroup } from "@/modules/services/services";
import type { ServiceGroup } from "@/modules/services/types";
import { Icon, type IconName } from "@/components/shared/Icon";
import { ServiceCategoryCard } from "./ServiceCategoryCard";

const GROUP_ICON: Readonly<Record<ServiceGroup, IconName>> = { surg: "i-scalpel", med: "i-steth" };
const GROUP_SECTION_ID: Readonly<Record<ServiceGroup, string>> = { surg: "surgical", med: "medical" };
const GROUP_GRID_ID: Readonly<Record<ServiceGroup, string>> = { surg: "sCatsS", med: "sCatsM" };

export function ServiceGroupSection({ group, locale }: { group: ServiceGroup; locale: Locale }) {
  const categories = getLocalizedCategoriesByGroup(group, locale);
  const titleKey: MessageKey = group === "surg" ? "sg.surg" : "sg.med";
  const subtitleKey: MessageKey = group === "surg" ? "sg.surgS" : "sg.medS";
  // The medical group's icon tile carries the reference's `.med` modifier
  // (violet gradient) and its grid the reference's `.g3` modifier (3 cols).
  const iconClass = group === "med" ? "sgrp-i med" : "sgrp-i";
  const gridClass = group === "med" ? "scats g3" : "scats";

  return (
    <div className="sgrp" id={GROUP_SECTION_ID[group]}>
      <div className="sgrp-h">
        <span className={iconClass}>
          <Icon name={GROUP_ICON[group]} />
        </span>
        <div>
          <h2>{t(locale, titleKey)}</h2>
          <small>{t(locale, subtitleKey)}</small>
        </div>
      </div>
      <div className={gridClass} id={GROUP_GRID_ID[group]}>
        {categories.map((category) => (
          <ServiceCategoryCard key={category.id} category={category} />
        ))}
      </div>
    </div>
  );
}
