import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { authStore } from "./authStore";
import { LoginPage } from "./LoginPage";

function renderLoginPage() {
  const router = createMemoryRouter(
    [
      { path: "/login", element: <LoginPage /> },
      { path: "/overview", element: <h1>نمای کلی</h1> },
    ],
    { initialEntries: ["/login"] },
  );

  render(<RouterProvider router={router} />);
  return router;
}

describe("LoginPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    authStore.setState({ session: null });
  });

  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    authStore.setState({ session: null });
  });

  it("shows inline Persian validation and does not create a session for empty fields", () => {
    const router = renderLoginPage();

    fireEvent.click(screen.getByRole("button", { name: "ورود به داشبورد" }));

    expect(screen.getByText("ایمیل الزامی است")).toBeTruthy();
    expect(screen.getByText("گذرواژه الزامی است")).toBeTruthy();
    expect(router.state.location.pathname).toBe("/login");
    expect(authStore.getState().session).toBeNull();
    expect(window.localStorage.getItem("astryx-dash:auth")).toBeNull();
  });

  it("accepts non-empty credentials and enters the overview", async () => {
    const router = renderLoginPage();

    fireEvent.change(screen.getByLabelText("ایمیل"), {
      target: { value: "ava@example.com" },
    });
    fireEvent.change(screen.getByLabelText("گذرواژه"), {
      target: { value: "هرچیزی" },
    });
    fireEvent.click(screen.getByRole("button", { name: "ورود به داشبورد" }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/overview");
      expect(screen.getByRole("heading", { name: "نمای کلی" })).toBeTruthy();
    });
    expect(authStore.getState().session?.profile.email).toBe("ava@example.com");
  });
});
