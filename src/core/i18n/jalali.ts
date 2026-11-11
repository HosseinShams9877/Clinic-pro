/**
 * jalali.ts — Gregorian ↔ Jalali date conversion (LOCALIZATION_AND_CALENDAR.md
 * §3: "ISO-8601 Gregorian canonical; Jalali only at the render boundary").
 *
 * Everything stored in this project is ISO-8601 Gregorian. A Jalali date only
 * exists at the moment a Gregorian date is rendered to a Persian reader.
 *
 * Algorithm: the Jalali calendar walks years of 365/366 days from a fixed
 * anchor — the start of Farvardin 1399, which the reference itself pins to
 * the Gregorian year 2020 ("از سال ۱۳۹۹" in index.html, "Since 2020" in
 * i18n.js). Leap years follow the 33-year cycle whose 8 leap positions give
 * 1399 (cycle position 13) a 30-day Esfand, which is the well-known behaviour
 * of the calendar in this era (verified against Nowruz 1400/1402/1403/1405).
 *
 * No calendar library is added; this is ~40 lines and fully unit-tested
 * against the Nowruz anchors.
 */

export interface JalaliDate {
  /** Jalali year, e.g. 1399. */
  jy: number;
  /** Month 1–12 (1 = Farvardin). */
  jm: number;
  /** Day 1–31. */
  jd: number;
}

/** The founding year the reference states, in both calendars. */
export const JALALI_FOUNDING_YEAR = 1399;
export const GREGORIAN_FOUNDING_YEAR = 2020;

const MS_PER_DAY = 86_400_000;
/** Days since the Unix epoch at the start of 1399/1/1 (2020-03-20 UTC). */
const JALALI_EPOCH_DAYS = Date.UTC(2020, 2, 20) / MS_PER_DAY;

/** Cycle positions in the 33-year Jalali cycle that are leap years. */
const LEAP_POSITIONS = new Set([1, 5, 9, 13, 17, 22, 26, 30]);

/** Month lengths of a common Jalali year; a leap year gives Esfand 30 days. */
const COMMON_MONTH_LENGTHS = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29] as const;

function isJalaliLeapYear(jy: number): boolean {
  return LEAP_POSITIONS.has(((jy % 33) + 33) % 33);
}

function monthLengths(jy: number): readonly number[] {
  return isJalaliLeapYear(jy)
    ? [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 30]
    : COMMON_MONTH_LENGTHS;
}

/** Days since the Unix epoch (UTC midnight) of a Gregorian date. */
function gregorianToDays(gy: number, gm: number, gd: number): number {
  return Date.UTC(gy, gm - 1, gd) / MS_PER_DAY;
}

/** A Jalali leap year has 366 days, otherwise 365. */
export function jalaliYearLength(jy: number): number {
  return isJalaliLeapYear(jy) ? 366 : 365;
}

/**
 * Convert a Gregorian date to a Jalali date. Inputs are proleptic Gregorian
 * calendar values (month 1–12, day 1–31) in the civil calendar — no timezone
 * conversion happens here, by design.
 */
export function gregorianToJalali(gy: number, gm: number, gd: number): JalaliDate {
  let remaining = gregorianToDays(gy, gm, gd) - JALALI_EPOCH_DAYS;

  let jy = JALALI_FOUNDING_YEAR;
  if (remaining >= 0) {
    for (;;) {
      const length = jalaliYearLength(jy);
      if (remaining < length) break;
      remaining -= length;
      jy += 1;
    }
  } else {
    while (remaining < 0) {
      jy -= 1;
      remaining += jalaliYearLength(jy);
    }
  }

  const lengths = monthLengths(jy);
  let jm = 12;
  for (let index = 0; index < 12; index += 1) {
    const length = lengths[index];
    if (length === undefined) break;
    if (remaining < length) {
      jm = index + 1;
      break;
    }
    remaining -= length;
  }

  return { jy, jm, jd: remaining + 1 };
}

/** Convert a Jalali date back to a proleptic Gregorian date. */
export function jalaliToGregorian(jy: number, jm: number, jd: number): {
  gy: number;
  gm: number;
  gd: number;
} {
  let days = JALALI_EPOCH_DAYS;
  if (jy >= JALALI_FOUNDING_YEAR) {
    for (let year = JALALI_FOUNDING_YEAR; year < jy; year += 1) {
      days += jalaliYearLength(year);
    }
  } else {
    for (let year = JALALI_FOUNDING_YEAR; year > jy; year -= 1) {
      days -= jalaliYearLength(year - 1);
    }
  }

  const lengths = monthLengths(jy);
  for (let index = 0; index < jm - 1; index += 1) {
    const length = lengths[index];
    if (length !== undefined) days += length;
  }
  days += jd - 1;

  const utc = new Date(days * MS_PER_DAY);
  return {
    gy: utc.getUTCFullYear(),
    gm: utc.getUTCMonth() + 1,
    gd: utc.getUTCDate(),
  };
}

/**
 * The Jalali year a Gregorian date falls in — the render boundary's most
 * common question (e.g. "founded in 1399").
 */
export function toJalaliYear(gy: number, gm: number, gd: number): number {
  return gregorianToJalali(gy, gm, gd).jy;
}
