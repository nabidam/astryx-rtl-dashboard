import { expect, test } from "@playwright/test";

test("Astryx mirrors the shell and keeps the RTL probe within the viewport", async ({
  page,
}, testInfo) => {
  for (const viewportWidth of [1280, 1920]) {
    await page.setViewportSize({ width: viewportWidth, height: 900 });
    await page.goto("/__rtl-spike");

    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByTestId("rtl-probe-shell")).toBeVisible();
    await expect(page.getByTestId("rtl-probe-sidenav")).toBeVisible();
    await expect(
      page.getByRole("table", { name: "جدول کاربران" }),
    ).toBeVisible();

    const sidebarBox = await page
      .getByTestId("rtl-probe-sidenav")
      .boundingBox();
    const contentBox = await page
      .getByTestId("rtl-probe-content")
      .boundingBox();

    if (sidebarBox === null || contentBox === null) {
      throw new Error("ابعاد پوستهٔ RTL قابل اندازه‌گیری نیست");
    }

    expect(sidebarBox.x).toBeGreaterThan(contentBox.x);
    expect(sidebarBox.x + sidebarBox.width).toBeGreaterThanOrEqual(
      viewportWidth - 1,
    );

    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(viewportWidth);
    await expect
      .poll(() => page.evaluate(() => document.body.scrollWidth))
      .toBeLessThanOrEqual(viewportWidth);

    await page.screenshot({
      path: testInfo.outputPath(`rtl-spike-${String(viewportWidth)}.png`),
      fullPage: true,
    });

    await page.getByRole("button", { name: "نمایش گفت‌وگو" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const dialogBox = await dialog.boundingBox();
    if (dialogBox === null) {
      throw new Error("ابعاد گفت‌وگو قابل اندازه‌گیری نیست");
    }
    expect(dialogBox.x).toBeGreaterThanOrEqual(0);
    expect(dialogBox.x + dialogBox.width).toBeLessThanOrEqual(viewportWidth);
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(viewportWidth);
    await page.screenshot({
      path: testInfo.outputPath(
        `rtl-spike-dialog-${String(viewportWidth)}.png`,
      ),
      fullPage: true,
    });
    await page.getByRole("button", { name: "بستن" }).click();
    await expect(dialog).toBeHidden();
  }
});
