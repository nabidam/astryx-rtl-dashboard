import { expect, test } from "@playwright/test";

test("boots as a Persian RTL document with Vazirmatn", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("html")).toHaveAttribute("lang", "fa");
  await expect(page.locator("p")).toContainText("صفحه ورود");
  await expect(page.locator("p")).toHaveCSS("font-family", /Vazirmatn/);
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
  await expect(page.getByText("صفحه ورود")).toBeVisible();
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
