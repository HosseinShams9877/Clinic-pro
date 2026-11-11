/**
 * ServiceCategoryCard.tsx — one category tile for the /services landing grid.
 *
 * Pure server component over a LocalizedCategory. The card surfaces exactly
 * what the reference's runtime-built tile did (services.js renderCats):
 * image, icon, name, description and the floor label, linking to the
 * category's own route. No "doctors" link and no video button — both are out
 * of the Phase 1 boundary (REC-3, Q1: tel-only CTA).
 */

import Link from "next/link";
import Image from "next/image";

import { Icon, type IconName } from "@/components/shared/Icon";
import type { LocalizedCategory } from "@/modules/services/services";

export function ServiceCategoryCard({ category }: { category: LocalizedCategory }) {
  return (
    <Link
      href={category.path}
      className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-1 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-2"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        {/* P2 item 8: next/image fill — the wrapper already reserved the 16/10
            box, so the AVIF/WebP picture crops into it exactly like the raw
            <img> did (box parity verified live); `sizes` only picks the
            generated variant. */}
        <Image
          src={category.image}
          alt={category.name}
          sizes="(min-width: 1024px) 365px, (min-width: 640px) calc((100vw - 56px) / 2), calc(100vw - 42px)"
          fill
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute bottom-3 end-3 flex h-11 w-11 items-center justify-center rounded-full bg-surface text-primary shadow-1">
          <Icon name={category.icon as IconName} size={22} />
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="text-[17px] font-extrabold text-foreground">{category.name}</h3>
        <p className="line-clamp-2 text-[13.5px] leading-7 text-muted">{category.description}</p>
        <span className="mt-auto flex items-center gap-1.5 pt-3 text-[12.5px] font-semibold text-accent-ink">
          <Icon name="i-pin" size={15} />
          {category.floorLabel}
        </span>
      </div>
    </Link>
  );
}
