import { expect, test } from "@playwright/test";

const newUser = {
  firstName: "یگانه",
  lastName: "قاسمی",
  email: "yeganeh.ghasemi@example.com",
};

async function fillUserIdentity(page: import("@playwright/test").Page) {
  await page
    .getByRole("textbox", { name: /^نام Required$/ })
    .fill(newUser.firstName);
  await page.getByLabel("نام خانوادگی").fill(newUser.lastName);
  await page.getByLabel("ایمیل").fill(newUser.email);
}

async function selectPastEsfandDate(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "انتخاب تاریخ تولد" }).click();

  // The current Jalali month is after Esfand 1404; moving back confirms the
  // picker exposes its Persian calendar navigation in the real browser.
  for (let index = 0; index < 5; index += 1) {
    await page.getByRole("button", { name: "ماه قبل" }).click();
  }

  const calendar = page.getByRole("grid", { name: /اسفند/ });
  await expect(calendar).toBeVisible();
  await calendar.locator("button").filter({ hasText: /^۱$/ }).click();
}

async function selectFutureDate(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "انتخاب تاریخ تولد" }).click();

  for (let index = 0; index < 12; index += 1) {
    await page.getByRole("button", { name: "ماه بعد" }).click();
  }

  await page
    .getByRole("grid")
    .locator("button")
    .filter({ hasText: /^۱$/ })
    .click();
}

test("gate 1: fresh-profile auth and users CRUD journey", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");

  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("html")).toHaveAttribute("lang", "fa");
  await expect(
    page.getByRole("heading", { name: "ورود به حساب کاربری" }),
  ).toBeVisible();
  await expect(page.getByLabel("ایمیل")).toHaveCSS("font-family", /Vazirmatn/);

  await page.getByLabel("ایمیل").fill("gate-1@example.com");
  await page.getByLabel("گذرواژه").fill("گذرواژه");
  await page.getByRole("button", { name: "ورود به داشبورد" }).click();
  await expect(page).toHaveURL(/\/overview$/);
  await expect(page.getByRole("heading", { name: "نمای کلی" })).toBeVisible();

  await page.getByRole("link", { name: "کاربران" }).click();
  await expect(page).toHaveURL(/\/users$/);
  await expect(
    page.getByRole("cell", { name: "آوا رضایی", exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: "افزودن کاربر" }).click();
  await fillUserIdentity(page);
  await selectPastEsfandDate(page);
  await page.getByRole("button", { name: "ذخیرهٔ کاربر" }).click();
  await expect(page).toHaveURL(/\/users$/);

  await page.getByLabel("جست‌وجوی کاربران").fill(newUser.firstName);
  await expect(
    page.getByRole("cell", { name: "یگانه قاسمی", exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: "تغییر به حالت تاریک" }).click();
  await expect(
    page.locator('div[data-astryx-theme="astryx-rtl-dashboard-shell"]'),
  ).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page).toHaveURL(/\/users$/);
  await page.getByLabel("جست‌وجوی کاربران").fill(newUser.firstName);
  await expect(
    page.getByRole("cell", { name: "یگانه قاسمی", exact: true }),
  ).toBeVisible();
  await expect(
    page.locator('div[data-astryx-theme="astryx-rtl-dashboard-shell"]'),
  ).toHaveAttribute("data-theme", "dark");

  await page.getByRole("button", { name: "اقدامات یگانه قاسمی" }).click();
  await page.getByRole("menuitem", { name: "ویرایش" }).click();
  await expect(page.getByLabel("نام خانوادگی")).toHaveValue("قاسمی");
  await page.getByLabel("نام خانوادگی").fill("کاظمی");
  await page.getByRole("button", { name: "ذخیرهٔ کاربر" }).click();
  await page.getByLabel("جست‌وجوی کاربران").fill(newUser.firstName);
  await expect(
    page.getByRole("cell", { name: "یگانه کاظمی", exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: "اقدامات یگانه کاظمی" }).click();
  await page.getByRole("menuitem", { name: "حذف" }).click();
  await page.getByRole("button", { name: "حذف کاربر" }).click();
  await expect(
    page.getByRole("cell", { name: "یگانه کاظمی", exact: true }),
  ).toBeHidden();

  await page.getByRole("button", { name: "افزودن کاربر" }).click();
  await page.getByRole("textbox", { name: /^نام Required$/ }).fill("آزمون");
  await page.getByLabel("نام خانوادگی").fill("نامعتبر");
  await page.getByLabel("ایمیل").fill("ava.rezaei@example.com");
  await selectFutureDate(page);
  await page.getByRole("button", { name: "ذخیرهٔ کاربر" }).click();
  await expect(page.getByText("این ایمیل قبلاً ثبت شده است")).toBeVisible();
  await expect(
    page.getByRole("alert").filter({
      hasText: "تاریخ تولد نمی‌تواند در آینده باشد",
    }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/users\/new$/);

  await page.setViewportSize({ width: 1920, height: 900 });
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(1920);
});
