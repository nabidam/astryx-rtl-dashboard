import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { themeStore } from "../../app/shell/themeStore";
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
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        addEventListener: vi.fn(),
        addListener: vi.fn(),
        dispatchEvent: vi.fn(),
        matches: false,
        media: query,
        onchange: null,
        removeEventListener: vi.fn(),
        removeListener: vi.fn(),
      })),
    });
    window.localStorage.clear();
    authStore.setState({ session: null });
    themeStore.setState({ mode: "dark" });
  });

  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    authStore.setState({ session: null });
    themeStore.setState({ mode: "dark" });
    Reflect.deleteProperty(window, "matchMedia");
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

  it("uses an email input for the sign-in email", () => {
    renderLoginPage();

    const email = screen.getByLabelText("ایمیل");

    expect(email.getAttribute("type")).toBe("email");
  });

  it("lets the visitor switch to light mode before signing in", () => {
    renderLoginPage();

    fireEvent.click(screen.getByRole("button", { name: "تغییر به حالت روشن" }));

    expect(themeStore.getState().mode).toBe("light");
    expect(window.localStorage.getItem("astryx-dash:theme")).toBe(
      JSON.stringify({ mode: "light" }),
    );
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
