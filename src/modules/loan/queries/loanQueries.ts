/**
 * loanQueries.ts — the client side of the loan feature.
 *
 * Everything the LoanWizard island needs to talk to our own routes. It
 * deliberately imports NO Zod (the same bundle posture as the status
 * badge: `statusClientGuard` mirrors the Zod schema by hand so the ~15 KB
 * runtime never ships). A response that fails the mirror is rejected —
 * the wizard then shows the generic error instead of rendering garbage.
 *
 * Error contract (lib/routeHandler.ts): failures arrive as
 * `{ error: string, fa?: string, code?: number }`; `fa` is the bank's own
 * Persian message when the bank refused, and is preferred for display.
 */

import type { Locale } from "@/core/i18n/locales";
import { t } from "@/modules/i18n/messages";

/* ----------------------------- types ------------------------------ */

export type CreditOption = {
  creditId: string;
  creditName: string;
  description?: string;
  creditBalance: number;
  creditAmount?: number;
  customerName?: string;
};

export type InquiryResponse = { requestId: string; credits: CreditOption[] };
export type SendOtpResponse = { mobile: string };
export type VerifyResponse = {
  transactionId: number;
  referenceNumber: string;
  status: string;
  usedAmount?: number;
};
export type StatusResponse = {
  steps: Array<{
    step: string;
    status: string;
    date?: string;
    amount?: string;
    clarifiedStatus?: string;
  }>;
  loanStatus?: string;
};
export type TransactionsResponse = {
  list: Array<Record<string, unknown>>;
  total: number;
};

export class LoanApiError extends Error {
  constructor(
    /** 4xx/5xx from our own route. */
    public readonly status: number,
    message: string,
    /** The bank's Persian message when the bank refused. */
    public readonly fa: string | undefined,
    /** The bank's error code when available. */
    public readonly code: number | undefined,
  ) {
    super(message);
    this.name = "LoanApiError";
  }
}

/* ----------------------------- guards ----------------------------- */

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const hasString = (value: Record<string, unknown>, key: string): value is Record<string, unknown> & { [k in typeof key]: string } =>
  typeof value[key] === "string";

const isCredit = (value: unknown): value is CreditOption =>
  isObject(value) &&
  hasString(value, "creditId") &&
  hasString(value, "creditName") &&
  typeof value.creditBalance === "number";

export const isInquiryResponse = (value: unknown): value is InquiryResponse =>
  isObject(value) &&
  hasString(value, "requestId") &&
  Array.isArray(value.credits) &&
  value.credits.every(isCredit);

export const isSendOtpResponse = (value: unknown): value is SendOtpResponse =>
  isObject(value) && hasString(value, "mobile");

export const isVerifyResponse = (value: unknown): value is VerifyResponse =>
  isObject(value) &&
  hasString(value, "referenceNumber") &&
  typeof value.transactionId === "number" &&
  typeof value.status === "string";

export const isStatusResponse = (value: unknown): value is StatusResponse =>
  isObject(value) &&
  Array.isArray(value.steps) &&
  value.steps.every(
    (step) => isObject(step) && hasString(step, "step") && hasString(step, "status"),
  );

/* --------------------------- fetch helper ------------------------- */

type Options = { signal?: AbortSignal };

async function postJson<T>(path: string, body: unknown, guard: (value: unknown) => value is T, options?: Options): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: options?.signal,
    });
  } catch {
    throw new LoanApiError(0, "network", undefined, undefined);
  }
  return parseResponse(response, guard);
}

async function getJson<T>(path: string, guard: (value: unknown) => value is T, options?: Options): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, { signal: options?.signal });
  } catch {
    throw new LoanApiError(0, "network", undefined, undefined);
  }
  return parseResponse(response, guard);
}

async function parseResponse<T>(response: Response, guard: (value: unknown) => value is T): Promise<T> {
  const parsed: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = isObject(parsed) ? parsed : {};
    const message = typeof error.error === "string" ? error.error : "error";
    const fa = isObject(error) && typeof error.fa === "string" ? error.fa : undefined;
    const code = isObject(error) && typeof error.code === "number" ? error.code : undefined;
    throw new LoanApiError(response.status, message, fa, code);
  }
  if (!guard(parsed)) throw new LoanApiError(response.status, "malformed", undefined, undefined);
  return parsed;
}

/* ------------------------------ calls ----------------------------- */

export const LOAN_API = {
  inquiry: "/api/loan/inquiry",
  sendOtp: "/api/loan/send-otp",
  verify: "/api/loan/verify",
  status: "/api/loan/status",
  confirm: "/api/loan/confirm",
  transactions: "/api/loan/transactions",
} as const;

export function fetchInquiry(nationalCode: string, options?: Options): Promise<InquiryResponse> {
  return postJson(LOAN_API.inquiry, { nationalCode }, isInquiryResponse, options);
}

export function fetchSendOtp(
  input: { nationalCode: string; requestId: string; creditId: string; amount: number },
  options?: Options,
): Promise<SendOtpResponse> {
  return postJson(LOAN_API.sendOtp, input, isSendOtpResponse, options);
}

export function fetchVerify(
  input: { nationalCode: string; requestId: string; creditId: string; amount: number; otp: string },
  options?: Options,
): Promise<VerifyResponse> {
  return postJson(LOAN_API.verify, input, isVerifyResponse, options);
}

export function fetchStatus(referenceNumber: string, options?: Options): Promise<StatusResponse> {
  return getJson(`${LOAN_API.status}?referenceNumber=${encodeURIComponent(referenceNumber)}`, isStatusResponse, options);
}

export function fetchConfirm(referenceNumber: string, options?: Options): Promise<{ status: string; transactionId: number; referenceNumber: string }> {
  return postJson(
    LOAN_API.confirm,
    { referenceNumber },
    (value): value is { status: string; transactionId: number; referenceNumber: string } =>
      isObject(value) &&
      hasString(value, "status") &&
      typeof value.transactionId === "number" &&
      hasString(value, "referenceNumber"),
    options,
  );
}

/* ------------------------ display helpers ------------------------- */

/**
 * The message to show the user for a failed call. Order: the bank's own
 * Persian wording (it says exactly what went wrong, e.g. "کد وارد شده
 * صحیح نمی‌باشد"), then our locale-appropriate copy.
 */
export function loanErrorMessage(locale: Locale, error: unknown): string {
  if (error instanceof LoanApiError) {
    if (error.status === 0) return t(locale, "lw.errNetwork");
    if (error.status === 429) return t(locale, "lw.errTooMany");
    if (locale === "fa" && error.fa) return error.fa;
    if (locale === "ar" && error.fa) return error.fa; // the bank's fa message is closer than our en fallback
    return t(locale, "lw.errGeneric");
  }
  return t(locale, "lw.errGeneric");
}
