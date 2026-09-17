import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { COLLECTION_PREFIX, ENTRY_PREFIX, collectionSchema, liveEntrySchema, type NewsCollection } from "@/lib/validation/newsroom";

// Each item is a separate row. Existing SiteSetting storage avoids a destructive
// database migration; timestamps provide optimistic concurrency for editorial saves.
export async function saveNewsroomRecord(key: string, value: Prisma.InputJsonValue, userId: string, expected?: string) {
  await prisma.$transaction(async tx => {
    if (expected) {
      if (!Number.isFinite(Date.parse(expected))) throw new Error("Geçersiz kayıt sürümü.");
      const result = await tx.siteSetting.updateMany({ where: { key, updatedAt: new Date(expected) }, data: { value, updatedById: userId } });
      if (!result.count) throw new Error("Kayıt başka bir oturumda değişti. Sayfayı yenileyip tekrar deneyin.");
    } else {
      await tx.siteSetting.create({ data: { key, value, updatedById: userId } });
    }
    await tx.auditLog.create({ data: { userId, action: expected ? "NEWSROOM_UPDATE" : "NEWSROOM_CREATE", entityType: "Newsroom", entityId: key } });
  });
}
export async function getCollection(slug: string, publicOnly = true) {
  const row = await prisma.siteSetting.findUnique({ where: { key: COLLECTION_PREFIX + slug } });
  const parsed = collectionSchema.safeParse(row?.value);
  if (!row || !parsed.success || (publicOnly && parsed.data.status === "DRAFT")) return null;
  return { ...parsed.data, updatedAt: row.updatedAt.toISOString() };
}
export async function listCollections(kind?: NewsCollection["kind"], publicOnly = true, page = 1, city = "") {
  const rows = await prisma.siteSetting.findMany({ where: { key: { startsWith: COLLECTION_PREFIX }, AND: [
    ...(kind ? [{ value: { path: ["kind"], equals: kind } }] : []),
    ...(city ? [{ value: { path: ["cityKey"], equals: city.trim().toLocaleLowerCase("tr") } }] : []),
    ...(publicOnly ? [{ OR: [{ value: { path: ["status"], equals: "PUBLISHED" } }, { value: { path: ["status"], equals: "CLOSED" } }] }] : []),
  ] }, orderBy: [{ updatedAt: "desc" }, { key: "asc" }], take: 25, skip: (Math.min(1000, Math.max(1, Math.floor(page))) - 1) * 25 });
  return rows.flatMap(row => { const p = collectionSchema.safeParse(row.value); return p.success ? [{ ...p.data, updatedAt: row.updatedAt.toISOString() }] : []; });
}
export async function getLiveEntries(slug: string, page = 1) {
  const rows = await prisma.siteSetting.findMany({ where: { key: { startsWith: `${ENTRY_PREFIX}${slug}.` } }, orderBy: [{ key: "desc" }], take: 50, skip: (Math.max(1, Math.min(1000, Math.floor(page))) - 1) * 50 });
  return rows.flatMap(row => { const p = liveEntrySchema.safeParse(row.value); return p.success ? [{ ...p.data, id: row.key, updatedAt: row.updatedAt.toISOString() }] : []; }).sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.publishedAt.localeCompare(a.publishedAt));
}
export async function getLiveEntry(slug: string, key: string) {
  if (!key.startsWith(`${ENTRY_PREFIX}${slug}.`) || key.length > 220) return null;
  const row = await prisma.siteSetting.findUnique({ where: { key } });
  const parsed = liveEntrySchema.safeParse(row?.value);
  return row && parsed.success && parsed.data.collection === slug ? { ...parsed.data, id: row.key, updatedAt: row.updatedAt.toISOString() } : null;
}
export function entryKey(slug: string) { return `${ENTRY_PREFIX}${slug}.${Date.now()}.${randomUUID()}`; }
