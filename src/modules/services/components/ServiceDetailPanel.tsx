/**
 * ServiceDetailPanel.tsx — the header block of /services/[category]
 * (the reference's `.sdetail`, services.html lines 138–156).
 *
 * CTA is tel-only (Q1): the reference's booking button pointed at the patient
 * panel and its "doctors of this field" button at doctors.html — both are
 * past the Services section, so neither is reproduced (REC-3). The reference
 * paired the text with a video button (sd-video); per the same ruling the
 * static category image carries the visual instead.
 */

import Image from "next/image";

import { siteConfig } from "@/config/site.config";
import type { Locale } from "@/core/i18n/locales";
import { t } from "@/modules/i18n/messages";
import { Icon, type IconName } from "@/components/shared/Icon";
import type { LocalizedCategory } from "@/modules/services/services";

export function ServiceDetailPanel({ category, locale }: { category: LocalizedCategory; locale: Locale }) {
  return (
    <section className="grid items-center gap-10 py-14 md:grid-cols-2 md:py-20">
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-50 text-primary">
            <Icon name={category.icon as IconName} size={26} />
          </span>
          <span className="rounded-full bg-accent/10 px-3.5 py-1 text-[12.5px] font-semibold text-accent-ink">
            {category.floorLabel}
          </span>
        </div>
        <h1 className="text-[30px] font-extrabold leading-tight text-foreground md:text-[40px]">
          {category.name}
        </h1>
        <p className="max-w-xl text-[15px] leading-loose text-muted">{category.description}</p>

        {/* Benefits — the reference's sd-ben. */}
        <ul className="flex flex-col gap-3 pt-1">
          {category.benefits.map((benefit) => (
            <li key={benefit.title} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-t5 text-t5i">
                <Icon name={benefit.icon as IconName} size={18} />
              </span>
              <b className="pt-1.5 text-[14px] font-semibold text-foreground">{benefit.title}</b>
            </li>
          ))}
        </ul>

        <a
          href={`tel:${siteConfig.phone}`}
          className="btn-primary mt-3 inline-flex w-fit items-center gap-2 rounded-lg bg-accent-strong px-6 py-3.5 text-[15px] font-bold text-on-accent transition hover:opacity-90"
        >
          <Icon name="i-phone" size={20} />
          {t(locale, "sv2.call")}
        </a>
      </div>

      {/* P2 item 8: fill inside a reserved aspect-[4/3] figure — the picture
          decodes AVIF/WebP without changing the shipped box (353x265 /
          550x413, verified). */}
      <figure className="relative aspect-[4/3] overflow-hidden rounded-xl shadow-2">
        <Image
          src={category.image}
          alt={category.name}
          sizes="(min-width: 960px) 550px, calc(100vw - 40px)"
          fill
          className="object-cover"
        />
      </figure>
    </section>
  );
}
