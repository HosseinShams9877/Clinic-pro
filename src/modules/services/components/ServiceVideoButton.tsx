/**
 * ServiceVideoButton.tsx — the department-video trigger of
 * /services/[category] (the reference's `button.sd-video`,
 * services.html lines 146–151, wired in services.js).
 *
 * The reference has no hosted video either: clicking the trigger surfaces the
 * `ptoast` status line with the per-locale "coming soon" copy (services.js
 * VID map) for three seconds, then dismisses it. Replicating that exact
 * behaviour is fidelity, not a fake affordance — the toast is the reference's
 * own disclosed substitution, and the status role keeps it observable to
 * assistive tech. The trigger stays a real `<button type="button">`, the
 * picture stays decorative (alt="", exactly as shipped in the reference), and
 * the `.pv-play` pulse + the `.sdv-t` / `.sdv-floor` overlays all come from
 * the ported `reference.css`.
 *
 * The only client-side piece of the B-4 port, so it is an island: the panel
 * around it stays a Server Component.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

import type { Locale } from "@/core/i18n/locales";
import { t } from "@/modules/i18n/messages";
import { Icon } from "@/components/shared/Icon";
import type { LocalizedCategory } from "@/modules/services/services";

const TOAST_MS = 3000;

export function ServiceVideoButton({
  category,
  locale,
}: {
  category: LocalizedCategory;
  locale: Locale;
}) {
  const [toastIn, setToastIn] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current !== null) clearTimeout(timer.current);
  }, []);

  return (
    <>
      <button type="button" className="sd-video" id="sdVideo"
        onClick={() => {
          setToastIn(true);
          if (timer.current !== null) clearTimeout(timer.current);
          timer.current = setTimeout(() => setToastIn(false), TOAST_MS);
        }}>
        {/* .sd-video carries aspect-ratio:16/10 and position:relative in the
            ported CSS, so a fill picture is the exact geometry of the
            reference's own absolute inset-0 <img>. Decorative, as shipped. */}
        <Image
          src={category.image}
          alt=""
          fill
          sizes="(min-width: 960px) 560px, calc(100vw - 40px)"
        />
        <span className="pv-play">
          <Icon name="i-play" />
        </span>
        <span className="sdv-t">
          <small>{t(locale, "sv2.vid")}</small>
          <b>{category.name}</b>
        </span>
        <span className="sdv-floor">{category.floorLabel}</span>
      </button>
      <div className={`ptoast${toastIn ? " in" : ""}`} id="pToast" role="status">
        {toastIn ? t(locale, "sv2.vidSoon") : ""}
      </div>
    </>
  );
}
