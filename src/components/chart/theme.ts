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
  textStyle: { color: string };
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

function readToken(source: Element, name: string): string {
  const value = getComputedStyle(source).getPropertyValue(name).trim();
  const rootValue = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();

  return value || rootValue || `var(${name})`;
}

export function deriveChartTheme(source: Element): ChartTheme {
  const surface = readToken(source, "--color-background-surface");
  const primaryText = readToken(source, "--color-text-primary");
  const secondaryText = readToken(source, "--color-text-secondary");
  const border = readToken(source, "--color-border");

  return {
    backgroundColor: surface,
    color: [
      readToken(source, "--color-accent"),
      readToken(source, "--color-success"),
      readToken(source, "--color-warning"),
      readToken(source, "--color-error"),
    ],
    textStyle: { color: primaryText },
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

export function withPersianChartFormatters(
  option: EChartsOption,
): EChartsOption {
  return {
    ...option,
    xAxis: formatAxes(option.xAxis, formatXAxis),
    yAxis: formatAxes(option.yAxis, formatYAxis),
  };
}
