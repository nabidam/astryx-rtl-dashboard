import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Theme, defineTheme } from "@astryxdesign/core/theme";
import { neutralTheme } from "@astryxdesign/theme-neutral/built";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { storage } from "../../lib/storage";
import { ErrorFallback } from "./ErrorFallback";
import { NotFoundPage } from "./NotFoundPage";

const testTheme = defineTheme({
  name: "errors-test",
  extends: neutralTheme,
});

function renderPage(page: React.ReactNode) {
  return render(
    <Theme theme={testTheme} mode="light">
      <MemoryRouter>{page}</MemoryRouter>
    </Theme>,
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("error pages", () => {
  it("shows a Persian 404 with a link back to the overview", () => {
    renderPage(<NotFoundPage />);

    expect(screen.getByRole("heading", { name: "صفحه پیدا نشد" })).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "بازگشت به نمای کلی" })
        .getAttribute("href"),
    ).toBe("/overview");
  });

  it("clears persisted data before reloading from the 500 fallback", () => {
    const clearAll = vi.spyOn(storage, "clearAll");
    const onReload = vi.fn();
    renderPage(<ErrorFallback onReload={onReload} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "پاک‌کردن داده‌های ذخیره‌شده و شروع دوباره",
      }),
    );

    expect(clearAll).toHaveBeenCalledOnce();
    expect(onReload).toHaveBeenCalledOnce();
  });

  it("offers a direct retry action without clearing data", () => {
    const clearAll = vi.spyOn(storage, "clearAll");
    const onReload = vi.fn();
    renderPage(<ErrorFallback onReload={onReload} />);

    fireEvent.click(screen.getByRole("button", { name: "تلاش دوباره" }));

    expect(onReload).toHaveBeenCalledOnce();
    expect(clearAll).not.toHaveBeenCalled();
  });
});
