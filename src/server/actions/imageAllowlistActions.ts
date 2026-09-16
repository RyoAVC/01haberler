"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { IMAGE_ALLOWLIST_KEY, addImageAllowlistDomainInternal } from "@/server/services/imageAllowlistService";

async function requireSettingsManager() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "settings:manage")) {
    throw new Error("Bu işlem için yetkiniz yok");
  }
}

export async function addImageAllowlistDomain(formData: FormData): Promise<void> {
  await requireSettingsManager();
  const domain = String(formData.get("domain") ?? "");
  await addImageAllowlistDomainInternal(domain);
  revalidatePath("/admin/ayarlar");
}

export async function removeImageAllowlistDomain(domain: string): Promise<void> {
  await requireSettingsManager();
  const setting = await prisma.siteSetting.findUnique({ where: { key: IMAGE_ALLOWLIST_KEY } });
  const current = Array.isArray(setting?.value) ? (setting.value as string[]) : [];
  await prisma.siteSetting.update({
    where: { key: IMAGE_ALLOWLIST_KEY },
    data: { value: current.filter((d) => d !== domain) },
  });
  revalidatePath("/admin/ayarlar");
}
