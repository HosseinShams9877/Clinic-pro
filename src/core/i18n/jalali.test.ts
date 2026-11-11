import { describe, expect, it } from "vitest";

import {
  gregorianToJalali,
  jalaliToGregorian,
  jalaliYearLength,
  toJalaliYear,
} from "./jalali";

describe("Nowruz anchors (gregorianToJalali)", () => {
  // Independently known Nowruz dates, not derived from this implementation.
  it("starts year 1399 on 2020-03-20", () => {
    expect(gregorianToJalali(2020, 3, 20)).toEqual({ jy: 1399, jm: 1, jd: 1 });
  });

  it("starts year 1400 on 2021-03-21 (1399 has a 30-day Esfand)", () => {
    expect(gregorianToJalali(2021, 3, 21)).toEqual({ jy: 1400, jm: 1, jd: 1 });
    expect(jalaliYearLength(1399)).toBe(366);
  });

  it("starts year 1402 on 2023-03-21", () => {
    expect(gregorianToJalali(2023, 3, 21)).toEqual({ jy: 1402, jm: 1, jd: 1 });
  });

  it("starts year 1403 on 2024-03-20", () => {
    expect(gregorianToJalali(2024, 3, 20)).toEqual({ jy: 1403, jm: 1, jd: 1 });
    expect(jalaliYearLength(1403)).toBe(366);
  });

  it("starts year 1405 on 2026-03-21", () => {
    expect(gregorianToJalali(2026, 3, 21)).toEqual({ jy: 1405, jm: 1, jd: 1 });
  });
});

describe("dates inside a Jalali year", () => {
  it("places New Year's Day 2025 in Dey 1403", () => {
    // 1403 is a leap year: 1 Dey = 2024-12-21 (Yalda, 30 Azar, is 2024-12-20),
    // so 2025-01-01 is Dey 12, one day later than in the common year 1402.
    expect(gregorianToJalali(2025, 1, 1)).toEqual({ jy: 1403, jm: 10, jd: 12 });
  });

  it("places the day before Nowruz 1399 in the previous year", () => {
    expect(gregorianToJalali(2020, 3, 19)).toEqual({ jy: 1398, jm: 12, jd: 29 });
    expect(jalaliYearLength(1398)).toBe(365);
  });

  it("places the last day of leap-year Esfand correctly", () => {
    expect(gregorianToJalali(2021, 3, 20)).toEqual({ jy: 1399, jm: 12, jd: 30 });
  });
});

describe("toJalaliYear", () => {
  it("maps the reference founding pair 1399 <-> 2020", () => {
    expect(toJalaliYear(2020, 3, 20)).toBe(1399);
  });

  it("falls into the previous Jalali year before Nowruz", () => {
    expect(toJalaliYear(2020, 1, 1)).toBe(1398);
    expect(toJalaliYear(2024, 1, 1)).toBe(1402);
  });
});

describe("jalaliToGregorian", () => {
  it("converts 1399/1/1 back to 2020-03-20", () => {
    expect(jalaliToGregorian(1399, 1, 1)).toEqual({ gy: 2020, gm: 3, gd: 20 });
  });

  it("converts 1403/10/12 back to 2025-01-01", () => {
    expect(jalaliToGregorian(1403, 10, 12)).toEqual({ gy: 2025, gm: 1, gd: 1 });
  });

  it("round-trips every 5th day across 2019–2030", () => {
    const start = Date.UTC(2019, 0, 1) / 86_400_000;
    const end = Date.UTC(2030, 11, 31) / 86_400_000;
    for (let days = start; days <= end; days += 5) {
      const utc = new Date(days * 86_400_000);
      const g = {
        gy: utc.getUTCFullYear(),
        gm: utc.getUTCMonth() + 1,
        gd: utc.getUTCDate(),
      };
      const j = gregorianToJalali(g.gy, g.gm, g.gd);
      expect(jalaliToGregorian(j.jy, j.jm, j.jd)).toEqual(g);
    }
  });

  it("round-trips the last day of every Jalali year 1395–1410", () => {
    for (let jy = 1395; jy <= 1410; jy += 1) {
      const lastDay = jalaliYearLength(jy) === 366 ? 30 : 29;
      const g = jalaliToGregorian(jy, 12, lastDay);
      expect(gregorianToJalali(g.gy, g.gm, g.gd)).toEqual({ jy, jm: 12, jd: lastDay });
    }
  });
});
