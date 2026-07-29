import { describe, expect, it } from "vitest";
import { toLatinDigits, toPersianDigits } from "./digits";

describe("digit conversion", () => {
  it("converts Latin digits to Persian digits", () => {
    expect(toPersianDigits("1404")).toBe("۱۴۰۴");
    expect(toPersianDigits("١٤٠٤")).toBe("۱۴۰۴");
  });

  it("normalizes mixed Persian and Arabic-Indic input to Latin digits", () => {
    expect(toLatinDigits("۱۴۰4-٠٥")).toBe("1404-05");
  });
});
