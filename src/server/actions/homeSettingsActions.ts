"use server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { HOME_SETTINGS_KEY } from "@/server/services/homeSettingsService";
import { revalidatePath } from "next/cache";
import { headlineWindow } from "@/lib/utils/headlineSchedule";
export async function saveHomeSettings(form: FormData) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "settings:manage")) throw new Error("Bu işlem için yetkiniz yok");
  const headlineIds = ["primary", "secondary1", "secondary2"].map(key => String(form.get(key) ?? "").trim());
  const uniqueIds = [...new Set(headlineIds.filter(Boolean))];
  if (uniqueIds.length !== headlineIds.filter(Boolean).length) throw new Error("Aynı haber birden fazla manşet alanına yerleştirilemez.");
  const available = await prisma.article.count({ where: { id: { in: uniqueIds }, status: "PUBLISHED", publishedAt: { lte: new Date() } } });
  if (available !== uniqueIds.length) throw new Error("Yalnızca yayındaki haberler seçilebilir");
  const windows = [0, 1, 2].map(i => headlineWindow(String(form.get(`start${i}`) ?? ""), String(form.get(`end${i}`) ?? "")));
  const value = { headlineIds, campaignsEnabled: form.get("campaignsEnabled") === "on", ...(windows.some(w => w.startAt || w.endAt) ? { windows } : {}) };
  await prisma.$transaction([
    prisma.siteSetting.upsert({ where: { key: HOME_SETTINGS_KEY }, update: { value, updatedById: user.id }, create: { key: HOME_SETTINGS_KEY, value, updatedById: user.id } }),
    prisma.auditLog.create({ data: { userId: user.id, action: "HOME_VITRINE_UPDATE", entityType: "SiteSetting", entityId: HOME_SETTINGS_KEY, metadata: { settings: value, timezone: "Europe/Istanbul" } } }),
  ]);
  revalidatePath("/"); revalidatePath("/admin/vitrin");
}
export async function saveHomeSettingsForm(_state: { error?: string; success?: string }, form: FormData) {
  try {
    await saveHomeSettings(form);
    return { success: "Vitrin kaydedildi. Değişiklikler işlem günlüğüne eklendi." };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const known = ["Bu işlem için yetkiniz yok", "Aynı haber birden fazla manşet alanına yerleştirilemez.", "Yalnızca yayındaki haberler seçilebilir", "Bitiş zamanı başlangıçtan sonra olmalı.", "Geçerli bir yayın zamanı girin."];
    return { error: known.includes(message) ? message : "Vitrin kaydedilemedi. Seçimleriniz korunuyor; tekrar deneyin." };
  }
}
