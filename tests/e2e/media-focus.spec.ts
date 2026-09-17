import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

test("media focal point supports pointer, keyboard, reset and persistent save", async ({ page }) => {
  test.skip(!process.env.CI, "Isolated CI only");
  const url = new URL(process.env.DATABASE_URL!);
  if (!["localhost", "127.0.0.1"].includes(url.hostname) || url.pathname !== "/haberler01") throw new Error("Isolated database required");
  const db = new PrismaClient();
  try {
    const filename = `focus-test-${Date.now()}`;
    const media = await db.media.create({ data: { url: "/images/placeholder-news.svg", originalFilename: filename, mimeType: "image/svg+xml", sizeBytes: 100 } });
    await page.goto("/admin/giris");
    await page.getByLabel("E-posta").fill(process.env.E2E_ADMIN_EMAIL!);
    await page.getByLabel("Parola").fill(process.env.E2E_ADMIN_PASSWORD!);
    await page.getByRole("button", { name: /Giriş Yap/i }).click();
    await expect(page).toHaveURL(/\/admin(?!\/giris)/);
    await page.goto(`/admin/medya?q=${filename}`);
    await page.getByText("Bilgileri düzenle", { exact: true }).click();
    const picker = page.getByRole("button", { name: "Görsel üzerinde odak seç", exact: true });
    await expect(picker.locator("img")).toBeVisible();
    const box = await picker.boundingBox();
    await picker.click({ position: { x: box!.width * 0.25, y: box!.height * 0.75 } });
    await expect(page.getByLabel("Odak X (0–100)")).toHaveValue("25");
    await expect(page.getByLabel("Odak Y (0–100)")).toHaveValue("75");
    await page.getByRole("button", { name: "Merkeze al" }).click();
    await expect(page.getByLabel("Odak X (0–100)")).toHaveValue("50");
    await page.getByLabel("Odak X (0–100)").fill("30");
    await expect(page.getByRole("group", { name: "Kırpma önizlemeleri" }).locator("img").first()).toHaveCSS("object-position", "30% 50%");
    await page.getByRole("button", { name: "Bilgileri kaydet" }).click();
    await expect(page.getByRole("status")).toContainText("Görsel bilgileri kaydedildi.");
    const saved = await db.siteSetting.findUniqueOrThrow({ where: { key: `media_metadata_${media.id}` } });
    expect(saved.value).toMatchObject({ focusX: 30, focusY: 50 });
    expect(await db.auditLog.count({ where: { entityId: media.id, action: "MEDIA_METADATA_UPDATE" } })).toBe(1);
  } finally { await db.$disconnect(); }
});
