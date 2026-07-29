import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PersistedUser } from "./storage";

const VERSION_KEY = "astryx-dash:v";
const USER_KEY = "astryx-dash:users";
const THEME_KEY = "astryx-dash:theme";

const validUser: PersistedUser = {
  id: "u-1",
  firstName: "آوا",
  lastName: "رضایی",
  email: "ava@example.com",
  role: "viewer",
  status: "active",
  birthDate: "1995-03-20",
  createdAt: "2025-03-20T12:00:00.000Z",
};

async function loadStorage() {
  return import("./storage");
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.resetModules();
  window.localStorage.clear();
});

describe("storage adapter", () => {
  it("resets a corrupt key and exposes the recovery flag", async () => {
    window.localStorage.setItem(VERSION_KEY, "1");
    window.localStorage.setItem(THEME_KEY, "not-json");
    const { read, storage } = await loadStorage();

    expect(read("theme")).toBeNull();
    expect(window.localStorage.getItem(THEME_KEY)).toBeNull();
    expect(storage.recovered).toBe(true);
  });

  it("resets a key with an invalid stored shape", async () => {
    window.localStorage.setItem(VERSION_KEY, "1");
    window.localStorage.setItem(THEME_KEY, JSON.stringify({ mode: "system" }));
    const { read, storage } = await loadStorage();

    expect(read("theme")).toBeNull();
    expect(window.localStorage.getItem(THEME_KEY)).toBeNull();
    expect(storage.recovered).toBe(true);
  });

  it("drops invalid user records while retaining valid users", async () => {
    window.localStorage.setItem(VERSION_KEY, "1");
    window.localStorage.setItem(
      USER_KEY,
      JSON.stringify([
        validUser,
        { ...validUser, id: "", birthDate: "1995-02-31" },
      ]),
    );
    const { read } = await loadStorage();

    expect(read<PersistedUser[]>("users")).toEqual([validUser]);
    expect(window.localStorage.getItem(USER_KEY)).toBe(
      JSON.stringify([validUser]),
    );
  });

  it("switches the entire session to memory-only after the first failed write", async () => {
    const { read, storage, write } = await loadStorage();
    read("theme");
    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementationOnce(() => {
        throw new DOMException("quota exceeded", "QuotaExceededError");
      });

    write("theme", { mode: "dark" });
    write("auth", {
      token: "session-token",
      profile: { displayName: "آوا رضایی", email: "ava@example.com" },
    });

    expect(storage.memoryOnly).toBe(true);
    expect(read("theme")).toEqual({ mode: "dark" });
    expect(read("auth")).toMatchObject({ token: "session-token" });
    expect(window.localStorage.getItem("astryx-dash:auth")).toBeNull();
    expect(setItem).toHaveBeenCalledTimes(1);
  });

  it("uses memory-only mode when localStorage is unavailable at boot", async () => {
    vi.stubGlobal("localStorage", undefined);
    const { read, storage, write } = await loadStorage();

    expect(read("theme")).toBeNull();
    expect(storage.memoryOnly).toBe(true);

    write("theme", { mode: "dark" });
    expect(read("theme")).toEqual({ mode: "dark" });
  });

  it("exports every public signature with the documented return shapes", async () => {
    const [
      { formatJalali, jalaliToIso },
      { toLatinDigits, toPersianDigits },
      { isolate },
      storageModule,
    ] = await Promise.all([
      import("./date"),
      import("./digits"),
      import("./bidi"),
      loadStorage(),
    ]);

    expect(formatJalali("2025-03-21")).toMatch(/^۱۴۰۴\/۰۱\/۰۱$/);
    expect(jalaliToIso({ year: 1404, month: 1, day: 1 })).toBe("2025-03-21");
    expect(toPersianDigits("1404")).toBe("۱۴۰۴");
    expect(toLatinDigits("۱۴۰۴")).toBe("1404");
    expect(isolate("example.com")).toBe("\u2068example.com\u2069");
    expect(storageModule.read("theme")).toBeNull();

    storageModule.write("theme", { mode: "dark" });
    storageModule.clearAll();

    expect(
      Array.from({ length: window.localStorage.length }, (_, index) =>
        window.localStorage.key(index),
      ).filter((key) => key?.startsWith("astryx-dash:")),
    ).toEqual([]);
  });
});
