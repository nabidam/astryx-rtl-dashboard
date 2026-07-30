import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type UIEvent,
} from "react";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Grid, GridSpan } from "@astryxdesign/core/Grid";
import { HStack } from "@astryxdesign/core/HStack";
import { Icon } from "@astryxdesign/core/Icon";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Popover } from "@astryxdesign/core/Popover";
import {
  SegmentedControl,
  SegmentedControlItem,
} from "@astryxdesign/core/SegmentedControl";
import { Text, Heading } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { Chart } from "../../components/chart/Chart";
import { toPersianDigits } from "../../lib/digits";
import { useNavigate } from "react-router";
import { useUsersStore, type User } from "../users/usersStore";
import {
  buildOverviewTwoBalanceOption,
  buildOverviewTwoRingOption,
} from "./overviewTwoChartConfigs";
import "./OverviewTwoPage.css";

type BalanceRange = "۷روز" | "۳۰روز" | "۵ماه" | "۱۲ماه";

type DashboardModel = {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  adminUsers: number;
  focusPercent: number;
  focusHours: number;
  reviewTotal: number;
  completedTasks: number;
  taskTarget: number;
  workHours: string;
  usagePercent: number;
  monthlyCost: number;
  balanceScoreValue: number;
  balanceScore: string;
  balanceBars: number[];
};

const rangeWindow: Record<BalanceRange, number> = {
  "۷روز": 2,
  "۳۰روز": 4,
  "۵ماه": 6,
  "۱۲ماه": 10,
};

const featureSlides = [
  {
    title: "کاربران فعال در یک نگاه",
    description: "وضعیت کاربران فعال را بدون خروج از نمای کلی بررسی کنید.",
  },
  {
    title: "داده‌های تازه، تصمیم‌های سریع‌تر",
    description: "کارت‌ها با هر تغییر در فهرست کاربران دوباره محاسبه می‌شوند.",
  },
  {
    title: "زیبایی‌شناسی، کاربردپذیری را جلو می‌اندازد",
    description: "کاربران، سادگی و وضوح را پیش از هر چیز به خاطر می‌سپارند.",
  },
  {
    title: "تمرکز روی سیگنال‌های مهم",
    description: "اطلاعات پرتکرار را در چند سطح فشرده و قابل اسکن نگه دارید.",
  },
  {
    title: "یک نمای کلی، چند مسیر اقدام",
    description: "از هر کارت به صفحه‌ای بروید که ادامهٔ کار را ممکن می‌کند.",
  },
] as const;

function formatDecimal(value: number): string {
  return toPersianDigits(value.toFixed(1).replace(".", "٫"));
}

function buildBalanceBars(users: User[], range: BalanceRange): number[] {
  const recentUsers = [...users]
    .sort((first, second) => first.createdAt.localeCompare(second.createdAt))
    .slice(-rangeWindow[range]);
  const bars = [0, 0, 0, 0, 0];

  recentUsers.forEach((_, index) => {
    const bucket = Math.min(4, Math.floor((index * 5) / recentUsers.length));
    bars[bucket] += 1;
  });

  return bars;
}

function buildDashboardModel(
  users: User[],
  range: BalanceRange,
): DashboardModel {
  const totalUsers = users.length;
  const activeUsers = users.filter((user) => user.status === "active").length;
  const inactiveUsers = totalUsers - activeUsers;
  const adminUsers = users.filter((user) => user.role === "admin").length;
  const activeRatio = totalUsers === 0 ? 0 : activeUsers / totalUsers;
  const focusPercent = Math.round(activeRatio * 100);
  const completedTasks = activeUsers * 2;
  const taskTarget = Math.max(1, totalUsers * 4);

  const balanceScoreValue = 6 + activeRatio * 4;

  return {
    totalUsers,
    activeUsers,
    inactiveUsers,
    adminUsers,
    focusPercent,
    focusHours: Math.max(1, activeUsers + adminUsers),
    reviewTotal: inactiveUsers,
    completedTasks,
    taskTarget,
    workHours: formatDecimal(activeUsers * 1.1 + adminUsers * 0.8),
    usagePercent: Math.min(100, totalUsers * 8 + inactiveUsers * 4),
    monthlyCost: totalUsers * 3 + adminUsers,
    balanceScore: formatDecimal(balanceScoreValue),
    balanceScoreValue,
    balanceBars: buildBalanceBars(users, range),
  };
}

function useWideLayout() {
  const [isWide, setIsWide] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 64rem)");
    const update = () => {
      setIsWide(query.matches);
    };

    update();
    query.addEventListener("change", update);

    return () => {
      query.removeEventListener("change", update);
    };
  }, []);

  return isWide;
}

function Tile({
  children,
  minHeight = "calc(var(--spacing-12) * 3)",
  variant,
  className,
}: {
  children: ReactNode;
  minHeight?: string;
  variant?: "blue" | "gray";
  className?: string;
}) {
  return (
    <Card
      className={className}
      minHeight={minHeight}
      padding={3}
      variant={variant ?? "default"}
    >
      {children}
    </Card>
  );
}

function TileHeading({ children }: { children: ReactNode }) {
  return (
    <Text display="block" size="sm" type="label">
      {children}
    </Text>
  );
}

function UserActionsPopover({
  label,
  onCreate,
  onOpen,
}: {
  label: string;
  onCreate: () => void;
  onOpen: () => void;
}) {
  return (
    <Popover
      content={
        <VStack gap={1}>
          <Button
            label="مشاهدهٔ همهٔ کاربران"
            onClick={onOpen}
            size="sm"
            variant="ghost"
            width="100%"
          />
          <Button
            label="افزودن کاربر"
            onClick={onCreate}
            size="sm"
            variant="ghost"
            width="100%"
          />
        </VStack>
      }
      label={label}
      placement="below"
    >
      <IconButton
        icon={<Icon icon="moreHorizontal" />}
        label={label}
        size="sm"
        tooltip={label}
        variant="ghost"
      />
    </Popover>
  );
}

function FocusTile({
  model,
  onOpen,
  onCreate,
}: {
  model: DashboardModel;
  onCreate: () => void;
  onOpen: () => void;
}) {
  return (
    <Tile variant="blue">
      <VStack gap={2} height="100%" vAlign="between">
        <HStack hAlign="between" vAlign="start">
          <TileHeading>تمرکز امروز</TileHeading>
          <UserActionsPopover
            label="گزینه‌های تمرکز امروز"
            onCreate={onCreate}
            onOpen={onOpen}
          />
        </HStack>
        <HStack hAlign="between" vAlign="end">
          <Text type="display-1">
            {toPersianDigits(String(model.focusPercent) + "٪")}
          </Text>
          <Text color="primary" size="sm" type="supporting">
            ↗ {toPersianDigits(String(model.focusHours) + " ساعت")}
          </Text>
        </HStack>
      </VStack>
    </Tile>
  );
}

function InvoicesTile({
  model,
  onOpen,
}: {
  model: DashboardModel;
  onOpen: () => void;
}) {
  return (
    <Tile minHeight="calc(var(--spacing-12) * 6)">
      <VStack gap={3} height="100%" vAlign="between">
        <HStack hAlign="between" vAlign="start">
          <TileHeading>کاربران نیازمند بررسی</TileHeading>
          <IconButton
            icon={<Icon icon="arrowUp" />}
            label="مشاهدهٔ کاربران نیازمند بررسی"
            onClick={onOpen}
            size="sm"
            tooltip="مشاهدهٔ کاربران"
            variant="ghost"
          />
        </HStack>
        <VStack gap={2}>
          <HStack hAlign="between" vAlign="end">
            <Text type="display-1">
              {toPersianDigits(String(model.reviewTotal))}
            </Text>
            <Text size="sm" type="supporting">
              ↗ {toPersianDigits(String(model.totalUsers) + " کاربر")}
            </Text>
          </HStack>
          <VStack gap={1}>
            <VStack aria-hidden className="overview-two-bar-track">
              <VStack
                aria-hidden
                className="overview-two-bar-fill"
                data-fill={
                  model.totalUsers === 0
                    ? "0"
                    : String(
                        Math.min(
                          5,
                          Math.ceil((model.reviewTotal / model.totalUsers) * 5),
                        ),
                      )
                }
              />
            </VStack>
            <HStack hAlign="between">
              <Text size="sm" type="supporting">
                جمع
              </Text>
              <Text size="sm" type="supporting">
                {toPersianDigits(
                  String(model.reviewTotal) +
                    " / " +
                    String(model.totalUsers || 1),
                )}
              </Text>
            </HStack>
          </VStack>
        </VStack>
      </VStack>
    </Tile>
  );
}

function BalanceTile({
  model,
  range,
  onRangeChange,
}: {
  model: DashboardModel;
  range: BalanceRange;
  onRangeChange: (value: string) => void;
}) {
  return (
    <Tile minHeight="calc(var(--spacing-12) * 6)">
      <VStack gap={3} height="100%" vAlign="between">
        <HStack hAlign="between" vAlign="start">
          <TileHeading>موجودی کل · تومان</TileHeading>
          <SegmentedControl
            label="بازهٔ زمانی موجودی"
            onChange={onRangeChange}
            size="sm"
            value={range}
          >
            <SegmentedControlItem label="۷روز" value="۷روز" />
            <SegmentedControlItem label="۳۰روز" value="۳۰روز" />
            <SegmentedControlItem label="۵ماه" value="۵ماه" />
            <SegmentedControlItem label="۱۲ماه" value="۱۲ماه" />
          </SegmentedControl>
        </HStack>
        <HStack gap={2} vAlign="end">
          <VStack gap={1} width="42%">
            <Text type="display-1">
              {toPersianDigits(String(model.totalUsers))}
            </Text>
            <Text size="sm" type="supporting">
              {toPersianDigits("آخرین بروزرسانی · امروز")}
            </Text>
          </VStack>
          <VStack className="overview-two-chart-wrap" width="58%">
            <Chart
              buildOption={(theme) =>
                buildOverviewTwoBalanceOption(model.balanceBars, theme)
              }
              className="overview-two-chart"
              data={model.balanceBars}
              height="calc(var(--spacing-12) * 3)"
            />
          </VStack>
        </HStack>
      </VStack>
    </Tile>
  );
}

function TasksTile({
  model,
  onOpen,
  onCreate,
}: {
  model: DashboardModel;
  onOpen: () => void;
  onCreate: () => void;
}) {
  return (
    <Tile>
      <VStack gap={2} height="100%" vAlign="between">
        <HStack hAlign="between">
          <TileHeading>کارهای تکمیل‌شده</TileHeading>
          <UserActionsPopover
            label="عملیات کاربران"
            onCreate={onCreate}
            onOpen={onOpen}
          />
        </HStack>
        <HStack hAlign="between" vAlign="end">
          <Text type="display-1">
            {toPersianDigits(String(model.completedTasks))}
          </Text>
          <Text size="sm" type="supporting">
            ↗ {toPersianDigits(String(model.taskTarget))}
          </Text>
        </HStack>
      </VStack>
    </Tile>
  );
}

function WorkTile({
  model,
  users,
  onOpen,
}: {
  model: DashboardModel;
  users: User[];
  onOpen: () => void;
}) {
  return (
    <Tile minHeight="calc(var(--spacing-12) * 6)">
      <VStack gap={3} height="100%" vAlign="between">
        <HStack hAlign="between" vAlign="start">
          <TileHeading>ساعت‌های پربازده</TileHeading>
          <IconButton
            icon={<Icon icon="arrowUp" />}
            label="نمایش گزارش ساعت‌های پربازده"
            onClick={onOpen}
            tooltip="نمایش گزارش"
            variant="ghost"
          />
        </HStack>
        <VStack gap={3}>
          <HStack hAlign="between" vAlign="end">
            <Text type="display-1">{toPersianDigits(model.workHours)}</Text>
            <Text size="sm" type="supporting">
              ↗ {toPersianDigits(String(model.activeUsers) + " فعال")}
            </Text>
          </HStack>
          <VStack gap={2}>
            <VStack aria-hidden className="overview-two-work-divider" />
            <TileHeading>آخرین فعالیت‌ها</TileHeading>
            <HStack gap={1} wrap="wrap">
              {Array.from(
                { length: Math.max(1, Math.min(6, users.length)) },
                (_, index) => (
                  <VStack
                    aria-label={
                      users[index]
                        ? `کاربر ${users[index].firstName} ${users[index].lastName}`
                        : "داده‌ای برای فعالیت ثبت نشده است"
                    }
                    className="overview-two-artwork"
                    data-artwork={index + 1}
                    key={users[index]?.id ?? index}
                  />
                ),
              )}
            </HStack>
          </VStack>
        </VStack>
      </VStack>
    </Tile>
  );
}

function FeatureTile({
  activeIndex,
  model,
  onChange,
}: {
  activeIndex: number;
  model: DashboardModel;
  onChange: (index: number) => void;
}) {
  const carouselRef = useRef<HTMLElement | null>(null);

  const handleCarouselScroll = (event: UIEvent<HTMLElement>) => {
    const track = event.currentTarget;
    const slideWidth = Math.max(track.clientWidth, 1);
    const nextIndex = Math.max(
      0,
      Math.min(
        featureSlides.length - 1,
        Math.round(Math.abs(track.scrollLeft) / slideWidth),
      ),
    );

    if (nextIndex !== activeIndex) {
      onChange(nextIndex);
    }
  };

  const scrollToSlide = (index: number) => {
    onChange(index);
    const slide = carouselRef.current?.children.item(index);

    if (!(slide instanceof HTMLElement)) {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    slide.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "nearest",
      inline: "start",
    });
  };

  return (
    <Tile
      minHeight="calc(var(--spacing-12) * 6)"
      variant="blue"
      className="overview-two-feature"
    >
      <VStack aria-hidden className="overview-two-feature-circle" />
      <VStack aria-hidden className="overview-two-feature-lines" />
      <VStack
        className="overview-two-feature-content"
        gap={2}
        height="100%"
        vAlign="between"
      >
        <TileHeading>یادداشت طراحی</TileHeading>
        <HStack
          aria-label="یادداشت‌های طراحی"
          className="overview-two-carousel-track"
          dir="ltr"
          gap={0}
          isScrollable
          onScroll={handleCarouselScroll}
          ref={carouselRef}
          role="region"
        >
          {featureSlides.map((slide, index) => (
            <VStack
              aria-hidden={index !== activeIndex}
              className="overview-two-carousel-slide"
              dir="rtl"
              gap={2}
              key={slide.title}
            >
              <Heading level={2}>{slide.title}</Heading>
              <Text color="primary" size="sm" type="supporting">
                {index === 0
                  ? `${String(model.activeUsers)} کاربر از ${String(model.totalUsers || 0)} کاربر فعال هستند.`
                  : slide.description}
              </Text>
            </VStack>
          ))}
        </HStack>
        <HStack gap={1}>
          {featureSlides.map((slide, index) => (
            <IconButton
              className="overview-two-feature-dot-button"
              icon={
                <VStack
                  aria-hidden
                  className="overview-two-feature-dot"
                  data-active={index === activeIndex}
                />
              }
              key={slide.title}
              label={`نمایش کارت ${toPersianDigits(String(index + 1))}`}
              onClick={() => {
                scrollToSlide(index);
              }}
              size="sm"
              variant="ghost"
            />
          ))}
        </HStack>
      </VStack>
    </Tile>
  );
}

function UsageTile({
  model,
  onOpen,
}: {
  model: DashboardModel;
  onOpen: () => void;
}) {
  return (
    <Tile minHeight="calc(var(--spacing-12) * 4)">
      <VStack gap={2} height="100%" vAlign="between">
        <HStack hAlign="between" vAlign="start">
          <TileHeading>مصرف سرویس هوش مصنوعی</TileHeading>
          <IconButton
            icon={<Icon icon="info" />}
            label="جزئیات مصرف سرویس"
            onClick={onOpen}
            size="sm"
            tooltip="جزئیات مصرف"
            variant="ghost"
          />
        </HStack>
        <HStack hAlign="between" vAlign="end">
          <Text type="display-1">
            {toPersianDigits(String(model.usagePercent) + "٪")}
          </Text>
          <Text size="sm" type="supporting">
            ↗ {toPersianDigits(String(model.monthlyCost) + " دلار")}
          </Text>
        </HStack>
        <VStack
          aria-label="درصد مصرف سرویس"
          className="overview-two-progress-track"
        >
          <VStack
            aria-hidden
            className="overview-two-progress-fill"
            data-progress={Math.min(5, Math.ceil(model.usagePercent / 20))}
          />
        </VStack>
      </VStack>
    </Tile>
  );
}

function BalanceRingTile({
  model,
  isDetailVisible,
  onToggleDetails,
}: {
  model: DashboardModel;
  isDetailVisible: boolean;
  onToggleDetails: () => void;
}) {
  return (
    <Tile
      minHeight="calc(var(--spacing-12) * 4)"
      className="overview-two-ring-tile"
    >
      <VStack gap={2} height="100%" vAlign="between">
        <HStack hAlign="end">
          <IconButton
            icon={<Icon icon="info" />}
            label="جزئیات امتیاز تعادل"
            onClick={onToggleDetails}
            size="sm"
            tooltip="نمایش جزئیات"
            variant="ghost"
          />
        </HStack>
        <VStack className="overview-two-ring-shell">
          <Chart
            buildOption={(theme) =>
              buildOverviewTwoRingOption(model.balanceScoreValue, theme)
            }
            className="overview-two-ring-chart"
            data={model.balanceScoreValue}
            height="100%"
          />
          <VStack
            aria-label={`امتیاز سلامت داده‌ها: ${model.balanceScore} از ۱۰`}
            className="overview-two-ring-overlay"
          >
            <Text type="display-1">{toPersianDigits(model.balanceScore)}</Text>
            <Text size="sm" type="supporting">
              سلامت داده‌ها
            </Text>
          </VStack>
        </VStack>
        {isDetailVisible ? (
          <Text size="sm" type="supporting">
            {toPersianDigits(
              String(model.activeUsers) +
                " فعال · " +
                String(model.inactiveUsers) +
                " نیازمند بررسی",
            )}
          </Text>
        ) : null}
      </VStack>
    </Tile>
  );
}

function CustomTile({ onOpen }: { onOpen: () => void }) {
  return (
    <Tile minHeight="calc(var(--spacing-12) * 3)" variant="gray">
      <HStack hAlign="between" vAlign="end">
        <Heading level={2}>
          داشبورد
          <br />
          شخصی‌سازی‌شده
        </Heading>
        <VStack gap={2} hAlign="end">
          <IconButton
            icon={<Icon icon="arrowUp" />}
            label="باز کردن قالب‌ها"
            onClick={onOpen}
            tooltip="باز کردن قالب‌ها"
            variant="ghost"
          />
          <Text size="sm" type="supporting">
            {toPersianDigits("۱۰ / ۲۰ قالب")}
          </Text>
        </VStack>
      </HStack>
    </Tile>
  );
}

type DashboardLayoutProps = {
  model: DashboardModel;
  users: User[];
  range: BalanceRange;
  onRangeChange: (value: string) => void;
  onOpenUsers: () => void;
  onCreateUser: () => void;
  onOpenSettings: () => void;
  featureIndex: number;
  onFeatureChange: (index: number) => void;
  isRingDetailVisible: boolean;
  onToggleRingDetails: () => void;
};

function DesktopDashboard({
  model,
  users,
  range,
  onRangeChange,
  onOpenUsers,
  onCreateUser,
  onOpenSettings,
  featureIndex,
  onFeatureChange,
  isRingDetailVisible,
  onToggleRingDetails,
}: DashboardLayoutProps) {
  return (
    <Grid columns={6} gap={2}>
      <FocusTile model={model} onCreate={onCreateUser} onOpen={onOpenUsers} />
      <GridSpan columns={2} rows={2}>
        <InvoicesTile model={model} onOpen={onOpenUsers} />
      </GridSpan>
      <GridSpan columns={3} rows={2}>
        <BalanceTile
          model={model}
          onRangeChange={onRangeChange}
          range={range}
        />
      </GridSpan>
      <TasksTile model={model} onCreate={onCreateUser} onOpen={onOpenUsers} />
      <GridSpan rows={2}>
        <WorkTile model={model} onOpen={onOpenUsers} users={users} />
      </GridSpan>
      <GridSpan rows={2}>
        <FeatureTile
          activeIndex={featureIndex}
          model={model}
          onChange={onFeatureChange}
        />
      </GridSpan>
      <GridSpan columns={2}>
        <UsageTile model={model} onOpen={onOpenSettings} />
      </GridSpan>
      <GridSpan columns={2}>
        <BalanceRingTile
          isDetailVisible={isRingDetailVisible}
          model={model}
          onToggleDetails={onToggleRingDetails}
        />
      </GridSpan>
      <GridSpan columns={4}>
        <CustomTile onOpen={onOpenSettings} />
      </GridSpan>
    </Grid>
  );
}

function MobileDashboard(props: DashboardLayoutProps) {
  return (
    <Grid columns={{ max: 1, minWidth: 240, repeat: "fit" }} gap={2}>
      <FocusTile
        model={props.model}
        onCreate={props.onCreateUser}
        onOpen={props.onOpenUsers}
      />
      <TasksTile
        model={props.model}
        onCreate={props.onCreateUser}
        onOpen={props.onOpenUsers}
      />
      <InvoicesTile model={props.model} onOpen={props.onOpenUsers} />
      <BalanceTile
        model={props.model}
        onRangeChange={props.onRangeChange}
        range={props.range}
      />
      <WorkTile
        model={props.model}
        onOpen={props.onOpenUsers}
        users={props.users}
      />
      <FeatureTile
        activeIndex={props.featureIndex}
        model={props.model}
        onChange={props.onFeatureChange}
      />
      <UsageTile model={props.model} onOpen={props.onOpenSettings} />
      <BalanceRingTile
        isDetailVisible={props.isRingDetailVisible}
        model={props.model}
        onToggleDetails={props.onToggleRingDetails}
      />
      <CustomTile onOpen={props.onOpenSettings} />
    </Grid>
  );
}

export function OverviewTwoPage() {
  const isWide = useWideLayout();
  const users = useUsersStore((state) => state.users);
  const navigate = useNavigate();
  const [range, setRange] = useState<BalanceRange>("۵ماه");
  const [featureIndex, setFeatureIndex] = useState(0);
  const [isRingDetailVisible, setIsRingDetailVisible] = useState(false);
  const model = useMemo(
    () => buildDashboardModel(users, range),
    [range, users],
  );

  const layoutProps: DashboardLayoutProps = {
    featureIndex,
    isRingDetailVisible,
    model,
    onCreateUser: () => {
      void navigate("/users/new");
    },
    onFeatureChange: setFeatureIndex,
    onOpenSettings: () => {
      void navigate("/settings");
    },
    onOpenUsers: () => {
      void navigate("/users");
    },
    onRangeChange: (value) => {
      if (
        value === "۷روز" ||
        value === "۳۰روز" ||
        value === "۵ماه" ||
        value === "۱۲ماه"
      ) {
        setRange(value);
      }
    },
    onToggleRingDetails: () => {
      setIsRingDetailVisible((visible) => !visible);
    },
    range,
    users,
  };

  return (
    <VStack className="overview-two-page" gap={2} width="100%">
      {isWide ? (
        <DesktopDashboard {...layoutProps} />
      ) : (
        <MobileDashboard {...layoutProps} />
      )}
    </VStack>
  );
}
