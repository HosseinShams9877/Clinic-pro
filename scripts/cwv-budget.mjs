/**
 * cwv-budget.mjs — the Core Web Vitals budget for the public site (P2 item 11).
 *
 * Item 11 asks for "Lighthouse / CWV budget enforced in CI". Two pieces make
 * that real:
 *   1. this module — the budget itself plus the *pure* aggregation functions
 *      the audit uses to turn raw PerformanceObserver entries into the three
 *      CWV numbers (LCP, CLS, INP) and the two supporting ones (FCP, TTFB);
 *   2. `scripts/cwv-audit.mjs` — the CDP harness that measures them against
 *      the live production build and exits non-zero on any breach, wired into
 *      `.github/workflows/cwv-budget.yml` and `npm run cwv`.
 *
 * The thresholds are BUDGETS, not Google's Good-rating thresholds: each sits
 * at or inside the Good rating with headroom for measurement noise, because a
 * gate that flickers is a gate nobody trusts. The Google thresholds the last
 * assertion in `tests/cwv-budget.test.ts` pins down (so the budget can never
 * drift to a value that would pass a page that rates "Needs improvement").
 *
 * Measurement origin: `http://localhost:3137`, HTTP not HTTPS. HSTS/HTTPS is
 * deferred to risk R-4 per the owner decision; the deferral is recorded in
 * `docs/reports/TECHNICAL_RISKS.md` and re-stated in the item-11 notes — on a
 * real HTTPS origin the same budgets apply, but TTFB gains TLS handshake and
 * the cold AVIF encode stays the same.
 */

/** The five metrics the audit measures, in that order. */
export const METRICS = Object.freeze(["ttfb", "fcp", "lcp", "cls", "inp"]);

/**
 * The budget. Values in ms for ttfb/fcp/lcp/inp and unitless for cls.
 * Calibrated on the Phase 2 production build measured warm at
 * http://localhost:3137 (docs/reports/cwv-audit.log) with headroom applied.
 */
export const BUDGET = Object.freeze({
  ttfb: 300, // Good ≤ 800; local origin, so this is deliberately tight
  fcp: 1200, // Good ≤ 1800
  lcp: 1500, // Good ≤ 2500; the item-8 hero is AVIF and warm-fast
  cls: 0.1, // Good ≤ 0.1 — equal to the Good threshold itself
  inp: 200, // Good ≤ 200
});

/**
 * Google's "Good" rating thresholds (web.dev/vitals). The budget must never
 * exceed these — a gate that passes a page rated "Needs improvement" is
 * worse than no gate. Pinned by tests/cwv-budget.test.ts.
 */
export const GOOD_THRESHOLDS = Object.freeze({
  ttfb: 800,
  fcp: 1800,
  lcp: 2500,
  cls: 0.1,
  inp: 200,
});

/**
 * CLS the way the spec computes it: the "session window" method. Layout
 * shifts are grouped into a session that ends after `gap` ms (1 s) without a
 * shift or after `cap` ms (5 s) from the session's first shift; the value is
 * the largest session's total. Entry shape: `{ startTime, value }`, with
 * `hadRecentInput` shifts already filtered out by the collector.
 */
export function sessionWindowCLS(shifts, gap = 1000, cap = 5000) {
  if (!Array.isArray(shifts) || shifts.length === 0) return 0;
  let max = 0;
  let sessionValue = 0;
  let firstTime = Number.POSITIVE_INFINITY; // first shift of the current session
  let latestTime = Number.POSITIVE_INFINITY; // most recent shift of the current session
  for (const shift of [...shifts].sort((a, b) => a.startTime - b.startTime)) {
    if (
      firstTime === Number.POSITIVE_INFINITY ||
      shift.startTime - firstTime > cap ||
      shift.startTime - latestTime > gap
    ) {
      sessionValue = 0;
      firstTime = shift.startTime;
    }
    latestTime = shift.startTime;
    sessionValue += shift.value;
    if (sessionValue > max) max = sessionValue;
  }
  // CLS is a ratio to 3 decimal places in the spec; keep the rounding here so
  // the comparison against the 0.1 budget is not at the mercy of float dust.
  return Math.round(max * 1000) / 1000;
}

/**
 * INP over the raw `event` entries (shape: `{ id, duration }`): one
 * interaction id groups the pointer/keyboard events of a single user gesture,
 * and the interaction's duration is the LONGEST of its event durations — a
 * click that runs a pointerdown handler at 40 ms and a click handler at
 * 90 ms is a 90 ms interaction, not 130 ms. The metric is the worst
 * interaction observed: for the audit's short session that is the honest
 * stand-in for the real p98 (documented in cwv-audit.mjs).
 */
export function worstInteraction(events) {
  if (!Array.isArray(events) || events.length === 0) return 0;
  const byId = new Map();
  for (const event of events) {
    if (event.id == null) continue;
    byId.set(event.id, Math.max(byId.get(event.id) ?? 0, event.duration));
  }
  if (byId.size === 0) return 0;
  return Math.max(...byId.values());
}

/** A metric's value formatted for the report table. */
export function formatMetric(metric, value) {
  if (value === null || value === undefined) return "n/a";
  return metric === "cls" ? value.toFixed(3) : `${Math.round(value)} ms`;
}

/**
 * The gate itself. Returns `{ pass, breaches }` for one measured page.
 * A metric that was never observed (`null`) is reported as n/a and does not
 * breach — INP on a route with no recorded interaction is "not measured",
 * not "failed", and the audit prints it that way.
 */
export function evaluateRoute(metrics, budget = BUDGET) {
  const breaches = [];
  for (const metric of METRICS) {
    // CLS is defined as a ratio to 3 decimal places, so the gate rounds it
    // before comparing — the same rounding the aggregator applies — and the
    // ms metrics are integers in the spec.
    const raw = metrics[metric];
    const value = raw === null || raw === undefined ? null : metric === "cls" ? Math.round(raw * 1000) / 1000 : Math.round(raw);
    if (value === null) continue;
    if (value > budget[metric]) {
      breaches.push({ metric, value, budget: budget[metric] });
    }
  }
  return { pass: breaches.length === 0, breaches };
}
