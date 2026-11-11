/**
 * statusEquivalence.test.ts — the P2 item 9 proof that the dependency-free
 * client guard agrees with the Zod contract.
 *
 * statusClientGuard.ts exists so the LiveStatus island can reject a malformed
 * /api/status response without shipping the Zod runtime to the browser. This
 * test is what makes that safe: it asserts the guard's verdict matches
 * statusResponseSchema.safeParse().success on every valid payload and every
 * malformed mutant. If the API contract changes and only one side is updated,
 * a case here flips and the suite fails.
 */

import { describe, expect, it } from "vitest";

import { isValidStatusResponse } from "./statusClientGuard";
import { statusResponseSchema } from "./statusSchema";

/** Valid payloads across the contract's full range corners. */
const VALID: unknown[] = [
  { open: true, closeMinutes: 1 },
  { open: true, closeMinutes: 750 },
  { open: true, closeMinutes: 480 },
  { open: false, opensInMinutes: 1, dayLabel: "today" },
  { open: false, opensInMinutes: 6000, dayLabel: "tomorrow" },
  { open: false, opensInMinutes: 90, dayLabel: "saturday" },
  // Zod's strip mode ignores unknown keys; the guard must too.
  { open: true, closeMinutes: 480, extra: "ignored" },
  { open: false, opensInMinutes: 90, dayLabel: "today", extra: 7 },
];

/** Every way a payload can be wrong (one mutation per case). */
const MUTANTS: unknown[] = [
  null,
  undefined,
  42,
  "open",
  [],
  [{}],
  {},
  { open: 1, closeMinutes: 480 },
  { open: "true", closeMinutes: 480 },
  { open: true },
  { open: true, closeMinutes: 0 },
  { open: true, closeMinutes: 751 },
  { open: true, closeMinutes: 480.5 },
  { open: true, closeMinutes: -10 },
  { open: true, closeMinutes: Number.NaN },
  { open: true, closeMinutes: "480" },
  { open: true, opensInMinutes: 90, dayLabel: "today" },
  { open: false },
  { open: false, opensInMinutes: 90 },
  { open: false, dayLabel: "today" },
  { open: false, opensInMinutes: 0, dayLabel: "today" },
  { open: false, opensInMinutes: 6001, dayLabel: "today" },
  { open: false, opensInMinutes: 90.5, dayLabel: "today" },
  { open: false, opensInMinutes: 90, dayLabel: "Sunday" },
  { open: false, opensInMinutes: 90, dayLabel: "TODAY" },
  { open: false, opensInMinutes: 90, dayLabel: 3 },
  { open: false, opensInMinutes: null, dayLabel: "today" },
];

describe("the client guard mirrors the Zod schema", () => {
  it("accepts exactly the valid payloads", () => {
    for (const payload of VALID) {
      const zod = statusResponseSchema.safeParse(payload);
      expect(zod.success, `zod should accept ${JSON.stringify(payload)}`).toBe(true);
      expect(isValidStatusResponse(payload), `guard should accept ${JSON.stringify(payload)}`).toBe(true);
    }
  });

  it("rejects exactly the malformed payloads", () => {
    for (const payload of MUTANTS) {
      const zod = statusResponseSchema.safeParse(payload);
      expect(zod.success, `zod should reject ${JSON.stringify(payload)}`).toBe(false);
      expect(isValidStatusResponse(payload), `guard should reject ${JSON.stringify(payload)}`).toBe(false);
    }
  });

  it("narrows to the response type (the fetch contract is static)", () => {
    const sample: unknown = { open: false, opensInMinutes: 95, dayLabel: "tomorrow" };
    if (isValidStatusResponse(sample)) {
      // type-level check: the narrowed value must be assignable to the
      // schema's inferred type.
      const _typed: import("./statusSchema").StatusResponse = sample;
      expect(_typed.open).toBe(false);
    } else {
      expect.unreachable("a known-valid payload must narrow");
    }
  });
});
