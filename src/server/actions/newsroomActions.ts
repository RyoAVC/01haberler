"use server";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { collectionSchema, liveEntrySchema, lines, COLLECTION_PREFIX, ENTRY_PREFIX } from "@/lib/validation/newsroom";
import { saveNewsroomRecord, getCollection, entryKey } from "@/server/services/newsroomStore";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { FormResult } from "@/components/admin/ActionForm";
import { Prisma } from "@prisma/client";

async function requireEditor() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "article:publish")) throw new Error("Bu işlem için editör yetkisi gerekli.");
  return user;
}
function fail(error: unknown): FormResult {
  if (error instanceof Prisma.PrismaClientKnownRequestError) return { error: error.code === "P2002" ? "Bu adres zaten kullanılıyor." : "Kayıt tamamlanamadı; yeniden deneyin." };
  return { error: error instanceof Error ? error.message : "Kayıt tamamlanamadı." };
}
export async function saveCollectionAction(_: FormResult, form: FormData): Promise<FormResult> {
  try {
    const user = await requireEditor();
    const parsed = collectionSchema.safeParse({ ...Object.fromEntries(form), articleIds: lines(form.get("articleIds")) });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Geçersiz bilgi." };
    const data = parsed.data;
    const existing = await getCollection(data.slug, false);
    if (existing && existing.kind !== data.kind) return { error: "Dosyanın türü değiştirilemez." };
    const articles = await prisma.article.count({ where: { id: { in: data.articleIds }, status: "PUBLISHED", publishedAt: { lte: new Date() } } });
    if (articles !== data.articleIds.length) return { error: "Yalnızca yayındaki haberleri ekleyebilirsiniz." };
    await saveNewsroomRecord(COLLECTION_PREFIX + data.slug, { ...data, cityKey: data.city.toLocaleLowerCase("tr") }, user.id, String(form.get("expected") ?? "") || undefined);
    revalidatePath("/", "layout");
    return { success: "Dosya kaydedildi. Düzenlemeye devam etmeden önce aşağıdaki listeden dosyayı yeniden açın." };
  } catch (error) { return fail(error); }
}
export async function saveLiveEntryAction(_: FormResult, form: FormData): Promise<FormResult> {
  try {
    const user = await requireEditor();
    const collection = await getCollection(String(form.get("collection")), false);
    if (!collection || collection.kind !== "canli" || collection.status === "CLOSED") return { error: "Canlı anlatım bulunamadı veya kapatıldı." };
    const id = String(form.get("id") ?? "");
    if (id && !id.startsWith(`${ENTRY_PREFIX}${collection.slug}.`)) return { error: "Geçersiz gelişme." };
    const previous = id ? await prisma.siteSetting.findUnique({ where: { key: id } }) : null;
    const old = liveEntrySchema.safeParse(previous?.value);
    if (id && !old.success) return { error: "Gelişme bulunamadı." };
    const parsed = liveEntrySchema.safeParse({ ...Object.fromEntries(form), pinned: form.get("pinned") === "on", publishedAt: old.success ? old.data.publishedAt : new Date().toISOString() });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Geçersiz bilgi." };
    if (id && !parsed.data.correction) return { error: "Düzenlemede bir düzeltme notu yazın." };
    await saveNewsroomRecord(id || entryKey(collection.slug), parsed.data, user.id, id ? String(form.get("expected")) : undefined);
    revalidatePath("/", "layout");
    return { success: "Gelişme kaydedildi. Güncel listeyi görmek için sayfayı yenileyin." };
  } catch (error) { return fail(error); }
}
