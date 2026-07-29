import { useState } from "react";
import { AppShell } from "@astryxdesign/core/AppShell";
import { Button } from "@astryxdesign/core/Button";
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import {
  HStack,
  Layout,
  LayoutContent,
  LayoutFooter,
  VStack,
} from "@astryxdesign/core/Layout";
import {
  SideNav,
  SideNavHeading,
  SideNavItem,
  SideNavSection,
} from "@astryxdesign/core/SideNav";
import { Table, proportional } from "@astryxdesign/core/Table";
import type { TableColumn } from "@astryxdesign/core/Table";
import { Heading, Text } from "@astryxdesign/core/Text";

interface RtlProbeRow extends Record<string, unknown> {
  id: string;
  name: string;
  email: string;
  status: string;
}

const rows: RtlProbeRow[] = [
  { id: "1", name: "نگار احمدی", email: "negar@example.com", status: "فعال" },
  {
    id: "2",
    name: "سامان رضایی",
    email: "saman@example.com",
    status: "در انتظار",
  },
  { id: "3", name: "مریم کریمی", email: "maryam@example.com", status: "فعال" },
];

const columns: TableColumn<RtlProbeRow>[] = [
  { key: "name", header: "نام", width: proportional(1) },
  { key: "email", header: "ایمیل", width: proportional(1) },
  { key: "status", header: "وضعیت", width: proportional(1) },
];

export function RtlProbe() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <AppShell
      contentPadding={0}
      data-testid="rtl-probe-shell"
      sideNav={
        <SideNav data-testid="rtl-probe-sidenav">
          <SideNavHeading
            heading="داشبورد آستریکس"
            subheading="آزمایش راست‌به‌چپ"
          />
          <SideNavSection title="ناوبری اصلی">
            <SideNavItem label="نمای کلی" isSelected href="#overview" />
            <SideNavItem label="کاربران" href="#users" />
          </SideNavSection>
          <SideNavSection title="حساب کاربری">
            <SideNavItem label="تنظیمات" href="#settings" />
          </SideNavSection>
        </SideNav>
      }
    >
      <VStack data-testid="rtl-probe-content" gap={4}>
        <VStack gap={1}>
          <Heading level={2}>بررسی چیدمان RTL</Heading>
          <Text type="body">
            این صفحه برای بررسی آینه‌شدن پوسته، جدول و گفت‌وگو ساخته شده است.
          </Text>
        </VStack>
        <Button
          label="نمایش گفت‌وگو"
          variant="primary"
          onClick={() => {
            setIsDialogOpen(true);
          }}
        />
        <Table
          aria-label="جدول کاربران"
          data={rows}
          columns={columns}
          idKey="id"
          density="compact"
          dividers="rows"
          hasHover
          data-testid="rtl-probe-table"
        />
      </VStack>
      <Dialog
        isOpen={isDialogOpen}
        onOpenChange={(isOpen) => {
          setIsDialogOpen(isOpen);
        }}
        purpose="info"
        data-testid="rtl-probe-dialog"
      >
        <Layout
          header={
            <DialogHeader
              title="جزئیات کاربر"
              subtitle="این گفت‌وگو برای بررسی لایهٔ مودال است."
              onOpenChange={(isOpen) => {
                setIsDialogOpen(isOpen);
              }}
            />
          }
          content={
            <LayoutContent>
              <Text type="body">
                محتوای گفت‌وگو در پوستهٔ راست‌به‌چپ قرار دارد.
              </Text>
            </LayoutContent>
          }
          footer={
            <LayoutFooter>
              <HStack gap={2} hAlign="end">
                <Button
                  label="بستن"
                  variant="secondary"
                  onClick={() => {
                    setIsDialogOpen(false);
                  }}
                />
              </HStack>
            </LayoutFooter>
          }
        />
      </Dialog>
    </AppShell>
  );
}
