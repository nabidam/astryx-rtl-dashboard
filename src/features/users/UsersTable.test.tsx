import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { InternationalizationProvider } from "@astryxdesign/core/i18n";
import { Theme, defineTheme } from "@astryxdesign/core/theme";
import { neutralTheme } from "@astryxdesign/theme-neutral/built";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import faMessages from "../../locale/fa.json";
import { fixtures } from "./fixtures";
import { UsersTable } from "./UsersTable";
import { usersStore } from "./usersStore";

const testTheme = defineTheme({
  name: "users-table-test",
  extends: neutralTheme,
});

function renderUsersTable() {
  return render(
    <Theme theme={testTheme} mode="light">
      <InternationalizationProvider locale="fa" messages={{ fa: faMessages }}>
        <UsersTable />
      </InternationalizationProvider>
    </Theme>,
  );
}

describe("UsersTable", () => {
  beforeEach(() => {
    usersStore.setState({ users: fixtures.map((user) => ({ ...user })) });
  });

  afterEach(() => {
    cleanup();
  });

  it("shows isolated Latin emails, Jalali dates, and Persian pagination", () => {
    renderUsersTable();

    expect(screen.getByText("\u2068ava.rezaei@example.com\u2069")).toBeTruthy();
    expect(screen.getByText("۱۳۷۹/۰۱/۰۲")).toBeTruthy();
    expect(screen.getByText("صفحه ۱ از ۲")).toBeTruthy();
  });

  it("filters rows and changes pages across the Persian fixtures", () => {
    renderUsersTable();

    fireEvent.click(screen.getByRole("combobox", { name: "وضعیت" }));
    fireEvent.click(screen.getByRole("option", { name: "غیرفعال" }));
    expect(screen.getByText("سارا احمدی")).toBeTruthy();
    expect(screen.queryByText("آوا رضایی")).toBeNull();

    fireEvent.click(screen.getByRole("combobox", { name: "وضعیت" }));
    fireEvent.click(screen.getByRole("option", { name: "همهٔ وضعیت‌ها" }));
    fireEvent.click(screen.getByRole("button", { name: "رفتن به صفحه بعد" }));
    expect(screen.getByText("نیلوفر مرادی")).toBeTruthy();
    expect(screen.getByText("صفحه ۲ از ۲")).toBeTruthy();
  });

  it("offers a clear action for zero-result searches", () => {
    renderUsersTable();

    fireEvent.change(screen.getByLabelText("جست‌وجوی کاربران"), {
      target: { value: "کاربر ناموجود" },
    });

    expect(screen.getByText("نتیجه‌ای یافت نشد")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "پاک‌کردن جست‌وجو" }));
    expect(screen.getByText("آوا رضایی")).toBeTruthy();
  });

  it("shows the add-user empty state after every row is removed", () => {
    usersStore.setState({ users: [] });
    renderUsersTable();

    expect(screen.getByText("هنوز کاربری وجود ندارد")).toBeTruthy();
    expect(screen.getByRole("button", { name: "افزودن کاربر" })).toBeTruthy();
  });

  it("wires row actions to edit and delete handlers", async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(
      <Theme theme={testTheme} mode="light">
        <InternationalizationProvider locale="fa" messages={{ fa: faMessages }}>
          <UsersTable onDelete={onDelete} onEdit={onEdit} />
        </InternationalizationProvider>
      </Theme>,
    );

    fireEvent.click(screen.getByRole("button", { name: "اقدامات آوا رضایی" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "ویرایش" }));
    expect(onEdit).toHaveBeenCalledWith(
      expect.objectContaining({ id: "fixture-ava-rezaei" }),
    );

    await waitFor(() => {
      expect(screen.queryByRole("menuitem", { name: "ویرایش" })).toBeNull();
    });
    fireEvent.click(screen.getByRole("button", { name: "اقدامات آوا رضایی" }));
    await waitFor(() => {
      expect(screen.getByRole("menuitem", { name: "حذف" })).toBeTruthy();
    });
    fireEvent.click(screen.getByRole("menuitem", { name: "حذف" }));
    expect(onDelete).toHaveBeenCalledWith(
      expect.objectContaining({ id: "fixture-ava-rezaei" }),
    );
  });
});
