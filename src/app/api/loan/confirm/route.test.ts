/**
 * route.test.ts — POST /api/loan/confirm (JetPay §1-9, final confirmation).
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
  return new Request("http://test.local/api/loan/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  serviceStub.confirm = vi.fn(async () => ({
    status: "CONFIRMED",
    transactionId: 749,
    referenceNumber: "1175914726766597",
    confirmedAmount: "10000.00",
  }));
});

describe("POST /api/loan/confirm", () => {
  it("returns 200 with the confirmed status for a valid reference number", async () => {
    const response = await POST(requestFor(nextIp(), { referenceNumber: "1175914726766597" }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: "CONFIRMED", transactionId: 749 });
    expect(serviceStub.confirm).toHaveBeenCalledWith("1175914726766597");
  });

  it("returns 400 when the reference number is missing", async () => {
    expect((await POST(requestFor(nextIp(), {}))).status).toBe(400);
    expect(serviceStub.confirm).not.toHaveBeenCalled();
  });

  it("maps the bank's transaction-not-completed refusal (calling confirm early)", async () => {
    serviceStub.confirm = vi.fn(async () => {
      throw new JetPayError(14000010, "تراکنش خرید هنوز کامل نشده است", "Transaction is not completed");
    });
    const response = await POST(requestFor(nextIp(), { referenceNumber: "1175914726766597" }));
    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({ code: 14000010 });
  });

  it("allows 10 requests per minute per client IP, then 429s", async () => {
    const ip = nextIp();
    for (let i = 0; i < 10; i += 1) {
      expect((await POST(requestFor(ip, { referenceNumber: "1175914726766597" }))).status).toBe(200);
    }
    expect((await POST(requestFor(ip, { referenceNumber: "1175914726766597" }))).status).toBe(429);
  });
});
