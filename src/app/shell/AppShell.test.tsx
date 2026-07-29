import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { RouterProvider } from "react-router/dom";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTranslator } from "@astryxdesign/core/i18n";
import { Text } from "@astryxdesign/core/Text";
import { authStore } from "../../features/auth/authStore";
import { storage } from "../../lib/storage";
import { router } from "../router";
import { AppShell } from "./AppShell";
import { themeStore } from "./themeStore";

const signedInSession = {
  token: "test-token",
  profile: { displayName: "آوا", email: "ava@example.com" },
};

function TranslationProbe() {
  const translate = useTranslator();

  return <Text>{translate("@astryx.pagination.next")}</Text>;
}

beforeEach(async () => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => {
      return {
        addEventListener: () => undefined,
        addListener: () => undefined,
        dispatchEvent: () => false,
        matches: false,
        media: query,
        onchange: null,
        removeEventListener: () => undefined,
        removeListener: () => undefined,
      } as unknown as MediaQueryList;
    }),
  );
  window.localStorage.clear();
  authStore.setState({ session: null });
  themeStore.setState({ mode: "light" });
  await router.navigate("/login");
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("app shell", () => {
  it("redirects app routes to login without a session and defaults a session to overview", async () => {
    await router.navigate("/users");
    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "ورود به حساب کاربری" }),
      ).toBeTruthy();
    });

    authStore.setState({ session: signedInSession });
    await router.navigate("/");

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "نمای کلی" })).toBeTruthy();
    });
  });

  it("navigates to users inside the shell, re-themes, and logs out", async () => {
    authStore.setState({ session: signedInSession });
    await router.navigate("/overview");
    render(<RouterProvider router={router} />);

    fireEvent.click(screen.getByRole("link", { name: "کاربران" }));
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "کاربران" })).toBeTruthy();
    });

    fireEvent.click(
      screen.getByRole("button", { name: "تغییر به حالت تاریک" }),
    );
    expect(themeStore.getState().mode).toBe("dark");

    fireEvent.click(screen.getByRole("button", { name: "خروج از حساب" }));
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "ورود به حساب کاربری" }),
      ).toBeTruthy();
      expect(authStore.getState().session).toBeNull();
    });
  });

  it("shows the recovery and memory-only notices and supplies Persian catalog strings", () => {
    vi.spyOn(storage, "recovered", "get").mockReturnValue(true);
    vi.spyOn(storage, "memoryOnly", "get").mockReturnValue(true);

    render(
      <MemoryRouter>
        <AppShell>
          <TranslationProbe />
        </AppShell>
      </MemoryRouter>,
    );

    expect(screen.getByText("داده‌های ذخیره‌شده بازنشانی شد")).toBeTruthy();
    expect(
      screen.getByText(/با بارگذاری دوباره، تغییرات از دست می‌روند/),
    ).toBeTruthy();
    expect(screen.getByText("رفتن به صفحه بعد")).toBeTruthy();
  });
});
