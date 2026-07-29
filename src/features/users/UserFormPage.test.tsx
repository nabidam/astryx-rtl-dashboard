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
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import faMessages from "../../locale/fa.json";
import { fixtures } from "./fixtures";
import { UserFormPage } from "./UserFormPage";
import { usersStore } from "./usersStore";

vi.mock("../../components/jalali-picker/JalaliPicker", () => ({
  JalaliPicker: ({
    onChange,
  }: {
    onChange: (date: { year: number; month: number; day: number }) => void;
  }) => (
    <>
      <button
        onClick={() => {
          onChange({ year: 1370, month: 1, day: 1 });
        }}
        type="button"
      >
        انتخاب تاریخ معتبر
      </button>
      <button
        onClick={() => {
          onChange({ year: 1500, month: 1, day: 1 });
        }}
        type="button"
      >
        انتخاب تاریخ آینده
      </button>
    </>
  ),
}));

const testTheme = defineTheme({
  name: "user-form-test",
  extends: neutralTheme,
});

function renderUserForm(initialEntry: string) {
  const router = createMemoryRouter(
    [
      { path: "/users/new", element: <UserFormPage /> },
      { path: "/users/:id/edit", element: <UserFormPage /> },
      { path: "/users", element: <h1>کاربران</h1> },
    ],
    { initialEntries: [initialEntry] },
  );

  render(
    <Theme theme={testTheme} mode="light">
      <InternationalizationProvider locale="fa" messages={{ fa: faMessages }}>
        <RouterProvider router={router} />
      </InternationalizationProvider>
    </Theme>,
  );

  return router;
}

describe("UserFormPage", () => {
  beforeEach(() => {
    usersStore.setState({ users: fixtures.map((user) => ({ ...user })) });
  });

  afterEach(cleanup);

  it("creates a user from Persian input and normalizes Latin/Persian email digits", async () => {
    const router = renderUserForm("/users/new");
    const [firstName, lastName, email] = screen.getAllByRole("textbox");

    fireEvent.change(firstName, {
      target: { value: "یگانه" },
    });
    fireEvent.change(lastName, {
      target: { value: "قاسمی" },
    });
    fireEvent.change(email, {
      target: { value: "yeganeh۱۲@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "انتخاب تاریخ معتبر" }));
    fireEvent.click(screen.getByRole("button", { name: "ذخیرهٔ کاربر" }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/users");
    });
    expect(usersStore.getState().users.at(-1)?.email).toBe(
      "yeganeh12@example.com",
    );
  });

  it("shows store validation messages inline and does not save invalid data", () => {
    renderUserForm("/users/new");
    const originalCount = usersStore.getState().users.length;
    const [firstName, lastName, email] = screen.getAllByRole("textbox");

    fireEvent.change(firstName, {
      target: { value: "یگانه" },
    });
    fireEvent.change(lastName, {
      target: { value: "قاسمی" },
    });
    fireEvent.change(email, {
      target: { value: fixtures[0].email },
    });
    fireEvent.click(screen.getByRole("button", { name: "انتخاب تاریخ آینده" }));
    fireEvent.click(screen.getByRole("button", { name: "ذخیرهٔ کاربر" }));

    expect(screen.getByText("این ایمیل قبلاً ثبت شده است")).toBeTruthy();
    expect(screen.getByText("تاریخ تولد نمی‌تواند در آینده باشد")).toBeTruthy();
    expect(usersStore.getState().users).toHaveLength(originalCount);
  });

  it("prefills the edit form and redirects an unknown id to the users table", async () => {
    renderUserForm(`/users/${fixtures[0].id}/edit`);

    expect(screen.getByDisplayValue("آوا")).toBeTruthy();
    expect(screen.getByDisplayValue("رضایی")).toBeTruthy();
    expect(screen.getByDisplayValue(fixtures[0].email)).toBeTruthy();

    cleanup();
    const router = renderUserForm("/users/missing-user/edit");
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/users");
    });
  });
});
