"use server";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { mediaLibraryWhere } from "@/server/services/mediaLibraryService";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
export async function saveMediaMetadata(id: string, form: FormData) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "article:create")) throw new Error("Yetkiniz yok.");
  const media = await prisma.media.findFirst({ where: { ...mediaLibraryWhere(user, ""), id }, select: { id: true } });
  if (!media) throw new Error("Görsel bulunamadı veya düzenleme yetkiniz yok.");
  const altText = String(form.get("altText") ?? "").trim().slice(0, 200);
  const credit = String(form.get("credit") ?? "").trim().slice(0, 300);
  const rights = String(form.get("rights") ?? "").trim().slice(0, 1000);
  const key = `media_metadata_${id}`;
  const focusX = Number(form.get("focusX") ?? 50), focusY = Number(form.get("focusY") ?? 50);
  if (![focusX, focusY].every(n => Number.isFinite(n) && n >= 0 && n <= 100)) throw new Error("Odak noktası 0–100 aralığında olmalı.");
  await prisma.$transaction([
    prisma.media.update({ where: { id }, data: { altText: altText || null } }),
    prisma.siteSetting.upsert({ where: { key }, create: { key, value: { credit, rights, focusX, focusY }, updatedById: user.id }, update: { value: { credit, rights, focusX, focusY }, updatedById: user.id } }),
    prisma.auditLog.create({ data: { userId: user.id, action: "MEDIA_METADATA_UPDATE", entityType: "Media", entityId: id } }),
  ]);
  revalidatePath("/admin/medya"); revalidatePath("/", "layout");
  redirect(`/admin/medya?kaydedildi=${encodeURIComponent(id)}`);
}
