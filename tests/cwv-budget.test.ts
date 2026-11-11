/**
 * cwv-budget.test.ts — the P2 item 11 mandated test over the budget logic.
 *
 * The CDP harness (`scripts/cwv-audit.mjs`) measures real pages; this file
 * pins down the *math* it relies on, so the aggregation cannot silently drift
 * from the spec (and the budget cannot drift past Google's Good thresholds)
 * without failing the suite. Cases use synthetic observer entries with
 * hand-computed expectations.
 */
import { describe, expect, it } from "vitest";

import {
  BUDGET,
  GOOD_THRESHOLDS,
  METRICS,
  evaluateRoute,
  formatMetric,
  sessionWindowCLS,
  worstInteraction,
} from "../scripts/cwv-budget.mjs";

describe("sessionWindowCLS (the session-window method)", () => {
  it("returns 0 for an empty or missing shift list", () => {
    expect(sessionWindowCLS([])).toBe(0);
    expect(sessionWindowCLS(undefined)).toBe(0);
  });

  it("sums shifts that arrive inside the same session", () => {
    // Two shifts 200 ms apart: one session, value 0.05 + 0.03.
    const shifts = [
      { startTime: 1000, value: 0.05 },
      { startTime: 1200, value: 0.03 },
    ];
    expect(sessionWindowCLS(shifts)).toBeCloseTo(0.08, 3);
  });

  it("starts a new session after a 1 s gap and keeps the larger session", () => {
    // Session A (0.09 total) … 1.1 s gap … session B (0.02) → CLS is 0.09.
    const shifts = [
      { startTime: 1000, value: 0.05 },
      { startTime: 1500, value: 0.04 },
      { startTime: 2700, value: 0.02 }, // 1200 ms after the previous shift
    ];
    expect(sessionWindowCLS(shifts)).toBeCloseTo(0.09, 3);
  });

  it("also caps a session at 5 s from its first shift", () => {
    // Shifts 800 ms apart — never a 1 s gap — but the run spans past 5 s
    // from the first shift, so a new session starts there.
    const shifts = [
      { startTime: 0, value: 0.02 },
      { startTime: 800, value: 0.02 },
      { startTime: 1600, value: 0.02 },
      { startTime: 2400, value: 0.02 },
      { startTime: 3200, value: 0.02 }, // session A total = 0.10
      { startTime: 5100, value: 0.01 }, // > 5000 ms after the first shift
    ];
    expect(sessionWindowCLS(shifts)).toBeCloseTo(0.1, 3);
  });

  it("ignores unsorted input the same way (sorts by startTime first)", () => {
    const shifts = [
      { startTime: 1200, value: 0.03 },
      { startTime: 1000, value: 0.05 },
    ];
    expect(sessionWindowCLS(shifts)).toBeCloseTo(0.08, 3);
  });

  it("matches the item-8 observation: warm loads measure 0.000", () => {
    expect(sessionWindowCLS([{ startTime: 200, value: 0.0 }])).toBe(0);
  });
});

describe("worstInteraction (INP grouping)", () => {
  it("returns 0 when nothing was recorded", () => {
    expect(worstInteraction([])).toBe(0);
    expect(worstInteraction(undefined)).toBe(0);
  });

  it("takes the LONGEST event duration of each interaction, not the sum", () => {
    // One click: pointerdown 40 ms + pointerup 90 ms → 90 ms, not 130 ms.
    const events = [
      { id: 7, duration: 40 },
      { id: 7, duration: 90 },
    ];
    expect(worstInteraction(events)).toBe(90);
  });

  it("reports the worst of several interactions", () => {
    const events = [
      { id: 1, duration: 30 },
      { id: 2, duration: 60 },
      { id: 2, duration: 45 },
      { id: 3, duration: 110 },
      { id: 3, duration: 80 },
    ];
    expect(worstInteraction(events)).toBe(110);
  });

  it("ignores events without an interaction id (unrelated events)", () => {
    const events = [
      { id: null, duration: 900 },
      { id: 4, duration: 25 },
    ];
    expect(worstInteraction(events)).toBe(25);
  });
});

describe("evaluateRoute (the gate)", () => {
  it("passes a clean warm page — the shape the audit reports", () => {
    const result = evaluateRoute({ ttfb: 42, fcp: 610, lcp: 780, cls: 0.0, inp: 64 });
    expect(result.pass).toBe(true);
    expect(result.breaches).toEqual([]);
  });

  it("flags each metric when it exceeds its budget", () => {
    const breaches = evaluateRoute({
      ttfb: 420,
      fcp: 1400,
      lcp: 2100,
      cls: 0.12,
      inp: 240,
    }).breaches.map((b) => b.metric);
    expect(breaches).toEqual(["ttfb", "fcp", "lcp", "cls", "inp"]);
  });

  it("reports the budget alongside the value, for the failure message", () => {
    const [breach] = evaluateRoute({ lcp: 2400 }).breaches;
    expect(breach).toEqual({ metric: "lcp", value: 2400, budget: BUDGET.lcp });
  });

  it("treats an unmeasured metric as n/a, never as a breach", () => {
    // INP on a route where no interaction was dispatched.
    const result = evaluateRoute({ ttfb: 50, fcp: 600, lcp: 700, cls: 0, inp: null });
    expect(result.pass).toBe(true);
    expect(formatMetric("inp", null)).toBe("n/a");
  });

  it("calls cls 0.1 exactly at the threshold a pass (no float dust)", () => {
    expect(evaluateRoute({ cls: 0.1 }).pass).toBe(true);
    expect(evaluateRoute({ cls: 0.1004 }).pass).toBe(true); // rounds to 0.1
    expect(evaluateRoute({ cls: 0.1005 }).pass).toBe(false); // rounds to 0.101
  });
});

describe("the budget itself", () => {
  it("covers exactly the five metrics the audit measures", () => {
    expect(Object.keys(BUDGET).sort()).toEqual([...METRICS].sort());
    for (const metric of METRICS) {
      expect(typeof BUDGET[metric]).toBe("number");
      expect(Number.isFinite(BUDGET[metric])).toBe(true);
    }
  });

  it("never exceeds Google's Good-rating thresholds (the gate must not pass 'Needs improvement')", () => {
    for (const metric of METRICS) {
      expect(BUDGET[metric]).toBeLessThanOrEqual(GOOD_THRESHOLDS[metric]);
    }
  });

  it("formats metrics for the report table", () => {
    expect(formatMetric("lcp", 1234.56)).toBe("1235 ms");
    expect(formatMetric("cls", 0.0294)).toBe("0.029");
    expect(formatMetric("cls", undefined)).toBe("n/a");
  });
});
