/**
 * openHours.ts — pure predicate for "is the clinic open right now?"
 *
 * The algorithm is the reference's (پلتفرم/assets/js/home.js, mirrored in
 * main.js): the instant is expressed in Asia/Tehran, the clinic is open
 * Saturday–Thursday from 07:30 to 20:00, and closed all of Friday. Minutes
 * since midnight: 07:30 = 450, 20:00 = 1200 (home.js boundary comparison).
 *
 * Kept pure (injectable clock) so unit tests can pin the boundaries.
 * CLAUDE.md §5: ISO-8601 Gregorian canonical; the wall-clock conversion here
 * happens only at this render/API boundary, never inside components.
 */

import { siteConfig } from "@/config/site.config";

/** Minutes since local midnight in Asia/Tehran for the given instant. */
export function tehranMinutes(now: Date): { day: number; minutes: number } {
  // Reference trick: format in the target zone, then re-parse the wall clock.
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: siteConfig.openHours.timeZone,
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(now);

  const get = (type: string): string | undefined =>
    parts.find((part) => part.type === type)?.value;

  const weekday = get("weekday");
  const hourRaw = get("hour");
  const minute = get("minute");
  if (weekday === undefined || hourRaw === undefined || minute === undefined) {
    throw new Error(`Could not resolve Asia/Tehran wall clock for ${now.toISOString()}`);
  }

  const hour = hourRaw === "24" ? 0 : Number.parseInt(hourRaw, 10);
  const day = WEEKDAY_INDEX[weekday.toLowerCase()];
  if (day === undefined) throw new Error(`Unknown weekday: ${weekday}`);

  return { day, minutes: hour * 60 + Number.parseInt(minute, 10) };
}

/** JS Date.getDay() value for each Intl weekday short name (en-US locale). */
const WEEKDAY_INDEX: Readonly<Record<string, number>> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

/** True when the clinic is open at the given instant, per the reference rules. */
export function isOpenNow(now: Date = new Date()): boolean {
  const { day, minutes } = tehranMinutes(now);
  const { closedDay, openDays, openMinutes, closeMinutes } = siteConfig.openHours;
  if (day === closedDay) return false;
  if (!openDays.includes(day)) return false;
  return minutes >= openMinutes && minutes < closeMinutes;
}

/**
 * The reference's countdown model: when the clinic is closed, show when it
 * opens next. home.js computes "today at 07:30" if today is an open day and
 * not yet past closing, else the next open day at 07:30 (status.opens:
 * "بازگشایی {day} ساعت ۷:۳۰"). Returns the next-open instant, or null when
 * the clinic is currently open (nothing to count down to).
 */
export function nextOpen(now: Date = new Date()): Date | null {
  if (isOpenNow(now)) return null;

  const { day, minutes } = tehranMinutes(now);
  const { closedDay, openDays, openMinutes } = siteConfig.openHours;

  // Same-day opening: an open day whose 07:30 has not arrived yet.
  if (day !== closedDay && openDays.includes(day) && minutes < openMinutes) {
    return atOpenTime(now, 0);
  }
  // Otherwise walk forward day by day (≤ 7 iterations, so this always lands).
  for (let step = 1; step <= 7; step += 1) {
    const candidate = atOpenTime(now, step);
    const candidateDay = (day + step) % 7;
    if (candidateDay !== closedDay && openDays.includes(candidateDay)) return candidate;
  }
  return null;
}

/**
 * The live-admissions status model, mirrored from home.js (lines 15–29).
 *
 * Pure and clock-injectable so the Route Handler (P1-13) runs no business
 * logic — it only serializes this — and unit tests can pin the boundaries.
 * The reference's exact rules:
 *   - open: `day !== 5 && minutes ∈ [450, 1200)` → count down to 20:00.
 *   - closed: say when it reopens. Label = "today" when today is an open day
 *     before 07:30; else "Saturday" only for Thursday after close; otherwise
 *     "tomorrow" (Friday → Saturday, every other open day → the next day).
 */
export type StatusDayLabel = "today" | "tomorrow" | "saturday";

export type StatusSnapshot =
  | { open: true; closeMinutes: number }
  | { open: false; opensInMinutes: number; dayLabel: StatusDayLabel };

export function statusFor(now: Date = new Date()): StatusSnapshot {
  const { day, minutes } = tehranMinutes(now);

  if (isOpenNow(now)) {
    return { open: true, closeMinutes: 1200 - minutes };
  }

  const label: StatusDayLabel =
    minutes < 450 && day !== 5
      ? "today"
      : (day === 4 && minutes >= 1200) || day === 5
        ? day === 5
          ? "tomorrow"
          : "saturday"
        : "tomorrow";

  const next = nextOpen(now);
  // nextOpen() always lands within ≤ 7 days (openDays covers six of seven).
  const opensInMinutes = next === null ? 0 : Math.max(1, Math.round((next.getTime() - now.getTime()) / 60_000));

  return { open: false, opensInMinutes, dayLabel: label };
}
function atOpenTime(now: Date, step: number): Date {
  const { year, month, day } = tehranDate(now);
  // The target wall clock expressed as if it were UTC, then corrected by the
  // zone offset to get the real instant. Iran has no DST, so the offset is a
  // stable +210 min — but it is still derived from Intl, never hardcoded.
  const wallAsUtc = Date.UTC(year, month - 1, day + step, 7, 30, 0, 0);
  return new Date(wallAsUtc - timeZoneOffsetMinutes(now) * 60_000);
}

/** The Asia/Tehran calendar date of `now` as plain numbers. */
function tehranDate(now: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: siteConfig.openHours.timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(now);

  const get = (type: string): number =>
    Number.parseInt(parts.find((part) => part.type === type)?.value ?? "NaN", 10);

  const year = get("year");
  const month = get("month");
  const day = get("day");
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    throw new Error(`Could not resolve Asia/Tehran date for ${now.toISOString()}`);
  }
  return { year, month, day };
}

/** UTC offset (minutes) of Asia/Tehran at the given instant. */
function timeZoneOffsetMinutes(instant: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: siteConfig.openHours.timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  }).formatToParts(instant);

  const get = (type: string): number =>
    Number.parseInt(parts.find((part) => part.type === type)?.value ?? "NaN", 10);

  const wallAsUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") === 24 ? 0 : get("hour"),
    get("minute"),
    get("second"),
  );
  return Math.round((wallAsUtc - instant.getTime()) / 60_000);
}
