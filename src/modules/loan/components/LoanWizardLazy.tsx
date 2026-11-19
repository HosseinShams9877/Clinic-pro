/**
 * LoanWizardLazy.tsx — the lazy-loading boundary for the loan wizard.
 *
 * `next/dynamic` with `ssr: false` is only legal inside a Client
 * Component in the App Router, hence this thin wrapper. The wizard's JS
 * is never part of any initial page load: the route ships the
 * server-rendered shell (the page renders the <noscript> notice and the
 * section chrome) and this island is imported on demand — the CWV
 * budgets stay untouched, the chunk is the wizard's own.
 *
 * `ssr: false` is deliberate: the flow cannot work without JS, so
 * server-rendering it would only hydrate into an unusable widget. The
 * page-level <noscript> notice carries the no-JS message.
 */

"use client";

import dynamic from "next/dynamic";

import type { Locale } from "@/core/i18n/locales";

const LoanWizard = dynamic(() => import("./LoanWizard").then((module) => module.LoanWizard), {
  ssr: false,
  // Locale-neutral: the shell stays up for the fraction of a second the
  // chunk takes to load; text would flash.
  loading: () => (
    <div className="ln-form ln-wizard" aria-busy="true">
      <div className="ln-f-in">
        <span className="ln-f-i ln-w-dot-wrap" aria-hidden="true">
          <span className="ln-dot" />
        </span>
      </div>
    </div>
  ),
});

export function LoanWizardLazy({
  locale,
  initialNationalCode,
}: {
  locale: Locale;
  initialNationalCode?: string;
}) {
  return <LoanWizard locale={locale} initialNationalCode={initialNationalCode} />;
}
