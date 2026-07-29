import type { ChartTheme } from "../../components/chart/theme";
import type { User } from "../users/usersStore";

export type OverviewChartSeries = {
  registrations: Array<{ date: string; count: number }>;
  roles: Array<{ label: string; count: number }>;
};

type OverviewChartOption = {
  backgroundColor: string;
  tooltip: { trigger: "axis" };
  grid: { containLabel: boolean };
  xAxis: { type: "category"; data: string[] };
  yAxis: { type: "value"; minInterval: number };
  series: Array<{
    name: string;
    type: "line" | "bar";
    data: number[];
    smooth?: boolean;
  }>;
};

const roleLabels = {
  admin: "مدیر",
  editor: "ویرایشگر",
  viewer: "بیننده",
} as const;

function registrationDate(user: User): string {
  return user.createdAt.slice(0, 10);
}

export function buildOverviewChartSeries(users: User[]): OverviewChartSeries {
  const registrationsByDate = new Map<string, number>();

  for (const user of users) {
    const date = registrationDate(user);
    registrationsByDate.set(date, (registrationsByDate.get(date) ?? 0) + 1);
  }

  return {
    registrations: [...registrationsByDate.entries()]
      .sort(([first], [second]) => first.localeCompare(second))
      .map(([date, count]) => ({ date, count })),
    roles:
      users.length === 0
        ? []
        : (Object.keys(roleLabels) as Array<keyof typeof roleLabels>).map(
            (role) => ({
              label: roleLabels[role],
              count: users.filter((user) => user.role === role).length,
            }),
          ),
  };
}

export function buildRegistrationChartOption(
  series: OverviewChartSeries,
  theme: ChartTheme,
): OverviewChartOption {
  return {
    backgroundColor: theme.backgroundColor,
    tooltip: { trigger: "axis" },
    grid: { containLabel: true },
    xAxis: {
      type: "category",
      data: series.registrations.map((point) => point.date),
    },
    yAxis: { type: "value", minInterval: 1 },
    series: [
      {
        name: "کاربران جدید",
        type: "line",
        smooth: true,
        data: series.registrations.map((point) => point.count),
      },
    ],
  };
}

export function buildRoleChartOption(
  series: OverviewChartSeries,
  theme: ChartTheme,
): OverviewChartOption {
  return {
    backgroundColor: theme.backgroundColor,
    tooltip: { trigger: "axis" },
    grid: { containLabel: true },
    xAxis: {
      type: "category",
      data: series.roles.map((role) => role.label),
    },
    yAxis: { type: "value", minInterval: 1 },
    series: [
      {
        name: "کاربران",
        type: "bar",
        data: series.roles.map((role) => role.count),
      },
    ],
  };
}
