import { describe, expect, it } from "vitest";
import { isolate } from "./bidi";

describe("bidi isolation", () => {
  it("wraps Latin text in Unicode directional isolates", () => {
    expect(isolate("person@example.com")).toBe(
      "\u2068person@example.com\u2069",
    );
  });
});
