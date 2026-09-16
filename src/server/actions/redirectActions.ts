"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";

async function requireRedirectManager() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "redirects:manage")) {
    throw new Error("Bu işlem için yetkiniz yok");
  }
  return user;
}

export async function saveRedirect(formData: FormData): Promise<void> {
  const user = await requireRedirectManager();

  const fromPath = String(formData.get("fromPath") ?? "").trim();
  const toPath = String(formData.get("toPath") ?? "").trim();
  const statusCode = Number(formData.get("statusCode") ?? 301);

  if (!fromPath.startsWith("/") || !toPath) {
    throw new Error("Kaynak yol '/' ile başlamalı ve hedef yol boş olamaz");
  }

  await prisma.redirect.create({
    data: { fromPath, toPath, statusCode, isActive: true },
  });

  await prisma.auditLog.create({
    data: { userId: user.id, action: "REDIRECT_CREATE", entityType: "Redirect" },
  });

  revalidatePath("/admin/yonlendirmeler");
}

export async function deleteRedirectAction(id: string): Promise<void> {
  const user = await requireRedirectManager();
  await prisma.redirect.delete({ where: { id } });
  await prisma.auditLog.create({
    data: { userId: user.id, action: "REDIRECT_DELETE", entityType: "Redirect", entityId: id },
  });
  revalidatePath("/admin/yonlendirmeler");
}

export async function toggleRedirectActiveAction(id: string, isActive: boolean): Promise<void> {
  const user = await requireRedirectManager();
  await prisma.redirect.update({ where: { id }, data: { isActive } });
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: isActive ? "REDIRECT_ACTIVATE" : "REDIRECT_DEACTIVATE",
      entityType: "Redirect",
      entityId: id,
    },
  });
  revalidatePath("/admin/yonlendirmeler");
}
