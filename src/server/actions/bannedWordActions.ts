"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { bannedWordInputSchema } from "@/lib/validation/bannedWord";

async function requireContentFilterManager() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "content-filter:manage")) {
    throw new Error("Bu işlem için yetkiniz yok");
  }
  return user;
}

export async function createBannedWord(formData: FormData): Promise<void> {
  const user = await requireContentFilterManager();

  const raw = {
    word: String(formData.get("word") ?? ""),
    severity: String(formData.get("severity") ?? "FLAG"),
  };

  const parsed = bannedWordInputSchema.safeParse(raw);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Geçersiz veri");

  await prisma.bannedWord.create({ data: parsed.data });
  await prisma.auditLog.create({
    data: { userId: user.id, action: "BANNED_WORD_CREATE", entityType: "BannedWord" },
  });

  revalidatePath("/admin/yasakli-kelimeler");
}

export async function deleteBannedWord(id: string): Promise<void> {
  const user = await requireContentFilterManager();
  await prisma.bannedWord.delete({ where: { id } });
  await prisma.auditLog.create({
    data: { userId: user.id, action: "BANNED_WORD_DELETE", entityType: "BannedWord", entityId: id },
  });
  revalidatePath("/admin/yasakli-kelimeler");
}
