import type { User } from "../users/usersStore";

export type OverviewStatCard = {
  id: "total" | "active" | "admins";
  label: string;
  value: number;
  note?: string;
};

const NO_DATA_NOTE = "داده‌ای برای نمایش وجود ندارد";

export function buildOverviewStatCards(users: User[]): OverviewStatCard[] {
  const hasUsers = users.length > 0;
  const note = hasUsers ? undefined : NO_DATA_NOTE;

  return [
    {
      id: "total",
      label: "کل کاربران",
      value: users.length,
      note,
    },
    {
      id: "active",
      label: "کاربران فعال",
      value: users.filter((user) => user.status === "active").length,
      note,
    },
    {
      id: "admins",
      label: "مدیران",
      value: users.filter((user) => user.role === "admin").length,
      note,
    },
  ];
}
