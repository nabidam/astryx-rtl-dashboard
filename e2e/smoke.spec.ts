import { expect, test } from "@playwright/test";

test("boots as a Persian RTL document with Vazirmatn", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("html")).toHaveAttribute("lang", "fa");
  await expect(page.locator("p")).toContainText("اسکلت داشبورد آماده است");
  await expect(page.locator("p")).toHaveCSS("font-family", /Vazirmatn/);
});
