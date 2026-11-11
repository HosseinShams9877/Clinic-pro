/**
 * LiveStatus.test.tsx — the live admissions badge island (P1-13).
 *
 * Pinned:
 *   1. The first client paint is the server snapshot — the badge carries the
 *      SSR text even while the mount fetch is still in flight (no flash of
 *      empty/wrong text, no hydration mismatch).
 *   2. The island switches to validated server data when it arrives.
 *   3. The poll interval is 61 s or more (never more frequent than the task's
 *      60 s posture) AND it only fires while the tab is visible — advancing
 *      the clock behind a hidden document triggers no request.
 *   4. Updates are announced via role="status" (an implicit aria-live polite
 *      region, per the ARIA spec).
 *
 * Clocks: the data-settling tests run on real timers (so the fetch → json →
 * Zod → React chain drains naturally); only the interval/visibility tests
 * install the fake clock, where the clock is exactly what is under test.
 */

import { QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { makeQueryClient } from "@/core/query/client";
import type { StatusSnapshot } from "@/core/openHours";
import { LiveStatus } from "./LiveStatus";

const OPEN_SNAPSHOT: StatusSnapshot = { open: true, closeMinutes: 480 };
const CLOSED_SNAPSHOT: StatusSnapshot = { open: false, opensInMinutes: 90, dayLabel: "today" };

/** Fetched payload the client switches to (Zod-valid). */
const FETCHED_PAYLOAD = { open: true, closeMinutes: 60 } as const;

/** The snapshot's sub-line, already rendered on the server. */
const SNAPSHOT_SUB_FA = "۸ ساعت و ۰ دقیقه تا پایان پذیرش";

function renderBadge(locale: "fa" | "en" | "ar", serverSnapshot: StatusSnapshot) {
  // The exact production configuration (core/query/client.ts).
  const client = makeQueryClient();
  return render(
    <QueryClientProvider client={client}>
      <LiveStatus locale={locale} serverSnapshot={serverSnapshot} />
    </QueryClientProvider>,
  );
}

/** jsdom's document reports "visible"; flip it and announce the change. */
function setVisibility(state: "visible" | "hidden") {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => state,
  });
  document.dispatchEvent(new Event("visibilitychange"));
}

/**
 * Advance the fake clock AND let every pending microtask (fetch → json → Zod
 * → React state update) settle inside act.
 */
async function tick(ms = 0): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

/** Drain the microtask queue on real timers (fetch resolution). */
async function flush(): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

let fetchCalls = 0;

beforeEach(() => {
  fetchCalls = 0;
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      fetchCalls += 1;
      return new Response(JSON.stringify(FETCHED_PAYLOAD));
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => "visible",
  });
});

describe("LiveStatus", () => {
  it("renders the server snapshot while the mount fetch is still in flight", () => {
    // The mount request never settles in this test — the badge must still
    // paint fully from the SSR snapshot.
    vi.stubGlobal(
      "fetch",
      vi.fn(() => {
        fetchCalls += 1;
        return new Promise<Response>(() => {});
      }),
    );
    renderBadge("fa", OPEN_SNAPSHOT);
    const badge = document.getElementById("live-status");
    expect(badge).not.toBeNull();
    expect(badge?.querySelector("b")?.textContent).toBe("پذیرش هم‌اکنون باز است");
    // The SSR countdown text, not a placeholder and not a blank.
    expect(badge?.textContent).toContain(SNAPSHOT_SUB_FA);
    // The dot paints for the server snapshot (green = open).
    expect(badge?.querySelector(".live-dot")?.className).toContain("bg-[var(--open)]");
    // The mount fetch fired once and is pending; the badge did not wait.
    expect(fetchCalls).toBe(1);
  });

  it("renders the closed snapshot identically from the server", () => {
    renderBadge("en", CLOSED_SNAPSHOT);
    const badge = document.getElementById("live-status");
    expect(badge?.querySelector("b")?.textContent).toBe("Admissions closed now");
    expect(badge?.textContent).toContain("Opens today at 07:30");
    expect(badge?.querySelector(".live-dot")?.className).toContain("bg-[var(--closed)]");
  });

  it("switches to validated server data once it arrives", async () => {
    renderBadge("fa", OPEN_SNAPSHOT);
    // The fetch carries 60 min left → "۱ ساعت و ۰ دقیقه", not the SSR "۸ ساعت".
    await screen.findByText("۱ ساعت و ۰ دقیقه تا پایان پذیرش");
    expect(fetchCalls).toBe(1);
    const badge = document.getElementById("live-status");
    expect(badge?.querySelector(".live-dot")?.className).toContain("bg-[var(--open)]");
  });

  it("regresses to the snapshot (never an empty badge) if the fetch rejects", async () => {
    vi.stubGlobal("fetch", async () => new Response("nope", { status: 503 }));
    renderBadge("fa", OPEN_SNAPSHOT);
    await flush();
    const badge = document.getElementById("live-status");
    expect(badge?.textContent).toContain(SNAPSHOT_SUB_FA);
  });

  it("does not poll again before 61 s", async () => {
    vi.useFakeTimers();
    renderBadge("fa", OPEN_SNAPSHOT);
    await tick();
    expect(fetchCalls).toBe(1);
    await tick(60_000); // 60 s elapsed — still under the interval
    expect(fetchCalls).toBe(1);
    await tick(2_000); // 62 s total — past the interval
    expect(fetchCalls).toBe(2);
  });

  it("stops polling while the tab is hidden and resumes when visible", async () => {
    vi.useFakeTimers();
    renderBadge("fa", OPEN_SNAPSHOT);
    await tick();
    expect(fetchCalls).toBe(1);

    setVisibility("hidden");
    await tick(180_000); // 3 minutes hidden
    expect(fetchCalls).toBe(1); // not a single poll behind a hidden tab

    setVisibility("visible");
    await tick(); // resuming does not slam the endpoint
    expect(fetchCalls).toBe(1);
    await tick(62_000);
    expect(fetchCalls).toBe(2);
  });

  it("announces updates politely to assistive technology", () => {
    renderBadge("fa", OPEN_SNAPSHOT);
    const badge = document.getElementById("live-status");
    // role="status" is, by the ARIA spec, an implicit aria-live="polite"
    // region — the badge's open/closed switch is announced; the countdown is
    // not (it would be noise).
    expect(badge?.getAttribute("role")).toBe("status");
  });

  it("does not render an empty badge before data arrives", () => {
    renderBadge("en", OPEN_SNAPSHOT);
    // role="status" element exists and carries text from the very first paint.
    const badge = screen.getByRole("status");
    expect(badge.textContent?.trim().length ?? 0).toBeGreaterThan(0);
  });
});
