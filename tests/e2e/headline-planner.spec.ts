import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

test("headline planner supports pool drag, previews, scheduling, duplicate prevention and audit", async ({ page }) => {
  test.skip(!process.env.CI, "Writes only isolated CI data.");
  const dbUrl = new URL(process.env.DATABASE_URL!);
  if (!["localhost", "127.0.0.1"].includes(dbUrl.hostname) || dbUrl.pathname !== "/haberler01") throw new Error("Isolated CI database required");
  const db = new PrismaClient();
  try {
    const category = await db.category.findFirstOrThrow();
    const stamp = Date.now();
    const articles = [];
    for (let i = 0; i < 3; i++) articles.push(await db.article.create({ data: { title: `Planlayıcı ${stamp} ${i}`, slug: `planner-${stamp}-${i}`, excerpt: "İzole test haberi", contentHtml: "<p>Test içeriği.</p>", categoryId: category.id, status: "PUBLISHED", publishedAt: new Date(stamp - i * 1000) } }));
    await page.goto("/admin/giris");
    await page.getByLabel("E-posta").fill(process.env.E2E_ADMIN_EMAIL!);
    await page.getByLabel("Parola").fill(process.env.E2E_ADMIN_PASSWORD!);
    await page.getByRole("button", { name: /Giriş Yap/i }).click();
    await expect(page).toHaveURL(/\/admin(?!\/giris)/);
    await page.goto("/admin/vitrin");
    await page.getByRole("article", { name: `Sürükle: ${articles[2]!.title}`, exact: true }).dragTo(page.getByRole("region", { name: "Birincil manşet", exact: true }));
    await expect(page.locator('select[name="primary"]')).toHaveValue(articles[2]!.id);
    await page.locator('select[name="secondary1"]').selectOption(articles[1]!.id);
    await expect(page.locator(`select[name="secondary2"] option[value="${articles[2]!.id}"]`)).toHaveAttribute("disabled", "");
    await page.getByRole("button", { name: `${articles[2]!.title} haberini İkincil manşet 2 alanına yerleştir`, exact: true }).click();
    await expect(page.locator('select[name="secondary2"]')).toHaveValue("");
    await expect(page.getByText("Bu haber başka bir manşette seçili.", { exact: false })).toBeVisible();
    await page.locator('input[name="start0"]').fill("2020-01-01T00:00");
    await page.locator('input[name="end0"]').fill("2020-01-02T00:00");
    const preview = page.getByTestId("headline-preview");
    await expect(preview.locator("article").first()).toContainText(articles[0]!.title);
    await page.getByRole("button", { name: "Mobil", exact: true }).click();
    await expect(preview).toHaveAttribute("data-view", "mobile");
    await page.getByRole("button", { name: "Masaüstü", exact: true }).click();
    await expect(preview).toHaveAttribute("data-view", "desktop");
    await page.getByRole("button", { name: "Vitrini kaydet", exact: true }).click();
    await expect(page.getByText("Vitrin kaydedildi. Değişiklikler işlem günlüğüne eklendi.", { exact: true })).toBeVisible();
    const audit = await db.auditLog.findFirstOrThrow({ where: { action: "HOME_VITRINE_UPDATE" }, orderBy: { createdAt: "desc" } });
    expect(audit.metadata).toMatchObject({ settings: { headlineIds: [articles[2]!.id, articles[1]!.id, ""] }, timezone: "Europe/Istanbul" });
    for (const width of [360, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await page.goto("/");
    const hero = page.getByRole("region", { name: "Manşetler", exact: true });
    await expect(hero.getByRole("heading").first()).toHaveText(articles[0]!.title);
    const links = await hero.locator('a[href^="/haber/"]').evaluateAll(nodes => nodes.map(n => n.getAttribute("href")));
    expect(new Set(links).size).toBe(links.length);
  } finally { await db.$disconnect(); }
});
