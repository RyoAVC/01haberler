"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser, destroyAllUserSessions, createSession } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { updateNameSchema, changePasswordSchema } from "@/lib/validation/profile";

export interface ProfileActionResult {
  error?: string;
  success?: string;
}

export async function updateOwnName(formData: FormData): Promise<ProfileActionResult> {
  const user = await getCurrentUser();
  if (!user) return { error: "Oturum bulunamadı" };

  const parsed = updateNameSchema.safeParse({ name: String(formData.get("name") ?? "") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Geçersiz veri" };

  await prisma.user.update({ where: { id: user.id }, data: { name: parsed.data.name } });
  revalidatePath("/admin/profil");
  return { success: "Ad soyad güncellendi." };
}

export async function changeOwnPassword(formData: FormData): Promise<ProfileActionResult> {
  const user = await getCurrentUser();
  if (!user) return { error: "Oturum bulunamadı" };

  const parsed = changePasswordSchema.safeParse({
    currentPassword: String(formData.get("currentPassword") ?? ""),
    newPassword: String(formData.get("newPassword") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Geçersiz veri" };

  const fullUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  const validCurrent = await verifyPassword(fullUser.passwordHash, parsed.data.currentPassword);
  if (!validCurrent) return { error: "Mevcut parola hatalı" };

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  // Parola degisince tum diger oturumlari (ele gecirilmis olabilecek eski
  // oturumlar dahil) sonlandirip yeni bir oturum acariz.
  await destroyAllUserSessions(user.id);
  await createSession(user, null);

  await prisma.auditLog.create({
    data: { userId: user.id, action: "PASSWORD_CHANGE", entityType: "User", entityId: user.id },
  });

  revalidatePath("/admin/profil");
  return { success: "Parolanız güncellendi." };
}
