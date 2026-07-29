import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { InternationalizationProvider } from "@astryxdesign/core/i18n";
import { Theme, defineTheme } from "@astryxdesign/core/theme";
import { neutralTheme } from "@astryxdesign/theme-neutral/built";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import faMessages from "../../locale/fa.json";
import { storage } from "../../lib/storage";
import { Header } from "../../app/shell/Header";
import { themeStore } from "../../app/shell/themeStore";
import { authStore } from "../auth/authStore";
import { SettingsPage } from "./SettingsPage";

const testTheme = defineTheme({
  name: "settings-test",
  extends: neutralTheme,
});

const signedInSession = {
  token: "test-token",
  profile: { displayName: "آوا", email: "ava@example.com" },
};

function renderSettings() {
  render(
    <MemoryRouter>
      <Theme theme={testTheme} mode="light">
        <InternationalizationProvider locale="fa" messages={{ fa: faMessages }}>
          <Header />
          <SettingsPage />
        </InternationalizationProvider>
      </Theme>
    </MemoryRouter>,
  );
}

describe("SettingsPage", () => {
  beforeEach(() => {
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
    authStore.setState({ session: signedInSession });
    themeStore.setState({ mode: "light" });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("shows the Persian validation result for an empty display name", () => {
    renderSettings();

    fireEvent.change(screen.getByLabelText(/نام نمایشی/), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByRole("button", { name: "ذخیرهٔ تغییرات" }));

    expect(screen.getByText("نام نمایشی الزامی است")).toBeTruthy();
    expect(authStore.getState().session?.profile.displayName).toBe("آوا");
  });

  it("updates the header immediately and persists a valid profile edit", () => {
    renderSettings();

    fireEvent.change(screen.getByLabelText(/نام نمایشی/), {
      target: { value: "پریسا" },
    });
    fireEvent.change(screen.getByLabelText(/ایمیل/), {
      target: { value: "parisa@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "ذخیرهٔ تغییرات" }));

    expect(screen.getByText("پریسا")).toBeTruthy();
    expect(authStore.getState().session?.profile).toEqual({
      displayName: "پریسا",
      email: "parisa@example.com",
    });
    expect(storage.read("auth")?.profile.displayName).toBe("پریسا");
  });

  it("binds the appearance control to the persisted theme store", () => {
    renderSettings();

    fireEvent.click(screen.getByRole("radio", { name: "تاریک" }));

    expect(themeStore.getState().mode).toBe("dark");
    expect(storage.read("theme")?.mode).toBe("dark");
  });
});
