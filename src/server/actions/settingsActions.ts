"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";

const ALLOWED_KEYS = ["ads_txt_content", "site_meta_description"] as const;
type AllowedKey = (typeof ALLOWED_KEYS)[number];

async function requireSettingsManager() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "settings:manage")) {
    throw new Error("Bu işlem için yetkiniz yok");
  }
  return user;
}

export async function updateSiteSetting(key: AllowedKey, formData: FormData): Promise<void> {
  const user = await requireSettingsManager();
  if (!ALLOWED_KEYS.includes(key)) throw new Error("Geçersiz ayar anahtarı");

  const value = String(formData.get("value") ?? "");

  await prisma.siteSetting.upsert({
    where: { key },
    update: { value, updatedById: user.id },
    create: { key, value, updatedById: user.id },
  });

  await prisma.auditLog.create({
    data: { userId: user.id, action: "SETTING_UPDATE", entityType: "SiteSetting", entityId: key },
  });

  revalidatePath("/admin/ayarlar");
  revalidatePath("/ads.txt");
}
