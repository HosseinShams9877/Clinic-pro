/**
 * loanQueries.test.ts — the client-side fetchers and response guards.
 *
 * Pinned: the guard rejects anything malformed (so the wizard never
 * renders unvalidated data), our error envelope maps to LoanApiError
 * with the bank's fa message attached, and the display helper prefers
 * the bank's wording over our generic copy.
 *
 * No Zod here by design (the status badge's bundle posture, P2 item 9):
 * these mirrors are proven equivalent by shape against the route
 * payloads, served by the tests above.
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import { t } from "@/modules/i18n/messages";
import {
  LoanApiError,
  fetchConfirm,
  fetchInquiry,
  fetchStatus,
  isInquiryResponse,
  isStatusResponse,
  isVerifyResponse,
  loanErrorMessage,
} from "./loanQueries";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

const INQUIRY = {
  requestId: "CR-0016-1761109080025-e6f8fb",
  credits: [
    {
      creditId: "156-2379-2287",
      creditName: "سپاس",
      creditBalance: 100_000_000,
    },
  ],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("response guards", () => {
  it("accepts a well-shaped inquiry response", () => {
    expect(isInquiryResponse(INQUIRY)).toBe(true);
  });

  it("rejects an inquiry response missing the requestId or with non-numeric balance", () => {
    expect(isInquiryResponse({ credits: [] })).toBe(false);
    expect(
      isInquiryResponse({ requestId: "x", credits: [{ creditId: "a", creditName: "b", creditBalance: "100" }] }),
    ).toBe(false);
  });

  it("accepts the purchase verify response and the flat status list", () => {
    expect(
      isVerifyResponse({ transactionId: 748, referenceNumber: "1175914726766597", status: "PENDING" }),
    ).toBe(true);
    expect(isStatusResponse({ steps: [{ step: "PURCHASE", status: "COMPLETED" }] })).toBe(true);
    expect(isStatusResponse({ steps: [{ step: "PURCHASE" }] })).toBe(false);
  });
});

describe("fetchers", () => {
  it("POSTs the inquiry body to our route and returns the parsed credits", async () => {
    const fetchStub = vi.fn(async () => jsonResponse(200, INQUIRY));
    vi.stubGlobal("fetch", fetchStub);
    const result = await fetchInquiry("4533654504");
    expect(fetchStub).toHaveBeenCalledWith(
      "/api/loan/inquiry",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ nationalCode: "4533654504" }) }),
    );
    expect(result.credits[0]!.creditBalance).toBe(100_000_000);
  });

  it("GETs the status route with the encoded reference number", async () => {
    const fetchStub = vi.fn(async () => jsonResponse(200, { steps: [{ step: "PURCHASE", status: "PENDING" }] }));
    vi.stubGlobal("fetch", fetchStub);
    await fetchStatus("1175914726766597");
    expect(fetchStub).toHaveBeenCalledWith("/api/loan/status?referenceNumber=1175914726766597", expect.objectContaining({ signal: undefined }));
  });

  it("throws LoanApiError with the bank's fa message and code when the route fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(502, { error: "otp code is wrong", fa: "کد وارد شده صحیح نمی‌باشد", code: 500003 }),
      ),
    );
    await expect(fetchConfirm("1175914726766597")).rejects.toMatchObject({
      name: "LoanApiError",
      status: 502,
      fa: "کد وارد شده صحیح نمی‌باشد",
      code: 500003,
    });
  });

  it("rejects a malformed success body rather than returning it", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(200, { nope: true })));
    await expect(fetchInquiry("4533654504")).rejects.toMatchObject({ name: "LoanApiError" });
  });

  it("maps a network failure to LoanApiError status 0", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("offline"))));
    await expect(fetchInquiry("4533654504")).rejects.toMatchObject({ status: 0 });
  });
});

describe("loanErrorMessage", () => {
  it("prefers the bank's fa message in fa locale", () => {
    const error = new LoanApiError(502, "otp code is wrong", "کد وارد شده صحیح نمی‌باشد", 500003);
    expect(loanErrorMessage("fa", error)).toBe("کد وارد شده صحیح نمی‌باشد");
  });

  it("shows the localized network message for unreachable banks", () => {
    expect(loanErrorMessage("fa", new LoanApiError(0, "network", undefined, undefined))).toBe(t("fa", "lw.errNetwork"));
    expect(loanErrorMessage("en", new LoanApiError(0, "network", undefined, undefined))).toBe(t("en", "lw.errNetwork"));
  });

  it("shows the localized too-many-requests message on 429", () => {
    expect(loanErrorMessage("fa", new LoanApiError(429, "Too Many Requests", undefined, undefined))).toBe(
      t("fa", "lw.errTooMany"),
    );
  });

  it("falls back to the generic message for other errors", () => {
    expect(loanErrorMessage("en", new LoanApiError(502, "bad", undefined, undefined))).toBe(t("en", "lw.errGeneric"));
    expect(loanErrorMessage("fa", {})).toBe(t("fa", "lw.errGeneric"));
  });
});
