import { expect, test, type Page } from "@playwright/test";

const createdUser = {
  firstName: "یگانه",
  lastName: "قاسمی",
  email: "yeganeh.ghasemi@example.com",
};

async function signIn(page: Page) {
  await page.getByLabel("ایمیل").fill("release-gate@example.com");
  await page.getByLabel("گذرواژه").fill("گذرواژه");
  await page.getByRole("button", { name: "ورود به داشبورد" }).click();
  await expect(page).toHaveURL(/\/overview$/);
}

async function selectEsfandDate(page: Page) {
  await page.getByRole("button", { name: "انتخاب تاریخ تولد" }).click();

  for (let index = 0; index < 5; index += 1) {
    await page.getByRole("button", { name: "ماه قبل" }).click();
  }

  const calendar = page.getByRole("grid", { name: /اسفند/ });
  await expect(calendar).toBeVisible();
  await calendar.locator("button").filter({ hasText: /^۱$/ }).click();
}

async function createUser(page: Page) {
  await page.getByRole("button", { name: "افزودن کاربر" }).click();
  await page
    .getByRole("textbox", { name: /^نام Required$/ })
    .fill(createdUser.firstName);
  await page.getByLabel("نام خانوادگی").fill(createdUser.lastName);
  await page.getByLabel("ایمیل").fill(createdUser.email);
  await selectEsfandDate(page);
  await page.getByRole("button", { name: "ذخیرهٔ کاربر" }).click();
  await expect(page).toHaveURL(/\/users$/);
  await page.getByLabel("جست‌وجوی کاربران").fill(createdUser.firstName);
  await expect(
    page.getByRole("cell", { name: "یگانه قاسمی", exact: true }),
  ).toBeVisible();
}

async function expectOverviewCharts(page: Page) {
  await expect(page.getByRole("heading", { name: "نمای کلی" })).toBeVisible();
  await expect(
    page.getByText("تاریخ‌ها بر پایهٔ تقویم جلالی نمایش داده می‌شوند."),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: /^\d+$/ })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /^[۰-۹]+$/ })).toHaveCount(3);

  const charts = page.locator('[aria-label="نمودار"]');
  await expect(charts).toHaveCount(2);
  await expect(charts.locator("canvas")).toHaveCount(2);
}

test("gate 2: release kernel journey and corrupted-storage recovery", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");

  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("html")).toHaveAttribute("lang", "fa");
  await expect(
    page.getByRole("heading", { name: "ورود به حساب کاربری" }),
  ).toBeVisible();
  await expect(page.getByLabel("ایمیل")).toHaveCSS("font-family", /Vazirmatn/);

  await signIn(page);
  await expectOverviewCharts(page);

  await page.getByRole("link", { name: "کاربران" }).click();
  await expect(page).toHaveURL(/\/users$/);
  await expect(
    page.getByRole("cell", { name: "آوا رضایی", exact: true }),
  ).toBeVisible();
  await createUser(page);

  await page.getByRole("link", { name: "نمای کلی" }).click();
  await expectOverviewCharts(page);
  const initialChartTextColor = await page
    .locator('[aria-label="نمودار"]')
    .first()
    .evaluate((element) => getComputedStyle(element).color);

  await page.getByRole("button", { name: "تغییر به حالت تاریک" }).click();
  await expect(
    page.locator('div[data-astryx-theme="astryx-rtl-dashboard-shell"]'),
  ).toHaveAttribute("data-theme", "dark");
  await expectOverviewCharts(page);
  const darkChartTextColor = await page
    .locator('[aria-label="نمودار"]')
    .first()
    .evaluate((element) => getComputedStyle(element).color);
  expect(darkChartTextColor).not.toBe(initialChartTextColor);

  await page.reload();
  await expect(page).toHaveURL(/\/overview$/);
  await expect(
    page.locator('div[data-astryx-theme="astryx-rtl-dashboard-shell"]'),
  ).toHaveAttribute("data-theme", "dark");
  await expectOverviewCharts(page);
  await page.getByRole("link", { name: "کاربران" }).click();
  await page.getByLabel("جست‌وجوی کاربران").fill(createdUser.firstName);
  await expect(
    page.getByRole("cell", { name: "یگانه قاسمی", exact: true }),
  ).toBeVisible();

  await page.getByRole("link", { name: "تنظیمات" }).click();
  await expect(page.getByRole("heading", { name: "تنظیمات" })).toBeVisible();
  await page.getByLabel("نام نمایشی").fill("مدیر انتشار");
  await page.getByRole("button", { name: "ذخیرهٔ تغییرات" }).click();
  await expect(page.getByText("مدیر انتشار", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("مدیر انتشار", { exact: true })).toBeVisible();

  await page.goto("/route-that-does-not-exist");
  await expect(
    page.getByRole("heading", { name: "صفحه پیدا نشد" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "بازگشت به نمای کلی" }).click();
  await expect(page).toHaveURL(/\/overview$/);

  await page.getByRole("button", { name: "خروج از حساب" }).click();
  await expect(
    page.getByRole("heading", { name: "ورود به حساب کاربری" }),
  ).toBeVisible();

  await signIn(page);
  await page.evaluate(() => {
    window.localStorage.setItem("astryx-dash:users", "garbage");
  });
  await page.reload();
  await expect(page.getByText("داده‌های ذخیره‌شده بازنشانی شد")).toBeVisible();
  await expect(page.getByRole("heading", { name: "نمای کلی" })).toBeVisible();
  await expect
    .poll(async () =>
      page.evaluate(() => {
        const rawUsers = window.localStorage.getItem("astryx-dash:users");
        return Array.isArray(JSON.parse(rawUsers ?? "null"));
      }),
    )
    .toBe(true);
});
