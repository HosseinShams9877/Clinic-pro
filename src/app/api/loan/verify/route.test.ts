/**
 * route.test.ts — POST /api/loan/verify (OTP verification → purchase).
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { JetPayError } from "@/modules/loan/services/jetpay";
import { POST } from "./route";

const { serviceStub } = vi.hoisted(() => ({ serviceStub: {} as Record<string, unknown> }));
vi.mock("@/modules/loan/services/loanService", () => ({
  getLoanService: () => serviceStub,
}));

let ipCounter = 0;
function nextIp(): string {
  ipCounter += 1;
  return `203.0.113.${ipCounter}`;
}
function requestFor(ip: string, body: unknown): Request {
  return new Request("http://test.local/api/loan/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

const VALID = {
  nationalCode: "4544484504",
  amount: 10000,
  requestId: "CR-4560-1759143340183-da8570",
  creditId: "156-2379-2287",
  otp: "52320",
};

beforeEach(() => {
  serviceStub.verify = vi.fn(async () => ({
    transactionId: 748,
    referenceNumber: "1175914726766597",
    status: "PENDING",
    usedAmount: 10000,
  }));
});

describe("POST /api/loan/verify", () => {
  it("returns 200 with the purchase result for a valid request", async () => {
    const response = await POST(requestFor(nextIp(), VALID));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      transactionId: 748,
      referenceNumber: "1175914726766597",
      status: "PENDING",
    });
    expect(serviceStub.verify).toHaveBeenCalledWith(VALID);
  });

  it("normalizes a Persian-digit OTP before validation", async () => {
    const response = await POST(requestFor(nextIp(), { ...VALID, otp: "۵۲۳۲۰" }));
    expect(response.status).toBe(200);
    expect(serviceStub.verify).toHaveBeenCalledWith(expect.objectContaining({ otp: "52320" }));
  });

  it("returns 400 for an OTP that is not 4-6 digits", async () => {
    expect((await POST(requestFor(nextIp(), { ...VALID, otp: "52" }))).status).toBe(400);
    expect((await POST(requestFor(nextIp(), { ...VALID, otp: "5232023" }))).status).toBe(400);
    expect(serviceStub.verify).not.toHaveBeenCalled();
  });

  it("returns 502 with the bank's message when the OTP is wrong", async () => {
    serviceStub.verify = vi.fn(async () => {
      throw new JetPayError(500003, "کد وارد شده صحیح نمی‌باشد", "otp code is wrong");
    });
    const response = await POST(requestFor(nextIp(), VALID));
    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({ code: 500003, fa: "کد وارد شده صحیح نمی‌باشد" });
  });

  it("returns 502 when the service rejects an out-of-sequence call (no OTP requested)", async () => {
    serviceStub.verify = vi.fn(async () => {
      throw new JetPayError(400, "ابتدا کد یکبار مصرف را درخواست کنید.", "Request an OTP first.");
    });
    const response = await POST(requestFor(nextIp(), VALID));
    expect(response.status).toBe(502);
  });

  it("allows 10 requests per minute per client IP, then 429s", async () => {
    const ip = nextIp();
    for (let i = 0; i < 10; i += 1) {
      expect((await POST(requestFor(ip, VALID))).status).toBe(200);
    }
    expect((await POST(requestFor(ip, VALID))).status).toBe(429);
  });
});
