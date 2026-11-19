/**
 * loanSchemas.test.ts — the Zod edge of the loan routes.
 *
 * Pinned: the normalization (Persian/Arabic digits) and the validation
 * floors, so a malformed input can never reach the service or the bank.
 * Bank response shapes are exercised through the client tests.
 */

import { describe, expect, it } from "vitest";

import {
  amountSchema,
  creditIdSchema,
  nationalCodeSchema,
  otpSchema,
  requestIdSchema,
  transactionsRequestSchema,
} from "./loanSchemas";

describe("nationalCodeSchema", () => {
  it("accepts a 10-digit ASCII national code", () => {
    expect(nationalCodeSchema.parse("4533654504")).toBe("4533654504");
  });

  it("normalizes Persian and Arabic digits (loan.js's en() rule)", () => {
    expect(nationalCodeSchema.parse("۴۵۳۳۶۵۴۵۰۴")).toBe("4533654504");
    expect(nationalCodeSchema.parse("٤٥٣٣٦٥٤٥٠٤")).toBe("4533654504");
  });

  it("trims surrounding whitespace", () => {
    expect(nationalCodeSchema.parse("  4533654504  ")).toBe("4533654504");
  });

  it("rejects anything that is not exactly 10 digits", () => {
    for (const bad of ["453365450", "45336545044", "4533-654504", "abcdefghij", "", "۴۵۳"]) {
      expect(nationalCodeSchema.safeParse(bad).success).toBe(false);
    }
  });
});

describe("otpSchema", () => {
  it("accepts 4-6 digits and normalizes Persian digits", () => {
    expect(otpSchema.parse("52320")).toBe("52320");
    expect(otpSchema.parse("۵۲۳۲۰")).toBe("52320");
  });

  it("rejects non-digit or too-long codes", () => {
    expect(otpSchema.safeParse("52").success).toBe(false);
    expect(otpSchema.safeParse("5232023").success).toBe(false);
    expect(otpSchema.safeParse(" Five2").success).toBe(false);
  });
});

describe("amountSchema", () => {
  it("accepts integers at and above the PDF's smallest sample amount", () => {
    expect(amountSchema.parse(10_000)).toBe(10_000);
    expect(amountSchema.parse(599_923_640)).toBe(599_923_640);
    // Above Int32 (transaction-list totals reach 3e9) but within safe range.
    expect(amountSchema.parse(3_000_000_000)).toBe(3_000_000_000);
  });

  it("rejects non-integers, negatives and absurd values", () => {
    for (const bad of [0, 999, 1.5, -100, 1e13]) {
      expect(amountSchema.safeParse(bad).success).toBe(false);
    }
  });
});

describe("requestIdSchema / creditIdSchema", () => {
  it("accepts the PDF's sample shapes without over-constraining", () => {
    expect(requestIdSchema.parse("CR-4560-1759143340183-da8570")).toBe("CR-4560-1759143340183-da8570");
    expect(creditIdSchema.parse("156-2379-2222")).toBe("156-2379-2222");
    expect(creditIdSchema.parse("344-758538-39836")).toBe("344-758538-39836");
  });

  it("rejects empty or oversized values", () => {
    expect(requestIdSchema.safeParse("").success).toBe(false);
    expect(creditIdSchema.safeParse("ab").success).toBe(false);
    expect(creditIdSchema.safeParse("x".repeat(61)).success).toBe(false);
  });
});

describe("transactionsRequestSchema", () => {
  it("coerces page/size with sane defaults", () => {
    const parsed = transactionsRequestSchema.parse({
      nationalCode: "0123456789",
      fromDate: "2026-05-15",
      toDate: "2026-05-30",
      page: "2",
      size: "25",
    });
    expect(parsed).toMatchObject({ page: 2, size: 25 });
  });

  it("caps page/size and rejects malformed dates", () => {
    expect(
      transactionsRequestSchema.safeParse({
        nationalCode: "0123456789",
        fromDate: "2026-05-15",
        toDate: "2026-05-30",
        size: 500,
      }).success,
    ).toBe(false);
    expect(
      transactionsRequestSchema.safeParse({
        nationalCode: "0123456789",
        fromDate: "yesterday",
        toDate: "2026-05-30",
      }).success,
    ).toBe(false);
  });
});
