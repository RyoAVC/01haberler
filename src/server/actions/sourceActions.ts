"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { sourceInputSchema, feedInputSchema } from "@/lib/validation/source";
import { assertPublicHttpUrl } from "@/lib/security/ssrf";
import { runIngestionJob } from "@/server/ingestion/runIngestionJob";
import { addImageAllowlistDomainInternal } from "@/server/services/imageAllowlistService";

async function requireSourceManager() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, "source:manage")) {
    throw new Error("Bu işlem için yetkiniz yok");
  }
  return user;
}

export async function createSource(formData: FormData): Promise<void> {
  const user = await requireSourceManager();

  const raw = {
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    homepageUrl: String(formData.get("homepageUrl") ?? ""),
    description: (formData.get("description") as string) || null,
    licenseNote: String(formData.get("licenseNote") ?? ""),
    isTrustedForAutoPublish: formData.get("isTrustedForAutoPublish") === "on",
    defaultCategoryId: (formData.get("defaultCategoryId") as string) || null,
    defaultCity: (formData.get("defaultCity") as string) || null,
    onDeleteAction: String(formData.get("onDeleteAction") ?? "KEEP_ARTICLES"),
    isActive: true,
  };

  const parsed = sourceInputSchema.safeParse(raw);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Geçersiz veri");

  await assertPublicHttpUrl(parsed.data.homepageUrl);

  await prisma.source.create({ data: parsed.data });
  await prisma.auditLog.create({
    data: { userId: user.id, action: "SOURCE_CREATE", entityType: "Source" },
  });

  try {
    const hostname = new URL(parsed.data.homepageUrl).hostname.replace(/^www\./, "");
    await addImageAllowlistDomainInternal(hostname);
  } catch {
    // Gorsel allowlist'e ekleme basarisiz olsa da kaynak olusturma islemini bozmaz.
  }

  revalidatePath("/admin/kaynaklar");
}

export async function createFeed(formData: FormData): Promise<void> {
  const user = await requireSourceManager();

  const raw = {
    sourceId: String(formData.get("sourceId") ?? ""),
    url: String(formData.get("url") ?? ""),
    type: String(formData.get("type") ?? "RSS"),
    categoryId: (formData.get("categoryId") as string) || null,
    fetchIntervalMinutes: Number(formData.get("fetchIntervalMinutes") ?? 15),
    isActive: true,
  };

  const parsed = feedInputSchema.safeParse(raw);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Geçersiz veri");

  await assertPublicHttpUrl(parsed.data.url);

  await prisma.feed.create({ data: parsed.data });
  await prisma.auditLog.create({
    data: { userId: user.id, action: "FEED_CREATE", entityType: "Feed" },
  });

  revalidatePath("/admin/kaynaklar");
}

export async function toggleFeedActive(feedId: string, isActive: boolean) {
  await requireSourceManager();
  await prisma.feed.update({ where: { id: feedId }, data: { isActive } });
  revalidatePath("/admin/kaynaklar");
}

export async function toggleSourceAutoPublish(sourceId: string, isTrustedForAutoPublish: boolean) {
  await requireSourceManager();
  await prisma.source.update({ where: { id: sourceId }, data: { isTrustedForAutoPublish } });
  revalidatePath("/admin/kaynaklar");
}

export async function runFeedNow(formData: FormData) {
  await requireSourceManager();
  const feedId = String(formData.get("feedId") ?? "");
  if (!feedId) throw new Error("Feed bulunamadı");

  if (formData.has("categoryId")) await saveFeedCategory(formData);

  await runIngestionJob(feedId, "MANUAL");
  revalidatePath("/admin/kaynaklar");
  revalidatePath("/admin/haberler");
}

export async function saveFeedCategory(formData: FormData): Promise<void> {
  const user = await requireSourceManager();
  const feedId = String(formData.get("feedId") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim() || null;
  if (!feedId) throw new Error("Feed bulunamadı");
  if (categoryId && !await prisma.category.findFirst({ where: { id: categoryId, isActive: true }, select: { id: true } })) {
    throw new Error("Aktif bir kategori seçin");
  }
  await prisma.$transaction(async tx => {
    const before = await tx.feed.findUniqueOrThrow({ where: { id: feedId }, select: { categoryId: true } });
    await tx.feed.update({ where: { id: feedId }, data: { categoryId } });
    await tx.auditLog.create({ data: { userId: user.id, action: "FEED_CATEGORY_UPDATE", entityType: "Feed", entityId: feedId,
      metadata: { previousCategoryId: before.categoryId, categoryId } } });
  });
  revalidatePath("/admin/kaynaklar");
}

export async function runAllActiveFeedsNow() {
  await requireSourceManager();
  const activeFeeds = await prisma.feed.findMany({ where: { isActive: true }, select: { id: true } });
  for (const feed of activeFeeds) {
    await runIngestionJob(feed.id, "MANUAL");
  }
  revalidatePath("/admin/kaynaklar");
  revalidatePath("/admin/haberler");
}
