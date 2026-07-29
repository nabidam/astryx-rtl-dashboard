import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Skeleton } from "@astryxdesign/core/Skeleton";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import type { EChartsOption, EChartsType } from "echarts";
import { useThemeStore } from "../../app/shell/themeStore";
import {
  deriveChartTheme,
  type ChartTheme,
  withPersianChartFormatters,
} from "./theme";

type EChartsModule = Pick<typeof import("echarts"), "init">;

type ChartProps<TSeries> = {
  buildOption: (theme: ChartTheme) => EChartsOption;
  data: TSeries;
};

export const chartRuntime = {
  load: (): Promise<EChartsModule> => import("echarts"),
};

function hasEmptySeries(series: EChartsOption["series"]): boolean {
  if (series === undefined) {
    return true;
  }

  const entries = Array.isArray(series) ? series : [series];
  return (
    entries.length === 0 ||
    entries.every((entry) => {
      const data = entry.data;
      return Array.isArray(data) && data.length === 0;
    })
  );
}

export function Chart<TSeries>({ buildOption, data }: ChartProps<TSeries>) {
  const mode = useThemeStore((state) => state.mode);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [chartTheme, setChartTheme] = useState<ChartTheme | null>(null);
  const [module, setModule] = useState<EChartsModule | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const chartRef = useRef<EChartsType | null>(null);
  const lastAppliedOptionRef = useRef<EChartsOption | null>(null);

  const setChartHost = useCallback((node: HTMLElement | null) => {
    setHost(node);
    setChartTheme(node ? deriveChartTheme(node) : null);
  }, []);

  useEffect(() => {
    let isCurrent = true;

    void chartRuntime.load().then(
      (loadedModule) => {
        if (isCurrent) {
          setModule(loadedModule);
        }
      },
      () => {
        if (isCurrent) {
          setLoadFailed(true);
        }
      },
    );

    return () => {
      isCurrent = false;
    };
  }, [loadAttempt]);

  const option = useMemo(() => {
    void data;
    if (!chartTheme) {
      return null;
    }

    return withPersianChartFormatters(buildOption(chartTheme));
  }, [buildOption, chartTheme, data]);

  const isEmpty = option ? hasEmptySeries(option.series) : false;

  useEffect(() => {
    if (!module || !host || !option || isEmpty) {
      return undefined;
    }

    const chart = module.init(host, chartTheme, {
      renderer: "canvas",
      useDirtyRect: true,
    });
    chartRef.current = chart;
    chart.setOption(option, { notMerge: true });
    lastAppliedOptionRef.current = option;

    const observer = new ResizeObserver(() => {
      chart.resize();
    });
    observer.observe(host);

    return () => {
      observer.disconnect();
      chartRef.current = null;
      lastAppliedOptionRef.current = null;
      chart.dispose();
    };
  }, [chartTheme, host, isEmpty, module, option]);

  useEffect(() => {
    if (!option || isEmpty || lastAppliedOptionRef.current === option) {
      return;
    }

    chartRef.current?.setOption(option, { notMerge: true });
    lastAppliedOptionRef.current = option;
  }, [data, isEmpty, option]);

  if (loadFailed) {
    return (
      <VStack gap={2} minHeight="var(--spacing-12)" vAlign="center">
        <Text type="body">بارگذاری نمودار ناموفق بود.</Text>
        <Button
          label="تلاش دوباره"
          variant="secondary"
          onClick={() => {
            setLoadFailed(false);
            setLoadAttempt((attempt) => attempt + 1);
          }}
        />
      </VStack>
    );
  }

  return (
    <VStack
      key={mode}
      ref={setChartHost}
      aria-label="نمودار"
      minHeight="var(--spacing-12)"
      width="100%"
    >
      {!module || !chartTheme ? (
        <Skeleton height="var(--spacing-12)" radius={3} width="100%" />
      ) : isEmpty ? (
        <EmptyState
          isCompact
          title="داده‌ای برای نمایش وجود ندارد"
          description="با ثبت داده، نمودار در این بخش نمایش داده می‌شود."
        />
      ) : null}
    </VStack>
  );
}
