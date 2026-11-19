/**
 * route.test.ts — GET /api/loan/transactions (JetPay §1-14).
 *
 * Enforces the bank's own published constraint here at our edge: a
 * request may span at most one month. Pagination is capped so the
 * proxy cannot be coaxed into a huge page.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

const { serviceStub } = vi.hoisted(() => ({ serviceStub: {} as Record<string, unknown> }));
vi.mock("@/modules/loan/services/loanService", () => ({
  getLoanService: () => serviceStub,
}));

let ipCounter = 0;
function nextIp(): string {
  ipCounter += 1;
  return `203.0.113.${ipCounter}`;
}
function requestFor(ip: string, query: string): Request {
  return new Request(`http://test.local/api/loan/transactions?${query}`, {
    headers: { "x-forwarded-for": ip },
  });
}

const VALID = "nationalCode=0123456789&fromDate=2026-05-15&toDate=2026-05-30&page=1&size=10";

beforeEach(() => {
  serviceStub.transactions = vi.fn(async () => ({
    list: [{ nationalCode: "0123456789", referenceNumber: "11780153176", status: "تایید شده" }],
    total: 1,
  }));
});

describe("GET /api/loan/transactions", () => {
  it("returns 200 with the bank's list for a valid one-month query", async () => {
    const response = await GET(requestFor(nextIp(), VALID));
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.total).toBe(1);
    expect(payload.list[0]).toMatchObject({ referenceNumber: "11780153176" });
    expect(serviceStub.transactions).toHaveBeenCalledWith({
      nationalCode: "0123456789",
      fromDate: "2026-05-15",
      toDate: "2026-05-30",
      page: 1,
      size: 10,
    });
  });

  it("applies sane defaults when page/size are omitted", async () => {
    const response = await GET(requestFor(nextIp(), "nationalCode=0123456789&fromDate=2026-05-15&toDate=2026-05-30"));
    expect(response.status).toBe(200);
    expect(serviceStub.transactions).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, size: 10 }),
    );
  });

  it("rejects a range longer than one month (the bank's own limit)", async () => {
    const response = await GET(requestFor(nextIp(), "nationalCode=0123456789&fromDate=2026-03-01&toDate=2026-05-30"));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: expect.stringContaining("one month") });
    expect(serviceStub.transactions).not.toHaveBeenCalled();
  });

  it("rejects a reversed or malformed date range", async () => {
    expect((await GET(requestFor(nextIp(), "nationalCode=0123456789&fromDate=2026-05-30&toDate=2026-05-15"))).status).toBe(400);
    expect((await GET(requestFor(nextIp(), "nationalCode=0123456789&fromDate=15-05-2026&toDate=2026-05-30"))).status).toBe(400);
    expect(serviceStub.transactions).not.toHaveBeenCalled();
  });

  it("rejects a page size over 50", async () => {
    const response = await GET(requestFor(nextIp(), "nationalCode=0123456789&fromDate=2026-05-15&toDate=2026-05-30&size=500"));
    expect(response.status).toBe(400);
  });

  it("returns 400 for a malformed national code", async () => {
    expect((await GET(requestFor(nextIp(), "nationalCode=abc&fromDate=2026-05-15&toDate=2026-05-30"))).status).toBe(400);
  });

  it("allows 10 requests per minute per client IP, then 429s", async () => {
    const ip = nextIp();
    for (let i = 0; i < 10; i += 1) {
      expect((await GET(requestFor(ip, VALID))).status).toBe(200);
    }
    expect((await GET(requestFor(ip, VALID))).status).toBe(429);
  });
});
