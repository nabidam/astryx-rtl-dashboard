import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it } from "vitest";
import { RegisterPage } from "./RegisterPage";

function renderRegisterPage() {
  const router = createMemoryRouter(
    [
      { path: "/register", element: <RegisterPage /> },
      { path: "/login", element: <h1>ورود به حساب کاربری</h1> },
    ],
    { initialEntries: ["/register"] },
  );

  render(<RouterProvider router={router} />);
  return router;
}

describe("RegisterPage", () => {
  afterEach(cleanup);

  it("shows inline Persian validation for every empty field", () => {
    const router = renderRegisterPage();

    fireEvent.click(screen.getByRole("button", { name: "ساخت حساب" }));

    expect(screen.getByText("نام الزامی است")).toBeTruthy();
    expect(screen.getByText("ایمیل الزامی است")).toBeTruthy();
    expect(screen.getByText("گذرواژه الزامی است")).toBeTruthy();
    expect(screen.getByText("تکرار گذرواژه الزامی است")).toBeTruthy();
    expect(router.state.location.pathname).toBe("/register");
  });

  it("returns a valid UI-only registration to the login page", async () => {
    const router = renderRegisterPage();

    fireEvent.change(screen.getByLabelText("نام"), {
      target: { value: "آوا رضایی" },
    });
    fireEvent.change(screen.getByLabelText("ایمیل"), {
      target: { value: "ava@example.com" },
    });
    fireEvent.change(screen.getByLabelText("گذرواژه"), {
      target: { value: "password" },
    });
    fireEvent.change(screen.getByLabelText("تکرار گذرواژه"), {
      target: { value: "password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "ساخت حساب" }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/login");
      expect(
        screen.getByRole("heading", { name: "ورود به حساب کاربری" }),
      ).toBeTruthy();
    });
  });
});
