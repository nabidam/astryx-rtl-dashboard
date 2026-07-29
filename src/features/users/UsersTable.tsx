import { useMemo, useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { HStack } from "@astryxdesign/core/Layout";
import { MoreMenu } from "@astryxdesign/core/MoreMenu";
import { Pagination } from "@astryxdesign/core/Pagination";
import { Selector } from "@astryxdesign/core/Selector";
import { StatusDot } from "@astryxdesign/core/StatusDot";
import { Table, proportional } from "@astryxdesign/core/Table";
import type { TableColumn } from "@astryxdesign/core/Table";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Token } from "@astryxdesign/core/Token";
import { Toolbar } from "@astryxdesign/core/Toolbar";
import { VStack } from "@astryxdesign/core/VStack";
import { isolate } from "../../lib/bidi";
import { formatJalali } from "../../lib/date";
import { toPersianDigits } from "../../lib/digits";
import {
  useUsersStore,
  usersStore,
  type User,
  type UserRole,
  type UserStatus,
} from "./usersStore";

const PAGE_SIZE = 4;

type TableSort = "name-asc" | "name-desc" | "birthDate-desc" | "birthDate-asc";

const sortOptions: Array<{ value: TableSort; label: string }> = [
  { value: "name-asc", label: "نام، الف تا ی" },
  { value: "name-desc", label: "نام، ی تا الف" },
  { value: "birthDate-desc", label: "تاریخ تولد، جدیدتر" },
  { value: "birthDate-asc", label: "تاریخ تولد، قدیمی‌تر" },
];

const roleOptions: Array<{ value: "all" | UserRole; label: string }> = [
  { value: "all", label: "همهٔ نقش‌ها" },
  { value: "admin", label: "مدیر" },
  { value: "editor", label: "ویرایشگر" },
  { value: "viewer", label: "بیننده" },
];

const statusOptions: Array<{
  value: "all" | UserStatus;
  label: string;
}> = [
  { value: "all", label: "همهٔ وضعیت‌ها" },
  { value: "active", label: "فعال" },
  { value: "inactive", label: "غیرفعال" },
];

type UserTableRow = User & Record<string, unknown>;

type UsersTableProps = {
  onCreate?: () => void;
  onEdit?: (user: User) => void;
  onDelete?: (user: User) => void;
};

function roleLabel(role: UserRole): string {
  return roleOptions.find((option) => option.value === role)?.label ?? "بیننده";
}

function statusLabel(status: UserStatus): string {
  return (
    statusOptions.find((option) => option.value === status)?.label ?? "غیرفعال"
  );
}

function emptyState(
  hasUsers: boolean,
  onClearSearch: () => void,
  onCreate?: () => void,
) {
  if (!hasUsers) {
    return (
      <EmptyState
        title="هنوز کاربری وجود ندارد"
        description="برای شروع، نخستین کاربر را اضافه کنید."
        actions={
          <Button
            label="افزودن کاربر"
            variant="primary"
            onClick={onCreate}
            isDisabled={onCreate === undefined}
          />
        }
      />
    );
  }

  return (
    <EmptyState
      title="نتیجه‌ای یافت نشد"
      description="عبارت جست‌وجو یا فیلترها را تغییر دهید."
      actions={
        <Button
          label="پاک‌کردن جست‌وجو"
          variant="secondary"
          onClick={onClearSearch}
        />
      }
    />
  );
}

export function UsersTable({ onCreate, onEdit, onDelete }: UsersTableProps) {
  const users = useUsersStore((state) => state.users);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<TableSort>("name-asc");
  const [role, setRole] = useState<"all" | UserRole>("all");
  const [status, setStatus] = useState<"all" | UserStatus>("all");
  const [page, setPage] = useState(1);

  const filter = useMemo(() => ({ role, status }), [role, status]);
  const filteredUsers = usersStore.getState().query({ search, sort, filter });
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageUsers = usersStore.getState().query({
    search,
    sort,
    filter,
    page: currentPage,
    pageSize: PAGE_SIZE,
  }) as UserTableRow[];

  const clearSearch = () => {
    setSearch("");
    setRole("all");
    setStatus("all");
    setPage(1);
  };

  const columns = useMemo<TableColumn<UserTableRow>[]>(
    () => [
      {
        key: "name",
        header: "نام و نام خانوادگی",
        width: proportional(2),
        renderCell: (user) => `${user.firstName} ${user.lastName}`,
      },
      {
        key: "email",
        header: "ایمیل",
        width: proportional(2),
        renderCell: (user) => isolate(user.email),
      },
      {
        key: "role",
        header: "نقش",
        width: proportional(1),
        renderCell: (user) => <Token label={roleLabel(user.role)} size="sm" />,
      },
      {
        key: "status",
        header: "وضعیت",
        width: proportional(1),
        renderCell: (user) => (
          <HStack gap={1} vAlign="center">
            <StatusDot
              variant={user.status === "active" ? "success" : "neutral"}
              label={statusLabel(user.status)}
            />
            <Text type="body" size="sm">
              {statusLabel(user.status)}
            </Text>
          </HStack>
        ),
      },
      {
        key: "birthDate",
        header: "تاریخ تولد",
        width: proportional(1),
        renderCell: (user) => formatJalali(user.birthDate),
      },
      {
        key: "actions",
        header: "اقدامات",
        width: proportional(1),
        align: "end",
        renderCell: (user) => (
          <MoreMenu
            label={`اقدامات ${user.firstName} ${user.lastName}`}
            items={[
              { label: "ویرایش", onClick: () => onEdit?.(user) },
              { type: "divider" },
              { label: "حذف", onClick: () => onDelete?.(user) },
            ]}
          />
        ),
      },
    ],
    [onDelete, onEdit],
  );

  return (
    <VStack gap={4}>
      <Toolbar
        label="ابزارهای جدول کاربران"
        size="sm"
        startContent={
          <TextInput
            label="جست‌وجوی کاربران"
            isLabelHidden
            value={search}
            placeholder="جست‌وجو در کاربران"
            hasClear
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
          />
        }
        endContent={
          <HStack gap={2} vAlign="end">
            <Selector
              label="مرتب‌سازی"
              options={sortOptions}
              value={sort}
              onChange={(value) => {
                const selected = sortOptions.find(
                  (option) => option.value === value,
                );
                if (selected) {
                  setSort(selected.value);
                  setPage(1);
                }
              }}
            />
            <Selector
              label="نقش"
              options={roleOptions}
              value={role}
              onChange={(value) => {
                const selected = roleOptions.find(
                  (option) => option.value === value,
                );
                if (selected) {
                  setRole(selected.value);
                  setPage(1);
                }
              }}
            />
            <Selector
              label="وضعیت"
              options={statusOptions}
              value={status}
              onChange={(value) => {
                const selected = statusOptions.find(
                  (option) => option.value === value,
                );
                if (selected) {
                  setStatus(selected.value);
                  setPage(1);
                }
              }}
            />
          </HStack>
        }
      />
      <Table
        aria-label="جدول کاربران"
        data={pageUsers}
        columns={columns}
        idKey="id"
        density="compact"
        dividers="rows"
        hasHover
        textOverflow="truncate"
        emptyState={emptyState(users.length > 0, clearSearch, onCreate)}
      />
      {filteredUsers.length > PAGE_SIZE ? (
        <Pagination
          label={`صفحه‌بندی کاربران: ${toPersianDigits(String(currentPage))} از ${toPersianDigits(String(totalPages))}`}
          page={currentPage}
          onChange={setPage}
          totalItems={filteredUsers.length}
          pageSize={PAGE_SIZE}
          size="sm"
          variant="compact"
        />
      ) : null}
    </VStack>
  );
}
