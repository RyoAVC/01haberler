"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import type { SocialPlatform } from "@prisma/client";
import { SOCIAL_RULES_KEY } from "@/server/services/socialRulesService";

function parseHourField(value: FormDataEntryValue | null): number | null {
  const s = String(value ?? "").trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isInteger(n) && n >= 0 && n <= 23 ? n : null;
}

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

export async function saveSocialRules(formData: FormData): Promise<void> {
  const user = await requireSocialManager();

  const value = {
    quietStartHour: parseHourField(formData.get("quietStartHour")),
    quietEndHour: parseHourField(formData.get("quietEndHour")),
    allowedCategoryIds: formData.getAll("allowedCategoryIds").map(String).filter(Boolean),
  };

  await prisma.siteSetting.upsert({
    where: { key: SOCIAL_RULES_KEY },
    update: { value, updatedById: user.id },
    create: { key: SOCIAL_RULES_KEY, value, updatedById: user.id },
  });

  await prisma.auditLog.create({
    data: { userId: user.id, action: "SOCIAL_RULES_UPDATE", entityType: "SiteSetting", entityId: SOCIAL_RULES_KEY },
  });

  revalidatePath("/admin/sosyal-otomasyon");
}
