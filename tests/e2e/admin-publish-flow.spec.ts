import { test, expect } from "@playwright/test";

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@01haberler.com";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "DegistirilecekParola123!";

test.describe("Haber olusturma ve yayinlama", () => {
  test("admin giris yapar, haber olusturup yayinlar, haber genel sitede gorunur", async ({ page }) => {
    const uniqueTitle = `E2E Test Haberi ${Date.now()}`;

    await page.goto("/admin/giris");
    await page.getByLabel("E-posta").fill(ADMIN_EMAIL);
    await page.getByLabel("Parola").fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /Giriş Yap/i }).click();
    await expect(page).toHaveURL(/\/admin(?!\/giris)/);

    await page.goto("/admin/haberler/yeni");
    await page.locator("#title").fill(uniqueTitle);
    await page.locator("#excerpt").fill("Bu haber Playwright uctan uca testi tarafindan olusturulmustur.");
    await page.locator("#contentHtml").fill("<p>Bu haberin govde icerigi test amaclidir ve yeterince uzundur.</p>");
    await page.locator("#categoryId").selectOption({ index: 1 });
    await page.locator("#status").selectOption("PUBLISHED");
    await page.getByRole("button", { name: "Kaydet" }).click();

    await expect(page).toHaveURL(/\/admin\/haberler\/.+\/duzenle/);
    await expect(page.getByText("Kaydedildi.")).toBeVisible();

    await page.goto(`/arama?q=${encodeURIComponent(uniqueTitle)}`);
    await expect(page.getByText(uniqueTitle)).toBeVisible();
  });
});
