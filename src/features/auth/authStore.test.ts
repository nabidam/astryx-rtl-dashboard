import { beforeEach, describe, expect, it, vi } from "vitest";

async function loadStore() {
  return import("./authStore");
}

beforeEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe("authStore", () => {
  it("accepts any credentials, persists a session, and logs out", async () => {
    const { authStore } = await loadStore();

    authStore
      .getState()
      .login({ email: "ava@example.com", password: "هرچیزی" });

    expect(authStore.getState().session).toMatchObject({
      profile: { displayName: "ava", email: "ava@example.com" },
    });
    expect(
      JSON.parse(window.localStorage.getItem("astryx-dash:auth") ?? "null"),
    ).toMatchObject({ profile: { email: "ava@example.com" } });

    authStore.getState().logout();
    expect(authStore.getState().session).toBeNull();
    expect(window.localStorage.getItem("astryx-dash:auth")).toBe("null");
  });

  it("hydrates a persisted session and owns profile updates", async () => {
    window.localStorage.setItem("astryx-dash:v", "1");
    window.localStorage.setItem(
      "astryx-dash:auth",
      JSON.stringify({
        token: "persisted-token",
        profile: { displayName: "آوا", email: "ava@example.com" },
      }),
    );
    const { authStore } = await loadStore();

    expect(authStore.getState().session?.token).toBe("persisted-token");
    expect(
      authStore.getState().updateProfile({
        displayName: "آوا رضایی",
        email: "ava۲@example.com",
      }),
    ).toEqual({ ok: true, value: undefined });
    expect(authStore.getState().session?.profile).toEqual({
      displayName: "آوا رضایی",
      email: "ava2@example.com",
    });
  });

  it("returns Persian field errors without persisting invalid profile data", async () => {
    const { authStore } = await loadStore();
    authStore.getState().login({ email: "old@example.com", password: "x" });
    const before = authStore.getState().session;

    const result = authStore.getState().updateProfile({
      displayName: " ",
      email: "not-an-email",
    });

    expect(result).toEqual({
      ok: false,
      errors: {
        displayName: "نام نمایشی الزامی است",
        email: "ایمیل معتبر نیست",
      },
    });
    expect(authStore.getState().session).toEqual(before);
  });
});
