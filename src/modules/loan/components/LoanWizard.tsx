/**
 * LoanWizard.tsx — the public loan-request flow (client island).
 *
 * THE flow, per the JetPay v1.2.0 document:
 *   1. national code  → POST /api/loan/inquiry   (PDF §1-5)
 *   2. credit choice  → shown from the inquiry result
 *   3. amount + OTP   → POST /api/loan/send-otp   (§1-6)
 *   4. OTP            → POST /api/loan/verify     (§1-8 purchase)
 *      then polls     GET  /api/loan/status       (§1-13) and, once the
 *      purchase step is COMPLETED, POST /api/loan/confirm (§1-9)
 *   5. result         → success / pending / failure
 *
 * All bank traffic flows through our own routes (never the browser →
 * bank), all validation happens server-side with Zod, and the wizard
 * itself only renders what the routes return.
 *
 * The markup rides the reference's own design vocabulary: `.ln-form`,
 * `.ln-f-in`, `.ln-fld`, `.ln-go`, `.ln-err`, `.ln-ok`, `.ln-steps`
 * (پلتفرم/assets/css/loan.css) — ported verbatim into reference.css, so
 * the flow looks exactly like the reference's loan page, not like a
 * generic form template. The empty server shell (LoanWizardFallback)
 * renders while the island loads and for no-JS visitors.
 */

"use client";

import { useEffect, useRef, useState } from "react";

import type { Locale } from "@/core/i18n/locales";
import { toAsciiDigits, toLocaleDigits } from "@/core/i18n/digits";
import { t } from "@/modules/i18n/messages";
import { Icon } from "@/components/shared/Icon";
import {
  type InquiryResponse,
  type StatusResponse,
  type VerifyResponse,
  fetchConfirm,
  fetchInquiry,
  fetchSendOtp,
  fetchStatus,
  fetchVerify,
  loanErrorMessage,
} from "../queries/loanQueries";
import { WIZARD_STEP, type WizardStep } from "../constants";

/** Polling posture after a purchase: every 3s, up to ~30s, then "pending". */
const POLL_INTERVAL_MS = 3_000;
const POLL_MAX_ATTEMPTS = 10;

type ResultKind = "processing" | "confirmed" | "pending" | "failed";

export interface LoanWizardProps {
  locale: Locale;
  /** Prefilled from /loan?nationalCode=… (the home section's GET form). */
  initialNationalCode?: string;
}

export function LoanWizard({ locale, initialNationalCode = "" }: LoanWizardProps) {
  const [step, setStep] = useState<WizardStep>(WIZARD_STEP.nationalCode);
  const [nationalCode, setNationalCode] = useState(initialNationalCode);
  const [inquiry, setInquiry] = useState<InquiryResponse | null>(null);
  const [creditId, setCreditId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [otp, setOtp] = useState<string>("");
  const [mobile, setMobile] = useState<string>("");
  const [purchase, setPurchase] = useState<VerifyResponse | null>(null);
  const [result, setResult] = useState<ResultKind>("processing");
  const [bankStatus, setBankStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [busy, setBusy] = useState<boolean>(false);
  const [fieldError, setFieldError] = useState<boolean>(false);

  const busyRef = useRef(busy);
  busyRef.current = busy;

  const selectedCredit = inquiry?.credits.find((credit) => credit.creditId === creditId) ?? null;

  /* --------------------------- step 1 ---------------------------- */

  function submitNationalCode(event: React.FormEvent) {
    event.preventDefault();
    if (busyRef.current) return; // duplicate-submit guard
    const normalized = toAsciiDigits(nationalCode).replace(/\D/g, "");
    if (!/^\d{10}$/.test(normalized)) {
      setFieldError(true);
      setError(t(locale, "ln.ncErr"));
      return;
    }
    setFieldError(false);
    setError("");
    setNationalCode(normalized);
    runStep(async () => {
      const response = await fetchInquiry(normalized);
      if (response.credits.length === 0) {
        setError(t(locale, "lw.noCredits"));
        return;
      }
      setInquiry(response);
      setCreditId(response.credits[0]?.creditId ?? "");
      setStep(WIZARD_STEP.inquiry);
    });
  }

  /* --------------------------- step 2 ---------------------------- */

  function submitCredit(event: React.FormEvent) {
    event.preventDefault();
    if (busyRef.current || selectedCredit === null) return;
    setStep(WIZARD_STEP.amount);
  }

  /* --------------------------- step 3 ---------------------------- */

  function submitAmount(event: React.FormEvent) {
    event.preventDefault();
    if (busyRef.current || selectedCredit === null) return;
    const value = Number(toAsciiDigits(amount).replace(/[^\d.]/g, ""));
    if (
      !Number.isInteger(value) ||
      value < 1000 ||
      value > selectedCredit.creditBalance
    ) {
      setFieldError(true);
      setError(t(locale, "lw.amountErr"));
      return;
    }
    setFieldError(false);
    setError("");
    if (inquiry === null) return;
    runStep(async () => {
      const response = await fetchSendOtp({
        nationalCode,
        requestId: inquiry.requestId,
        creditId: selectedCredit.creditId,
        amount: value,
      });
      setMobile(response.mobile);
      setOtp("");
      setStep(WIZARD_STEP.otp);
    });
  }

  /* --------------------------- step 4 ---------------------------- */

  function submitOtp(event: React.FormEvent) {
    event.preventDefault();
    if (busyRef.current || inquiry === null || selectedCredit === null) return;
    const code = toAsciiDigits(otp).replace(/\D/g, "");
    if (code.length < 4) {
      setFieldError(true);
      setError(t(locale, "lw.otpPh"));
      return;
    }
    setFieldError(false);
    setError("");
    const requested = Number(toAsciiDigits(amount).replace(/[^\d.]/g, ""));
    runStep(async () => {
      const response = await fetchVerify({
        nationalCode,
        requestId: inquiry.requestId,
        creditId: selectedCredit.creditId,
        amount: requested,
        otp: code,
      });
      setPurchase(response);
      setResult("processing");
      setBankStatus(response.status);
      setStep(WIZARD_STEP.result);
      void pollConfirmation(response.referenceNumber);
    });
  }

  /**
   * Poll the bank's status (§1-13) until the purchase step is COMPLETED,
   * then send the final confirm (§1-9). If the purchase fails, the result
   * screen says so; if the bank is still processing after the polling
   * budget, the request is registered and pending — the honest state.
   */
  async function pollConfirmation(referenceNumber: string) {
    for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      let status: StatusResponse;
      try {
        status = await fetchStatus(referenceNumber);
      } catch {
        continue; // a failed poll is not a failed request; retry
      }
      const purchaseStep = status.steps.find((stepRow) => stepRow.step === "PURCHASE");
      if (purchaseStep?.status === "FAILED") {
        setBankStatus(purchaseStep.status);
        setResult("failed");
        return;
      }
      if (purchaseStep?.status === "COMPLETED") {
        try {
          const confirmed = await fetchConfirm(referenceNumber);
          setBankStatus(confirmed.status);
          setResult(confirmed.status === "CONFIRMED" || confirmed.status === "COMPLETED" ? "confirmed" : "pending");
        } catch {
          // The confirm call failed but the purchase completed: the bank's
          // §1-9 note gives 60 minutes before auto-expiry — pending, and
          // the advisor follows up. Retrying blindly would double-charge.
          setResult("pending");
        }
        return;
      }
      if (purchaseStep) setBankStatus(purchaseStep.status);
    }
    setResult("pending");
  }

  /* --------------------------- helpers --------------------------- */

  async function runStep(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (cause) {
      setError(loanErrorMessage(locale, cause));
      setResult("failed");
    } finally {
      setBusy(false);
    }
  }

  function resetToNationalCode() {
    setStep(WIZARD_STEP.nationalCode);
    setInquiry(null);
    setCreditId("");
    setAmount("");
    setOtp("");
    setMobile("");
    setPurchase(null);
    setError("");
    setFieldError(false);
  }

  const digits = (value: number | string) => toLocaleDigits(locale, value);
  const formattedAmount = (value: number) => digits(value.toLocaleString("en-US"));

  /* --------------------------- render ---------------------------- */

  const stepIndex: Readonly<Record<WizardStep, number>> = {
    [WIZARD_STEP.nationalCode]: 0,
    [WIZARD_STEP.inquiry]: 1,
    [WIZARD_STEP.amount]: 2,
    [WIZARD_STEP.otp]: 3,
    [WIZARD_STEP.result]: 4,
  };
  const current = stepIndex[step];

  return (
    <form className="ln-form ln-wizard" data-src="loan-page" noValidate onSubmit={(event) => event.preventDefault()}>
      <div className="ln-f-in">
        <span className="ln-f-i">
          <Icon name="i-money" size={23} />
        </span>
        <h3>{t(locale, "lw.title")}</h3>
        {/* The reference's own 4-step stepper (loan.css), adapted to the flow. */}
        <ol className="ln-steps ln-w-steps" aria-hidden="true">
          {(["lw.s1", "lw.s2", "lw.s3", "lw.s4"] as const).map((label, index) => (
            <li key={label} className={index < current ? "done" : index === current ? "on" : ""}>
              <span className="ln-n">{digits(index + 1)}</span>
              <span className="ln-si">
                <Icon name={index === 0 ? "i-user" : index === 1 ? "i-search" : index === 2 ? "i-money" : "i-check"} size={21} />
              </span>
              <span>{t(locale, label)}</span>
            </li>
          ))}
        </ol>

        {error ? (
          <p className="ln-err" role="alert">
            {error}
          </p>
        ) : null}

        {step === WIZARD_STEP.nationalCode ? (
          <label className="ln-fld">
            <span>{t(locale, "ln.nc")}</span>
            <input
              name="nationalCode"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              dir="ltr"
              placeholder={t(locale, "ln.ncPh")}
              autoComplete="username"
              value={nationalCode}
              aria-invalid={fieldError}
              className={fieldError ? "bad" : undefined}
              disabled={busy}
              onChange={(event) => {
                setNationalCode(event.target.value);
                setFieldError(false);
              }}
            />
          </label>
        ) : (
          <p className="ln-w-nc">
            <Icon name="i-user" size={16} />
            <span dir="ltr">{digits(nationalCode)}</span>
            <button type="button" className="ln-again" onClick={resetToNationalCode}>
              {t(locale, "lw.editNc")}
            </button>
          </p>
        )}

        {step === WIZARD_STEP.inquiry && inquiry ? (
          inquiry.credits.length > 1 ? (
            <fieldset className="ln-w-credits">
              <legend className="ln-fld">
                <span>{t(locale, "lw.chooseCredit")}</span>
              </legend>
              {inquiry.credits.map((credit) => (
                <label key={credit.creditId} className="ln-w-credit">
                  <input
                    type="radio"
                    name="creditId"
                    value={credit.creditId}
                    checked={credit.creditId === creditId}
                    onChange={() => setCreditId(credit.creditId)}
                  />
                  <span className="ln-w-c-box">
                    <b>{credit.creditName}</b>
                    {credit.customerName ? <small>{t(locale, "lw.customer")}: {credit.customerName}</small> : null}
                    <em>
                      {t(locale, "lw.balance")}: {formattedAmount(credit.creditBalance)}
                    </em>
                  </span>
                </label>
              ))}
            </fieldset>
          ) : (
            <p className="ln-w-one">
              {selectedCredit ? (
                <>
                  <b>{selectedCredit.creditName}</b>
                  <em>
                    {t(locale, "lw.balance")}: {formattedAmount(selectedCredit.creditBalance)}
                  </em>
                  {selectedCredit.customerName ? <small>{t(locale, "lw.customer")}: {selectedCredit.customerName}</small> : null}
                </>
              ) : null}
            </p>
          )
        ) : null}

        {step === WIZARD_STEP.amount && selectedCredit ? (
          <>
            <label className="ln-fld">
              <span>{t(locale, "lw.amount")}</span>
              <input
                name="amount"
                type="tel"
                inputMode="numeric"
                dir="ltr"
                placeholder={formattedAmount(selectedCredit.creditBalance)}
                aria-invalid={fieldError}
                className={fieldError ? "bad" : undefined}
                disabled={busy}
                value={amount}
                onChange={(event) => {
                  setAmount(event.target.value);
                  setFieldError(false);
                }}
              />
            </label>
            <small className="ln-w-hint">{t(locale, "lw.amountHint")}</small>
          </>
        ) : null}

        {step === WIZARD_STEP.otp ? (
          <>
            <p className="ln-w-mobile">
              {t(locale, "lw.otpSent").replace("{mobile}", mobile)}
            </p>
            <label className="ln-fld">
              <span>{t(locale, "lw.otp")}</span>
              <input
                name="otp"
                type="tel"
                inputMode="numeric"
                maxLength={6}
                dir="ltr"
                placeholder={t(locale, "lw.otpPh")}
                autoComplete="one-time-code"
                aria-invalid={fieldError}
                className={fieldError ? "bad" : undefined}
                disabled={busy}
                value={otp}
                onChange={(event) => {
                  setOtp(event.target.value);
                  setFieldError(false);
                }}
              />
            </label>
          </>
        ) : null}

        {step === WIZARD_STEP.result && purchase ? (
          <div className="ln-w-result" role="status">
            {result === "processing" ? (
              <p className="ln-w-proc">
                <span className="ln-dot" aria-hidden="true" />
                {t(locale, "lw.polling")}
              </p>
            ) : result === "confirmed" ? (
              <div className="ln-ok ln-w-ok">
                <span className="ln-ok-i">
                  <Icon name="i-check" size={32} />
                </span>
                <h3>{t(locale, "lw.successTitle")}</h3>
                <dl className="ln-w-facts">
                  <div>
                    <dt>{t(locale, "lw.refNum")}</dt>
                    <dd dir="ltr">{purchase.referenceNumber}</dd>
                  </div>
                  <div>
                    <dt>{t(locale, "lw.txId")}</dt>
                    <dd dir="ltr">{digits(purchase.transactionId)}</dd>
                  </div>
                  <div>
                    <dt>{t(locale, "lw.amountPaid")}</dt>
                    <dd dir="ltr">
                      {digits(Number(toAsciiDigits(amount).replace(/[^\d.]/g, "")).toLocaleString("en-US"))}
                    </dd>
                  </div>
                  <div>
                    <dt>{t(locale, "lw.stCONFIRMED")}</dt>
                    <dd>{bankStatus ? t(locale, statusKey(bankStatus)) : t(locale, "lw.stCONFIRMED")}</dd>
                  </div>
                </dl>
              </div>
            ) : result === "pending" ? (
              <div className="ln-ok ln-w-ok">
                <span className="ln-ok-i">
                  <Icon name="i-clock" size={32} />
                </span>
                <h3>{t(locale, "lw.pendingTitle")}</h3>
                <p>{t(locale, "lw.pendingBody")}</p>
                <dl className="ln-w-facts">
                  <div>
                    <dt>{t(locale, "lw.refNum")}</dt>
                    <dd dir="ltr">{purchase.referenceNumber}</dd>
                  </div>
                </dl>
              </div>
            ) : (
              <div className="ln-ok ln-w-fail">
                <span className="ln-w-fail-i">
                  <Icon name="i-alert" size={32} />
                </span>
                <h3>{t(locale, "lw.failedTitle")}</h3>
                <p>{bankStatus ? t(locale, statusKey(bankStatus)) : error || t(locale, "lw.errGeneric")}</p>
              </div>
            )}
          </div>
        ) : null}

        {/* Footer actions: the reference's .ln-go primary button shape. */}
        {step === WIZARD_STEP.nationalCode ? (
          <button className="btn btn-primary ln-go" type="submit" onClick={submitNationalCode} disabled={busy}>
            <Icon name="i-arrow" size={17} />
            <span>{busy ? t(locale, "lw.verifying") : t(locale, "ln.start")}</span>
          </button>
        ) : null}
        {step === WIZARD_STEP.inquiry ? (
          <button className="btn btn-primary ln-go" type="submit" onClick={submitCredit} disabled={busy}>
            <Icon name="i-arrow" size={17} />
            <span>{t(locale, "lw.submit")}</span>
          </button>
        ) : null}
        {step === WIZARD_STEP.amount ? (
          <button className="btn btn-primary ln-go" type="submit" onClick={submitAmount} disabled={busy}>
            <Icon name="i-phone" size={17} />
            <span>{busy ? t(locale, "lw.sending") : t(locale, "lw.sendOtp")}</span>
          </button>
        ) : null}
        {step === WIZARD_STEP.otp ? (
          <>
            <button className="btn btn-primary ln-go" type="submit" onClick={submitOtp} disabled={busy}>
              <Icon name="i-check" size={17} />
              <span>{busy ? t(locale, "lw.verifying") : t(locale, "lw.verify")}</span>
            </button>
            <button type="button" className="ln-again ln-w-resend" onClick={() => setStep(WIZARD_STEP.amount)} disabled={busy}>
              {t(locale, "lw.resend")}
            </button>
          </>
        ) : null}
        {step === WIZARD_STEP.result && result === "failed" ? (
          <button className="btn btn-primary ln-go" type="button" onClick={resetToNationalCode}>
            <Icon name="i-arrow" size={17} />
            <span>{t(locale, "lw.newRequest")}</span>
          </button>
        ) : null}

        <small className="ln-priv">
          <Icon name="i-shield" size={14} />
          <span>{t(locale, "ln.privNc")}</span>
        </small>
      </div>
    </form>
  );
}

/** Map a bank status string to a message key (falls back to generic). */
function statusKey(status: string): "lw.stPENDING" | "lw.stPROCESSING" | "lw.stCOMPLETED" | "lw.stCONFIRMED" | "lw.stFAILED" | "lw.stREFUNDED" | "lw.stRETRY" {
  switch (status) {
    case "PENDING":
      return "lw.stPENDING";
    case "PROCESSING":
      return "lw.stPROCESSING";
    case "COMPLETED":
      return "lw.stCOMPLETED";
    case "CONFIRMED":
      return "lw.stCONFIRMED";
    case "FAILED":
      return "lw.stFAILED";
    case "REFUNDED":
      return "lw.stREFUNDED";
    case "RETRY":
      return "lw.stRETRY";
    default:
      return "lw.stPENDING";
  }
}
