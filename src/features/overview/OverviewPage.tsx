import { useMemo } from "react";
import { Card } from "@astryxdesign/core/Card";
import { Grid } from "@astryxdesign/core/Grid";
import { Heading, Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { Chart } from "../../components/chart/Chart";
import { toPersianDigits } from "../../lib/digits";
import { useUsersStore } from "../users/usersStore";
import {
  buildOverviewChartSeries,
  buildRegistrationChartOption,
  buildRoleChartOption,
} from "./chartConfigs";
import { buildOverviewStatCards } from "./statCards";

export function OverviewPage() {
  const users = useUsersStore((state) => state.users);
  const statCards = useMemo(() => buildOverviewStatCards(users), [users]);
  const chartSeries = useMemo(() => buildOverviewChartSeries(users), [users]);

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

      <Grid columns={2} gap={4}>
        <Card padding={4}>
          <VStack gap={3}>
            <VStack gap={1}>
              <Heading level={2}>روند ثبت کاربران</Heading>
              <Text type="supporting" size="sm">
                تاریخ‌ها بر پایهٔ تقویم جلالی نمایش داده می‌شوند.
              </Text>
            </VStack>
            <Chart
              buildOption={(theme) =>
                buildRegistrationChartOption(chartSeries, theme)
              }
              data={chartSeries.registrations}
            />
          </VStack>
        </Card>
        <Card padding={4}>
          <VStack gap={3}>
            <VStack gap={1}>
              <Heading level={2}>توزیع نقش‌ها</Heading>
              <Text type="supporting" size="sm">
                تعداد کاربران هر نقش با ارقام فارسی نمایش داده می‌شود.
              </Text>
            </VStack>
            <Chart
              buildOption={(theme) => buildRoleChartOption(chartSeries, theme)}
              data={chartSeries.roles}
            />
          </VStack>
        </Card>
      </Grid>
    </VStack>
  );
}
