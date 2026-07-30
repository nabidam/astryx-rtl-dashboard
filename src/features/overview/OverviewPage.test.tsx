import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { InternationalizationProvider } from "@astryxdesign/core/i18n";
import { Theme, defineTheme } from "@astryxdesign/core/theme";
import { neutralTheme } from "@astryxdesign/theme-neutral/built";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { chartRuntime } from "../../components/chart/Chart";
import type { ChartTheme } from "../../components/chart/theme";
import faMessages from "../../locale/fa.json";
import { fixtures } from "../users/fixtures";
import { usersStore } from "../users/usersStore";
import {
  buildOverviewChartSeries,
  buildRegistrationChartOption,
} from "./chartConfigs";
import { OverviewPage } from "./OverviewPage";
import { buildOverviewStatCards } from "./statCards";

const testTheme = defineTheme({
  name: "overview-test",
  extends: neutralTheme,
});

const chartTheme: ChartTheme = {
  backgroundColor: "var(--color-background-surface)",
  color: [],
  textStyle: {
    color: "var(--color-text-primary)",
    fontFamily: "var(--font-family-body)",
  },
  tooltip: { textStyle: { fontFamily: "var(--font-family-body)" } },
  categoryAxis: {
    axisLine: { lineStyle: { color: "var(--color-border)" } },
    axisLabel: { color: "var(--color-text-secondary)" },
    splitLine: { lineStyle: { color: "var(--color-border)" } },
  },
  valueAxis: {
    axisLine: { lineStyle: { color: "var(--color-border)" } },
    axisLabel: { color: "var(--color-text-secondary)" },
    splitLine: { lineStyle: { color: "var(--color-border)" } },
  },
};

function renderOverviewPage() {
  return render(
    <Theme theme={testTheme} mode="light">
      <InternationalizationProvider locale="fa" messages={{ fa: faMessages }}>
        <OverviewPage />
      </InternationalizationProvider>
    </Theme>,
  );
}

describe("OverviewPage", () => {
  beforeEach(() => {
    usersStore.setState({ users: fixtures.map((user) => ({ ...user })) });
    chartRuntime.load = vi.fn(() => new Promise<never>(() => undefined));
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("derives Persian-digit stat cards from users in the store", () => {
    renderOverviewPage();

    expect(screen.getByText("کل کاربران")).toBeTruthy();
    expect(screen.getByText("کاربران فعال")).toBeTruthy();
    expect(screen.getByText("مدیران")).toBeTruthy();
    expect(screen.getAllByText("۶").length).toBeGreaterThan(0);
    expect(screen.getAllByText("۵").length).toBeGreaterThan(0);
    expect(screen.getAllByText("۱").length).toBeGreaterThan(0);
  });

  it("summarizes the activation rate and the newest users", () => {
    renderOverviewPage();

    expect(screen.getAllByText("نرخ کاربران فعال").length).toBeGreaterThan(0);
    expect(screen.getByText("۸۳٪")).toBeTruthy();
    expect(screen.getByText("تازه‌ترین کاربران")).toBeTruthy();
    expect(screen.getAllByText("فعال").length).toBeGreaterThan(0);
  });

  it("shows zero-valued cards and a muted no-data note when there are no users", () => {
    usersStore.setState({ users: [] });
    renderOverviewPage();

    expect(screen.getAllByText("۰")).toHaveLength(3);
    expect(screen.getAllByText("داده‌ای برای نمایش وجود ندارد")).toHaveLength(
      4,
    );
    expect(screen.getByText("۰٪")).toBeTruthy();
  });

  it("shows skeleton placeholders while the ECharts chunk is loading", async () => {
    renderOverviewPage();

    await waitFor(() => {
      expect(document.querySelectorAll(".astryx-skeleton")).toHaveLength(5);
    });
  });

  it("provides dated chart series for the wrapper's Jalali axis formatter", () => {
    const series = buildOverviewChartSeries(fixtures);
    const option = buildRegistrationChartOption(series, chartTheme);

    expect(buildOverviewStatCards(fixtures).map((card) => card.value)).toEqual([
      6, 5, 1,
    ]);
    expect(option.xAxis).toMatchObject({
      data: [
        "2025-01-03",
        "2025-01-05",
        "2025-01-08",
        "2025-01-11",
        "2025-01-14",
        "2025-01-17",
      ],
    });
  });
});
