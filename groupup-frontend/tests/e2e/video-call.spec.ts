import { test, expect } from "@playwright/test";

test("video call: start button opens call modal in a group", async ({ page }) => {
  await page.goto("/groups");
  await expect(page.locator("text=Campus West 3BR")).toBeVisible();

  // open the first group via its button (the name text is not clickable)
  await page.locator("button", { hasText: "Open group" }).first().click();

  await expect(page.locator("text=Start video check")).toBeVisible();
  await page.locator("text=Start video check").click();

  await expect(page.locator('[aria-label="Hang up"]')).toBeVisible({ timeout: 15000 });
});