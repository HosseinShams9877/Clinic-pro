/**
 * statusQueries.ts — React Query wiring for the live admissions badge (P1-13).
 *
 * The ONLY client-side server-state need in the implemented scope: the
 * home-page open/closed badge, polled every 60 s while the tab is visible
 * (the reference does the same client-side every 30 s; the server-side route
 * makes it correct for no-JS/SSR too, with the initial state server-rendered).
 *
 * The Route Handler validates the payload with the Zod contract in
 * schemas/statusSchema.ts ("Zod at every API edge", CLAUDE.md §5). This
 * module is imported by the LiveStatus client island, so it stays
 * dependency-free: a malformed response is rejected here by the hand-rolled
 * mirror in schemas/statusClientGuard.ts (equivalence with the Zod schema is
 * proven by statusEquivalence.test.ts). Keeping Zod server-side stops its
 * ~15.5 KB gzip runtime from being shipped to the browser (P2 item 9).
 *
 * Also owns the trilingual countdown formatting (home.js T table, lines 9–11):
 *   open   → "Closes in {h}h {m}m" / "{m} min"
 *   closed → "Opens {d} at 07:30", {d} ∈ today / tomorrow / Saturday
 * Digits are localized per locale exactly like home.js's n().
 */

import { toLocaleDigits } from "@/core/i18n/digits";
import type { Locale } from "@/core/i18n/locales";
import type { StatusDayLabel, StatusSnapshot } from "@/core/openHours";
import { t } from "@/modules/i18n/messages";
import { isValidStatusResponse } from "@/modules/services/schemas/statusClientGuard";
import type { StatusResponse } from "@/modules/services/schemas/statusSchema";

export const STATUS_PATH = "/api/status" as const;

/** React Query key for the live status (per-locale, though the data is not). */
export const statusQueryKey = (locale: Locale) => ["status", locale] as const;

/** Client fetcher: validates the response and refuses anything malformed. */
export async function fetchStatus(locale: Locale): Promise<StatusResponse> {
  const response = await fetch(STATUS_PATH);
  if (!response.ok) {
    throw new Error(`status: unexpected ${response.status} ${response.statusText}`);
  }
  const parsed: unknown = await response.json();
  if (!isValidStatusResponse(parsed)) {
    throw new Error("status: malformed response");
  }
  return parsed;
}

/** The API payload for a pure snapshot — the Route Handler serializes this. */
export function statusPayload(snapshot: StatusSnapshot): StatusResponse {
  return snapshot.open ? { open: true, closeMinutes: snapshot.closeMinutes } : snapshot;
}

const DAY_LABEL_KEY: Readonly<Record<StatusDayLabel, "status.today" | "status.tomorrow" | "status.sat">> = {
  today: "status.today",
  tomorrow: "status.tomorrow",
  saturday: "status.sat",
};

/**
 * The two badge lines in the given locale: the bold title (open/closed) and
 * the countdown sub-line. Pure — safe on both server and client.
 */
export function statusText(locale: Locale, snapshot: StatusSnapshot): { title: string; sub: string } {
  const digits = (value: number) => toLocaleDigits(locale, value);

  if (snapshot.open) {
    const remaining = snapshot.closeMinutes;
    const hours = Math.floor(remaining / 60);
    const minutes = remaining % 60;
    const sub =
      hours > 0
        ? t(locale, "status.left").replace("{h}", digits(hours)).replace("{m}", digits(minutes))
        : t(locale, "status.leftM").replace("{m}", digits(minutes));
    return { title: t(locale, "status.open"), sub };
  }

  const sub = t(locale, "status.opens").replace("{d}", t(locale, DAY_LABEL_KEY[snapshot.dayLabel]));
  return { title: t(locale, "status.closed"), sub };
}
