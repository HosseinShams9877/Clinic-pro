/**
 * cwv-budget.d.mts — TypeScript surface for scripts/cwv-budget.mjs (the P2
 * item 11 budget module), so `tests/cwv-budget.test.ts` type-checks under
 * `tsc --noEmit` without turning `allowJs` on for the whole app. The runtime
 * implementation is the .mjs file; this declaration mirrors its exports and
 * the test suite pins the behaviour, so any drift between the two surfaces
 * as a failing test rather than silent typing.
 */

export type Metric = "ttfb" | "fcp" | "lcp" | "cls" | "inp";

export const METRICS: readonly Metric[];

export const BUDGET: Readonly<Record<Metric, number>>;

export const GOOD_THRESHOLDS: Readonly<Record<Metric, number>>;

/** Layout-shift entry as the collector records it. */
export interface LayoutShift {
  startTime: number;
  value: number;
}

/** Event-timing entry as the collector records it (diagnostic only). */
export interface TimedEvent {
  id: number | null;
  duration: number;
}

export function sessionWindowCLS(shifts?: LayoutShift[], gap?: number, cap?: number): number;

export function worstInteraction(events?: TimedEvent[]): number;

export function formatMetric(metric: Metric, value: number | null | undefined): string;

export interface Breach {
  metric: Metric;
  value: number;
  budget: number;
}

export interface Evaluation {
  pass: boolean;
  breaches: Breach[];
}

export function evaluateRoute(metrics: Partial<Record<Metric, number | null>>, budget?: Readonly<Record<Metric, number>>): Evaluation;
