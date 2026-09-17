import { test, expect } from "@playwright/test";
test("homepage leads with headlines and masthead stays usable at all widths", async ({ page }) => {
  await page.goto("/");
  const hero = page.getByRole("region", { name: "Manşetler", exact: true });
  await expect(hero).toBeVisible();
  const ticker = page.locator(".home-canvas").getByText("Son Haberler", { exact: true });
  const heroBox = await hero.boundingBox();
  const tickerBox = await ticker.boundingBox();
  if (tickerBox) expect(heroBox!.y).toBeLessThan(tickerBox.y);
  for (const width of [360, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.getByRole("search").getByLabel("Haberlerde ara").fill("test");
  await page.getByRole("search").getByRole("button", { name: "Ara ↗" }).click();
  await expect(page).toHaveURL(/\/arama\?q=test/);
});
