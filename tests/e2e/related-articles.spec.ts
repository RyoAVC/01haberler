import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
test("related articles can be found, ordered and saved without typing IDs", async ({ page }) => {
  test.skip(!process.env.CI, "Isolated CI only");
  const url = new URL(process.env.DATABASE_URL!);
  if (!["localhost", "127.0.0.1"].includes(url.hostname) || url.pathname !== "/haberler01") throw new Error("Isolated database required");
  const db = new PrismaClient();
  try {
    const category = await db.category.findFirstOrThrow();
    const stamp = Date.now(), slug = `picker-${stamp}`;
    const articles = [];
    for (let i = 0; i < 2; i++) articles.push(await db.article.create({ data: { title: `Seçici ${stamp} ${i}`, slug: `picker-${stamp}-${i}`, excerpt: "Test haberi", contentHtml: "<p>İzole test.</p>", status: "PUBLISHED", publishedAt: new Date(), categoryId: category.id } }));
    await page.goto("/admin/giris"); await page.getByLabel("E-posta").fill(process.env.E2E_ADMIN_EMAIL!); await page.getByLabel("Parola").fill(process.env.E2E_ADMIN_PASSWORD!); await page.getByRole("button", { name: /Giriş Yap/i }).click(); await expect(page).toHaveURL(/\/admin(?!\/giris)/);
    await page.goto("/admin/dosyalar");
    await page.getByLabel("Adres", { exact: true }).fill(slug); await page.getByLabel("Başlık", { exact: true }).fill("Seçici test dosyası"); await page.getByLabel("Dosya özeti").fill("İzole ortamda haber seçimi için test dosyası.");
    await page.getByLabel("Yayındaki haberlerde ara").fill(`Seçici ${stamp}`);
    for (const article of articles) await page.getByRole("button", { name: `${article.title} haberini ekle`, exact: true }).click();
    await expect(page.getByRole("button", { name: `${articles[0]!.title} haberini ekle`, exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "2. haberi yukarı taşı", exact: true }).click();
    await expect(page.getByRole("list", { name: "Seçilen haberler" }).locator("li").first()).toContainText(articles[1]!.title);
    await page.getByRole("button", { name: "Dosyayı kaydet", exact: true }).click(); await expect(page.getByText("Dosya kaydedildi.", { exact: false })).toBeVisible();
    const saved = await db.siteSetting.findUniqueOrThrow({ where: { key: `newsroom.collection.${slug}` } });
    expect(saved.value).toMatchObject({ articleIds: [articles[1]!.id, articles[0]!.id] });
    await page.goto(`/admin/dosyalar?edit=${slug}`);
    await expect(page.getByRole("list", { name: "Seçilen haberler" }).locator("li")).toHaveCount(2);
    await page.getByRole("button", { name: "1. haberi seçimden kaldır", exact: true }).click();
    await expect(page.locator('input[name="articleIds"]')).toHaveValue(articles[0]!.id);
  } finally { await db.$disconnect(); }
});
