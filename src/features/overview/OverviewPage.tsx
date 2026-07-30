import { useMemo, type ReactNode } from "react";
import { Avatar } from "@astryxdesign/core/Avatar";
import { Badge } from "@astryxdesign/core/Badge";
import { Card } from "@astryxdesign/core/Card";
import { Grid } from "@astryxdesign/core/Grid";
import { HStack } from "@astryxdesign/core/HStack";
import { Item } from "@astryxdesign/core/Item";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";
import { Heading, Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { Chart } from "../../components/chart/Chart";
import { formatJalali } from "../../lib/date";
import { toPersianDigits } from "../../lib/digits";
import { useUsersStore, type User } from "../users/usersStore";
import {
  buildBirthDecadeChartOption,
  buildCumulativeChartOption,
  buildOverviewChartSeries,
  buildRegistrationChartOption,
  buildRoleChartOption,
  buildStatusChartOption,
} from "./chartConfigs";
import { buildOverviewStatCards } from "./statCards";

const RECENT_USERS_LIMIT = 5;

function ChartCard({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <Card padding={4}>
      <VStack gap={3}>
        <VStack gap={1}>
          <Heading level={2}>{title}</Heading>
          <Text type="supporting" size="sm">
            {description}
          </Text>
        </VStack>
        {children}
      </VStack>
    </Card>
  );
}

function recentUsers(users: User[]): User[] {
  return [...users]
    .sort((first, second) => second.createdAt.localeCompare(first.createdAt))
    .slice(0, RECENT_USERS_LIMIT);
}

function RecentUsersCard({ users }: { users: User[] }) {
  const recent = useMemo(() => recentUsers(users), [users]);

  return (
    <Card padding={4}>
      <VStack gap={3}>
        <VStack gap={1}>
          <Heading level={2}>تازه‌ترین کاربران</Heading>
          <Text type="supporting" size="sm">
            پنج کاربر آخر بر پایهٔ تاریخ ثبت‌نام.
          </Text>
        </VStack>
        {recent.length === 0 ? (
          <Text type="supporting" size="sm">
            داده‌ای برای نمایش وجود ندارد
          </Text>
        ) : (
          <VStack as="ul" gap={1}>
            {recent.map((user) => (
              <Item
                as="li"
                description={`${user.email} · ${formatJalali(user.createdAt.slice(0, 10))}`}
                endContent={
                  <Badge
                    label={user.status === "active" ? "فعال" : "غیرفعال"}
                    variant={user.status === "active" ? "success" : "neutral"}
                  />
                }
                key={user.id}
                label={`${user.firstName} ${user.lastName}`}
                startContent={
                  <Avatar
                    name={`${user.firstName} ${user.lastName}`}
                    size="sm"
                  />
                }
              />
            ))}
          </VStack>
        )}
      </VStack>
    </Card>
  );
}

function ActivationCard({
  activeUsers,
  totalUsers,
}: {
  activeUsers: number;
  totalUsers: number;
}) {
  const percent =
    totalUsers === 0 ? 0 : Math.round((activeUsers / totalUsers) * 100);

  return (
    <Card padding={4}>
      <VStack gap={3}>
        <HStack hAlign="between" vAlign="end">
          <VStack gap={1}>
            <Heading level={2}>نرخ کاربران فعال</Heading>
            <Text type="supporting" size="sm">
              سهم کاربران فعال از کل کاربران ثبت‌شده.
            </Text>
          </VStack>
          <Heading level={2}>{toPersianDigits(`${String(percent)}٪`)}</Heading>
        </HStack>
        <ProgressBar
          formatValueLabel={(value, max) =>
            toPersianDigits(`${String(value)} از ${String(max)}`)
          }
          hasValueLabel
          isLabelHidden
          label="نرخ کاربران فعال"
          max={Math.max(1, totalUsers)}
          value={activeUsers}
          variant="success"
        />
      </VStack>
    </Card>
  );
}

export function OverviewPage() {
  const users = useUsersStore((state) => state.users);
  const statCards = useMemo(() => buildOverviewStatCards(users), [users]);
  const chartSeries = useMemo(() => buildOverviewChartSeries(users), [users]);
  const activeUsers = useMemo(
    () => users.filter((user) => user.status === "active").length,
    [users],
  );

  return (
    <VStack gap={6}>
      <VStack gap={1}>
        <Heading level={1}>نمای کلی</Heading>
        <Text type="supporting">تصویری از کاربران و روند رشد داشبورد</Text>
      </VStack>

      <Grid columns={3} gap={4}>
        {statCards.map((card) => (
          <Card key={card.id} padding={4}>
            <VStack gap={1}>
              <Text type="supporting" size="sm">
                {card.label}
              </Text>
              <Heading level={2}>{toPersianDigits(String(card.value))}</Heading>
              {card.note ? (
                <Text type="supporting" size="sm">
                  {card.note}
                </Text>
              ) : null}
            </VStack>
          </Card>
        ))}
      </Grid>

      <ActivationCard activeUsers={activeUsers} totalUsers={users.length} />

      <Grid columns={2} gap={4}>
        <ChartCard
          title="روند ثبت کاربران"
          description="تاریخ‌ها بر پایهٔ تقویم جلالی نمایش داده می‌شوند."
        >
          <Chart
            buildOption={(theme) =>
              buildRegistrationChartOption(chartSeries, theme)
            }
            data={chartSeries.registrations}
          />
        </ChartCard>
        <ChartCard
          title="توزیع نقش‌ها"
          description="تعداد کاربران هر نقش با ارقام فارسی نمایش داده می‌شود."
        >
          <Chart
            buildOption={(theme) => buildRoleChartOption(chartSeries, theme)}
            data={chartSeries.roles}
          />
        </ChartCard>
        <ChartCard
          title="وضعیت کاربران"
          description="سهم کاربران فعال و غیرفعال در یک نگاه."
        >
          <Chart
            buildOption={(theme) => buildStatusChartOption(chartSeries, theme)}
            data={chartSeries.statuses}
          />
        </ChartCard>
        <ChartCard
          title="رشد تجمعی کاربران"
          description="مجموع کاربران ثبت‌شده تا هر تاریخ."
        >
          <Chart
            buildOption={(theme) =>
              buildCumulativeChartOption(chartSeries, theme)
            }
            data={chartSeries.cumulative}
          />
        </ChartCard>
        <ChartCard
          title="دهه‌های تولد"
          description="پراکندگی سال تولد کاربران بر پایهٔ تقویم جلالی."
        >
          <Chart
            buildOption={(theme) =>
              buildBirthDecadeChartOption(chartSeries, theme)
            }
            data={chartSeries.birthDecades}
          />
        </ChartCard>
        <RecentUsersCard users={users} />
      </Grid>
    </VStack>
  );
}
