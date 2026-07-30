import { describe, expect, it } from "vitest";
import { deriveChartTheme, withPersianChartFormatters } from "./theme";

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

  it("renders tooltips with Jalali dates and Persian digits", () => {
    const option = withPersianChartFormatters({
      tooltip: { trigger: "axis" },
      series: [{ type: "line", data: [4] }],
    });
    const tooltip = option.tooltip;
    const formatter =
      tooltip && !Array.isArray(tooltip) ? tooltip.formatter : undefined;

    expect(typeof formatter).toBe("function");
    if (typeof formatter !== "function") {
      throw new Error("قالب‌بند راهنمای نمودار تنظیم نشد");
    }
    const formatTooltip = formatter as unknown as (
      params: Array<{
        axisValueLabel: string;
        seriesName: string;
        value: number;
      }>,
    ) => string;

    expect(
      formatTooltip([
        {
          axisValueLabel: "2025-01-11",
          seriesName: "مجموع کاربران",
          value: 4,
        },
      ]),
    ).toBe("۱۴۰۳/۱۰/۲۲<br/>مجموع کاربران: ۴");
  });

  it("keeps source files free of hardcoded color literals", () => {
    const offenders = Object.entries(sourceFiles)
      .filter(([, source]) => hardcodedColorLiteral.test(source))
      .map(([path]) => path)
      .sort();

    expect(offenders).toEqual([]);
  });
});
