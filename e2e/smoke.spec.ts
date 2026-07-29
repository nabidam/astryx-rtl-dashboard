import { expect, test } from "@playwright/test";

test("boots as a Persian RTL document with Vazirmatn", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("html")).toHaveAttribute("lang", "fa");
  await expect(
    page.getByRole("heading", { name: "ورود به حساب کاربری" }),
  ).toBeVisible();
  await expect(page.getByLabel("ایمیل")).toHaveCSS("font-family", /Vazirmatn/);
});

test("logs in with any non-empty credentials and opens the overview", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByLabel("ایمیل").fill("ava@example.com");
  await page.getByLabel("گذرواژه").fill("هرچیزی");
  await page.getByRole("button", { name: "ورود به داشبورد" }).click();

  await expect(page).toHaveURL(/\/overview$/);
  await expect(page.getByRole("heading", { name: "نمای کلی" })).toBeVisible();
});

test("authenticated navigation, theme switching, and logout work in the shell", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("astryx-dash:v", "1");
    window.localStorage.setItem(
      "astryx-dash:auth",
      JSON.stringify({
        token: "e2e-session",
        profile: { displayName: "آوا", email: "ava@example.com" },
      }),
    );
  });

  await page.goto("/users");

  await expect(page.getByRole("heading", { name: "کاربران" })).toBeVisible();
  await page.getByRole("button", { name: "تغییر به حالت تاریک" }).click();
  await expect(
    page.locator('div[data-astryx-theme="astryx-rtl-dashboard-shell"]'),
  ).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "خروج از حساب" }).click();
  await expect(
    page.getByRole("heading", { name: "ورود به حساب کاربری" }),
  ).toBeVisible();
});

test("the users table renders seeded Persian data and finds a persisted user", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("astryx-dash:v", "1");
    window.localStorage.setItem(
      "astryx-dash:auth",
      JSON.stringify({
        token: "e2e-session",
        profile: { displayName: "آوا", email: "ava@example.com" },
      }),
    );
  });

  await page.goto("/users");

  await expect(
    page.getByRole("cell", { name: "آوا رضایی", exact: true }),
  ).toBeVisible();
  await page.evaluate(() => {
    const users = JSON.parse(
      window.localStorage.getItem("astryx-dash:users") ?? "[]",
    ) as unknown[];
    users.push({
      id: "e2e-created-user",
      firstName: "یگانه",
      lastName: "قاسمی",
      email: "yeganeh.ghasemi@example.com",
      role: "viewer",
      status: "active",
      birthDate: "1998-11-22",
      createdAt: "2026-07-29T08:00:00.000Z",
    });
    window.localStorage.setItem("astryx-dash:users", JSON.stringify(users));
  });
  await page.reload();

  await page.getByLabel("جست‌وجوی کاربران").fill("یگانه");
  await expect(
    page.getByRole("cell", { name: "یگانه قاسمی", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("\u2068yeganeh.ghasemi@example.com\u2069"),
  ).toBeVisible();
});

test("corrupt users storage recovers without crashing the authenticated shell", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("astryx-dash:v", "1");
    window.localStorage.setItem(
      "astryx-dash:auth",
      JSON.stringify({
        token: "e2e-session",
        profile: { displayName: "آوا", email: "ava@example.com" },
      }),
    );
    window.localStorage.setItem("astryx-dash:users", "garbage");
  });

  await page.goto("/users");

  await expect(page.getByText("داده‌های ذخیره‌شده بازنشانی شد")).toBeVisible();
  await expect
    .poll(async () => {
      return page.evaluate(() => {
        const rawUsers = window.localStorage.getItem("astryx-dash:users");
        return Array.isArray(JSON.parse(rawUsers ?? "null"));
      });
    })
    .toBe(true);
});
