import { beforeEach, describe, expect, it, vi } from "vitest";
import { fixtures } from "./fixtures";

async function loadStore() {
  return import("./usersStore");
}

const validInput = {
  firstName: "مینا",
  lastName: "حیدری",
  email: "mina@example.com",
  birthDate: { year: 1402, month: 6, day: 12 },
} as const;

beforeEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe("usersStore", () => {
  it("seeds fixtures only when the users key is absent", async () => {
    const firstStore = await loadStore();
    expect(firstStore.usersStore.getState().users).toEqual(fixtures);
    expect(window.localStorage.getItem("astryx-dash:users")).not.toBeNull();

    window.localStorage.setItem("astryx-dash:users", "[]");
    vi.resetModules();
    const secondStore = await loadStore();
    expect(secondStore.usersStore.getState().users).toEqual([]);
  });

  it("validates create and update without persisting invalid input", async () => {
    const { usersStore } = await loadStore();
    const before = usersStore.getState().users;
    const persistedBefore = window.localStorage.getItem("astryx-dash:users");

    const invalid = usersStore.getState().create({
      ...validInput,
      firstName: " ",
      email: "ava.rezaei@example.com",
      birthDate: { year: 1402, month: 12, day: 30 },
    });
    expect(invalid).toEqual({
      ok: false,
      errors: {
        firstName: "نام الزامی است",
        email: "این ایمیل قبلاً ثبت شده است",
        birthDate: "تاریخ تولد معتبر نیست",
      },
    });
    expect(usersStore.getState().users).toEqual(before);
    expect(window.localStorage.getItem("astryx-dash:users")).toBe(
      persistedBefore,
    );

    const created = usersStore.getState().create({
      ...validInput,
      role: "editor",
      status: "inactive",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) {
      throw new Error("expected valid user");
    }
    expect(created.value).toMatchObject({
      firstName: "مینا",
      role: "editor",
      status: "inactive",
      birthDate: "2023-09-03",
    });
    expect(created.value.id).toBeTypeOf("string");
    expect(created.value.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    const duplicate = usersStore.getState().update(created.value.id, {
      ...validInput,
      email: "AVA.REZAEI@example.com",
    });
    expect(duplicate).toEqual({
      ok: false,
      errors: { email: "این ایمیل قبلاً ثبت شده است" },
    });
  });

  it("rejects future dates and honors leap Esfand dates", async () => {
    const { usersStore } = await loadStore();
    const future = usersStore.getState().create({
      ...validInput,
      birthDate: { year: 1500, month: 1, day: 1 },
    });
    expect(future).toEqual({
      ok: false,
      errors: { birthDate: "تاریخ تولد نمی‌تواند در آینده باشد" },
    });

    const leap = usersStore.getState().create({
      ...validInput,
      email: "leap@example.com",
      birthDate: { year: 1403, month: 12, day: 30 },
    });
    expect(leap.ok).toBe(true);
  });

  it("searches Persian text and digits, sorts stably, filters, and paginates", async () => {
    const { usersStore } = await loadStore();
    const store = usersStore.getState();

    expect(store.query({ search: "آوا" })).toHaveLength(1);
    expect(store.query({ search: "fixture-1" })).toHaveLength(0);
    expect(store.query({ search: "۱۴۰۴" })).toHaveLength(0);
    expect(store.query({ search: "ava" })[0]?.email).toBe(
      "ava.rezaei@example.com",
    );
    expect(store.query({ filter: "inactive" })).toEqual([
      expect.objectContaining({ firstName: "سارا" }),
    ]);
    expect(
      store.query({ sort: "name-asc", page: 1, pageSize: 2 }),
    ).toHaveLength(2);
    expect(
      store.query({ sort: "name-asc", page: 2, pageSize: 2 }),
    ).toHaveLength(2);
  });

  it("removes users and persists the empty state", async () => {
    const { usersStore } = await loadStore();
    for (const user of [...usersStore.getState().users]) {
      usersStore.getState().remove(user.id);
    }

    expect(usersStore.getState().users).toEqual([]);
    expect(window.localStorage.getItem("astryx-dash:users")).toBe("[]");
  });
});
