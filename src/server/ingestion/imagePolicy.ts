import { prisma } from "@/lib/db";
import { getImageAllowlistDomains, addImageAllowlistDomainInternal } from "@/server/services/imageAllowlistService";
import { getStockPhotoForCategory } from "@/server/services/stockPhotoService";
import { titleSimilarity } from "@/lib/utils/titleSimilarity";

const PLACEHOLDER_IMAGE_URL = "/images/placeholder-news.svg";
const CROSS_SOURCE_LOOKBACK_DAYS = 3;
const CROSS_SOURCE_MIN_SCORE = 0.34;
const CROSS_SOURCE_MIN_SHARED_TOKENS = 2;

/**
 * Gorsel lisansi belirsiz oldugundan disaridan gelen gorseller yalnizca
 * yonetici tarafindan tanimlanan allowlist domain'lerinden alinir; izinli
 * degilse veya URL yoksa null doner (placeholder olusturmaz - o karar
 * cagiran tarafin sorumlulugunda, bkz. resolveArticleImageWithFallback).
 */
export async function tryAllowlistedImage(imageUrl: string | null): Promise<string | null> {
  if (!imageUrl) return null;

  let hostname: string;
  try {
    hostname = new URL(imageUrl).hostname.toLowerCase();
  } catch {
    return null;
  }

  const allowlist = await getImageAllowlistDomains();
  const isAllowed = allowlist.some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
  );
  if (!isAllowed) return null;

  const media = await prisma.media.create({
    data: {
      url: imageUrl,
      mimeType: "image/*",
      sizeBytes: 0,
      source: "REMOTE_ALLOWLISTED",
      altText: null,
    },
  });

  return media.id;
}

async function findCrossSourceImage(title: string): Promise<string | null> {
  const cutoff = new Date(Date.now() - CROSS_SOURCE_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
  const candidates = await prisma.article.findMany({
    where: {
      createdAt: { gte: cutoff },
      coverMediaId: { not: null },
      coverMedia: { source: { not: "PLACEHOLDER" } },
    },
    select: { title: true, coverMedia: { select: { url: true } } },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  let best: { score: number; url: string } | null = null;
  for (const candidate of candidates) {
    if (!candidate.coverMedia) continue;
    const { score, sharedTokens } = titleSimilarity(title, candidate.title);
    if (score < CROSS_SOURCE_MIN_SCORE || sharedTokens < CROSS_SOURCE_MIN_SHARED_TOKENS) continue;
    if (!best || score > best.score) best = { score, url: candidate.coverMedia.url };
  }

  return best?.url ?? null;
}

async function createPlaceholderMedia(): Promise<string> {
  const media = await prisma.media.create({
    data: {
      url: PLACEHOLDER_IMAGE_URL,
      mimeType: "image/svg+xml",
      sizeBytes: 0,
      source: "PLACEHOLDER",
      altText: "Haber gorseli mevcut degil",
    },
  });
  return media.id;
}

export interface ImageResolutionInput {
  imageUrl: string | null;
  title: string;
  categoryName: string | null;
}

/**
 * Haber gorseli icin sirayla: (1) kaynagin kendi gorseli, (2) ayni olayi
 * kapsayan baska bir kaynagin gorseli (baslik benzerligiyle eslesirse),
 * (3) ucretsiz stok gorsel API'si, (4) hicbiri yoksa guvenli placeholder.
 */
export async function resolveArticleImageWithFallback(input: ImageResolutionInput): Promise<string> {
  const direct = await tryAllowlistedImage(input.imageUrl);
  if (direct) return direct;

  const crossSourceUrl = await findCrossSourceImage(input.title);
  if (crossSourceUrl) {
    const reused = await tryAllowlistedImage(crossSourceUrl);
    if (reused) return reused;
  }

  const stockUrl = await getStockPhotoForCategory(input.categoryName);
  if (stockUrl) {
    try {
      await addImageAllowlistDomainInternal("images.pexels.com");
    } catch {
      // allowlist'e ekleme basarisiz olsa da akisi bozmaz.
    }
    const stockMediaId = await tryAllowlistedImage(stockUrl);
    if (stockMediaId) return stockMediaId;
  }

  return createPlaceholderMedia();
}
