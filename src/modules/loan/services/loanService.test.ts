/**
 * loanService.test.ts — the orchestration layer, against the real
 * (throwaway) SQLite test database with a stubbed bank client.
 *
 * What is pinned: the documented JetPay sequence, the persistence
 * contract (LoanRequest/Transaction rows advance INQUIRY → OTP_SENT →
 * PURCHASED → CONFIRMED), and the duplicate-request guard (the bank's
 * own resend cooldown, mirrored server-side). Bank behaviour itself is
 * the stub's; parsing it is jetpay.test.ts's job.
 *
 * The service is constructed directly with the stub; the module
 * singleton is bypassed (that wiring belongs to the route tests).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LOAN_STATUS, OTP_RESEND_COOLDOWN_MS } from "../constants";
import type {
  AccountBalanceResult,
  ConfirmResult,
  InquiryStep,
  PurchaseResult,
} from "../schemas/loanSchemas";
import { JetPayError } from "./jetpay";
import { LoanService } from "./loanService";
import { prisma } from "./prisma";

/** A stub bank client implementing the JetPay surface the service uses. */
function stubBank(overrides: Partial<BankStub> = {}): BankStub {
  return {
    accountBalance: vi.fn(async (): Promise<AccountBalanceResult> => ({
      requestId: "CR-0016-1761109080025-e6f8fb",
      credits: [
        {
          credit_balance: 100_000_000,
          credit_info: {
            credit_id: "156-2379-2287",
            credit_name: "سپاس",
            description: "کالانو",
            credit_amount: 120_000_000,
          },
          customer_detail: { first_name: "حسن", last_name: "قاسمی", account_number: "1-0002-00987068-01" },
        },
      ],
    })),
    sendOtp: vi.fn(async () => ({ mobile: "091******93" })),
    purchase: vi.fn(async (): Promise<PurchaseResult> => ({
      transactionId: 748,
      referenceNumber: "1175914726766597",
      status: "PENDING",
      creditInfo: { creditId: "156-2379-2287", creditName: "سپاس", usedAmount: 25_000_000 },
    })),
    confirm: vi.fn(async (): Promise<ConfirmResult> => ({
      transactionId: 749,
      referenceNumber: "1175914726766597",
      status: "CONFIRMED",
      creditInfo: { creditId: "156-2379-2287", creditName: "سپاس", confirmedAmount: "25000000.00" },
    })),
    inquiry: vi.fn(async (): Promise<InquiryStep[][]> => [
      [{ step: "PURCHASE", status: "COMPLETED", date: "2025-10-19T14:04:43.988Z", amount: "25000000.00" }],
    ]),
    transactionList: vi.fn(async () => ({
      list: [{ nationalCode: "4533654504", referenceNumber: "11780153176", status: "SUCCESS" }],
      total: 1,
    })),
    ...overrides,
  };
}

type BankStub = {
  accountBalance: (nationalCode: string) => Promise<AccountBalanceResult>;
  sendOtp: (input: { nationalCode: string; requestId: string; creditId: string; amount: number }) => Promise<{ mobile: string }>;
  purchase: (input: { nationalCode: string; amount: number; requestId: string; creditId: string; otp: string }) => Promise<PurchaseResult>;
  confirm: (referenceNumber: string) => Promise<ConfirmResult>;
  inquiry: (referenceNumber: string) => Promise<InquiryStep[][]>;
  transactionList: (query: { nationalCode: string; fromDate: string; toDate: string; page: number; size: number }) => Promise<{ list: unknown[]; total: number }>;
};

beforeEach(async () => {
  await prisma.transaction.deleteMany();
  await prisma.loanRequest.deleteMany();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("LoanService.inquire", () => {
  it("returns the credits and the bank requestId, and persists an INQUIRY row", async () => {
    const bank = stubBank();
    const service = new LoanService(bank as never);
    const result = await service.inquire("4533654504");

    expect(result.requestId).toBe("CR-0016-1761109080025-e6f8fb");
    expect(result.credits).toHaveLength(1);
    expect(result.credits[0]).toMatchObject({
      creditId: "156-2379-2287",
      creditName: "سپاس",
      creditBalance: 100_000_000,
      customerName: "حسن قاسمی",
    });

    const rows = await prisma.loanRequest.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      nationalCode: "4533654504",
      requestId: "CR-0016-1761109080025-e6f8fb",
      status: LOAN_STATUS.inquiry,
      firstName: "حسن",
      lastName: "قاسمی",
    });
  });

  it("does not include the bank's account_number in the public credit view", async () => {
    const service = new LoanService(stubBank() as never);
    const result = await service.inquire("4533654504");
    expect(JSON.stringify(result)).not.toContain("1-0002-00987068-01");
  });
});

describe("LoanService.sendOtp", () => {
  it("persists an OTP_SENT row carrying the amount as BigInt and the masked mobile", async () => {
    const bank = stubBank();
    const service = new LoanService(bank as never);
    const result = await service.sendOtp({
      nationalCode: "4533654504",
      requestId: "CR-0016-1761109080025-e6f8fb",
      creditId: "156-2379-2287",
      amount: 25_000_000,
    });
    expect(result).toEqual({ mobile: "091******93" });
    expect(bank.sendOtp).toHaveBeenCalledTimes(1);

    const row = await prisma.loanRequest.findFirstOrThrow();
    expect(row.status).toBe(LOAN_STATUS.otpSent);
    expect(row.amount).toBe(25_000_000n);
    expect(row.mobile).toBe("091******93");
  });

  it("does not call the bank twice for a repeat within the resend cooldown (duplicate guard)", async () => {
    const bank = stubBank();
    const service = new LoanService(bank as never);
    const input = {
      nationalCode: "4533654504",
      requestId: "CR-0016-1761109080025-e6f8fb",
      creditId: "156-2379-2287",
      amount: 25_000_000,
    };
    await service.sendOtp(input);
    const second = await service.sendOtp(input);
    expect(bank.sendOtp).toHaveBeenCalledTimes(1);
    expect(second).toEqual({ mobile: "091******93" });
  });

  it("advances the inquiry row instead of duplicating it (one row per journey)", async () => {
    const bank = stubBank();
    const service = new LoanService(bank as never);
    await service.inquire("4533654504");
    await service.sendOtp({
      nationalCode: "4533654504",
      requestId: "CR-0016-1761109080025-e6f8fb",
      creditId: "156-2379-2287",
      amount: 25_000_000,
    });
    const rows = await prisma.loanRequest.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      status: LOAN_STATUS.otpSent,
      amount: 25_000_000n,
      creditId: "156-2379-2287",
      mobile: "091******93",
    });
  });

  it("calls the bank again after the resend cooldown passes", async () => {
    const bank = stubBank();
    const service = new LoanService(bank as never);
    const input = {
      nationalCode: "4533654504",
      requestId: "CR-0016-1761109080025-e6f8fb",
      creditId: "156-2379-2287",
      amount: 25_000_000,
    };
    await service.sendOtp(input);
    // Age the persisted row past the cooldown.
    await prisma.loanRequest.updateMany({
      where: { status: LOAN_STATUS.otpSent },
      data: { updatedAt: new Date(Date.now() - OTP_RESEND_COOLDOWN_MS - 1000) },
    });
    await service.sendOtp(input);
    expect(bank.sendOtp).toHaveBeenCalledTimes(2);
  });
});

describe("LoanService.verify", () => {
  it("refuses a purchase when no OTP was requested (sequence guard)", async () => {
    const bank = stubBank();
    const service = new LoanService(bank as never);
    await expect(
      service.verify({
        nationalCode: "4533654504",
        requestId: "CR-0016-1761109080025-e6f8fb",
        creditId: "156-2379-2287",
        amount: 25_000_000,
        otp: "52320",
      }),
    ).rejects.toBeInstanceOf(JetPayError);
    expect(bank.purchase).not.toHaveBeenCalled();
  });

  it("updates the request to PURCHASED with the reference number and writes the PURCHASE transaction row", async () => {
    const bank = stubBank();
    const service = new LoanService(bank as never);
    await service.inquire("4533654504");
    await service.sendOtp({
      nationalCode: "4533654504",
      requestId: "CR-0016-1761109080025-e6f8fb",
      creditId: "156-2379-2287",
      amount: 25_000_000,
    });

    const result = await service.verify({
      nationalCode: "4533654504",
      requestId: "CR-0016-1761109080025-e6f8fb",
      creditId: "156-2379-2287",
      amount: 25_000_000,
      otp: "52320",
    });
    expect(result).toMatchObject({ transactionId: 748, referenceNumber: "1175914726766597", status: "PENDING" });

    const row = await prisma.loanRequest.findFirstOrThrow();
    expect(row.status).toBe(LOAN_STATUS.purchased);
    expect(row.referenceNumber).toBe("1175914726766597");
    expect(row.transactionId).toBe(748);

    const transactions = await prisma.transaction.findMany();
    expect(transactions).toHaveLength(1);
    expect(transactions[0]).toMatchObject({ step: "PURCHASE", status: "PENDING", amount: 25_000_000n });
  });
});

describe("LoanService.status", () => {
  it("reconciles CONFIRMED when the bank's confirm step is CONFIRMED", async () => {
    const bank = stubBank({
      inquiry: vi.fn(async (): Promise<InquiryStep[][]> => [
        [{ step: "PURCHASE", status: "COMPLETED" }],
        [{ step: "CONFIRM", status: "CONFIRMED" }],
      ]),
    });
    const service = new LoanService(bank as never);
    await seedPurchasedRequest();

    const result = await service.status("1175914726766597");
    expect(result.loanStatus).toBe(LOAN_STATUS.confirmed);
    expect(result.steps).toHaveLength(2);

    const row = await prisma.loanRequest.findFirstOrThrow();
    expect(row.status).toBe(LOAN_STATUS.confirmed);
    // The bank's step list is ledgered as Transaction rows.
    const transactions = await prisma.transaction.findMany({ orderBy: { step: "asc" } });
    expect(transactions.map((transaction) => [transaction.step, transaction.status])).toEqual([
      ["CONFIRM", "CONFIRMED"],
      ["PURCHASE", "COMPLETED"],
    ]);
  });

  it("reconciles FAILED when the bank's purchase step failed", async () => {
    const bank = stubBank({
      inquiry: vi.fn(async (): Promise<InquiryStep[][]> => [[{ step: "PURCHASE", status: "FAILED" }]]),
    });
    const service = new LoanService(bank as never);
    await seedPurchasedRequest();

    const result = await service.status("1175914726766597");
    expect(result.loanStatus).toBe(LOAN_STATUS.failed);
    expect((await prisma.loanRequest.findFirstOrThrow()).status).toBe(LOAN_STATUS.failed);
  });

  it("reports the step list without a loan status when the reference number is unknown to us", async () => {
    const service = new LoanService(stubBank() as never);
    const result = await service.status("9999999999");
    // The service returns the bank's steps flattened (one row per step).
    expect(result.steps[0]).toMatchObject({ step: "PURCHASE", status: "COMPLETED" });
    expect(result.loanStatus).toBeUndefined();
  });

  it("dedupes identical ledgered steps across polls", async () => {
    const bank = stubBank();
    const service = new LoanService(bank as never);
    await seedPurchasedRequest();
    await service.status("1175914726766597");
    await service.status("1175914726766597");
    const transactions = await prisma.transaction.findMany();
    expect(transactions).toHaveLength(1);
  });
});

describe("LoanService.confirm", () => {
  it("marks the request CONFIRMED and writes the CONFIRM transaction row", async () => {
    const bank = stubBank();
    const service = new LoanService(bank as never);
    await seedPurchasedRequest();

    const result = await service.confirm("1175914726766597");
    expect(result).toMatchObject({ status: "CONFIRMED", referenceNumber: "1175914726766597" });

    const row = await prisma.loanRequest.findFirstOrThrow();
    expect(row.status).toBe(LOAN_STATUS.confirmed);
    const confirmRow = await prisma.transaction.findFirst({ where: { step: "CONFIRM" } });
    expect(confirmRow).toMatchObject({ status: "CONFIRMED", amount: 25_000_000n });
  });
});

describe("LoanService.transactions", () => {
  it("passes the bank's list through", async () => {
    const bank = stubBank();
    const service = new LoanService(bank as never);
    const result = await service.transactions({
      nationalCode: "4533654504",
      fromDate: "2026-05-15",
      toDate: "2026-05-30",
      page: 1,
      size: 10,
    });
    expect(result.total).toBe(1);
    expect(result.list[0]).toMatchObject({ referenceNumber: "11780153176" });
    expect(bank.transactionList).toHaveBeenCalledWith({
      nationalCode: "4533654504",
      fromDate: "2026-05-15",
      toDate: "2026-05-30",
      page: 1,
      size: 10,
    });
  });
});

/** Seed a journey that already purchased, for status/confirm tests. */
async function seedPurchasedRequest(): Promise<void> {
  await prisma.loanRequest.create({
    data: {
      nationalCode: "4533654504",
      requestId: "CR-0016-1761109080025-e6f8fb",
      creditId: "156-2379-2287",
      amount: 25_000_000n,
      status: LOAN_STATUS.purchased,
      referenceNumber: "1175914726766597",
      transactionId: 748,
      mobile: "091******93",
    },
  });
}
