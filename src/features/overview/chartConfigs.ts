import type { ChartOption } from "../../components/chart/Chart";
import type { ChartTheme } from "../../components/chart/theme";
import { formatJalali, isValidIsoDate } from "../../lib/date";
import { toLatinDigits } from "../../lib/digits";
import type { User } from "../users/usersStore";

export type OverviewChartSeries = {
  registrations: Array<{ date: string; count: number }>;
  roles: Array<{ label: string; count: number }>;
  statuses: Array<{ label: string; count: number }>;
  cumulative: Array<{ date: string; total: number }>;
  birthDecades: Array<{ label: string; count: number }>;
};

const roleLabels = {
  admin: "مدیر",
  editor: "ویرایشگر",
  viewer: "بیننده",
} as const;

const statusLabels = {
  active: "فعال",
  inactive: "غیرفعال",
} as const;

/** Charts sit inside Astryx cards, which already paint the surface token. */
const TRANSPARENT = "transparent";

function registrationDate(user: User): string {
  return user.createdAt.slice(0, 10);
}

/** Birth years are stored as ISO dates but must be read as Jalali decades. */
function birthDecadeLabel(user: User): string {
  if (!isValidIsoDate(user.birthDate)) {
    return "نامشخص";
  }

  const jalaliYear = Number(
    toLatinDigits(formatJalali(user.birthDate).slice(0, 4)),
  );

  return `دههٔ ${String(Math.floor(jalaliYear / 10) * 10)}`;
}

function countBy<TKey extends string>(
  users: User[],
  select: (user: User) => TKey,
): Map<TKey, number> {
  const counts = new Map<TKey, number>();

  for (const user of users) {
    const key = select(user);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return counts;
}

export function buildOverviewChartSeries(users: User[]): OverviewChartSeries {
  const registrationsByDate = countBy(users, registrationDate);
  const registrations = [...registrationsByDate.entries()]
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([date, count]) => ({ date, count }));

  let runningTotal = 0;
  const cumulative = registrations.map((point) => {
    runningTotal += point.count;
    return { date: point.date, total: runningTotal };
  });

  const birthDecades = [...countBy(users, birthDecadeLabel).entries()]
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([label, count]) => ({ label, count }));

  const hasUsers = users.length > 0;

  return {
    registrations,
    cumulative,
    birthDecades,
    roles: hasUsers
      ? (Object.keys(roleLabels) as Array<keyof typeof roleLabels>).map(
          (role) => ({
            label: roleLabels[role],
            count: users.filter((user) => user.role === role).length,
          }),
        )
      : [],
    statuses: hasUsers
      ? (Object.keys(statusLabels) as Array<keyof typeof statusLabels>).map(
          (status) => ({
            label: statusLabels[status],
            count: users.filter((user) => user.status === status).length,
          }),
        )
      : [],
  };
}

export function buildRegistrationChartOption(
  series: OverviewChartSeries,
  theme: ChartTheme,
): ChartOption {
  return {
    backgroundColor: TRANSPARENT,
    tooltip: { trigger: "axis" },
    grid: { bottom: 8, containLabel: true, left: 8, right: 16, top: 16 },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: series.registrations.map((point) => point.date),
    },
    yAxis: { type: "value", minInterval: 1 },
    series: [
      {
        name: "کاربران جدید",
        type: "line",
        smooth: true,
        showSymbol: series.registrations.length < 12,
        areaStyle: { opacity: 0.12 },
        itemStyle: { color: theme.color[0] },
        lineStyle: { color: theme.color[0], width: 2 },
        data: series.registrations.map((point) => point.count),
      },
    ],
  };
}

export function buildRoleChartOption(
  series: OverviewChartSeries,
  theme: ChartTheme,
): ChartOption {
  return {
    backgroundColor: TRANSPARENT,
    tooltip: { trigger: "axis" },
    grid: { bottom: 8, containLabel: true, left: 8, right: 16, top: 16 },
    xAxis: {
      type: "category",
      data: series.roles.map((role) => role.label),
    },
    yAxis: { type: "value", minInterval: 1 },
    series: [
      {
        name: "کاربران",
        type: "bar",
        barMaxWidth: 32,
        itemStyle: { borderRadius: [4, 4, 0, 0], color: theme.color[0] },
        data: series.roles.map((role) => role.count),
      },
    ],
  };
}

/**
 * Status split as a donut: two mutually exclusive slices read faster than bars,
 * and the ring keeps the centre free for the legend.
 */
export function buildStatusChartOption(
  series: OverviewChartSeries,
  theme: ChartTheme,
): ChartOption {
  return {
    backgroundColor: TRANSPARENT,
    tooltip: { trigger: "item" },
    legend: { bottom: 0, textStyle: { color: theme.textStyle.color } },
    series: [
      {
        name: "وضعیت کاربران",
        type: "pie",
        radius: ["52%", "78%"],
        center: ["50%", "44%"],
        avoidLabelOverlap: true,
        itemStyle: {
          borderColor: theme.categoryAxis.splitLine.lineStyle.color,
          borderWidth: 2,
        },
        label: { show: false },
        data: series.statuses.map((status) => ({
          name: status.label,
          value: status.count,
          // Success/warning carry the meaning of the status itself, which the
          // generic categorical palette order would not.
          itemStyle: {
            color:
              status.label === statusLabels.active
                ? theme.color[1]
                : theme.color[2],
          },
        })),
      },
    ],
  };
}

export function buildCumulativeChartOption(
  series: OverviewChartSeries,
  theme: ChartTheme,
): ChartOption {
  return {
    backgroundColor: TRANSPARENT,
    tooltip: { trigger: "axis" },
    grid: { bottom: 8, containLabel: true, left: 8, right: 16, top: 16 },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: series.cumulative.map((point) => point.date),
    },
    yAxis: { type: "value", minInterval: 1 },
    series: [
      {
        name: "مجموع کاربران",
        type: "line",
        step: "end",
        symbol: "none",
        areaStyle: { opacity: 0.18 },
        lineStyle: { color: theme.color[1], width: 2 },
        itemStyle: { color: theme.color[1] },
        data: series.cumulative.map((point) => point.total),
      },
    ],
  };
}

/** Horizontal bars keep the decade labels readable in an RTL layout. */
export function buildBirthDecadeChartOption(
  series: OverviewChartSeries,
  theme: ChartTheme,
): ChartOption {
  return {
    backgroundColor: TRANSPARENT,
    tooltip: { trigger: "axis" },
    grid: { bottom: 8, containLabel: true, left: 8, right: 24, top: 16 },
    xAxis: { type: "value", minInterval: 1 },
    yAxis: {
      type: "category",
      inverse: true,
      data: series.birthDecades.map((decade) => decade.label),
    },
    series: [
      {
        name: "کاربران",
        type: "bar",
        barMaxWidth: 20,
        itemStyle: { borderRadius: [0, 4, 4, 0], color: theme.color[2] },
        data: series.birthDecades.map((decade) => decade.count),
      },
    ],
  };
}
