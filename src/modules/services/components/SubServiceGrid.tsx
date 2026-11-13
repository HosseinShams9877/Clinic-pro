/**
 * SubServiceGrid.tsx — the "خدمات این حوزه" grid of /services/[category]
 * (the reference's `section.sitems-wrap`, services.html lines 154–157,
 * populated by services.js renderItems).
 *
 * The B-4 fidelity port: the reference's exact item build —
 *   <article class="si" style="--k:k">
 *     <div class="si-m">  <img loading="lazy">  |  <span class="si-mono">svg
 *     <div class="si-b">  <h3>name</h3><p>desc</p>
 *       <a class="si-go" href="tel:+983155154000" aria-label="name">svg.arr
 *
 * The `--k` custom property drives the ported docIn entrance stagger
 * (`animation-delay:calc(var(--k)*60ms)`), exactly as the reference injects
 * it per item index.
 *
 * Image geometry note: `.si-m` is a fixed-height (150px) box that is NOT
 * positioned, and `.si-m img` sets width/height 100% + object-fit cover —
 * so a `fill` picture's inline absolute/inset geometry would collapse the
 * cell. The picture ships NON-fill with the source's true intrinsic
 * width/height as HTML attributes; the attributes lose to the class rules,
 * so the reference's own static-img geometry applies. Items without a photo
 * keep the reference's `.si-mono` icon tile (the two branches are the
 * catalog's, not a silent flattening).
 */

import type { CSSProperties } from "react";
import Image from "next/image";

import { siteConfig } from "@/config/site.config";
import type { Locale } from "@/core/i18n/locales";
import { t } from "@/modules/i18n/messages";
import { Icon, type IconName } from "@/components/shared/Icon";
import type { LocalizedCategory } from "@/modules/services/services";

/** True intrinsic dimensions of the catalog's item photos (probed from
 *  public/img/**) — honest width/height for srcset negotiation; the ported
 *  CSS owns the rendered box. */
const INTRINSIC: Readonly<Record<string, readonly [number, number]>> = {
  "/img/services/gallbladder.jpg": [760, 570],
  "/img/services/hernia.jpg": [760, 570],
  "/img/services/colon.jpg": [760, 570],
  "/img/services/stomach.jpg": [760, 570],
  "/img/services/thyroid.jpg": [622, 760],
};

export function SubServiceGrid({
  category,
  locale,
}: {
  category: LocalizedCategory;
  locale: Locale;
}) {
  return (
    <section className="container sitems-wrap">
      <div className="sec-head">
        <div>
          <h2>{t(locale, "sv2.items")}</h2>
        </div>
      </div>
      <div className="sitems" id="sItems">
        {category.items.map((item, k) => (
          <article
            key={item.name}
            className="si"
            style={{ "--k": k } as CSSProperties}
          >
            <div className="si-m">
              {item.image !== undefined ? (
                <Image
                  src={item.image}
                  alt=""
                  width={INTRINSIC[item.image]?.[0] ?? 760}
                  height={INTRINSIC[item.image]?.[1] ?? 570}
                  loading="lazy"
                  sizes="(min-width: 1181px) 340px, (min-width: 641px) calc((100vw - 136px) / 3), calc(100vw - 40px)"
                />
              ) : (
                <span className="si-mono">
                  <Icon name={(item.icon ?? "i-check") as IconName} />
                </span>
              )}
            </div>
            <div className="si-b">
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <a
                className="si-go"
                href={`tel:${siteConfig.phone}`}
                aria-label={item.name}
              >
                <Icon name="i-arrow" className="arr" />
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
