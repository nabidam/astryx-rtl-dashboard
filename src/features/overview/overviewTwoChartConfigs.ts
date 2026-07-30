import type { ChartOption } from "../../components/chart/Chart";
import type { ChartTheme } from "../../components/chart/theme";

/** Tiles already paint their own surface; the canvas must not repaint it. */
const TRANSPARENT = "transparent";

export function buildOverviewTwoBalanceOption(
  values: number[],
  theme: ChartTheme,
): ChartOption {
  const peakValue = Math.max(...values, 0);

  return {
    animationDuration: 250,
    backgroundColor: TRANSPARENT,
    grid: { bottom: 0, containLabel: false, left: 0, right: 0, top: 0 },
    tooltip: { trigger: "axis" },
    xAxis: {
      axisLabel: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
      data: values.map((_, index) => String(index + 1)),
      type: "category",
    },
    yAxis: {
      axisLabel: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      type: "value",
    },
    series: [
      {
        barCategoryGap: "28%",
        data: values.map((value) => ({
          itemStyle: {
            color:
              value === peakValue
                ? theme.color[0]
                : theme.categoryAxis.axisLine.lineStyle.color,
          },
          value,
        })),
        type: "bar",
      },
    ],
  };
}

export function buildOverviewTwoRingOption(
  score: number,
  theme: ChartTheme,
): ChartOption {
  const boundedScore = Math.max(0, Math.min(10, score));

  return {
    animationDuration: 300,
    backgroundColor: TRANSPARENT,
    series: [
      {
        clockwise: true,
        data: [
          { itemStyle: { color: theme.color[0] }, value: boundedScore },
          {
            itemStyle: {
              color: theme.valueAxis.splitLine.lineStyle.color,
            },
            value: 10 - boundedScore,
          },
        ],
        emphasis: { disabled: true },
        label: { show: false },
        radius: ["72%", "84%"],
        silent: true,
        startAngle: 220,
        type: "pie",
      },
    ],
  };
}
