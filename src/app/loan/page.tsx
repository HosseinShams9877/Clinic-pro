/**
 * app/loan/page.tsx — the loan page, a faithful port of پلتفرم/loan.html.
 *
 * Structure mirrors the reference section for section (phx hero with
 * crumbs → ix-body with the ln-page grid: explainer column + the
 * request column) on the reference's own class hooks, which
 * reference.css styles 1:1. The reference's side card was the
 * advisor-callback demo form; here it is the live JetPay request flow
 * (the owner's 2026-11-18 loan-feature extension of scope), lazy-loaded
 * so this page's initial load ships only the static explainer.
 *
 * Scope substitutions per the binding Q decisions:
 *   - The reference's .ix-tabs nav (راهنمای قبل و بعد از عمل / ساعات
 *     ملاقات / منشور حقوق بیمار / پذیرش و ترخیص) is not rendered: its
 *     targets are past the implementation boundary (Q4 — no dead links).
 *   - The middle crumb (راهنمای بیماران) renders as plain text for the
 *     same reason: it would link nowhere.
 *   - The four "how it works" steps are adapted to the digital flow
 *     (see messages fa.ts §"Loan feature" for provenance).
 */

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { ROUTES } from "@/config/site.config";
import { getLocale } from "@/core/i18n/getLocale";
import { toLocaleDigits } from "@/core/i18n/digits";
import { t } from "@/modules/i18n/messages";
import { routeMetadata } from "@/modules/seo/lib/metadata";
import { Icon, type IconName } from "@/components/shared/Icon";
import { LoanWizardLazy } from "@/modules/loan/components/LoanWizardLazy";

export function generateMetadata(): Metadata {
  // fa-canonical title/description (SEO_ACCESSIBILITY_SECURITY.md §1.5),
  // alternates carried by routeMetadata.
  return routeMetadata({
    title: t("fa", "loan.meta"),
    description: t("fa", "loan.metaDescription"),
    path: ROUTES.loan,
  });
}

/** The four "how it works" steps (adapted to the digital flow). */
const HOW_STEPS: ReadonlyArray<"lp.h1" | "lp.h2" | "lp.h3" | "lp.h4"> = ["lp.h1", "lp.h2", "lp.h3", "lp.h4"];
/** The two "who is it for" cards. */
const WHO: ReadonlyArray<"lp.w1" | "lp.w2"> = ["lp.w1", "lp.w2"];
/** The four document chips, with the reference's own icons. */
const DOCS: ReadonlyArray<{ icon: IconName; key: "lp.d1" | "lp.d2" | "lp.d3" | "lp.d4" }> = [
  { icon: "i-user", key: "lp.d1" },
  { icon: "i-clipboard", key: "lp.d2" },
  { icon: "i-money", key: "lp.d3" },
  { icon: "i-layers", key: "lp.d4" },
];
/** The four FAQ entries, with the reference's open-first state. */
const FAQ: ReadonlyArray<{ q: "lp.q1" | "lp.q2" | "lp.q3" | "lp.q4"; a: "lp.a1" | "lp.a2" | "lp.a3" | "lp.a4" }> = [
  { q: "lp.q1", a: "lp.a1" },
  { q: "lp.q2", a: "lp.a2" },
  { q: "lp.q3", a: "lp.a3" },
  { q: "lp.q4", a: "lp.a4" },
];

export default async function LoanPage({
  searchParams,
}: {
  /** Next 15: search params arrive as a promise. */
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getLocale();
  const params = await searchParams;
  // The home section's GET form navigates here with ?nationalCode=…,
  // which the wizard pre-fills (validated on submit, not on arrival).
  const initialNationalCode = typeof params?.nationalCode === "string" ? params.nationalCode : "";

  return (
    // `.page-info` is the reference's body hook for the info pages
    // (info.css L5); the phx-in frame and ix hooks follow.
    <div className="page-info">
      <section className="phx ix ix-loan">
        <div className="container">
          <div className="phx-in">
            <div className="phx-t">
              <nav className="crumbs" aria-label="breadcrumb">
                <Link href={ROUTES.home}>{t(locale, "nav.home")}</Link>
                <span>/</span>
                {/* Plain text, not a link: the guide page is past the
                    boundary (Q4 — no dead links). */}
                <span>{t(locale, "nav.guide")}</span>
                <span>/</span>
                <b>{t(locale, "lp.t")}</b>
              </nav>
              <h1>{t(locale, "lp.t")}</h1>
              <p>{t(locale, "lp.p")}</p>
              <ul className="ix-facts">
                <li>
                  <Icon name="i-hand" size={17} />
                  <span>{t(locale, "lp.f1")}</span>
                </li>
                <li>
                  <Icon name="i-calendar" size={17} />
                  <span>{t(locale, "lp.f2")}</span>
                </li>
              </ul>
            </div>
            <div className="phx-v ix-v" aria-hidden="true">
              <Image src="/img/p-form.jpg" alt="" fill sizes="(max-width: 860px) 100vw, 45vw" />
              <div className="ix-badge">
                <span className="k">{t(locale, "lp.bk")}</span>
                <b>{t(locale, "lp.bv")}</b>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container ix-body">
        {/* The reference's .ix-tabs nav is omitted (Q4: all sibling
            tabs point past the boundary). */}
        <div className="ln-page">
          <div className="ln-page-main">
            <h2 className="ix-h first">
              <span>{t(locale, "lp.hT")}</span>
            </h2>
            <ol className="ix-steps">
              {HOW_STEPS.map((stepKey, index) => (
                <li key={stepKey}>
                  <span className="ix-num">{toLocaleDigits(locale, index + 1)}</span>
                  <div>
                    <p>{t(locale, stepKey)}</p>
                  </div>
                </li>
              ))}
            </ol>

            <h2 className="ix-h">
              <span>{t(locale, "lp.wT")}</span>
            </h2>
            <div className="ix-grid g2">
              {WHO.map((key) => (
                <div className="ix-card" key={key}>
                  <span className="ix-ic">
                    <Icon name="i-shield" size={23} />
                  </span>
                  <p>{t(locale, key)}</p>
                </div>
              ))}
            </div>

            <h2 className="ix-h">
              <span>{t(locale, "lp.dT")}</span>
            </h2>
            <div className="ix-grid g2">
              {DOCS.map((doc) => (
                <div className="ix-card ix-dc" key={doc.key}>
                  <span className="ix-ic">
                    <Icon name={doc.icon} size={23} />
                  </span>
                  <p>{t(locale, doc.key)}</p>
                </div>
              ))}
            </div>

            <h2 className="ix-h">
              <span>{t(locale, "lp.qT")}</span>
            </h2>
            <div className="ln-faq">
              {FAQ.map((item, index) => (
                <details className="ln-q" key={item.q} open={index === 0}>
                  <summary>
                    <span>{t(locale, item.q)}</span>
                    <Icon name="i-chev" size={18} />
                  </summary>
                  <p>{t(locale, item.a)}</p>
                </details>
              ))}
            </div>

            <p className="ix-note">
              <Icon name="i-alert" size={19} />
              <span>{t(locale, "lp.note")}</span>
            </p>
          </div>

          <aside className="ln-page-side">
            {/* For no-JS visitors: the notice, rendered in HTML. */}
            <noscript>
              <p className="ln-w-js">{t(locale, "lw.js")}</p>
            </noscript>
            {/* The request flow — a client island, lazy-loaded and not
                server-rendered (see LoanWizardLazy). */}
            <LoanWizardLazy locale={locale} initialNationalCode={initialNationalCode} />
          </aside>
        </div>
      </section>
    </div>
  );
}
