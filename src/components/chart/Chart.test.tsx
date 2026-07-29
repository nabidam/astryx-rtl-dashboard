import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { EChartsOption, EChartsType } from "echarts";
import { themeStore } from "../../app/shell/themeStore";
import { Chart, chartRuntime } from "./Chart";
import type { ChartTheme } from "./theme";

const dispose = vi.fn();
const resize = vi.fn();
const setOption = vi.fn();
const observers: ResizeObserverMock[] = [];
const init = vi.fn<
  (dom: HTMLElement, theme: unknown, options: unknown) => EChartsType
>(() => ({ dispose, resize, setOption }) as unknown as EChartsType);

class ResizeObserverMock {
  disconnect = vi.fn();
  observe = vi.fn();
  unobserve = vi.fn();

  constructor(readonly callback: ResizeObserverCallback) {
    observers.push(this);
  }
}

const option: EChartsOption = {
  series: [{ type: "line", data: [1, 2] }],
  xAxis: { type: "category", data: ["2026-03-20"] },
  yAxis: { type: "value" },
};

function buildOption(theme: ChartTheme): EChartsOption {
  return { ...option, backgroundColor: theme.backgroundColor };
}

function renderChart() {
  return render(<Chart buildOption={buildOption} data={[1, 2]} />);
}

describe("Chart", () => {
  beforeEach(() => {
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
    document.documentElement.style.setProperty(
      "--color-background-surface",
      "surface-a",
    );
    document.documentElement.style.setProperty(
      "--color-text-primary",
      "text-primary",
    );
    document.documentElement.style.setProperty(
      "--color-text-secondary",
      "text-secondary",
    );
    document.documentElement.style.setProperty("--color-border", "border");
    document.documentElement.style.setProperty("--color-accent", "accent");
    document.documentElement.style.setProperty("--color-success", "success");
    document.documentElement.style.setProperty("--color-warning", "warning");
    document.documentElement.style.setProperty("--color-error", "error");
    themeStore.setState({ mode: "light" });
    chartRuntime.load = vi.fn().mockResolvedValue({ init });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    dispose.mockClear();
    resize.mockClear();
    setOption.mockClear();
    init.mockClear();
    observers.length = 0;
  });

  it("disposes the instance when unmounted", async () => {
    const view = renderChart();

    await waitFor(() => {
      expect(init).toHaveBeenCalledTimes(1);
    });
    view.unmount();

    expect(dispose).toHaveBeenCalledTimes(1);
  });

  it("recreates the chart with freshly derived tokens when the mode changes", async () => {
    renderChart();
    await waitFor(() => {
      expect(init).toHaveBeenCalledTimes(1);
    });

    document.documentElement.style.setProperty(
      "--color-background-surface",
      "surface-b",
    );
    act(() => {
      themeStore.setState({ mode: "dark" });
    });

    await waitFor(() => {
      expect(init).toHaveBeenCalledTimes(2);
    });
    expect(dispose).toHaveBeenCalledTimes(1);
    expect(init.mock.calls[1]?.[1]).toMatchObject({
      backgroundColor: "surface-b",
    });
  });

  it("resizes the ECharts instance when its host resizes", async () => {
    renderChart();
    await waitFor(() => {
      expect(init).toHaveBeenCalledTimes(1);
    });
    const observer = observers.at(0);
    if (!observer) {
      throw new Error("ناظر تغییر اندازه نمودار ایجاد نشد");
    }

    observer.callback([], observer as unknown as ResizeObserver);

    expect(resize).toHaveBeenCalledTimes(1);
  });

  it("applies the option again when chart data changes", async () => {
    const view = render(<Chart buildOption={buildOption} data={[1]} />);
    await waitFor(() => {
      expect(setOption).toHaveBeenCalledTimes(1);
    });

    view.rerender(<Chart buildOption={buildOption} data={[1, 2]} />);

    await waitFor(() => {
      expect(setOption).toHaveBeenCalledTimes(2);
    });
    expect(setOption.mock.calls[1]?.[1]).toEqual({ notMerge: true });
  });

  it("shows an inline Persian retry action when ECharts cannot load", async () => {
    chartRuntime.load = vi
      .fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({ init });
    renderChart();

    expect(await screen.findByText("بارگذاری نمودار ناموفق بود.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "تلاش دوباره" }));

    await waitFor(() => {
      expect(init).toHaveBeenCalledTimes(1);
    });
  });

  it("uses an Astryx empty state instead of initializing a blank chart", async () => {
    render(
      <Chart
        buildOption={() => ({ series: [{ type: "line", data: [] }] })}
        data={[]}
      />,
    );

    expect(
      await screen.findByText("داده‌ای برای نمایش وجود ندارد"),
    ).toBeTruthy();
    expect(init).not.toHaveBeenCalled();
  });

  it("formats Jalali axis dates and Persian digits before setting the option", async () => {
    renderChart();

    await waitFor(() => {
      expect(setOption).toHaveBeenCalledTimes(1);
    });
    const configuredOption = setOption.mock.calls[0]?.[0] as EChartsOption;
    const xAxis = configuredOption.xAxis as NonNullable<EChartsOption["xAxis"]>;
    const axis = Array.isArray(xAxis) ? xAxis[0] : xAxis;
    const formatter = axis.axisLabel?.formatter;

    expect(typeof formatter).toBe("function");
    if (typeof formatter !== "function") {
      throw new Error("قالب‌بند محور نمودار تنظیم نشد");
    }
    const formatAxisLabel = formatter as unknown as (
      value: string,
      index: number,
    ) => string;
    expect(formatAxisLabel("2026-03-20", 0)).toBe("۱۴۰۴/۱۲/۲۹");
    expect(formatAxisLabel("1404", 0)).toBe("۱۴۰۴");
    expect(setOption.mock.calls[0]?.[1]).toEqual({ notMerge: true });
  });
});
