"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Icon, type IconName } from "@/components/shared/Icon";
import { toLocaleDigits } from "@/core/i18n/digits";
import type { Locale } from "@/core/i18n/locales";
import { siteConfig } from "@/config/site.config";
import { guideUi } from "../content/guideUi";
import type { GuideCommonContent, GuideSurgery } from "../types";

export function GuideItemContent({
  locale,
  item,
  common,
  related,
}: {
  locale: Locale;
  item: GuideSurgery;
  common: GuideCommonContent;
  related: GuideSurgery[];
}) {
  const ui = guideUi[locale];
  const [tab, setTab] = useState<"pre" | "post">("pre");
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const storageKey = `kh-guide-checklist-${item.id}`;

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) setChecked(JSON.parse(saved) as Record<number, boolean>);
    } catch {
      // The checklist remains fully usable when storage is unavailable.
    }
  }, [storageKey]);

  const toggleCheck = (index: number) => {
    setChecked((current) => {
      const next = { ...current, [index]: !current[index] };
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // Non-persistent state is an acceptable privacy/storage fallback.
      }
      return next;
    });
  };

  const completed = useMemo(() => Object.values(checked).filter(Boolean).length, [checked]);
  const generalTips = tab === "pre" ? common.pre : common.post;
  const specificTips = tab === "pre" ? item.pre : item.post;

  return (
    <>
      <section className="container gi-hero-wrap">
        <div className="gi-hero">
          <div className="gi-img">
            <Image
              src={item.hero || item.img}
              alt=""
              fill
              priority
              sizes="(max-width: 960px) 100vw, 50vw"
            />
          </div>
          <div className="gi-t">
            <nav className="crumbs" aria-label="breadcrumb">
              <Link href="/guide">{locale === "fa" ? "راهنمای بیماران" : locale === "en" ? "Patient Guide" : "دليل المرضى"}</Link>
              <span>/</span>
              <b>{item.n[locale]}</b>
            </nav>
            <h1>{item.n[locale]}</h1>
            <span className="gi-sub">{ui.iSub}</span>
            <button type="button" className="btn btn-line btn-sm gi-print" onClick={() => window.print()}>
              <Icon name="i-print" />
              <span>{ui.print}</span>
            </button>
          </div>
        </div>
      </section>

      <section className="container">
        <div className="gtabs" role="tablist">
          <button
            type="button"
            className={`gtab${tab === "pre" ? " on" : ""}`}
            role="tab"
            aria-selected={tab === "pre"}
            onClick={() => setTab("pre")}
          >
            <Icon name="i-clipboard" />
            <span>{ui.tPre}</span>
          </button>
          <button
            type="button"
            className={`gtab${tab === "post" ? " on" : ""}`}
            role="tab"
            aria-selected={tab === "post"}
            onClick={() => setTab("post")}
          >
            <Icon name="i-heart" />
            <span>{ui.tPost}</span>
          </button>
        </div>
        <div className="gnote">
          <Icon name="i-shield" />
          <span>{ui.note}</span>
        </div>

        <div className="gbox">
          <h2 className="gh2">
            <Icon name="i-clipboard" />
            <span>{tab === "pre" ? ui.hPre : ui.hPost}</span>
          </h2>
          <div className="gtips">
            {generalTips.map((tip) => (
              <article key={tip.n.fa}>
                <span>
                  <Icon name={tip.i as IconName} />
                </span>
                <div>
                  <b>{tip.n[locale]}</b>
                  <p>{tip.d[locale]}</p>
                </div>
              </article>
            ))}
          </div>
          {specificTips.length ? (
            <ul className="gspec">
              <li className="gspec-t">{ui.spec}</li>
              {specificTips.map((tip) => (
                <li key={tip.fa}>
                  <Icon name="i-check" />
                  <span>{tip[locale]}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="gbox">
          <h2 className="gh2">
            <Icon name="i-check" />
            <span>{ui.chk}</span>
            <small className="gprog">
              {ui.done!
                .replace("{n}", toLocaleDigits(locale, completed))
                .replace("{t}", toLocaleDigits(locale, common.checklist.length))}
            </small>
          </h2>
          <ul className="gcheck">
            {common.checklist.map((entry, index) => (
              <li key={entry.fa}>
                <label>
                  <input
                    type="checkbox"
                    checked={Boolean(checked[index])}
                    onChange={() => toggleCheck(index)}
                  />
                  <span>{entry[locale]}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>

        <div className="gbox gwarn">
          <h2 className="gh2">
            <Icon name="i-alert" />
            <span>{ui.warnT}</span>
          </h2>
          <ul className="gwarn-l">
            {common.warn.map((warning) => (
              <li key={warning.fa}>{warning[locale]}</li>
            ))}
          </ul>
          <a className="btn btn-primary" href={`tel:${siteConfig.phone}`}>
            <Icon name="i-phone" />
            <span>{ui.warnBtn}</span>
          </a>
        </div>

        <div className="gbox gmore">
          <h2 className="gh2">
            <Icon name="i-layers" />
            <span>{ui.more}</span>
          </h2>
          <div className="ggrid gmore-g">
            {related.map((guide) => (
              <Link className="gsc" href={`/guide/${guide.id}`} key={guide.id}>
                <div className="gc-m">
                  <Image
                    src={guide.img}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 960px) 45vw, 280px"
                  />
                </div>
                <div className="gc-b">
                  <h3>{guide.n[locale]}</h3>
                  <p>{guide.d[locale]}</p>
                  <span className="gc-go">
                    <Icon name="i-arrow" className="arr" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
