"use server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { slugSchema } from "@/lib/validation/newsroom";
import { revalidatePath } from "next/cache";
import type { FormResult } from "@/components/admin/ActionForm";
const schema = z.object({ name: z.string().trim().min(2).max(120), slug: slugSchema, bio: z.string().trim().max(4000), expertise: z.string().trim().max(500) });
export async function saveAuthorProfile(_: FormResult, form: FormData): Promise<FormResult> {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "article:create")) return { error: "Oturum gerekli." };
  const data = schema.safeParse(Object.fromEntries(form));
  if (!data.success) return { error: data.error.issues[0]?.message ?? "Geçersiz bilgi." };
  const id = String(form.get("id") ?? "");
  const current = id ? await prisma.author.findUnique({ where: { id } }) : null;
  if (id && (!current || current.userId !== user.id && !hasPermission(user.role, "users:manage"))) return { error: "Bu profili düzenleme yetkiniz yok." };
  if (current && current.slug !== data.data.slug) return { error: "Mevcut yazar adresi değiştirilemez." };
  try {
    await prisma.$transaction(async tx => {
      const { expertise, ...profile } = data.data;
      let authorId = id;
      if (id) {
        const expected = new Date(String(form.get("expected")));
        if (!Number.isFinite(expected.getTime())) throw new Error("conflict");
        const updated = await tx.author.updateMany({ where: { id, updatedAt: expected }, data: profile });
        if (!updated.count) throw new Error("conflict");
      } else { const created = await tx.author.create({ data: { ...profile, userId: user.id } }); authorId = created.id; }
      await tx.siteSetting.upsert({ where: { key: `author_expertise_${authorId}` }, create: { key: `author_expertise_${authorId}`, value: expertise, updatedById: user.id }, update: { value: expertise, updatedById: user.id } });
      await tx.auditLog.create({ data: { userId: user.id, action: "AUTHOR_PROFILE_UPDATE", entityType: "Author", entityId: authorId } });
    });
  } catch { return { error: "Profil kaydedilemedi. Adres zaten kullanılıyor veya kayıt başka bir oturumda değişmiş olabilir; sayfayı yenileyin." }; }
  revalidatePath("/", "layout");
  return { success: "Yazar profili kaydedildi." };
}
