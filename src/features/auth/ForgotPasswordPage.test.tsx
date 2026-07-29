import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it } from "vitest";
import { ForgotPasswordPage } from "./ForgotPasswordPage";

function renderForgotPasswordPage() {
  const router = createMemoryRouter(
    [
      { path: "/forgot-password", element: <ForgotPasswordPage /> },
      { path: "/login", element: <h1>ورود به حساب کاربری</h1> },
    ],
    { initialEntries: ["/forgot-password"] },
  );

  render(<RouterProvider router={router} />);
  return router;
}

describe("ForgotPasswordPage", () => {
  afterEach(cleanup);

  it("shows an inline Persian error when email is empty", () => {
    renderForgotPasswordPage();

    fireEvent.click(screen.getByRole("button", { name: "ادامه" }));

    expect(screen.getByText("ایمیل الزامی است")).toBeTruthy();
  });

  it("shows a success note and a working login link after submission", () => {
    const router = renderForgotPasswordPage();

    fireEvent.change(screen.getByLabelText("ایمیل"), {
      target: { value: "ava@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "ادامه" }));

    expect(
      screen.getByText(
        "اگر حسابی با این ایمیل وجود داشته باشد، راهنمای بازیابی برای آن ارسال می‌شود.",
      ),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("link", { name: "بازگشت به ورود" }));
    expect(router.state.location.pathname).toBe("/login");
  });
});
