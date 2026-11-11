/**
 * statusQueries.test.ts — the API contract and the trilingual countdown text.
 *
 * What is pinned here:
 *   1. The Zod schema accepts exactly the reference's two status shapes and
 *      rejects everything else (the client never renders a bad payload).
 *   2. statusText emits home.js's T-table phrasing per locale, with digits
 *      localized exactly like home.js's n().
 *   3. statusPayload round-trips the pure snapshot into the wire shape.
 */

import { describe, expect, it, vi } from "vitest";

import { fetchStatus, statusPayload, statusQueryKey, statusText } from "./statusQueries";
import { statusResponseSchema } from "../schemas/statusSchema";

describe("statusResponseSchema", () => {
  it("accepts the open shape", () => {
    expect(statusResponseSchema.safeParse({ open: true, closeMinutes: 480 }).success).toBe(true);
  });

  it("accepts the closed shape with a day label", () => {
    expect(statusResponseSchema.safeParse({ open: false, opensInMinutes: 90, dayLabel: "today" }).success).toBe(true);
    expect(statusResponseSchema.safeParse({ open: false, opensInMinutes: 90, dayLabel: "saturday" }).success).toBe(true);
  });

  it("rejects an out-of-range countdown", () => {
    expect(statusResponseSchema.safeParse({ open: true, closeMinutes: 0 }).success).toBe(false);
    expect(statusResponseSchema.safeParse({ open: true, closeMinutes: 751 }).success).toBe(false);
    expect(statusResponseSchema.safeParse({ open: false, opensInMinutes: 0, dayLabel: "today" }).success).toBe(false);
  });

  it("rejects a shape missing its countdown", () => {
    expect(statusResponseSchema.safeParse({ open: true }).success).toBe(false);
    expect(statusResponseSchema.safeParse({ open: false, dayLabel: "today" }).success).toBe(false);
  });

  it("rejects an unknown day label", () => {
    expect(
      statusResponseSchema.safeParse({ open: false, opensInMinutes: 90, dayLabel: "Sunday" }).success,
    ).toBe(false);
  });
});

describe("statusText", () => {
  it("renders the open title with an hours+minutes countdown (fa, Persian digits)", () => {
    const { title, sub } = statusText("fa", { open: true, closeMinutes: 480 });
    expect(title).toBe("پذیرش هم‌اکنون باز است");
    expect(sub).toBe("۸ ساعت و ۰ دقیقه تا پایان پذیرش");
  });

  it("renders the minutes-only countdown when under an hour (fa)", () => {
    const { sub } = statusText("fa", { open: true, closeMinutes: 45 });
    expect(sub).toBe("۴۵ دقیقه تا پایان پذیرش");
  });

  it("localizes digits for ar", () => {
    const { sub } = statusText("ar", { open: true, closeMinutes: 480 });
    expect(sub).toBe("يغلق بعد ٨ س و٠ د");
  });

  it("keeps ASCII digits for en", () => {
    const { title, sub } = statusText("en", { open: true, closeMinutes: 480 });
    expect(title).toBe("Admissions open now");
    expect(sub).toBe("Closes in 8h 0m");
  });

  it("renders the closed title with the reopen day (en)", () => {
    const { title, sub } = statusText("en", { open: false, opensInMinutes: 90, dayLabel: "today" });
    expect(title).toBe("Admissions closed now");
    expect(sub).toBe("Opens today at 07:30");
  });

  it("renders the Saturday reopen after Thursday close (fa)", () => {
    const { sub } = statusText("fa", { open: false, opensInMinutes: 6000, dayLabel: "saturday" });
    expect(sub).toBe("بازگشایی شنبه ساعت ۷:۳۰");
  });

  it("renders the Saturday reopen after Friday (ar)", () => {
    const { sub } = statusText("ar", { open: false, opensInMinutes: 1200, dayLabel: "tomorrow" });
    expect(sub).toBe("يفتح غدًا الساعة ٧:٣٠");
  });
});

describe("statusPayload", () => {
  it("passes the open snapshot through unchanged", () => {
    expect(statusPayload({ open: true, closeMinutes: 123 })).toEqual({ open: true, closeMinutes: 123 });
  });

  it("passes the closed snapshot through unchanged", () => {
    const snapshot = { open: false as const, opensInMinutes: 90, dayLabel: "today" as const };
    expect(statusPayload(snapshot)).toEqual(snapshot);
  });
});

describe("statusQueryKey", () => {
  it("namespaces the query key per locale", () => {
    expect(statusQueryKey("fa")).toEqual(["status", "fa"]);
    expect(statusQueryKey("en")).toEqual(["status", "en"]);
    expect(statusQueryKey("en")).not.toBe(statusQueryKey("en")); // new tuple each call
  });
});

describe("fetchStatus", () => {
  it("validates a successful response", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ open: true, closeMinutes: 60 })));
    vi.stubGlobal("fetch", fetchMock);
    try {
      await expect(fetchStatus("fa")).resolves.toEqual({ open: true, closeMinutes: 60 });
      expect(fetchMock).toHaveBeenCalledWith("/api/status");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("throws on an HTTP error", async () => {
    vi.stubGlobal("fetch", async () => new Response("nope", { status: 429 }));
    await expect(fetchStatus("fa")).rejects.toThrow(/429/);
    vi.unstubAllGlobals();
  });

  it("throws on a malformed body (never renders a bad badge)", async () => {
    vi.stubGlobal("fetch", async () => new Response(JSON.stringify({ open: "yes" })));
    await expect(fetchStatus("fa")).rejects.toThrow(/malformed/);
    vi.unstubAllGlobals();
  });
});
