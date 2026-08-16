import { test, expect } from "@playwright/test";

test("group page: seeded groups and agreement template render", async ({ page }) => {
  await page.goto("/groups");
  await expect(page.locator("text=Campus West 3BR")).toBeVisible();
  await page.locator("text=Agreement template").click();
  await expect(page.locator("text=Budget split agreement")).toBeVisible();
  await page.locator("text=Acknowledge").click();
  await expect(page.locator("text=Budget split agreement")).not.toBeVisible();
});