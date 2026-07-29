import { beforeEach, describe, expect, it, vi } from "vitest";

async function loadStore() {
  return import("./themeStore");
}

beforeEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe("themeStore", () => {
  it("defaults to light, toggles, and persists the selected mode", async () => {
    const { themeStore } = await loadStore();

    expect(themeStore.getState().mode).toBe("light");
    themeStore.getState().toggle();

    expect(themeStore.getState().mode).toBe("dark");
    expect(window.localStorage.getItem("astryx-dash:theme")).toBe(
      JSON.stringify({ mode: "dark" }),
    );
  });

  it("hydrates dark mode on a new store instance", async () => {
    window.localStorage.setItem("astryx-dash:v", "1");
    window.localStorage.setItem(
      "astryx-dash:theme",
      JSON.stringify({ mode: "dark" }),
    );

    const { themeStore } = await loadStore();
    expect(themeStore.getState().mode).toBe("dark");
  });
});
