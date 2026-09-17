import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

test("live feed refreshes, pauses and stops for closed archives", async ({ page }) => {
  test.skip(!process.env.CI, "Isolated CI only");
  const url = new URL(process.env.DATABASE_URL!);
  if (!["localhost", "127.0.0.1"].includes(url.hostname) || url.pathname !== "/haberler01") throw new Error("Isolated database required");
  const db = new PrismaClient();
  const slug = `refresh-${Date.now()}`;
  const collection = { kind: "canli", slug, title: "Canlı test dosyası", summary: "Yalnızca test ortamına ait canlı anlatım.", status: "PUBLISHED", articleIds: [] };
  try {
    await db.siteSetting.create({ data: { key: `newsroom.collection.${slug}`, value: collection } });
    await page.clock.install();
    await page.goto(`/canli/${slug}`);
    await expect(page.getByRole("button", { name: "Otomatik yenilemeyi duraklat" })).toBeVisible();
    await db.siteSetting.create({ data: { key: `newsroom.entry.${slug}.1`, value: { collection: slug, title: "Yeni test gelişmesi", body: "Otomatik yenilemeyle gelen test metni.", pinned: false, sourceUrl: "", publishedAt: new Date().toISOString() } } });
    await page.clock.fastForward(31000);
    await expect(page.getByRole("heading", { name: "Yeni test gelişmesi" })).toBeVisible();
    await page.getByRole("button", { name: "Otomatik yenilemeyi duraklat" }).click();
    await db.siteSetting.update({ where: { key: `newsroom.collection.${slug}` }, data: { value: { ...collection, status: "CLOSED" } } });
    await page.clock.fastForward(31000);
    await expect(page.getByRole("button", { name: "Otomatik yenilemeyi sürdür" })).toBeVisible();
    await page.getByRole("button", { name: "Şimdi yenile", exact: true }).click();
    await expect(page.getByText("Arşiv görünümü · otomatik yenileme kapalı.", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Otomatik yenilemeyi sürdür" })).toHaveCount(0);
  } finally { await db.$disconnect(); }
});
