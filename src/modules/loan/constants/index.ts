/**
 * constants — the loan feature's non-changing facts.
 *
 * The status vocabulary mirrors the JetPay credit-consumption flow
 * (مستند سرویس مصرف اعتباری سیموتک v1.2.0 §1-8/§1-9 and the `status`
 * table of §1-13) as far as the public request flow can reach. Refund and
 * its OTP/confirm services (§1-10…§1-12) are deliberately NOT here: no
 * refund UI exists in the implemented scope, and a constant nobody uses
 * rots faster than one added when needed.
 */

/** PUBLIC: the wizard's own step machine (the 5 screens). */
export const WIZARD_STEP = {
  nationalCode: "nationalCode",
  inquiry: "inquiry",
  amount: "amount",
  otp: "otp",
  result: "result",
} as const;
export type WizardStep = (typeof WIZARD_STEP)[keyof typeof WIZARD_STEP];

/** The persisted status of a LoanRequest row (Zod-validated at the edge). */
export const LOAN_STATUS = {
  /** Credit inquiry done; no amount chosen yet. */
  inquiry: "INQUIRY",
  /** OTP requested for a chosen credit + amount. */
  otpSent: "OTP_SENT",
  /** Purchase accepted by the bank, awaiting confirmation. */
  purchased: "PURCHASED",
  /** Confirm completed: the money is committed. */
  confirmed: "CONFIRMED",
  /** Bank rejected at a step, or the request was abandoned on an error. */
  failed: "FAILED",
} as const;
export type LoanStatus = (typeof LOAN_STATUS)[keyof typeof LOAN_STATUS];

/** Step names the bank's `/inquiry` returns (§1-13 result.step). */
export const BANK_STEP = {
  purchase: "PURCHASE",
  confirm: "CONFIRM",
} as const;

/** Status values the bank reports (§1-13 status table). */
export const BANK_STATUS = {
  pending: "PENDING",
  processing: "PROCESSING",
  completed: "COMPLETED",
  failed: "FAILED",
  confirmed: "CONFIRMED",
  refunded: "REFUNDED",
  retry: "RETRY",
} as const;

/** The bank's own OTP resend cooldown, mirrored by our service-level dedupe. */
export const OTP_RESEND_COOLDOWN_MS = 120_000;

/** Per-IP rate limits (FixedWindowRateLimiter, same posture as /api/status). */
export const LOAN_RATE_LIMITS = {
  /** A credit inquiry is a lookup — 10 / minute is generous for one user. */
  inquiry: { limit: 10, windowMs: 60_000 },
  /** An OTP costs the merchant an SMS — the tightest limit. */
  sendOtp: { limit: 5, windowMs: 60_000 },
  /** OTP attempts — matches the bank's own max-attempt posture. */
  verify: { limit: 10, windowMs: 60_000 },
  /** Status polling (the wizard polls after purchase). */
  status: { limit: 30, windowMs: 60_000 },
  /** Final confirm. */
  confirm: { limit: 10, windowMs: 60_000 },
  /** Transaction list. */
  transactions: { limit: 10, windowMs: 60_000 },
} as const;

/** Bank-call timeouts — a hanging upstream must not hang the UI. */
export const BANK_TIMEOUT_MS = 15_000;
