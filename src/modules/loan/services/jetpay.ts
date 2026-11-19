/**
 * jetpay.ts — the server-side client for the Simorq Tejarat JetPay
 * credit-consumption API (مستند سرویس مصرف اعتباری سیموتک v1.2.0).
 *
 * THE security boundary of the loan feature: this is the only code that
 * knows the merchant credentials or the raw bearer token. It lives in a
 * module's services folder (MODULAR_ARCHITECTURE §2: only services may
 * import the data seams — by the same convention the bank seam lives
 * here, server-only, imported only by the loan service), it is never
 * imported by a client component, and it never puts a token or
 * credential in a response body. The client browser only ever talks to
 * our own routes.
 *
 * Contract details transcribed from the official PDF (which takes
 * precedence over any assumption):
 *   - every call: JSON body, `Content-Type: application/json`;
 *   - every call except POST /token: `Authorization: Bearer <jwt>`;
 *   - every response: `{ status, success, result }`, `success: false`
 *     meaning `result.error: { fa?, en?, code? }` (§1-4 sample);
 *   - token: `{ username, password, terminalId }` (§1-4);
 *   - inquiry/transaction-list are GETs; the rest are POSTs;
 *   - §1-9: confirm only after the purchase transaction has reached
 *     COMPLETED — the service layer enforces that sequencing.
 */

import {
  accountBalanceResponseSchema,
  confirmResponseSchema,
  inquiryResponseSchema,
  purchaseResponseSchema,
  sendOtpResponseSchema,
  tokenResponseSchema,
  transactionListResponseSchema,
} from "../schemas/loanSchemas";
import { BANK_TIMEOUT_MS } from "../constants";

/** Credentials and base URL, read once from the environment. */
export interface JetPayConfig {
  baseUrl: string;
  username: string;
  password: string;
  terminalId: string;
}

/** A typed bank failure — carries the bank's own error code + messages. */
export class JetPayError extends Error {
  constructor(
    /** The bank's numeric error code (result.error.code), or our own. */
    public readonly code: number,
    /** Persian message from the bank when available. */
    public readonly fa: string,
    /** English message (bank or our own). */
    public readonly en: string,
    options?: { cause?: unknown },
  ) {
    super(en, options);
    this.name = "JetPayError";
  }
}

/** We could not reach the bank at all (DNS/connect/timeout/abort). */
export const jetPayUnreachable = (cause: unknown): JetPayError =>
  new JetPayError(
    0,
    "اتصال به سامانه بانک در حال حاضر مقدور نیست؛ لطفاً لحظاتی بعد تلاش کنید.",
    "The bank service is unreachable right now; please try again shortly.",
    { cause },
  );

const PATHS = {
  token: "/api/v1/credit-consumption/token",
  accountBalance: "/api/v1/credit-consumption/account-balance",
  sendOtp: "/api/v1/credit-consumption/send-otp",
  purchase: "/api/v1/credit-consumption/purchase",
  confirm: "/api/v1/credit-consumption/confirm",
  inquiry: "/api/v1/credit-consumption/inquiry",
  transactionList: "/api/v1/credit-consumption/transaction-list",
} as const;

/** The bank's shared envelope — anything else is a contract drift. */
type Envelope = { status: number; success: boolean; result: unknown };

const trimSlashes = (url: string) => url.replace(/\/+$/, "");

export class JetPayClient {
  private tokenState: { token: string; exp: number } | null = null;

  constructor(
    private readonly config: JetPayConfig,
    /** Injectable for tests; the global fetch in production. */
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  /* ------------------------------ auth ------------------------------ */

  /** A fresh bearer token (cached until 60 s before its JWT `exp`). */
  async token(): Promise<string> {
    const cached = this.tokenState;
    if (cached !== null && cached.exp > Date.now() + 60_000) return cached.token;
    const body = {
      username: this.config.username,
      password: this.config.password,
      terminalId: this.config.terminalId,
    };
    const parsed = await this.call(PATHS.token, "POST", body, { auth: false });
    const { result } = tokenResponseSchema.parse(parsed);
    this.tokenState = { token: result.token, exp: tokenExpiryMs(result.token) };
    return result.token;
  }

  /** Forget the cached token (after a 401 so the next call re-auths). */
  invalidateToken(): void {
    this.tokenState = null;
  }

  /* ---------------------------- endpoints --------------------------- */

  /** §1-5 credit inquiry. */
  async accountBalance(nationalCode: string) {
    return accountBalanceResponseSchema.parse(
      await this.call(`${PATHS.accountBalance}?nationalCode=${encodeURIComponent(nationalCode)}`, "GET", undefined, { auth: true }),
    ).result;
  }

  /** §1-6 send OTP. */
  async sendOtp(input: { nationalCode: string; requestId: string; creditId: string; amount: number }) {
    return sendOtpResponseSchema.parse(await this.call(PATHS.sendOtp, "POST", input, { auth: true })).result;
  }

  /** §1-8 purchase (OTP verification completes here). */
  async purchase(input: {
    nationalCode: string;
    amount: number;
    requestId: string;
    creditId: string;
    otp: string;
  }) {
    return purchaseResponseSchema.parse(await this.call(PATHS.purchase, "POST", input, { auth: true })).result;
  }

  /** §1-9 final confirmation of a purchase. */
  async confirm(referenceNumber: string) {
    return confirmResponseSchema.parse(
      await this.call(PATHS.confirm, "POST", { referenceNumber }, { auth: true }),
    ).result;
  }

  /** §1-13 transaction status (step list). */
  async inquiry(referenceNumber: string) {
    return inquiryResponseSchema.parse(
      await this.call(`${PATHS.inquiry}?referenceNumber=${encodeURIComponent(referenceNumber)}`, "GET", undefined, { auth: true }),
    ).result;
  }

  /** §1-14 transaction list. */
  async transactionList(query: {
    nationalCode: string;
    fromDate: string;
    toDate: string;
    page: number;
    size: number;
  }) {
    const params = new URLSearchParams({
      nationalCode: query.nationalCode,
      fromDate: query.fromDate,
      toDate: query.toDate,
      page: String(query.page),
      size: String(query.size),
    });
    return transactionListResponseSchema.parse(
      await this.call(`${PATHS.transactionList}?${params.toString()}`, "GET", undefined, { auth: true }),
    ).result;
  }

  /* ---------------------------- transport --------------------------- */

  /**
   * One bank call with auth, timeout and one 401 retry. `auth: false`
   * is only for /token itself.
   */
  private async call(
    path: string,
    method: "GET" | "POST",
    body: unknown,
    options: { auth: boolean },
  ): Promise<Envelope> {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" };
      if (options.auth) headers.Authorization = `Bearer ${await this.token()}`;

      let response: Response;
      try {
        response = await this.fetchImpl(`${trimSlashes(this.config.baseUrl)}${path}`, {
          method,
          headers,
          body: body === undefined ? undefined : JSON.stringify(body),
          signal: AbortSignal.timeout(BANK_TIMEOUT_MS),
        });
      } catch (cause) {
        if (attempt === 0 && options.auth) {
          this.invalidateToken();
          continue;
        }
        throw jetPayUnreachable(cause);
      }

      // A 401 means our cached token expired or was revoked: re-auth once.
      if (response.status === 401 && options.auth && attempt === 0) {
        this.invalidateToken();
        continue;
      }

      let parsed: unknown;
      try {
        parsed = await response.json();
      } catch (cause) {
        throw new JetPayError(
          response.status,
          "پاسخ بانک قابل خواندن نیست.",
          "The bank returned a non-JSON response.",
          { cause },
        );
      }

      const envelope = parsed as Envelope;
      if (envelope?.success === true) return envelope;
      throw toJetPayError(envelope, response.status);
    }
    // Unreachable: the loop either returns or throws on every path.
    throw new JetPayError(0, "خطای ناشناخته در ارتباط با بانک.", "Unknown bank communication error.");
  }
}

/** Build the bank-side error from an envelope, tolerating missing fields. */
function toJetPayError(envelope: Envelope, httpStatus: number): JetPayError {
  const error = (envelope?.result as { error?: { fa?: string; en?: string; code?: number } } | undefined)?.error ?? {};
  return new JetPayError(
    error.code ?? httpStatus,
    error.fa ?? "خطای ناشناخته از سمت بانک.",
    error.en ?? "Unknown bank error.",
  );
}

/**
 * Decode the JWT's `exp` (seconds) into an absolute ms timestamp. The
 * client does not verify the signature (the issuer did), it only reads
 * the expiry to avoid re-fetching a still-valid token on every call. A
 * malformed token falls back to "already expired" — one wasted re-auth
 * is harmless, a wrongly-trusted cache is not.
 */
export function tokenExpiryMs(token: string): number {
  try {
    const payload = token.split(".")[1];
    if (payload === undefined) return 0;
    const json = JSON.parse(
      Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8"),
    ) as { exp?: unknown };
    return typeof json.exp === "number" ? json.exp * 1000 : 0;
  } catch {
    return 0;
  }
}

/**
 * The process-wide client. Config comes from env (JETPAY_*); missing
 * values surface as a clear error on first use, not at import time, so
 * a build or unrelated test never needs credentials present.
 */
let singleton: JetPayClient | null = null;

export function loadJetPayConfig(): JetPayConfig {
  const required = ["JETPAY_BASE_URL", "JETPAY_USERNAME", "JETPAY_PASSWORD", "JETPAY_TERMINAL_ID"] as const;
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Loan feature misconfigured: missing environment variables ${missing.join(", ")}. ` +
        "See .env.example and docs/reports/LOAN_FEATURE_REPORT.md.",
    );
  }
  return {
    baseUrl: process.env.JETPAY_BASE_URL as string,
    username: process.env.JETPAY_USERNAME as string,
    password: process.env.JETPAY_PASSWORD as string,
    terminalId: process.env.JETPAY_TERMINAL_ID as string,
  };
}

export function getJetPayClient(): JetPayClient {
  if (singleton === null) singleton = new JetPayClient(loadJetPayConfig());
  return singleton;
}

/** Test-only: reset the process singleton (service tests inject their own). */
export function __resetJetPaySingletonForTests(): void {
  singleton = null;
}
