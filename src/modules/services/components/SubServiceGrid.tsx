/**
 * SubServiceGrid.tsx — the "خدمات این حوزه" grid of /services/[category]
 * (the reference's `.sitems`, populated by services.js renderItems).
 *
 * Items are either icon-led or image-led (SubServiceSchema enforces exactly
 * one of the two): general surgery's five items carry images, everything
 * else carries an icon. The distinction is rendered, not silently flattened.
 */

import Image from "next/image";

import { Icon, type IconName } from "@/components/shared/Icon";
import type { LocalizedCategory } from "@/modules/services/services";

export function SubServiceGrid({ category }: { category: LocalizedCategory }) {
  return (
    <section className="pb-20">
      <div className="mb-7">
        <h2 className="text-[24px] font-extrabold text-foreground">{category.name}</h2>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {category.items.map((item) => (
          <article
            key={item.name}
            className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-5 shadow-1 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-2"
          >
            {item.image !== undefined ? (
              // P2 item 8: the aspect box is the wrapper, so fill reserves
              // height exactly like the raw <img> did (shipped box 311x175).
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md">
                <Image
                  src={item.image}
                  alt={item.name}
                  sizes="(min-width: 1024px) 325px, (min-width: 640px) calc((100vw - 66px) / 2), calc(100vw - 62px)"
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-50 text-primary">
                <Icon name={(item.icon ?? "i-check") as IconName} size={24} />
              </span>
            )}
            <h3 className="text-[16px] font-extrabold text-foreground">{item.name}</h3>
            <p className="text-[13.5px] leading-7 text-muted">{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
