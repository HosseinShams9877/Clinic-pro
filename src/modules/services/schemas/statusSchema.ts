/**
 * statusSchema.ts — the Zod contract for GET /api/status (P2 item 9, 2026-11-10).
 *
 * Zod stays server-side by design. It used to live in queries/statusQueries.ts,
 * which the LiveStatus client island imports — so the whole Zod runtime
 * (~15.5 KB gzip, chunk 700) was shipped to the browser just to re-parse one
 * tiny JSON object. The API *edge* is the Route Handler: this module validates
 * there, and the client gets a hand-rolled mirror (statusClientGuard.ts) that
 * agrees with this schema by proof, not by convention — statusEquivalence.test
 * asserts the two agree on every valid payload and every malformed mutant.
 * CLAUDE.md §5 ("Zod at every API edge") is kept and strengthened: the edge
 * itself now actually runs the parse.
 */

import { z } from "zod";

export const statusResponseSchema = z.discriminatedUnion("open", [
  z.object({
    open: z.literal(true),
    /** Minutes left until 20:00 close (1–750). */
    closeMinutes: z.number().int().min(1).max(750),
  }),
  z.object({
    open: z.literal(false),
    /** Minutes until the next 07:30 opening (1–6000, ≤ 7 days). */
    opensInMinutes: z.number().int().min(1).max(6000),
    /** Which reference day-label template applies. */
    dayLabel: z.enum(["today", "tomorrow", "saturday"]),
  }),
]);

export type StatusResponse = z.infer<typeof statusResponseSchema>;
