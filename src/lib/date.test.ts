import { describe, expect, it } from "vitest";
import {
  formatJalali,
  isValidJalaliDate,
  jalaliToIso,
  type JalaliDate,
} from "./date";
import { toPersianDigits } from "./digits";

describe("Jalali date helpers", () => {
  it("formats Gregorian ISO dates as Persian-digit Jalali dates", () => {
    expect(formatJalali("2025-03-21")).toBe("۱۴۰۴/۰۱/۰۱");
  });

  it("round-trips valid ISO and Jalali dates without calendar drift", () => {
    const dates: JalaliDate[] = [
      { year: 1402, month: 12, day: 29 },
      { year: 1403, month: 1, day: 1 },
      { year: 1403, month: 12, day: 30 },
    ];

    for (const date of dates) {
      const iso = jalaliToIso(date);
      expect(formatJalali(iso)).toBe(
        toPersianDigits(
          `${String(date.year)}/${date.month.toString().padStart(2, "0")}/${date.day
            .toString()
            .padStart(2, "0")}`,
        ),
      );
    }
  });

  it("honors Esfand leap-day boundaries and rejects impossible dates", () => {
    expect(isValidJalaliDate({ year: 1402, month: 12, day: 29 })).toBe(true);
    expect(isValidJalaliDate({ year: 1402, month: 12, day: 30 })).toBe(false);
    expect(isValidJalaliDate({ year: 1403, month: 12, day: 30 })).toBe(true);
    expect(() => jalaliToIso({ year: 1402, month: 12, day: 30 })).toThrow(
      RangeError,
    );
  });
});
