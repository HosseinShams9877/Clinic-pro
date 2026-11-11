/**
 * statusClientGuard.ts — the browser-side mirror of statusResponseSchema
 * (P2 item 9, 2026-11-10).
 *
 * Zero dependencies: importing Zod here would ship its full runtime to the
 * client (~15.5 KB gzip) for one boolean check. This predicate mirrors the
 * schema exactly — same discriminators, same integer ranges, same enum — and
 * statusEquivalence.test.ts proves the agreement over a corpus of valid
 * payloads and malformed mutants, so "a malformed response never reaches the
 * badge" (the invariant statusQueries.ts has always relied on) is preserved
 * by test, not by hope. The Zod schema in statusSchema.ts remains the
 * authority; if the contract changes, both must change together, and the
 * equivalence test fails if they drift apart.
 */

import type { StatusResponse } from "./statusSchema";

const DAY_LABELS: ReadonlySet<string> = new Set(["today", "tomorrow", "saturday"]);

function isIntWithin(value: unknown, min: number, max: number): boolean {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= min &&
    value <= max
  );
}

/**
 * True iff `value` is exactly what statusResponseSchema accepts (Zod's
 * strip mode ignores unknown keys, so extra keys are fine here too — the
 * equivalence test covers that case explicitly).
 */
export function isValidStatusResponse(value: unknown): value is StatusResponse {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const record = value as Record<string, unknown>;

  if (record.open === true) {
    return isIntWithin(record.closeMinutes, 1, 750);
  }
  if (record.open === false) {
    return (
      isIntWithin(record.opensInMinutes, 1, 6000) &&
      typeof record.dayLabel === "string" &&
      DAY_LABELS.has(record.dayLabel)
    );
  }
  return false;
}
