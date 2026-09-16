"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import type { SocialPlatform } from "@prisma/client";

async function requireSocialManager() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "social:manage")) {
    throw new Error("Bu işlem için yetkiniz yok");
  }
  return user;
}

export async function saveSocialAutoPostConfig(platform: SocialPlatform, formData: FormData): Promise<void> {
  const user = await requireSocialManager();

  const data = {
    isActive: formData.get("isActive") === "on",
    accessToken: (formData.get("accessToken") as string) || null,
    accountRef: (formData.get("accountRef") as string) || null,
    messageTemplate: String(formData.get("messageTemplate") ?? "{{title}} {{url}}"),
  };

  await prisma.socialAutoPostConfig.upsert({
    where: { platform },
    update: data,
    create: { platform, ...data },
  });

  await prisma.auditLog.create({
    data: { userId: user.id, action: "SOCIAL_CONFIG_UPDATE", entityType: "SocialAutoPostConfig", entityId: platform },
  });

  revalidatePath("/admin/sosyal-otomasyon");
}
