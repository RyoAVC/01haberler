"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { savePushSubscription, sendPushToAllSubscribers } from "@/server/services/pushService";

export async function subscribeToPushAction(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  userAgent?: string
): Promise<void> {
  await savePushSubscription(subscription, userAgent);
}

export async function sendManualPushAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "push:manage")) {
    throw new Error("Bu işlem için yetkiniz yok");
  }

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const url = (formData.get("url") as string) || undefined;

  if (!title || !body) {
    throw new Error("Başlık ve mesaj gerekli");
  }

  await sendPushToAllSubscribers({ title, body, url });

  await prisma.auditLog.create({
    data: { userId: user.id, action: "PUSH_SEND_MANUAL", entityType: "PushSubscription" },
  });

  revalidatePath("/admin/bildirimler");
}
