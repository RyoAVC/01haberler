import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { rssAdapter } from "./rssAdapter";
import { checkDuplicate } from "./dedupe";
import { resolveArticleImageWithFallback } from "./imagePolicy";
import { slugify } from "@/lib/utils/slug";
import { estimateReadingTimeMinutes } from "@/lib/utils/readingTime";
import { sanitizeArticleHtml } from "@/lib/utils/sanitize";
import { isModuleEnabled } from "@/server/services/moduleFlagsService";
import { autoEditForPublish } from "@/server/services/aiEditorService";
import { findBannedWordMatches } from "@/server/services/bannedWordService";
import type { JobTrigger } from "@prisma/client";
import { validSourceDate } from "@/lib/utils/sourceDate";
import { resolveIngestedArticleStatus } from "@/lib/utils/ingestPublish";

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1000;

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const delay = RETRY_BASE_DELAY_MS * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

async function generateUniqueSlug(title: string): Promise<string> {
  const base = slugify(title) || "haber";
  let candidate = base;
  let suffix = 1;
  while (await prisma.article.findUnique({ where: { slug: candidate } })) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  return candidate;
}

export async function runIngestionJob(feedId: string, triggeredBy: JobTrigger): Promise<string> {
  const feed = await prisma.feed.findUniqueOrThrow({
    where: { id: feedId },
    include: { source: true },
  });

  const job = await prisma.ingestionJob.create({
    data: { feedId, triggeredBy, status: "RUNNING", startedAt: new Date() },
  });

  const log = (level: "INFO" | "WARN" | "ERROR", message: string) =>
    prisma.ingestionLog.create({ data: { jobId: job.id, level, message } });

  let itemsFound = 0;
  let itemsCreated = 0;
  let itemsSkippedDuplicate = 0;

  try {
    const items = await withRetry(() =>
      rssAdapter.fetchItems(feed.url, env.INGESTION_REQUEST_TIMEOUT_MS, env.INGESTION_USER_AGENT)
    );
    itemsFound = items.length;
    await log("INFO", `${items.length} oge bulundu`);

    const categoryId = feed.categoryId ?? feed.source.defaultCategoryId;
    if (!categoryId) {
      throw new Error("Feed veya kaynak icin varsayilan kategori tanimlanmamis");
    }
    const category = await prisma.category.findUnique({ where: { id: categoryId }, select: { name: true } });

    // Kaynak "guvenilir" isaretlenmis VE site genelinde AI otomatik yayin
    // modulu acik olmalidir; ikisi de saglanmazsa asagidaki davranis
    // bugunkuyle birebir aynidir (PENDING_REVIEW, ozgun ozet).
    const autoPublishEligible =
      feed.source.isTrustedForAutoPublish && (await isModuleEnabled("aiAutoPublish"));

    for (const item of items) {
      const sourceDate = validSourceDate(item.publishedAt);
      const dedupe = await checkDuplicate({
        link: item.link,
        title: item.title,
        excerpt: item.excerpt,
      });

      if (dedupe.isDuplicate) {
        itemsSkippedDuplicate += 1;
        continue;
      }

      const coverMediaId = await resolveArticleImageWithFallback({
        imageUrl: item.imageUrl,
        title: item.title,
        categoryName: category?.name ?? null,
      });
      const safeExcerpt = item.excerpt || item.title;

      let autoEdit = null;
      if (autoPublishEligible && sourceDate) {
        autoEdit = await autoEditForPublish({
          title: item.title,
          excerptSource: safeExcerpt,
          sourceName: feed.source.name,
          sourceUrl: dedupe.canonicalUrl,
          categoryName: category?.name ?? null,
        });
      }

      if (autoEdit) {
        const { blocking } = await findBannedWordMatches(`${autoEdit.title} ${autoEdit.contentHtml}`);
        if (blocking.length > 0) autoEdit = null;
      }

      const slug = await generateUniqueSlug(autoEdit?.title ?? item.title);

      // Guvenilir kaynak + gecerli tarih + basarili AI duzenlemesi saglandiginda
      // haber dogrudan yayimlanir; aksi halde incelemede kalir.
      const status = resolveIngestedArticleStatus({
        autoPublishEligible,
        hasValidSourceDate: Boolean(sourceDate),
        aiEditSucceeded: Boolean(autoEdit),
      });

      const article = await prisma.article.create({
        data: {
          title: (autoEdit?.title ?? item.title).slice(0, 200),
          slug,
          excerpt: (autoEdit?.excerpt ?? safeExcerpt).slice(0, 500),
          contentHtml: sanitizeArticleHtml(autoEdit?.contentHtml ?? `<p>${safeExcerpt}</p>`),
          status,
          publishedAt: sourceDate,
          city: feed.source.defaultCity,
          categoryId,
          sourceId: feed.sourceId,
          feedId: feed.id,
          sourceUrl: dedupe.canonicalUrl,
          sourceDisplayName: feed.source.name,
          contentHash: dedupe.contentHash,
          coverMediaId,
          metaTitle: autoEdit?.metaTitle,
          metaDescription: autoEdit?.metaDescription,
          readingTimeMinutes: estimateReadingTimeMinutes(autoEdit?.contentHtml ?? safeExcerpt),
        },
      });
      itemsCreated += 1;
      await prisma.auditLog.create({ data: { userId: null, action: "ARTICLE_SOURCE_IMPORTED", entityType: "Article", entityId: article.id,
        metadata: { sourcePublishedAt: sourceDate?.toISOString() ?? null, importedAt: new Date().toISOString(), dateNeedsReview: !sourceDate } } });

      if (autoEdit) {
        await prisma.auditLog.create({
            data: { userId: null, action: "ARTICLE_AI_DRAFT_PREPARED", entityType: "Article", entityId: article.id },
        });
      }

      if (status === "PUBLISHED") {
        await prisma.auditLog.create({
            data: { userId: null, action: "ARTICLE_AUTO_PUBLISH", entityType: "Article", entityId: article.id,
              metadata: { sourceName: feed.source.name, publishedAt: sourceDate?.toISOString() ?? null } },
        });
      }
    }

    await prisma.feed.update({
      where: { id: feed.id },
      data: {
        lastFetchedAt: new Date(),
        lastSuccessAt: new Date(),
        lastStatus: "OK",
        consecutiveFailures: 0,
        lastErrorMessage: null,
      },
    });

    await prisma.ingestionJob.update({
      where: { id: job.id },
      data: {
        status: "SUCCESS",
        finishedAt: new Date(),
        itemsFound,
        itemsCreated,
        itemsSkippedDuplicate,
      },
    });

    await log("INFO", `Tamamlandi: ${itemsCreated} yeni, ${itemsSkippedDuplicate} tekrar`);
    return job.id;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bilinmeyen hata";

    await prisma.feed.update({
      where: { id: feed.id },
      data: {
        lastFetchedAt: new Date(),
        lastStatus: "ERROR",
        consecutiveFailures: { increment: 1 },
        lastErrorMessage: message,
      },
    });

    await prisma.ingestionJob.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        finishedAt: new Date(),
        itemsFound,
        itemsCreated,
        itemsSkippedDuplicate,
        errorMessage: message,
      },
    });

    await log("ERROR", message);
    return job.id;
  }
}
