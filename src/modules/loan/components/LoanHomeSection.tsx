/**
 * LoanHomeSection.tsx — the reference's home `#loan` section, ported.
 *
 * Transcribed from پلتفرم/index.html L183–212 on the reference's own
 * class hooks (`.ln-box`, `.ln-main`, `.ln-k`, `.ln-steps`, `.ln-form` …),
 * which reference.css styles 1:1. Per the visual-fidelity standard the
 * markup mirrors the reference exactly; the only substitution is the
 * side card: the reference collected a mobile number for an advisor
 * callback (its demo stored it in localStorage), while the loan feature
 * starts the live request — so the same `.ln-form` shape asks for the
 * national code and GET-navigates to /loan. A plain GET form means zero
 * client JavaScript on the home page for this section.
 *
 * Section order matches the reference: HELP → LOAN → SERVICES (the
 * reference's own club section between them stays out of scope, Q3).
 */

import type { Locale } from "@/core/i18n/locales";
import { toLocaleDigits } from "@/core/i18n/digits";
import { t } from "@/modules/i18n/messages";
import { ROUTES } from "@/config/site.config";
import { Icon, type IconName } from "@/components/shared/Icon";

/** The four home stepper entries: the reference's own icons and steps. */
const HOME_STEPS: ReadonlyArray<{
  icon: IconName;
  number: 1 | 2 | 3 | 4;
  key: "ln.st1" | "ln.st2" | "ln.st3" | "ln.st4";
}> = [
  { icon: "i-user", number: 1, key: "ln.st1" },
  { icon: "i-phone", number: 2, key: "ln.st2" },
  { icon: "i-hand", number: 3, key: "ln.st3" },
  { icon: "i-check", number: 4, key: "ln.st4" },
];

export function LoanHomeSection({ locale }: { locale: Locale }) {
  return (
    <section className="container h-sec ln-sec" id="loan">
      <div className="ln-box">
        <div className="ln-main">
          <span className="ln-k">
            <i />
            <span>{t(locale, "ln.k")}</span>
          </span>
          <h2>
            <span>{t(locale, "ln.t1")}</span>
            <em>{t(locale, "ln.t2")}</em>
          </h2>
          <p className="ln-lead">{t(locale, "ln.p")}</p>
          <ul className="ln-bens">
            <li>
              <Icon name="i-check" size={16} />
              <span>{t(locale, "ln.b1")}</span>
            </li>
            <li>
              <Icon name="i-check" size={16} />
              <span>{t(locale, "ln.b2")}</span>
            </li>
            <li>
              <Icon name="i-check" size={16} />
              <span>{t(locale, "ln.b3")}</span>
            </li>
          </ul>
          <ol className="ln-steps">
            {HOME_STEPS.map((step) => (
              <li key={step.number}>
                <span className="ln-n">{toLocaleDigits(locale, step.number)}</span>
                <span className="ln-si">
                  <Icon name={step.icon} size={21} />
                </span>
                <span>{t(locale, step.key)}</span>
              </li>
            ))}
          </ol>
          <a className="ln-more" href={ROUTES.loan}>
            <span>{t(locale, "ln.more")}</span>
            <Icon name="i-arrow" size={17} />
          </a>
        </div>
        <div className="ln-side">
          <form className="ln-form" action={ROUTES.loan} method="get" noValidate>
            <div className="ln-f-in">
              <span className="ln-f-i">
                <Icon name="i-money" size={23} />
              </span>
              <h3>{t(locale, "ln.fT")}</h3>
              <p>{t(locale, "ln.fP")}</p>
              <label className="ln-fld">
                <span>{t(locale, "ln.nc")}</span>
                <input name="nationalCode" type="tel" inputMode="numeric" maxLength={10} dir="ltr" placeholder={t(locale, "ln.ncPh")} autoComplete="username" required />
              </label>
              <p className="ln-err" hidden>
                <span>{t(locale, "ln.ncErr")}</span>
              </p>
              <button className="btn btn-primary ln-go" type="submit">
                <Icon name="i-arrow" size={17} />
                <span>{t(locale, "ln.start")}</span>
              </button>
              <small className="ln-priv">
                <Icon name="i-shield" size={14} />
                <span>{t(locale, "ln.privNc")}</span>
              </small>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
