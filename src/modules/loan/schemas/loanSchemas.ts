/**
 * loanSchemas — Zod at the loan API edge (CLAUDE.md §5).
 *
 * Two families live here:
 *   1. request schemas — what our own routes accept (validated in the
 *      Route Handler before anything touches the service or the bank);
 *   2. bank response schemas — what JetPay's v1.2.0 document specifies,
 *      parsed on arrival so a drifting upstream can never reach our
 *      callers unparsed.
 *
 * Every response shape below is transcribed from the official PDF
 * (مستند سرویس مصرف اعتباری سیموتک v1_2_0_2), sample outputs included —
 * the PDF takes precedence over any assumed shape.
 */

import { z } from "zod";

import { toAsciiDigits } from "@/core/i18n/digits";

/* ------------------------------------------------------------------ */
/* 1. Our own request edge                                            */
/* ------------------------------------------------------------------ */

/** Normalize then validate: Persian/Arabic digits arrive as Persian/Arabic
 *  glyphs from both the UI and direct API users, exactly like the
 *  reference's own loan.js `en()` helper. */
const asciiDigits = z
  .string()
  .trim()
  .transform((value) => toAsciiDigits(value));

/** Iranian national code: 10 digits. */
export const nationalCodeSchema = asciiDigits.pipe(
  z.string().regex(/^\d{10}$/, "national code must be 10 digits"),
);

/** The bank's inquiry requestId, e.g. "CR-4560-1759143340183-da8570". */
export const requestIdSchema = z.string().trim().min(5).max(60);

/** The bank's credit id, e.g. "156-2379-2222" — the PDF shows two
 *  different group splittings, so no pattern is enforced beyond length. */
export const creditIdSchema = z.string().trim().min(3).max(60);

/** Amounts are IRR integers. Sample amounts in the PDF are 10,000 and
 *  credit balances ~6e8; transaction-list totals reach 3e9, so Int32 is
 *  not enough — the floor is the PDF's own smallest sample. */
export const amountSchema = z.number().int().min(1_000).max(1e12);

/** OTP codes in the PDF's samples are 5 digits ("52320"); the document
 *  only defines a missing-code error, not a length contract, so accept
 *  the plausible range and let the bank be the authority on correctness. */
export const otpSchema = asciiDigits.pipe(z.string().regex(/^\d{4,6}$/, "otp must be 4-6 digits"));

export const inquiryRequestSchema = z.object({
  nationalCode: nationalCodeSchema,
});

export const sendOtpRequestSchema = z.object({
  nationalCode: nationalCodeSchema,
  requestId: requestIdSchema,
  creditId: creditIdSchema,
  amount: amountSchema,
});

export const verifyRequestSchema = z.object({
  nationalCode: nationalCodeSchema,
  requestId: requestIdSchema,
  creditId: creditIdSchema,
  amount: amountSchema,
  otp: otpSchema,
});

export const confirmRequestSchema = z.object({
  referenceNumber: z.string().trim().min(5).max(60),
});

export const statusRequestSchema = z.object({
  referenceNumber: z.string().trim().min(5).max(60),
});

/** GET /transaction-list query (§1-14). The bank accepts at most a
 *  one-month range; page/size capped to keep the proxy honest. */
export const transactionsRequestSchema = z.object({
  nationalCode: nationalCodeSchema,
  fromDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD"),
  toDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD"),
  page: z.coerce.number().int().min(1).max(100).default(1),
  size: z.coerce.number().int().min(1).max(50).default(10),
});

/* ------------------------------------------------------------------ */
/* 2. Bank response envelopes (PDF)                                    */
/* ------------------------------------------------------------------ */

/** Every bank call answers { status, success, result } (§1-4 … §1-14). */
const bankErrorSchema = z.object({
  fa: z.string().optional(),
  en: z.string().optional(),
  code: z.number().optional(),
});

export const bankErrorEnvelopeSchema = z.object({
  status: z.number(),
  success: z.literal(false),
  result: z.object({ error: bankErrorSchema }),
});

/** §1-4 token. */
export const tokenResponseSchema = z.object({
  status: z.number(),
  success: z.literal(true),
  result: z.object({ token: z.string().min(20) }),
});

/** §1-5 account-balance. */
const creditInfoSchema = z.object({
  credit_id: z.string(),
  credit_name: z.string(),
  description: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  credit_amount: z.number().optional(),
});

const customerDetailSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  account_number: z.string().optional(),
});

const creditSchema = z.object({
  credit_balance: z.number(),
  credit_info: creditInfoSchema,
  customer_detail: customerDetailSchema.optional(),
});

export const accountBalanceResponseSchema = z.object({
  status: z.number(),
  success: z.literal(true),
  result: z.object({
    requestId: z.string(),
    credits: z.array(creditSchema),
  }),
});

/** §1-6 send-otp returns the (masked) mobile that received the code. */
export const sendOtpResponseSchema = z.object({
  status: z.number(),
  success: z.literal(true),
  result: z.object({ mobile: z.string() }),
});

/** §1-8 purchase. */
const purchaseCreditInfoSchema = z.object({
  creditId: z.string(),
  creditName: z.string().optional(),
  usedAmount: z.number().optional(),
});

export const purchaseResponseSchema = z.object({
  status: z.number(),
  success: z.literal(true),
  result: z.object({
    transactionId: z.number(),
    referenceNumber: z.string(),
    status: z.string(),
    creditInfo: purchaseCreditInfoSchema.optional(),
  }),
});

/** §1-9 confirm. */
export const confirmResponseSchema = z.object({
  status: z.number(),
  success: z.literal(true),
  result: z.object({
    transactionId: z.number(),
    referenceNumber: z.string(),
    status: z.string(),
    creditInfo: z
      .object({
        creditId: z.string().optional(),
        creditName: z.string().optional(),
        confirmedAmount: z.string().optional(),
      })
      .optional(),
  }),
});

/** §1-13 inquiry — a list of step rows, nested one level. */
const inquiryStepSchema = z.object({
  step: z.string(),
  status: z.string(),
  date: z.string().optional(),
  amount: z.string().optional(),
  clarifiedStatus: z.string().optional(),
});

export const inquiryResponseSchema = z.object({
  status: z.number(),
  success: z.literal(true),
  result: z.array(z.array(inquiryStepSchema)),
});

/** §1-14 transaction-list. */
const transactionRowSchema = z.object({
  nationalCode: z.string().optional(),
  requestId: z.string().optional(),
  status: z.string().optional(),
  createdAt: z.string().optional(),
  totalAmount: z.number().optional(),
  creditAmount: z.number().optional(),
  cashAmount: z.number().optional(),
  method: z.string().optional(),
  creditType: z.string().optional(),
  referenceNumber: z.string().optional(),
});

export const transactionListResponseSchema = z.object({
  status: z.number(),
  success: z.literal(true),
  result: z.object({
    list: z.array(transactionRowSchema),
    total: z.number(),
  }),
});

/* ------------------------------------------------------------------ */
/* 3. Types                                                            */
/* ------------------------------------------------------------------ */

export type BankError = z.infer<typeof bankErrorSchema>;
export type InquiryRequest = z.infer<typeof inquiryRequestSchema>;
export type SendOtpRequest = z.infer<typeof sendOtpRequestSchema>;
export type VerifyRequest = z.infer<typeof verifyRequestSchema>;
export type ConfirmRequest = z.infer<typeof confirmRequestSchema>;
export type StatusRequest = z.infer<typeof statusRequestSchema>;
export type TransactionsRequest = z.infer<typeof transactionsRequestSchema>;

export type AccountBalanceResult = z.infer<typeof accountBalanceResponseSchema>["result"];
export type Credit = AccountBalanceResult["credits"][number];
export type PurchaseResult = z.infer<typeof purchaseResponseSchema>["result"];
export type ConfirmResult = z.infer<typeof confirmResponseSchema>["result"];
export type InquiryStep = z.infer<typeof inquiryStepSchema>;
export type TransactionRow = z.infer<typeof transactionRowSchema>;
