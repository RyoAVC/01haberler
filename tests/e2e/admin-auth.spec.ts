import { test, expect } from "@playwright/test";

test.describe("Admin yetkilendirme", () => {
  test("oturum açmadan /admin/haberler erisimi giris sayfasina yonlendirir", async ({ page }) => {
    await page.goto("/admin/haberler");
    await expect(page).toHaveURL(/\/admin\/giris/);
    await expect(page.getByRole("heading", { name: /Yönetim/i })).toBeVisible();
  });

  test("hatali parola ile giris basarisiz olur", async ({ page }) => {
    await page.goto("/admin/giris");
    await page.getByLabel("E-posta").fill("olmayan@01haberler.com");
    await page.getByLabel("Parola").fill("YanlisParola123");
    await page.getByRole("button", { name: /Giriş Yap/i }).click();
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/giris/);
  });
});
