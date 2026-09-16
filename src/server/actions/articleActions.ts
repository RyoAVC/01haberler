"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { articleInputSchema } from "@/lib/validation/article";
import { sanitizeArticleHtml } from "@/lib/utils/sanitize";
import { slugify } from "@/lib/utils/slug";
import { estimateReadingTimeMinutes } from "@/lib/utils/readingTime";
import { findBannedWordMatches } from "@/server/services/bannedWordService";
import { postArticleToSocialPlatforms, pingGoogleSitemap } from "@/server/services/socialPostService";
import type { ArticleStatus } from "@prisma/client";
import { parsePublicationSchedule } from "@/lib/utils/publicationSchedule";
import { canEditArticle } from "@/server/services/articleAccessService";

async function requirePermission(permission: Parameters<typeof hasPermission>[1]) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, permission)) {
    throw new Error("Bu işlem için yetkiniz yok");
  }
  return user;
}

async function setStatus(articleId: string, status: ArticleStatus, action: string) {
  const user = await requirePermission("article:publish");

  const data: { status: ArticleStatus; publishedAt?: Date } = { status };
  if (status === "PUBLISHED") {
    const existing = await prisma.article.findUnique({ where: { id: articleId }, select: { publishedAt: true } });
    if (!existing?.publishedAt) data.publishedAt = new Date();
  }

  const updated = await prisma.article.update({ where: { id: articleId }, data });
  await prisma.auditLog.create({
    data: { userId: user.id, action, entityType: "Article", entityId: articleId },
  });

  if (status === "PUBLISHED") {
    await postArticleToSocialPlatforms(updated);
    await pingGoogleSitemap();
  }

  revalidatePath("/admin/haberler");
  revalidatePath("/");
}

export async function approveArticle(articleId: string) {
  await setStatus(articleId, "PUBLISHED", "ARTICLE_APPROVE_PUBLISH");
}

export async function rejectArticle(articleId: string) {
  await setStatus(articleId, "REJECTED", "ARTICLE_REJECT");
}

export async function publishArticle(articleId: string) {
  await setStatus(articleId, "PUBLISHED", "ARTICLE_PUBLISH");
}

export async function archiveArticle(articleId: string) {
  await setStatus(articleId, "ARCHIVED", "ARTICLE_ARCHIVE");
}

export async function bulkApproveArticles(formData: FormData) {
  const user = await requirePermission("article:publish");
  const ids = formData.getAll("articleIds").map(String);
  if (ids.length === 0) return;

  const now = new Date();
  const existingArticles = await prisma.article.findMany({ where: { id: { in: ids } }, select: { id: true, publishedAt: true } });
  await prisma.$transaction(
    ids.map((id) =>
      prisma.article.update({
        where: { id },
        data: { status: "PUBLISHED", publishedAt: existingArticles.find(a => a.id === id)?.publishedAt ?? now },
      })
    )
  );

  await prisma.auditLog.create({
    data: { userId: user.id, action: "ARTICLE_BULK_APPROVE_PUBLISH", entityType: "Article", metadata: { ids } },
  });

  revalidatePath("/admin/haberler");
  revalidatePath("/");
}

async function generateUniqueSlug(title: string, ignoreId?: string): Promise<string> {
  const base = slugify(title) || "haber";
  let candidate = base;
  let suffix = 1;
  while (true) {
    const existing = await prisma.article.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!existing || existing.id === ignoreId) return candidate;
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}

export interface SaveArticleResult {
  error?: string;
}

export async function saveArticle(articleId: string | null, formData: FormData): Promise<SaveArticleResult> {
  const user = await requirePermission(articleId ? "article:edit:own" : "article:create");
  if (articleId && !await canEditArticle(user, articleId)) return { error: "Bu haberi düzenleme yetkiniz yok." };
  let scheduledAt: Date | null;
  try { scheduledAt = parsePublicationSchedule(String(formData.get("scheduledAt") ?? "")); }
  catch { return { error: "Geçerli bir yayın zamanı girin (Türkiye saati)." }; }

  const raw = {
    title: String(formData.get("title") ?? ""),
    excerpt: String(formData.get("excerpt") ?? ""),
    contentHtml: String(formData.get("contentHtml") ?? ""),
    categoryId: String(formData.get("categoryId") ?? ""),
    tagIds: formData.getAll("tagIds").map(String),
    authorId: (formData.get("authorId") as string) || null,
    coverMediaId: (formData.get("coverMediaId") as string) || null,
    coverImageAlt: (formData.get("coverImageAlt") as string) || null,
    metaTitle: (formData.get("metaTitle") as string) || null,
    metaDescription: (formData.get("metaDescription") as string) || null,
    canonicalUrl: (formData.get("canonicalUrl") as string) || null,
    status: String(formData.get("status") ?? "DRAFT"),
    isBreaking: formData.get("isBreaking") === "on",
    isFeatured: formData.get("isFeatured") === "on",
    isEditorsPick: formData.get("isEditorsPick") === "on",
    scheduledAt,
  };

  const parsed = articleInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz veri" };
  }

  const data = parsed.data;
  if (!hasPermission(user.role, "article:edit:any")) data.authorId = (await prisma.author.findUnique({ where: { userId: user.id }, select: { id: true } }))?.id ?? null;
  const sanitizedContent = sanitizeArticleHtml(data.contentHtml);
  const readingTimeMinutes = estimateReadingTimeMinutes(sanitizedContent);

  const { blocking } = await findBannedWordMatches(`${data.title} ${data.excerpt} ${sanitizedContent}`);
  if (blocking.length > 0) {
    return { error: `Yasaklı kelime tespit edildi: ${blocking.join(", ")}. Haberi kaydetmeden önce düzenleyin.` };
  }

  const canPublish = hasPermission(user.role, "article:publish");
  const finalStatus: ArticleStatus = canPublish ? data.status : "PENDING_REVIEW";
  if (finalStatus === "SCHEDULED" && (!data.scheduledAt || data.scheduledAt <= new Date())) return { error: "Zamanlanmış haber için gelecekte bir yayın zamanı seçin." };

  let savedId = articleId;

  if (articleId) {
    const expectedUpdatedAt = String(formData.get("expectedUpdatedAt") ?? "");
    if (!expectedUpdatedAt || !Number.isFinite(Date.parse(expectedUpdatedAt))) return { error: "Düzenleme oturumu güncel değil. Sayfayı yenileyin." };
    const publishedAtUpdate =
      finalStatus === "PUBLISHED"
        ? { publishedAt: (await prisma.article.findUnique({ where: { id: articleId }, select: { publishedAt: true } }))?.publishedAt ?? new Date() }
        : {};

    try { await prisma.article.update({
      where: { id: articleId, updatedAt: new Date(expectedUpdatedAt) },
      data: {
        title: data.title,
        excerpt: data.excerpt,
        contentHtml: sanitizedContent,
        categoryId: data.categoryId,
        authorId: data.authorId,
        coverMediaId: data.coverMediaId,
        coverImageAlt: data.coverImageAlt,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        canonicalUrl: data.canonicalUrl,
        status: finalStatus,
        isBreaking: data.isBreaking,
        breakingStartAt: data.isBreaking ? (data.breakingStartAt ?? new Date()) : null,
        breakingEndAt: data.isBreaking ? data.breakingEndAt : null,
        isFeatured: data.isFeatured,
        isEditorsPick: data.isEditorsPick,
        scheduledAt: finalStatus === "SCHEDULED" ? data.scheduledAt : null,
        readingTimeMinutes,
        tags: {
          deleteMany: {},
          create: data.tagIds.map((tagId) => ({ tagId })),
        },
        ...publishedAtUpdate,
      },
    }); } catch (error) {
      if ((error as { code?: string }).code === "P2025") return { error: "Bu haber siz düzenlerken değiştirildi. Metninizi kopyalayın, sayfayı yenileyip güncel sürümle karşılaştırın." };
      throw error;
    }

    await prisma.articleRevision.create({
      data: {
        articleId,
        title: data.title,
        excerpt: data.excerpt,
        contentHtml: sanitizedContent,
        editedById: user.id,
      },
    });

    await prisma.auditLog.create({
      data: { userId: user.id, action: "ARTICLE_UPDATE", entityType: "Article", entityId: articleId },
    });
  } else {
    const slug = await generateUniqueSlug(data.title);
    const created = await prisma.article.create({
      data: {
        title: data.title,
        slug,
        excerpt: data.excerpt,
        contentHtml: sanitizedContent,
        categoryId: data.categoryId,
        authorId: data.authorId,
        coverMediaId: data.coverMediaId,
        coverImageAlt: data.coverImageAlt,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        canonicalUrl: data.canonicalUrl,
        status: finalStatus,
        isBreaking: data.isBreaking,
        breakingStartAt: data.isBreaking ? new Date() : null,
        isFeatured: data.isFeatured,
        isEditorsPick: data.isEditorsPick,
        scheduledAt: finalStatus === "SCHEDULED" ? data.scheduledAt : null,
        readingTimeMinutes,
        publishedAt: finalStatus === "PUBLISHED" ? new Date() : null,
        tags: { create: data.tagIds.map((tagId) => ({ tagId })) },
      },
    });
    savedId = created.id;

    await prisma.auditLog.create({
      data: { userId: user.id, action: "ARTICLE_CREATE", entityType: "Article", entityId: created.id },
    });
  }

  revalidatePath("/admin/haberler");
  revalidatePath("/");
  redirect(`/admin/haberler/${savedId}/duzenle?kaydedildi=1`);
}

export interface BulkCreateResult {
  created: number;
  blocked: number;
}

export async function bulkCreateArticlesAction(formData: FormData): Promise<BulkCreateResult> {
  const user = await requirePermission("article:create");

  const categoryId = String(formData.get("categoryId") ?? "");
  const bulkText = String(formData.get("bulkText") ?? "");
  if (!categoryId || !bulkText.trim()) return { created: 0, blocked: 0 };

  const blocks = bulkText
    .split(/^---$/m)
    .map((block) => block.trim())
    .filter(Boolean);

  let created = 0;
  let blocked = 0;

  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim());
    const title = lines[0]?.slice(0, 200) ?? "";
    const bodyText = lines.slice(1).join("\n").trim();
    if (!title || !bodyText) continue;

    const { blocking } = await findBannedWordMatches(`${title} ${bodyText}`);
    if (blocking.length > 0) {
      blocked += 1;
      continue;
    }

    const contentHtml = sanitizeArticleHtml(
      bodyText
        .split(/\n{2,}/)
        .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
        .join("")
    );
    const excerpt = bodyText.slice(0, 300);
    const slug = await generateUniqueSlug(title);

    await prisma.article.create({
      data: {
        title,
        slug,
        excerpt,
        contentHtml,
        categoryId,
        status: "PENDING_REVIEW",
        readingTimeMinutes: estimateReadingTimeMinutes(bodyText),
      },
    });
    created += 1;
  }

  await prisma.auditLog.create({
    data: { userId: user.id, action: "ARTICLE_BULK_CREATE", entityType: "Article", metadata: { created, blocked } },
  });

  revalidatePath("/admin/haberler");
  return { created, blocked };
}

export async function deleteArticleAction(articleId: string) {
  const user = await requirePermission("article:delete");
  await prisma.article.delete({ where: { id: articleId } });
  await prisma.auditLog.create({
    data: { userId: user.id, action: "ARTICLE_DELETE", entityType: "Article", entityId: articleId },
  });
  revalidatePath("/admin/haberler");
}
