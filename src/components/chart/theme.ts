import type {
  EChartsOption,
  XAXisComponentOption,
  YAXisComponentOption,
} from "echarts";
import { formatJalali } from "../../lib/date";
import { toPersianDigits } from "../../lib/digits";

export type ChartTheme = {
  backgroundColor: string;
  color: string[];
  textStyle: { color: string; fontFamily: string };
  /**
   * The tooltip is a DOM node ECharts styles inline, so it ignores both the
   * page stylesheet and the theme-level `textStyle` — the font has to be
   * declared here or it falls back to the browser's sans-serif.
   */
  tooltip: { textStyle: { fontFamily: string } };
  categoryAxis: {
    axisLine: { lineStyle: { color: string } };
    axisLabel: { color: string };
    splitLine: { lineStyle: { color: string } };
  };
  valueAxis: {
    axisLine: { lineStyle: { color: string } };
    axisLabel: { color: string };
    splitLine: { lineStyle: { color: string } };
  };
};

/**
 * Astryx design tokens are authored as `light-dark(<light>, <dark>)`. Custom
 * properties keep that function unresolved in their computed value, and ECharts
 * paints on a canvas where only concrete colors are accepted — an unresolved
 * token silently renders as an opaque default fill. Resolving it means letting
 * the browser collapse the function: assign it to a real color property on a
 * throwaway probe inside the chart host so the host's `color-scheme` picks the
 * branch, then read back the computed color.
 */
function resolveTokenValue(source: Element, value: string): string {
  if (!value.startsWith("light-dark(")) {
    return value;
  }

  const probe = document.createElement("span");
  probe.style.setProperty("color", value);
  source.append(probe);
  const resolved = getComputedStyle(probe).color.trim();
  probe.remove();

  return resolved || value;
}

function readToken(source: Element, name: string): string {
  const value = getComputedStyle(source).getPropertyValue(name).trim();
  const rootValue = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();

  return resolveTokenValue(source, value || rootValue || `var(${name})`);
}

export function deriveChartTheme(source: Element): ChartTheme {
  const surface = readToken(source, "--color-background-surface");
  const primaryText = readToken(source, "--color-text-primary");
  const secondaryText = readToken(source, "--color-text-secondary");
  const border = readToken(source, "--color-border");
  const fontFamily = readToken(source, "--font-family-body");

  return {
    backgroundColor: surface,
    color: [
      readToken(source, "--color-accent"),
      readToken(source, "--color-success"),
      readToken(source, "--color-warning"),
      readToken(source, "--color-error"),
    ],
    textStyle: { color: primaryText, fontFamily },
    tooltip: { textStyle: { fontFamily } },
    categoryAxis: {
      axisLine: { lineStyle: { color: border } },
      axisLabel: { color: secondaryText },
      splitLine: { lineStyle: { color: border } },
    },
    valueAxis: {
      axisLine: { lineStyle: { color: border } },
      axisLabel: { color: secondaryText },
      splitLine: { lineStyle: { color: border } },
    },
  };
}

function formatChartLabel(value: string | number): string {
  const label = String(value);

  if (/^\d{4}-\d{2}-\d{2}$/.test(label)) {
    return formatJalali(label);
  }

  return toPersianDigits(label);
}

function formatXAxis(axis: XAXisComponentOption): XAXisComponentOption {
  return {
    ...axis,
    axisLabel: {
      ...axis.axisLabel,
      formatter: formatChartLabel,
    },
  };
}

function formatYAxis(axis: YAXisComponentOption): YAXisComponentOption {
  return {
    ...axis,
    axisLabel: {
      ...axis.axisLabel,
      formatter: formatChartLabel,
    },
  };
}

function formatAxes<T>(
  axes: T | T[] | undefined,
  formatter: (axis: T) => T,
): T | T[] | undefined {
  if (axes === undefined) {
    return undefined;
  }

  return Array.isArray(axes) ? axes.map(formatter) : formatter(axes);
}

/** Shape of the entries ECharts hands to a tooltip formatter callback. */
type TooltipEntry = {
  axisValueLabel?: string;
  marker?: string;
  name?: string;
  seriesName?: string;
  value?: unknown;
};

function formatTooltipValue(value: unknown): string {
  if (typeof value === "number" || typeof value === "string") {
    return formatChartLabel(value);
  }

  if (Array.isArray(value)) {
    return value.map(formatTooltipValue).join(" · ");
  }

  return "";
}

/**
 * Axis labels alone are not enough: tooltips render their own header and values
 * straight from the raw data, which would leak Gregorian dates and Latin digits
 * into an otherwise Jalali, Persian-digit dashboard.
 */
function formatTooltip(params: TooltipEntry | TooltipEntry[]): string {
  const entries = Array.isArray(params) ? params : [params];
  const header = entries[0]?.axisValueLabel ?? entries[0]?.name ?? "";
  const rows = entries.map((entry) => {
    const label = entry.seriesName ?? entry.name ?? "";
    return `${entry.marker ?? ""}${label}: ${formatTooltipValue(entry.value)}`;
  });

  return [header ? formatChartLabel(header) : "", ...rows]
    .filter((row) => row !== "")
    .join("<br/>");
}

type TooltipOption = NonNullable<EChartsOption["tooltip"]>;

function withTooltipFormatter(tooltip: TooltipOption): TooltipOption {
  if (Array.isArray(tooltip)) {
    return tooltip.map((entry) => ({
      ...entry,
      formatter: entry.formatter ?? formatTooltip,
    })) as TooltipOption;
  }

  return {
    ...tooltip,
    formatter: tooltip.formatter ?? formatTooltip,
  } as TooltipOption;
}

export function withPersianChartFormatters(
  option: EChartsOption,
): EChartsOption {
  return {
    ...option,
    tooltip: option.tooltip ? withTooltipFormatter(option.tooltip) : undefined,
    xAxis: formatAxes(option.xAxis, formatXAxis),
    yAxis: formatAxes(option.yAxis, formatYAxis),
  };
}
