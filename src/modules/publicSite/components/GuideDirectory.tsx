"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Icon } from "@/components/shared/Icon";
import type { Locale } from "@/core/i18n/locales";
import guideSource from "../content/guide.json";
import { guideUi } from "../content/guideUi";
import type { GuideCategory, GuideSurgery } from "../types";

const categories = guideSource.categories as GuideCategory[];
const surgeries = guideSource.surgeries as GuideSurgery[];

function normalized(value: string) {
  return value
    .toLocaleLowerCase()
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/‌/g, "")
    .trim();
}

export function GuideDirectory({
  locale,
  initialQuery = "",
}: {
  locale: Locale;
  initialQuery?: string;
}) {
  const ui = guideUi[locale];
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState(initialQuery);
  const visible = useMemo(() => {
    const needle = normalized(query);
    return surgeries.filter((item) => {
      if (category !== "all" && item.cat !== category) return false;
      if (!needle) return true;
      return normalized(
        `${item.n.fa} ${item.n.en} ${item.n.ar} ${item.d.fa} ${item.d.en} ${item.d.ar}`,
      ).includes(needle);
    });
  }, [category, query]);

  return (
    <section className="container">
      <div className="gpanel">
        <label className="dsearch gsearch">
          <Icon name="i-search" />
          <input
            type="search"
            autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={ui.ph}
          />
        </label>
        <div className="dchips gchips" role="tablist">
          {categories.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={category === item.id}
              className={`dchip${category === item.id ? " on" : ""}`}
              onClick={() => setCategory(item.id)}
            >
              {item.n[locale]}
            </button>
          ))}
        </div>
        <div className="ggrid">
          {visible.map((item, index) => (
            <Link
              className="gsc"
              style={{ "--k": index } as React.CSSProperties}
              href={`/guide/${item.id}`}
              key={item.id}
            >
              <div className="gc-m">
                {item.img ? (
                  <Image
                    src={item.img}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 960px) 45vw, 280px"
                  />
                ) : (
                  <span className="si-mono">
                    <Icon name={item.cat === "eye" ? "i-eye" : item.cat === "ent" ? "i-ear" : "i-scalpel"} />
                  </span>
                )}
              </div>
              <div className="gc-b">
                <h2>{item.n[locale]}</h2>
                <p>{item.d[locale]}</p>
                <span className="gc-go">
                  <Icon name="i-arrow" className="arr" />
                </span>
              </div>
            </Link>
          ))}
        </div>
        {visible.length === 0 ? <p className="gempty">{ui.empty}</p> : null}
      </div>
    </section>
  );
}
