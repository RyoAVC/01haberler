import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { searchDateRange, type SearchFilters } from "@/lib/utils/searchFilters";

export const PUBLIC_ARTICLE_CARD_SELECT = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  publishedAt: true,
  readingTimeMinutes: true,
  isBreaking: true,
  coverMedia: { select: { url: true, altText: true } },
  category: { select: { name: true, slug: true } },
  author: { select: { name: true, slug: true } },
  sourceDisplayName: true,
} satisfies Prisma.ArticleSelect;

export type ArticleCardData = Prisma.ArticleGetPayload<{ select: typeof PUBLIC_ARTICLE_CARD_SELECT }>;

export function publishedWhere(extra: Prisma.ArticleWhereInput = {}): Prisma.ArticleWhereInput {
  return {
    status: "PUBLISHED",
    publishedAt: { lte: new Date() },
    ...extra,
  };
}

export async function getLatestArticles(take = 12): Promise<ArticleCardData[]> {
  return prisma.article.findMany({
    where: publishedWhere(),
    orderBy: { publishedAt: "desc" },
    take,
    select: PUBLIC_ARTICLE_CARD_SELECT,
  });
}

export async function getFeaturedArticles(take = 5): Promise<ArticleCardData[]> {
  return prisma.article.findMany({
    where: publishedWhere({ isFeatured: true }),
    orderBy: { publishedAt: "desc" },
    take,
    select: PUBLIC_ARTICLE_CARD_SELECT,
  });
}

export async function getEditorsPicks(take = 6): Promise<ArticleCardData[]> {
  return prisma.article.findMany({
    where: publishedWhere({ isEditorsPick: true }),
    orderBy: { publishedAt: "desc" },
    take,
    select: PUBLIC_ARTICLE_CARD_SELECT,
  });
}

export async function getMostRead(take = 6): Promise<ArticleCardData[]> {
  return prisma.article.findMany({
    where: publishedWhere(),
    orderBy: { viewCount: "desc" },
    take,
    select: PUBLIC_ARTICLE_CARD_SELECT,
  });
}

export async function getArticlesByCategorySlugForHome(
  categorySlug: string,
  take = 5
): Promise<ArticleCardData[]> {
  return prisma.article.findMany({
    where: publishedWhere({ category: { slug: categorySlug } }),
    orderBy: { publishedAt: "desc" },
    take,
    select: PUBLIC_ARTICLE_CARD_SELECT,
  });
}

export async function getArticlesByCategorySlug(
  categorySlug: string,
  page: number,
  pageSize = 12
): Promise<{ items: ArticleCardData[]; total: number }> {
  const where = publishedWhere({ category: { slug: categorySlug } });
  const [items, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: PUBLIC_ARTICLE_CARD_SELECT,
    }),
    prisma.article.count({ where }),
  ]);
  return { items, total };
}

export const ARTICLE_DETAIL_SELECT = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  contentHtml: true,
  publishedAt: true,
  updatedAt: true,
  readingTimeMinutes: true,
  isBreaking: true,
  metaTitle: true,
  metaDescription: true,
  canonicalUrl: true,
  sourceUrl: true,
  sourceDisplayName: true,
  coverMedia: { select: { url: true, altText: true } },
  category: { select: { id: true, name: true, slug: true } },
  author: { select: { name: true, slug: true, bio: true } },
  tags: { select: { tag: { select: { name: true, slug: true } } } },
} satisfies Prisma.ArticleSelect;

export type ArticleDetailData = Prisma.ArticleGetPayload<{ select: typeof ARTICLE_DETAIL_SELECT }>;

export async function getArticleBySlug(slug: string): Promise<ArticleDetailData | null> {
  return prisma.article.findFirst({
    where: publishedWhere({ slug }),
    select: ARTICLE_DETAIL_SELECT,
  });
}

export async function getRelatedArticles(
  articleId: string,
  categoryId: string,
  take = 4
): Promise<ArticleCardData[]> {
  return prisma.article.findMany({
    where: publishedWhere({ categoryId, id: { not: articleId } }),
    orderBy: { publishedAt: "desc" },
    take,
    select: PUBLIC_ARTICLE_CARD_SELECT,
  });
}

export async function getPrevNextArticle(
  categoryId: string,
  publishedAt: Date
): Promise<{ prev: { slug: string; title: string } | null; next: { slug: string; title: string } | null }> {
  const [prev, next] = await Promise.all([
    prisma.article.findFirst({
      where: publishedWhere({ categoryId, publishedAt: { lt: publishedAt } }),
      orderBy: { publishedAt: "desc" },
      select: { slug: true, title: true },
    }),
    prisma.article.findFirst({
      where: publishedWhere({ categoryId, publishedAt: { gt: publishedAt } }),
      orderBy: { publishedAt: "asc" },
      select: { slug: true, title: true },
    }),
  ]);
  return { prev, next };
}

export async function incrementViewCount(articleId: string): Promise<void> {
  await prisma.article.update({
    where: { id: articleId },
    data: { viewCount: { increment: 1 } },
  });
}

export async function getArticlesByTagSlug(
  tagSlug: string,
  page: number,
  pageSize = 12
): Promise<{ items: ArticleCardData[]; total: number }> {
  const where = publishedWhere({ tags: { some: { tag: { slug: tagSlug } } } });
  const [items, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: PUBLIC_ARTICLE_CARD_SELECT,
    }),
    prisma.article.count({ where }),
  ]);
  return { items, total };
}

export async function getArticlesByAuthorSlug(
  authorSlug: string,
  page: number,
  pageSize = 12
): Promise<{ items: ArticleCardData[]; total: number }> {
  const where = publishedWhere({ author: { slug: authorSlug } });
  const [items, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: PUBLIC_ARTICLE_CARD_SELECT,
    }),
    prisma.article.count({ where }),
  ]);
  return { items, total };
}

export async function getArticlesBySourceSlug(
  sourceSlug: string,
  page: number,
  pageSize = 12
): Promise<{ items: ArticleCardData[]; total: number }> {
  const where = publishedWhere({ source: { slug: sourceSlug } });
  const [items, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: PUBLIC_ARTICLE_CARD_SELECT,
    }),
    prisma.article.count({ where }),
  ]);
  return { items, total };
}

export async function searchArticles(
  query: string,
  page: number,
  pageSize = 12,
  filters: SearchFilters = {}
): Promise<{ items: ArticleCardData[]; total: number }> {
  const { start, end } = searchDateRange(filters.from, filters.to);
  const where = publishedWhere({
    ...(query ? { OR: [
      { title: { contains: query, mode: "insensitive" } },
      { excerpt: { contains: query, mode: "insensitive" } },
    ] } : {}),
    ...(filters.category ? { category: { slug: filters.category } } : {}),
    publishedAt: { lte: new Date(), ...(start ? { gte: start } : {}), ...(end ? { lt: end } : {}) },
  });
  const orderBy: Prisma.ArticleOrderByWithRelationInput[] = filters.sort === "popular"
    ? [{ viewCount: "desc" }, { publishedAt: "desc" }, { id: "desc" }]
    : [{ publishedAt: filters.sort === "oldest" ? "asc" : "desc" }, { id: "desc" }];
  const [items, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: PUBLIC_ARTICLE_CARD_SELECT,
    }),
    prisma.article.count({ where }),
  ]);
  return { items, total };
}
