/**
 * HomeSvcBento.tsx — the home «خدمات تخصصی» bento showcase.
 *
 * A faithful React port of پلتفرم/assets/js/home-svc.js: two tabs (surg / med)
 * swap the bento grid built from the shared service catalog, so the home
 * section always matches the services page (same names, floors, photos,
 * links). The static `.h-svc` cards rendered by page.tsx stay in the DOM as
 * the no-JS / SEO fallback — after mount, this island mirrors
 * home-svc.js exactly: `js-svc` is added to <html> (which reveals the tabs
 * via `html:not(.js-svc) .hx-tabs{display:none}`) and `.h-svc` is hidden.
 *
 * Layout, copy and behaviour are copied from the reference:
 *   - SIZE: gen/aes are featured (2×2, `f`); ent/gyn/anes/endo are wide
 *     (2×1, `w`); the rest fall back to 1×1.
 *   - `g{n % 6}` rotates the six gradient pairs.
 *   - `--d: n*60ms` staggers the `hxIn` entrance per card.
 *   - Benefits chips render only on featured cards.
 *   - Tab counts localise to the locale's digits (۷ / ٣).
 *
 * The tab pill is driven by the tablist's `data-on` attribute (CSS positions
 * `.hx-pill` from it), exactly as in the reference.
 *
 * Nothing here is content: all text comes from the catalog (provenance:
 * services-data.js via scripts/seed-content.mjs) and the message tables.
 */

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import type { Locale } from "@/core/i18n/locales";
import { toLocaleDigits } from "@/core/i18n/digits";
import { t, type MessageKey } from "@/modules/i18n/messages";
import { serviceCategories } from "@/modules/services/content/categories";
import type { ServiceGroup } from "@/modules/services/types";
import { Icon, type IconName } from "@/components/shared/Icon";

/** Bento layout per category id — home-svc.js SIZE. */
const SIZE: Readonly<Record<string, "f" | "w" | undefined>> = {
  gen: "f",
  ent: "w",
  gyn: "w",
  aes: "f",
  anes: "w",
  endo: "w",
};

/** Floor number → message key (home-svc.js FL). */
const FLOOR_KEY: Readonly<Record<number, "floorS.basm" | "floorS.ground" | "floorS.second" | "floorS.third">> = {
  [-1]: "floorS.basm",
  0: "floorS.ground",
  2: "floorS.second",
  3: "floorS.third",
};

const GROUPS: ReadonlyArray<{ id: ServiceGroup; icon: IconName; labelKey: "nav.svcSurg" | "nav.svcMed" }> = [
  { id: "surg", icon: "i-scalpel", labelKey: "nav.svcSurg" },
  { id: "med", icon: "i-steth", labelKey: "nav.svcMed" },
];

function floorLabel(locale: Locale, floor: number): string {
  const key = FLOOR_KEY[floor];
  return key ? t(locale, key) : "";
}

function shortText(locale: Locale, id: string): string {
  // The reference falls back to the category description when no short
  // blurb exists; the catalog carries a short text for every category, so
  // the fallback is a safety net only.
  return t(locale, `short.${id}` as MessageKey);
}

/** Localised tab count — the reference writes_FA digits into `.hx-n`. */
function countFor(locale: Locale, group: ServiceGroup): string {
  return toLocaleDigits(locale, serviceCategories.filter((c) => c.group === group).length);
}

export function HomeSvcBento({ locale }: { locale: Locale }) {
  const [group, setGroup] = useState<ServiceGroup>("surg");
  const [mounted, setMounted] = useState(false);

  // home-svc.js: `html.classList.add("js-svc"); document.querySelector(".h-svc").hidden = true;`
  useEffect(() => {
    document.documentElement.classList.add("js-svc");
    const fallback = document.querySelector(".h-svc");
    if (fallback) fallback.setAttribute("hidden", "");
    setMounted(true);
  }, []);

  const onTab = (next: ServiceGroup) => {
    if (next === group) return; // home-svc.js ignores a re-click of the active tab
    setGroup(next);
  };

  const cards = mounted
    ? serviceCategories
        .filter((c) => c.group === group)
        .map((c, i) => {
          const sz = SIZE[c.id] ?? "";
          const n = i + 1;
          return { c, sz, n };
        })
    : [];

  return (
    <>
      <div className="hx-tabs" role="tablist" data-on={group} aria-label={t(locale, "h.svT")}>
        {GROUPS.map((g) => {
          const on = g.id === group;
          return (
            <button
              key={g.id}
              type="button"
              className={`hx-tab${on ? " on" : ""}`}
              role="tab"
              aria-selected={on}
              aria-controls="hxSvc"
              data-g={g.id}
              onClick={() => onTab(g.id)}
            >
              <Icon name={g.icon} />
              <span>{t(locale, g.labelKey)}</span>
              <em className="hx-n">{countFor(locale, g.id)}</em>
            </button>
          );
        })}
        <i className="hx-pill" aria-hidden="true" />
      </div>
      {/* key={group} forces a fresh subtree per tab switch so the `hxIn`
          entrance replays, mirroring home-svc.js's remove("in")/reflow/add("in"). */}
      <div
        key={mounted ? group : "init"}
        className={`hx-grid${mounted ? " in" : ""}`}
        id="hxSvc"
        role="tabpanel"
        aria-label={t(locale, group === "surg" ? "nav.svcSurg" : "nav.svcMed")}
        hidden={!mounted}
      >
        {cards.map(({ c, sz, n }) => (
          <a
            key={c.id}
            className={`hx-c ${sz} g${n % 6}`}
            href={`/services/${c.id}`}
            style={{ ["--d" as string]: `${n * 60}ms` }}
          >
            <Image src={c.image} alt="" fill sizes="(max-width: 640px) 92vw, (max-width: 1100px) 46vw, 23vw" />
            <span className="hx-fl">
              <Icon name="i-building" size={14} />
              {floorLabel(locale, c.floor)}
            </span>
            <span className="hx-i">
              <Icon name={c.icon as IconName} />
            </span>
            <div className="hx-t">
              <b>{c.name[locale]}</b>
              <p>{shortText(locale, c.id)}</p>
              {sz === "f" && c.benefits.length > 0 && (
                <ul className="hx-ben">
                  {c.benefits.map((b) => (
                    <li key={b.title.fa}>
                      <Icon name={b.icon as IconName} size={15} />
                      {b.title[locale]}
                    </li>
                  ))}
                </ul>
              )}
              <span className="hx-go">
                <span>{t(locale, "h.see")}</span>
                <i>
                  <Icon name="i-arrow" size={17} />
                </i>
              </span>
            </div>
          </a>
        ))}
      </div>
    </>
  );
}
