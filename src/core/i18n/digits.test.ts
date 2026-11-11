import { describe, expect, it } from "vitest";

import { toAsciiDigits, toLocaleDigits } from "./digits";

describe("toLocaleDigits", () => {
  it("renders ASCII digits as Persian digits for fa", () => {
    expect(toLocaleDigits("fa", "7")).toBe("۷");
    expect(toLocaleDigits("fa", 7)).toBe("۷");
    expect(toLocaleDigits("fa", "60+")).toBe("۶۰+");
    expect(toLocaleDigits("fa", "07:30")).toBe("۰۷:۳۰");
  });

  it("renders ASCII digits as Arabic-Indic digits for ar", () => {
    expect(toLocaleDigits("ar", "7")).toBe("٧");
    expect(toLocaleDigits("ar", "07:30")).toBe("٠٧:٣٠");
    expect(toLocaleDigits("ar", "60+")).toBe("٦٠+");
  });

  it("keeps ASCII digits for en", () => {
    expect(toLocaleDigits("en", "07:30")).toBe("07:30");
    expect(toLocaleDigits("en", 1399)).toBe("1399");
  });

  it("passes non-digit characters through untouched", () => {
    expect(toLocaleDigits("fa", "Saturday – Thursday")).toBe("Saturday – Thursday");
    expect(toLocaleDigits("fa", "+98 31 5515 4000")).toBe("+۹۸ ۳۱ ۵۵۱۵ ۴۰۰۰");
  });
});

describe("toAsciiDigits", () => {
  it("normalizes Persian digits to ASCII", () => {
    expect(toAsciiDigits("۷")).toBe("7");
    expect(toAsciiDigits("۱۳۹۹")).toBe("1399");
  });

  it("normalizes Arabic-Indic digits to ASCII", () => {
    expect(toAsciiDigits("٧")).toBe("7");
    expect(toAsciiDigits("٠١٢٣٤٥٦٧٨٩")).toBe("0123456789");
  });

  it("leaves already-ASCII and non-digit text untouched", () => {
    expect(toAsciiDigits("07:30")).toBe("07:30");
    expect(toAsciiDigits("Snapper")).toBe("Snapper");
  });

  it("round-trips every digit through both scripts", () => {
    for (let n = 0; n < 1000; n += 7) {
      const fa = toLocaleDigits("fa", n);
      const ar = toLocaleDigits("ar", n);
      expect(toAsciiDigits(fa)).toBe(String(n));
      expect(toAsciiDigits(ar)).toBe(String(n));
      expect(toLocaleDigits("en", toAsciiDigits(fa))).toBe(String(n));
    }
  });
});
