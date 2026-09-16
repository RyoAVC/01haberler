"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser, destroyAllUserSessions } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { hashPassword } from "@/lib/auth/password";
import { userInputSchema } from "@/lib/validation/user";

async function requireUserManager() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "users:manage")) {
    throw new Error("Bu işlem için yetkiniz yok");
  }
  return user;
}

export async function createUser(formData: FormData): Promise<void> {
  const admin = await requireUserManager();

  const raw = {
    email: String(formData.get("email") ?? ""),
    name: String(formData.get("name") ?? ""),
    password: String(formData.get("password") ?? ""),
    role: String(formData.get("role") ?? "AUTHOR"),
  };

  const parsed = userInputSchema.safeParse(raw);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Geçersiz veri");

  const passwordHash = await hashPassword(parsed.data.password);

  await prisma.user.create({
    data: {
      email: parsed.data.email,
      name: parsed.data.name,
      role: parsed.data.role,
      passwordHash,
    },
  });

  await prisma.auditLog.create({
    data: { userId: admin.id, action: "USER_CREATE", entityType: "User" },
  });

  revalidatePath("/admin/kullanicilar");
}

export async function toggleUserActive(userId: string, isActive: boolean): Promise<void> {
  const admin = await requireUserManager();
  if (userId === admin.id) throw new Error("Kendi hesabınızı devre dışı bırakamazsınız");

  await prisma.user.update({ where: { id: userId }, data: { isActive } });
  if (!isActive) await destroyAllUserSessions(userId);

  await prisma.auditLog.create({
    data: { userId: admin.id, action: isActive ? "USER_ACTIVATE" : "USER_DEACTIVATE", entityType: "User", entityId: userId },
  });

  revalidatePath("/admin/kullanicilar");
}

export async function changeUserRole(userId: string, formData: FormData): Promise<void> {
  const admin = await requireUserManager();
  const role = String(formData.get("role") ?? "");
  if (!["SUPER_ADMIN", "EDITOR", "AUTHOR"].includes(role)) throw new Error("Geçersiz rol");
  if (userId === admin.id) throw new Error("Kendi rolünüzü değiştiremezsiniz");

  await prisma.user.update({ where: { id: userId }, data: { role: role as "SUPER_ADMIN" | "EDITOR" | "AUTHOR" } });
  await prisma.auditLog.create({
    data: { userId: admin.id, action: "USER_ROLE_CHANGE", entityType: "User", entityId: userId, metadata: { role } },
  });

  revalidatePath("/admin/kullanicilar");
}
