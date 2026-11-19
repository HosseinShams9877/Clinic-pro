/**
 * LoanWizard.test.tsx — the interactive request flow, end to end.
 *
 * The routes are mocked out with stubbed fetch, so this pins the flow
 * machine itself: each step submits the documented payload, the receipt
 * renders the bank's reference number, and the polling loop settles on
 * the confirm step. Persian digits typed by a Persian keyboard are part
 * of the contract (the reference's own en() rule).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";

import { LoanWizard } from "./LoanWizard";

/** The stubbed route responses, in call order. */
function routeBank() {
  return {
    "/api/loan/inquiry": async () => ({
      status: 200,
      body: {
        requestId: "CR-0016-1761109080025-e6f8fb",
        credits: [
          { creditId: "156-2379-2287", creditName: "سپاس", creditBalance: 100_000_000, customerName: "حسن قاسمی" },
        ],
      },
    }),
    "/api/loan/send-otp": async () => ({ status: 200, body: { mobile: "091******93" } }),
    "/api/loan/verify": async () => ({
      status: 200,
      body: { transactionId: 748, referenceNumber: "1175914726766597", status: "PENDING" },
    }),
    "/api/loan/status": async () => ({
      status: 200,
      body: { steps: [{ step: "PURCHASE", status: "COMPLETED" }] },
    }),
    "/api/loan/confirm": async () => ({
      status: 200,
      body: { status: "CONFIRMED", transactionId: 749, referenceNumber: "1175914726766597" },
    }),
  } as Record<string, () => Promise<{ status: number; body: unknown }>>;
}

let fetchStub: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  const routes = routeBank();
  fetchStub = vi.fn(async (path: string) => {
    const handler = routes[new URL(path, "http://test.local").pathname];
    if (!handler) throw new Error(`unexpected route ${path}`);
    const { status, body } = await handler();
    return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  });
  vi.stubGlobal("fetch", fetchStub);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

async function advance(): Promise<void> {
  // Let pending promises/timers settle under fake timers.
  await act(async () => {
    await vi.runOnlyPendingTimersAsync();
  });
}

describe("LoanWizard flow", () => {
  it("runs inquiry → amount → OTP → purchase → confirmed receipt", async () => {
    render(<LoanWizard locale="fa" />);

    // Step 1: national code (Persian digits, like a fa keyboard).
    const input = screen.getByLabelText("کد ملی");
    fireEvent.change(input, { target: { value: "۴۵۳۳۶۵۴۵۰۴" } });
    fireEvent.click(screen.getByRole("button", { name: /شروع درخواست/ }));
    await advance();

    expect(fetchStub).toHaveBeenCalledWith(
      "/api/loan/inquiry",
      expect.objectContaining({ body: JSON.stringify({ nationalCode: "4533654504" }) }),
    );

    // Step 2: the credit is shown; continue.
    expect(screen.getByText("سپاس")).toBeInTheDocument();
    expect(screen.getByText(/۱۰۰,۰۰۰,۰۰۰/)).toBeInTheDocument(); // localized balance
    fireEvent.click(screen.getByRole("button", { name: /ادامه/ }));
    await advance();

    // Step 3: amount + OTP request.
    fireEvent.change(screen.getByLabelText(/مبلغ درخواست/), { target: { value: "25000000" } });
    fireEvent.click(screen.getByRole("button", { name: /دریافت کد یکبار مصرف/ }));
    await advance();
    expect(fetchStub).toHaveBeenCalledWith(
      "/api/loan/send-otp",
      expect.objectContaining({
        body: JSON.stringify({
          nationalCode: "4533654504",
          requestId: "CR-0016-1761109080025-e6f8fb",
          creditId: "156-2379-2287",
          amount: 25_000_000,
        }),
      }),
    );

    // Step 4: OTP → purchase.
    expect(screen.getByText(/091\*+\*+\*+93/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("کد یکبار مصرف"), { target: { value: "52320" } });
    fireEvent.click(screen.getByRole("button", { name: /تأیید و ثبت درخواست/ }));
    await advance();
    expect(fetchStub).toHaveBeenCalledWith(
      "/api/loan/verify",
      expect.objectContaining({
        body: JSON.stringify({
          nationalCode: "4533654504",
          requestId: "CR-0016-1761109080025-e6f8fb",
          creditId: "156-2379-2287",
          amount: 25_000_000,
          otp: "52320",
        }),
      }),
    );

    // Step 5: polling resolves the purchase, confirm runs, receipt shows.
    await waitFor(() => {
      expect(screen.getByText("درخواست وام ثبت شد")).toBeInTheDocument();
    });
    expect(screen.getByText("1175914726766597")).toBeInTheDocument();
    expect(fetchStub.mock.calls.some(([path]) => String(path).includes("/api/loan/confirm"))).toBe(true);
  });

  it("blocks an invalid national code client-side and never calls the route", async () => {
    render(<LoanWizard locale="fa" />);
    fireEvent.change(screen.getByLabelText("کد ملی"), { target: { value: "123" } });
    fireEvent.click(screen.getByRole("button", { name: /شروع درخواست/ }));
    await advance();
    expect(screen.getByText(/کد ملی را درست وارد کنید/)).toBeInTheDocument();
    expect(fetchStub).not.toHaveBeenCalled();
  });

  it("blocks an amount above the available credit balance", async () => {
    render(<LoanWizard locale="fa" />);
    fireEvent.change(screen.getByLabelText("کد ملی"), { target: { value: "4533654504" } });
    fireEvent.click(screen.getByRole("button", { name: /شروع درخواست/ }));
    await advance();
    fireEvent.click(screen.getByRole("button", { name: /ادامه/ }));
    await advance();
    fireEvent.change(screen.getByLabelText(/مبلغ درخواست/), { target: { value: "999999999" } });
    fireEvent.click(screen.getByRole("button", { name: /دریافت کد یکبار مصرف/ }));
    await advance();
    expect(screen.getByText(/مبلغ را به صورت عدد صحیح/)).toBeInTheDocument();
    expect(fetchStub.mock.calls.some(([path]) => String(path).includes("send-otp"))).toBe(false);
  });

  it("shows the bank's fa message when the route refuses", async () => {
    fetchStub = vi.fn(async () =>
      new Response(JSON.stringify({ error: "refused", fa: "کد وارد شده صحیح نمی‌باشد", code: 500003 }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchStub);
    render(<LoanWizard locale="fa" />);
    fireEvent.change(screen.getByLabelText("کد ملی"), { target: { value: "4533654504" } });
    fireEvent.click(screen.getByRole("button", { name: /شروع درخواست/ }));
    await advance();
    expect(await screen.findByText("کد وارد شده صحیح نمی‌باشد")).toBeInTheDocument();
  });

  it("renders in English without leaking Persian copy", async () => {
    render(<LoanWizard locale="en" />);
    expect(screen.getByLabelText("National code")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("National code"), { target: { value: "4533654504" } });
    fireEvent.click(screen.getByRole("button", { name: /Start request/i }));
    await advance();
    expect(await screen.findByText("سپاس")).toBeInTheDocument(); // the credit name comes from the bank
    expect(screen.getByRole("button", { name: /Continue/i })).toBeInTheDocument();
  });
});
