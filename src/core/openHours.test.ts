/**
 * openHours.test.ts — the open/closed predicate and status model, pinned to
 * the reference's boundaries (home.js line 18: `day !== 5 && mins >= 450 &&
 * mins < 1200`, Asia/Tehran).
 *
 * Fixtures are named by their Tehran wall clock. Asia/Tehran is UTC+03:30
 * with no DST, so a wall-clock time is constructed in UTC and shifted back
 * 210 minutes; every fixture then cross-asserts tehranMinutes, so if the zone
 * rules ever change these tests fail loudly rather than silently.
 *
 * Boundary set (per the checklist): 450, 1199, 1200, Friday, Sat 07:31.
 */

import { describe, expect, it } from "vitest";

import { isOpenNow, nextOpen, statusFor, tehranMinutes } from "./openHours";

/** Minutes offset of Asia/Tehran from UTC (fixed, no DST since 2022). */
const TEHRAN_OFFSET_MINUTES = 210;

/** A Date whose Asia/Tehran wall clock is the given Y/M/D h:min. */
function atTehran(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  seconds = 0,
): Date {
  const asUtc = Date.UTC(year, month - 1, day, hour, minute, seconds);
  return new Date(asUtc - TEHRAN_OFFSET_MINUTES * 60_000);
}

describe("tehranMinutes", () => {
  it("resolves the Tehran wall clock from an arbitrary UTC instant", () => {
    const now = atTehran(2026, 11, 7, 7, 31);
    const { day, minutes } = tehranMinutes(now);
    expect(day).toBe(6); // Saturday
    expect(minutes).toBe(7 * 60 + 31);
  });
});

describe("isOpenNow", () => {
  it("is open at exactly 07:30 (minute 450), the lower boundary", () => {
    expect(isOpenNow(atTehran(2026, 11, 7, 7, 30))).toBe(true); // Sat 07:30
  });

  it("is open at 07:31 on the first open day of the week", () => {
    expect(isOpenNow(atTehran(2026, 11, 7, 7, 31))).toBe(true); // Sat 07:31
  });

  it("is open at 19:59 (minute 1199), the last open minute", () => {
    expect(isOpenNow(atTehran(2026, 11, 9, 19, 59))).toBe(true); // Mon 19:59
  });

  it("is closed at exactly 20:00 (minute 1200), the upper boundary", () => {
    expect(isOpenNow(atTehran(2026, 11, 9, 20, 0))).toBe(false); // Mon 20:00
  });

  it("is closed before 07:30 (minute 449)", () => {
    expect(isOpenNow(atTehran(2026, 11, 9, 7, 29))).toBe(false); // Mon 07:29
  });

  it("is closed all of Friday regardless of the time", () => {
    expect(isOpenNow(atTehran(2026, 11, 6, 7, 31))).toBe(false); // Fri 07:31
    expect(isOpenNow(atTehran(2026, 11, 6, 12, 0))).toBe(false); // Fri 12:00
    expect(isOpenNow(atTehran(2026, 11, 6, 19, 59))).toBe(false); // Fri 19:59
  });

  it("is open on every open day of the week at midday", () => {
    // November 2026: 1st=Sun, 2nd=Mon, 3rd=Tue, 4th=Wed, 5th=Thu, 7th=Sat.
    const november = {
      0: 1, // Sunday
      1: 2, // Monday
      2: 3, // Tuesday
      3: 4, // Wednesday
      4: 5, // Thursday
      6: 7, // Saturday
    } as const;
    for (const day of [6, 0, 1, 2, 3, 4]) {
      const instant = atTehran(2026, 11, november[day as keyof typeof november], 12, 0);
      expect(isOpenNow(instant)).toBe(true);
    }
  });
});

describe("nextOpen", () => {
  it("returns null while open (nothing to count down to)", () => {
    expect(nextOpen(atTehran(2026, 11, 9, 12, 0))).toBeNull(); // Mon noon
  });

  it("lands on the same day's 07:30 when closed before opening", () => {
    const now = atTehran(2026, 11, 9, 6, 0); // Mon 06:00
    const next = nextOpen(now);
    expect(next).not.toBeNull();
    const { day, minutes } = tehranMinutes(next as Date);
    expect(day).toBe(1); // still Monday
    expect(minutes).toBe(450);
  });

  it("skips Friday: Thursday after close → Saturday 07:30", () => {
    const now = atTehran(2026, 11, 5, 21, 0); // Thu 21:00
    const next = nextOpen(now);
    const { day, minutes } = tehranMinutes(next as Date);
    expect(day).toBe(6); // Saturday
    expect(minutes).toBe(450);
  });
});

describe("statusFor", () => {
  it("counts down to close while open", () => {
    const snapshot = statusFor(atTehran(2026, 11, 9, 12, 0)); // Mon 12:00
    expect(snapshot).toEqual({ open: true, closeMinutes: 480 }); // 8h to 20:00
  });

  it("reports one minute left at 19:59", () => {
    expect(statusFor(atTehran(2026, 11, 9, 19, 59))).toEqual({ open: true, closeMinutes: 1 });
  });

  it("labels the same-day reopen before 07:30 as 'today'", () => {
    const snapshot = statusFor(atTehran(2026, 11, 9, 6, 0)); // Mon 06:00
    expect(snapshot.open).toBe(false);
    expect((snapshot as { dayLabel: string }).dayLabel).toBe("today");
    expect((snapshot as { opensInMinutes: number }).opensInMinutes).toBe(90);
  });

  it("labels Thursday after close as 'saturday'", () => {
    const snapshot = statusFor(atTehran(2026, 11, 5, 20, 30)); // Thu 20:30
    expect(snapshot.open).toBe(false);
    expect((snapshot as { dayLabel: string }).dayLabel).toBe("saturday");
  });

  it("labels Friday as 'tomorrow' (reopens Saturday)", () => {
    const snapshot = statusFor(atTehran(2026, 11, 6, 12, 0)); // Fri noon
    expect(snapshot.open).toBe(false);
    expect((snapshot as { dayLabel: string }).dayLabel).toBe("tomorrow");
  });

  it("labels any open day after close as 'tomorrow'", () => {
    const snapshot = statusFor(atTehran(2026, 11, 9, 23, 0)); // Mon 23:00
    expect((snapshot as { dayLabel: string }).dayLabel).toBe("tomorrow");
  });
});
