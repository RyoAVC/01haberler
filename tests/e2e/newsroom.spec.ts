import { test, expect } from "@playwright/test";

test("editor can draft, publish and follow a topic while drafts remain private", async ({ page, browser }) => {
  test.skip(!process.env.CI, "Creates test records only in the isolated CI database.");
  const slug = `e2e-dosya-${Date.now()}`;
  await page.goto("/admin/giris");
  await page.getByLabel("E-posta").fill(process.env.E2E_ADMIN_EMAIL!);
  await page.getByLabel("Parola").fill(process.env.E2E_ADMIN_PASSWORD!);
  await page.getByRole("button", { name: /Giriş Yap/i }).click();
  await expect(page).toHaveURL(/\/admin(?!\/giris)/);
  await page.goto("/admin/dosyalar");
  await page.getByLabel("Adres", { exact: true }).fill(slug);
  await page.getByLabel("Başlık", { exact: true }).fill("Test konu dosyası");
  await page.getByLabel("Dosya özeti").fill("Yalnızca izole test veritabanında kullanılan bir dosya özeti.");
  await page.getByRole("button", { name: "Dosyayı kaydet" }).click();
  await expect(page.getByText("Dosya kaydedildi.", { exact: false })).toBeVisible();
  const visitor = await browser.newContext();
  const publicPage = await visitor.newPage();
  const hidden = await publicPage.goto(`http://localhost:3000/konu/${slug}`);
  expect(hidden?.status()).toBe(404);
  await page.goto(`/admin/dosyalar?edit=${slug}`);
  await page.getByLabel("Yayın durumu").selectOption("PUBLISHED");
  await page.getByRole("button", { name: "Dosyayı kaydet" }).click();
  await expect(page.getByText("Dosya kaydedildi.", { exact: false })).toBeVisible();
  await publicPage.goto(`http://localhost:3000/konu/${slug}`);
  await expect(publicPage.getByRole("heading", { name: "Test konu dosyası", exact: true })).toBeVisible();
  await publicPage.getByRole("button", { name: "Takip et +", exact: true }).click();
  await expect(publicPage.getByRole("button", { name: "Takip ediliyor ✓", exact: true })).toBeVisible();
  await publicPage.goto("http://localhost:3000/takip");
  await expect(publicPage.getByRole("link", { name: "Test konu dosyası", exact: true })).toBeVisible();
  for (const width of [360, 390, 768, 1440]) {
    await publicPage.setViewportSize({ width, height: 900 });
    expect(await publicPage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  await visitor.close();
});

test("reader reports stay in moderation and newsletter is honest when unconfigured", async ({ page }) => {
  test.skip(!process.env.CI, "Creates test records only in the isolated CI database.");
  await page.goto("/ihbar");
  await page.getByLabel("Ad soyad", { exact: true }).fill("Test Okuru");
  await page.getByLabel("E-posta", { exact: true }).fill("reader@example.com");
  await page.getByLabel("Konu", { exact: true }).fill("Test düzeltme başvurusu");
  await page.getByLabel("Açıklama", { exact: true }).fill("Bu bir test başvurusudur; gerçek haber veya ihbar değildir.");
  await page.locator('input[name="consent"]').check();
  await page.getByRole("button", { name: "Editöre ilet" }).click();
  await expect(page.getByRole("status")).toContainText("Başvuru numarası:");
  await page.goto("/bulten");
  await expect(page.getByRole("heading", { name: "Bülten yakında" })).toBeVisible();
  await expect(page.locator('input[name="email"]')).toHaveCount(0);
});
