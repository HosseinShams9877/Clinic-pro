/**
 * loanService.ts — the loan feature's orchestration: the bank client and
 * the database behind one server-side seam, called by the (deliberately
 * thin) Route Handlers in app/api/loan/*.
 *
 * Responsibilities:
 *   - run the documented JetPay sequence (PDF §1-4…§1-14): inquiry →
 *     send-otp → purchase → poll inquiry → confirm;
 *   - persist the journey (LoanRequest + Transaction rows) so a request
 *     survives page refreshes and can be rebuilt from bank state;
 *   - prevent duplicate work: a repeat send-otp within the bank's own
 *     resend cooldown returns the stored result instead of a second SMS;
 *   - never leak bank internals: every returned object is shaped for the
 *     public caller (no tokens, no credentials — those never leave here).
 *
 * Errors surface as `JetPayError` (bank code + fa/en message) so routes
 * can map them to localized errors without importing the bank client.
 */

import { prisma } from "./prisma";
import { BANK_STATUS, LOAN_STATUS, OTP_RESEND_COOLDOWN_MS } from "../constants";
import type {
  AccountBalanceResult,
  ConfirmResult,
  InquiryStep,
  PurchaseResult,
  TransactionRow,
} from "../schemas/loanSchemas";
import {
  type JetPayClient,
  getJetPayClient,
  JetPayError,
} from "./jetpay";

/** The public view of a credit (excludes the bank's account_number —
 *  sensitive, and the wizard has no use for it). */
export type CreditView = {
  creditId: string;
  creditName: string;
  description?: string;
  creditBalance: number;
  creditAmount?: number;
  startDate?: string;
  endDate?: string;
  customerName?: string;
};

/** What the wizard needs from an inquiry. */
export type InquiryView = {
  requestId: string;
  credits: CreditView[];
};

export type SendOtpView = { mobile: string };

/** What a purchase returns to the caller (plus our request tracking id). */
export type PurchaseView = {
  transactionId: number;
  referenceNumber: string;
  status: string;
  usedAmount?: number;
};

/** One flattened step of the bank's status list (PDF §1-13). */
export type StatusView = {
  steps: Array<{
    step: string;
    status: string;
    date?: string;
    amount?: string;
    clarifiedStatus?: string;
  }>;
  /** Our own request status, when we could match the reference number. */
  loanStatus?: string;
};

export type TransactionsView = {
  list: TransactionRow[];
  total: number;
};

/** The loan request record as stored (amounts as BigInt → string at the edge). */
export type LoanRequestRecord = {
  id: string;
  nationalCode: string;
  amount: string;
  creditId: string;
  requestId: string;
  status: string;
  referenceNumber: string | null;
  transactionId: number | null;
  createdAt: Date;
  updatedAt: Date;
};

/* ------------------------------------------------------------------ */

export class LoanService {
  constructor(private readonly bank: JetPayClient = getJetPayClient()) {}

  /* ----------------- Step 1–2: credit inquiry ----------------------- */

  /**
   * Credit inquiry by national code (PDF §1-5). Persists/refreshes a
   * LoanRequest row in the INQUIRY status so the journey is traceable
   * even if the user stops here; the chosen credit and amount are
   * recorded at send-otp.
   */
  async inquire(nationalCode: string): Promise<InquiryView> {
    const result: AccountBalanceResult = await this.bank.accountBalance(nationalCode);

    await prisma.loanRequest.create({
      data: {
        nationalCode,
        requestId: result.requestId,
        // Fields required by the schema are filled with the inquiry's
        // defaults; the amount/creditId of record arrive with send-otp.
        amount: BigInt(result.credits[0]?.credit_balance ?? 0),
        creditId: result.credits[0]?.credit_info.credit_id ?? "",
        status: LOAN_STATUS.inquiry,
        firstName: result.credits[0]?.customer_detail?.first_name,
        lastName: result.credits[0]?.customer_detail?.last_name,
        creditName: result.credits[0]?.credit_info.credit_name,
        creditBalance: result.credits[0] ? BigInt(result.credits[0].credit_balance) : undefined,
      },
    });

    return {
      requestId: result.requestId,
      credits: result.credits.map((credit) => ({
        creditId: credit.credit_info.credit_id,
        creditName: credit.credit_info.credit_name,
        description: credit.credit_info.description,
        creditBalance: credit.credit_balance,
        creditAmount: credit.credit_info.credit_amount,
        startDate: credit.credit_info.start_date,
        endDate: credit.credit_info.end_date,
        customerName:
          credit.customer_detail?.first_name || credit.customer_detail?.last_name
            ? [credit.customer_detail?.first_name, credit.customer_detail?.last_name]
                .filter(Boolean)
                .join(" ")
            : undefined,
      })),
    };
  }

  /* -------------------- Step 3: amount + OTP ------------------------ */

  /**
   * Request the bank's OTP (PDF §1-6). One row per journey: the row the
   * inquiry created is advanced (amount, creditId, mobile, status),
   * and only a journey with no prior inquiry row is created fresh.
   *
   * De-duplicates: a repeat for the same national code + credit +
   * amount within the bank's own resend cooldown returns the stored
   * mobile instead of triggering (and being rejected by) a second SMS.
   */
  async sendOtp(input: {
    nationalCode: string;
    requestId: string;
    creditId: string;
    amount: number;
  }): Promise<SendOtpView> {
    const latest = await prisma.loanRequest.findFirst({
      where: { nationalCode: input.nationalCode, requestId: input.requestId },
      orderBy: { createdAt: "desc" },
    });

    if (
      latest !== null &&
      latest.status === LOAN_STATUS.otpSent &&
      latest.creditId === input.creditId &&
      latest.amount === BigInt(input.amount) &&
      Date.now() - latest.updatedAt.getTime() < OTP_RESEND_COOLDOWN_MS &&
      latest.mobile !== null
    ) {
      return { mobile: latest.mobile };
    }

    const result = await this.bank.sendOtp(input);

    if (latest === null) {
      await prisma.loanRequest.create({
        data: {
          nationalCode: input.nationalCode,
          requestId: input.requestId,
          creditId: input.creditId,
          amount: BigInt(input.amount),
          status: LOAN_STATUS.otpSent,
          mobile: result.mobile,
        },
      });
    } else {
      await prisma.loanRequest.update({
        where: { id: latest.id },
        data: {
          creditId: input.creditId,
          amount: BigInt(input.amount),
          status: LOAN_STATUS.otpSent,
          mobile: result.mobile,
        },
      });
    }

    return { mobile: result.mobile };
  }

  /* -------------- Step 4: OTP verification (purchase) --------------- */

  /**
   * Verify the OTP and create the purchase (PDF §1-8). Requires an
   * existing journey for this national code + requestId in the OTP_SENT
   * status — the flow may not skip ahead, and the bank itself would
   * reject an OTP that was never sent (OTP_NOT_SENT).
   */
  async verify(input: {
    nationalCode: string;
    requestId: string;
    creditId: string;
    amount: number;
    otp: string;
  }): Promise<PurchaseView> {
    const latest = await prisma.loanRequest.findFirst({
      where: { nationalCode: input.nationalCode, requestId: input.requestId },
      orderBy: { createdAt: "desc" },
    });

    if (latest === null || latest.status !== LOAN_STATUS.otpSent) {
      throw new JetPayError(400, "ابتدا کد یکبار مصرف را درخواست کنید.", "Request an OTP first.");
    }

    const result: PurchaseResult = await this.bank.purchase(input);

    await prisma.loanRequest.update({
      where: { id: latest.id },
      data: {
        status: LOAN_STATUS.purchased,
        referenceNumber: result.referenceNumber,
        transactionId: result.transactionId,
        creditId: input.creditId,
        amount: BigInt(input.amount),
      },
    });

    await prisma.transaction.create({
      data: {
        loanRequestId: latest.id,
        bankTransactionId: result.transactionId,
        referenceNumber: result.referenceNumber,
        step: "PURCHASE",
        status: result.status,
        amount: BigInt(input.amount),
      },
    });

    return {
      transactionId: result.transactionId,
      referenceNumber: result.referenceNumber,
      status: result.status,
      usedAmount: result.creditInfo?.usedAmount,
    };
  }

  /* ----------------- Step 5: status (and polling) -------------------- */

  /**
   * Bank transaction status (PDF §1-13). Reconciles our rows: when the
   * purchase step has reached COMPLETED the request is ready for
   * confirmation; CONFIRMED on the bank's confirm step means the money
   * moved. Returns the step list verbatim for the wizard to render.
   */
  async status(referenceNumber: string): Promise<StatusView> {
    const steps: InquiryStep[][] = await this.bank.inquiry(referenceNumber);
    const flat = steps.flat();

    const loan = await prisma.loanRequest.findFirst({
      where: { referenceNumber },
      orderBy: { createdAt: "desc" },
    });

    if (loan !== null) {
      const purchaseStep = flat.find((step) => step.step === "PURCHASE");
      const confirmStep = flat.find((step) => step.step === "CONFIRM");
      const nextStatus =
        confirmStep?.status === BANK_STATUS.confirmed
          ? LOAN_STATUS.confirmed
          : purchaseStep?.status === BANK_STATUS.failed
            ? LOAN_STATUS.failed
            : loan.status;
      if (nextStatus !== loan.status) {
        await prisma.loanRequest.update({
          where: { id: loan.id },
          data: { status: nextStatus },
        });
      }
      // Keep a ledger row per status poll that changes a step set.
      await persistSteps(loan.id, flat);
      return { steps: flat, loanStatus: nextStatus };
    }

    return { steps: flat };
  }

  /* ------------------- Step 5b: final confirmation -------------------- */

  /**
   * Finalize the purchase (PDF §1-9). Only legal when the purchase
   * transaction has COMPLETED — the PDF's own precondition (calling it
   * earlier returns the bank's TRANSACTION_NOT_COMPLETED) and the
   * reason the wizard polls `status` before calling this.
   */
  async confirm(referenceNumber: string): Promise<{ status: string; transactionId: number; referenceNumber: string; confirmedAmount?: string }> {
    const result: ConfirmResult = await this.bank.confirm(referenceNumber);

    const loan = await prisma.loanRequest.findFirst({
      where: { referenceNumber },
      orderBy: { createdAt: "desc" },
    });
    if (loan !== null) {
      await prisma.loanRequest.update({
        where: { id: loan.id },
        data: { status: LOAN_STATUS.confirmed },
      });
      await prisma.transaction.create({
        data: {
          loanRequestId: loan.id,
          bankTransactionId: result.transactionId,
          referenceNumber: result.referenceNumber,
          step: "CONFIRM",
          status: result.status,
          amount: loan.amount,
        },
      });
    }

    return {
      status: result.status,
      transactionId: result.transactionId,
      referenceNumber: result.referenceNumber,
      confirmedAmount: result.creditInfo?.confirmedAmount,
    };
  }

  /* ------------------- Transaction list (§1-14) --------------------- */

  async transactions(query: {
    nationalCode: string;
    fromDate: string;
    toDate: string;
    page: number;
    size: number;
  }): Promise<TransactionsView> {
    const result = await this.bank.transactionList(query);
    return { list: result.list, total: result.total };
  }

  /* --------------------- Support: one request ----------------------- */

  /** The current persisted state of a request, for the wizard's resume. */
  async findByReferenceNumber(referenceNumber: string): Promise<LoanRequestRecord | null> {
    const loan = await prisma.loanRequest.findFirst({
      where: { referenceNumber },
      orderBy: { createdAt: "desc" },
    });
    if (loan === null) return null;
    return {
      id: loan.id,
      nationalCode: loan.nationalCode,
      amount: loan.amount.toString(),
      creditId: loan.creditId,
      requestId: loan.requestId,
      status: loan.status,
      referenceNumber: loan.referenceNumber,
      transactionId: loan.transactionId,
      createdAt: loan.createdAt,
      updatedAt: loan.updatedAt,
    };
  }
}

/**
 * Ledger: persist the bank's step list as Transaction rows we have not
 * seen for this request (deduped by step+status+date), so the journey
 * can be rebuilt from our own database alone.
 */
async function persistSteps(loanRequestId: string, flat: InquiryStep[]): Promise<void> {
  for (const step of flat) {
    const existing = await prisma.transaction.findFirst({
      where: {
        loanRequestId,
        step: step.step,
        status: step.status,
      },
    });
    if (existing === null) {
      await prisma.transaction.create({
        data: {
          loanRequestId,
          step: step.step,
          status: step.status,
          amount: step.amount === undefined ? BigInt(0) : parseAmount(step.amount),
        },
      });
    }
  }
}

/** The bank reports amounts as strings like "30000.00" (§1-13). */
function parseAmount(value: string): bigint {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? BigInt(Math.trunc(parsed)) : BigInt(0);
}

/* ------------------------------------------------------------------ */

/** Process-wide service singleton (production). */
let service: LoanService | null = null;
export function getLoanService(): LoanService {
  if (service === null) service = new LoanService();
  return service;
}

/** Test-only: inject a service with a stubbed bank client. */
export function __setLoanServiceForTests(instance: LoanService | null): void {
  service = instance;
}
