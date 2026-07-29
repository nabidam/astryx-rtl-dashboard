import { describe, expect, it } from "vitest";
import { deriveChartTheme } from "./theme";

declare global {
  interface ImportMeta {
    glob<T = unknown>(
      pattern: string,
      options: {
        eager: boolean;
        import: "default";
        query: string;
      },
    ): Record<string, T>;
  }
}

const sourceFiles = import.meta.glob<string>("../../**/*.{ts,tsx,css,json}", {
  eager: true,
  import: "default",
  query: "?raw",
});

const hardcodedColorLiteral = /#[0-9a-fA-F]{3,8}\b|\b(?:rgb|rgba|hsl|hsla)\(/;

describe("chart theme re-branding", () => {
  it("derives the current Astryx accent token at runtime", () => {
    const host = document.createElement("div");
    document.body.append(host);
    document.documentElement.style.setProperty(
      "--color-accent",
      "brand-accent-a",
    );

    expect(deriveChartTheme(host).color[0]).toBe("brand-accent-a");

    document.documentElement.style.setProperty(
      "--color-accent",
      "brand-accent-b",
    );

    expect(deriveChartTheme(host).color[0]).toBe("brand-accent-b");
    host.remove();
  });

  it("keeps source files free of hardcoded color literals", () => {
    const offenders = Object.entries(sourceFiles)
      .filter(([, source]) => hardcodedColorLiteral.test(source))
      .map(([path]) => path)
      .sort();

    expect(offenders).toEqual([]);
  });
});
