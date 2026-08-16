import { test, expect } from "@playwright/test";

test("swipe flow: like button advances to the next card", async ({ page }) => {
  await page.goto("/swipe");
  await expect(page.locator("text=Swipe to match")).toBeVisible();

  const heading = page.locator("h2.text-xl");
  await expect(heading).toBeVisible();
  const firstName = await heading.textContent();

  await page.locator('[aria-label="Like"]').click();

  // the displayed profile name should change
  await expect(heading).not.toHaveText(firstName ?? "", { timeout: 10000 });
});