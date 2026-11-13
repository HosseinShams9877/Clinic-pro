/**
 * ServiceCategoryCard.tsx — one category tile of the /services landing grid
 * (the reference's `.scat`, built at runtime by services.js renderCats).
 *
 * The B-3 fidelity port: the reference's exact tile build —
 *   <button class="scat">
 *     <span class="sc-i"><svg/></span>
 *     <b>name</b>
 *     <img src loading="lazy">          (or <span class="sc-mono"> — every
 *                                        catalog category ships a photo, so
 *                                        the mono fallback branch never runs)
 *     <span class="sc-go"><svg class="arr"/></span>
 *   </button>
 *
 * The app's tile is a real `<Link>` to the category's own route (the detail
 * surface lives on /services/[category], B-4) instead of the reference's
 * same-page tab button — the same named destination, no tab semantics
 * (Q4: no fake affordances). `.scat`'s CSS is target-agnostic, so the ported
 * geometry, hover lift and mask-fade apply verbatim.
 *
 * Image geometry note: the ported `.scat img` rule sets
 * `position:absolute;inset:auto 0 0;height:52%;width:100%;object-fit:cover`,
 * which a `fill` picture would override from its INLINE style (Next injects
 * position/height/width/inset inline for fill, and throws on style props
 * that disagree). The picture therefore ships NON-fill with the source's
 * true intrinsic width/height as HTML attributes — attributes lose to the
 * class rules, so the reference geometry applies exactly, and the box is
 * fixed-height (210px) so nothing shifts.
 */

import Link from "next/link";
import Image from "next/image";

import { Icon, type IconName } from "@/components/shared/Icon";
import type { LocalizedCategory } from "@/modules/services/services";

/**
 * The true intrinsic dimensions of each catalog photo (probed from
 * public/img/**). Only used to give next/image honest width/height
 * attributes for srcset negotiation — the ported CSS owns the rendered box.
 */
const INTRINSIC: Readonly<Record<string, readonly [number, number]>> = {
  "/img/services/cat-gen.jpg": [622, 760],
  "/img/services/cat-gyn.jpg": [622, 760],
  "/img/services/cat-uro.jpg": [622, 760],
  "/img/services/cat-aes.jpg": [622, 760],
  "/img/services/or.jpg": [1200, 422],
  "/img/services/hero.jpg": [1600, 550],
  "/img/services/eye.jpg": [1000, 750],
  "/img/services/ent.jpg": [1000, 750],
  "/img/services/stomach.jpg": [760, 570],
  "/img/guide/v-doctor.jpg": [1400, 1050],
};

export function ServiceCategoryCard({ category }: { category: LocalizedCategory }) {
  const [width, height] = INTRINSIC[category.image] ?? [1200, 760];
  return (
    <Link href={category.path} className="scat">
      <span className="sc-i">
        <Icon name={category.icon as IconName} />
      </span>
      <b>{category.name}</b>
      <Image
        src={category.image}
        alt=""
        width={width}
        height={height}
        loading="lazy"
        sizes="(min-width: 1181px) 150px, (min-width: 641px) calc((100vw - 76px) / 4), 138px"
      />
      <span className="sc-go">
        <Icon name="i-arrow" className="arr" />
      </span>
    </Link>
  );
}
