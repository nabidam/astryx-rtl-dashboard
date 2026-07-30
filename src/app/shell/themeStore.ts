import { create } from "zustand";
import { storage } from "../../lib/storage";

export type ThemeMode = "light" | "dark";

export type ThemeState = {
  mode: ThemeMode;
  toggle: () => void;
};

function hydrateMode(): ThemeMode {
  const persisted = storage.read("theme");
  if (persisted) {
    return persisted.mode;
  }

  const mode: ThemeMode = "dark";
  storage.write("theme", { mode });
  return mode;
}

export const themeStore = create<ThemeState>((set, get) => ({
  mode: hydrateMode(),
  toggle: () => {
    const mode: ThemeMode = get().mode === "light" ? "dark" : "light";
    set({ mode });
    storage.write("theme", { mode });
  },
}));

export const useThemeStore = themeStore;
