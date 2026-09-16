"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { adInputSchema } from "@/lib/validation/ad";

async function requireAdManager() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "ads:manage")) {
    throw new Error("Bu işlem için yetkiniz yok");
  }
  return user;
}

export async function createAd(formData: FormData): Promise<void> {
  const user = await requireAdManager();

  const raw = {
    name: String(formData.get("name") ?? ""),
    slotKey: String(formData.get("slotKey") ?? ""),
    provider: String(formData.get("provider") ?? "MANUAL"),
    placement: String(formData.get("placement") ?? "SIDEBAR"),
    publisherId: (formData.get("publisherId") as string) || null,
    adUnitSlotId: (formData.get("adUnitSlotId") as string) || null,
    isResponsive: formData.get("isResponsive") === "on",
    width: formData.get("width") ? Number(formData.get("width")) : null,
    height: formData.get("height") ? Number(formData.get("height")) : null,
    targetUrl: (formData.get("targetUrl") as string) || null,
    headline: (formData.get("headline") as string) || null,
    showOnDesktop: formData.get("showOnDesktop") === "on",
    showOnTablet: formData.get("showOnTablet") === "on",
    showOnMobile: formData.get("showOnMobile") === "on",
    categoryScope: (formData.get("categoryScope") as string) || null,
    startAt: (formData.get("startAt") as string) || null,
    endAt: (formData.get("endAt") as string) || null,
    priority: Number(formData.get("priority") ?? 0),
    isActive: formData.get("isActive") === "on",
  };

  const parsed = adInputSchema.safeParse(raw);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Geçersiz veri");

  const imageMediaId = (formData.get("imageMediaId") as string) || null;

  await prisma.advertisement.create({
    data: { ...parsed.data, imageMediaId },
  });

  await prisma.auditLog.create({
    data: { userId: user.id, action: "AD_CREATE", entityType: "Advertisement" },
  });

  revalidatePath("/admin/reklamlar");
}

export async function toggleAdActive(adId: string, isActive: boolean): Promise<void> {
  const user = await requireAdManager();
  await prisma.advertisement.update({ where: { id: adId }, data: { isActive } });
  await prisma.auditLog.create({
    data: { userId: user.id, action: isActive ? "AD_ACTIVATE" : "AD_DEACTIVATE", entityType: "Advertisement", entityId: adId },
  });
  revalidatePath("/admin/reklamlar");
}

export async function deleteAd(adId: string): Promise<void> {
  const user = await requireAdManager();
  await prisma.advertisement.delete({ where: { id: adId } });
  await prisma.auditLog.create({
    data: { userId: user.id, action: "AD_DELETE", entityType: "Advertisement", entityId: adId },
  });
  revalidatePath("/admin/reklamlar");
}
