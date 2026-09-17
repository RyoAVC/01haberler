import { prisma } from "@/lib/db";
import {
  PUBLIC_ARTICLE_CARD_SELECT,
  publishedWhere,
  type ArticleCardData,
} from "@/server/services/articleService";

export function normalizeCity(value: string): string {
  return value.trim().slice(0, 80);
}

// Yayimlanmis haberlerde en cok kullanilan sehirler; yerel sehir secici icin.
export async function getLocalCities(take = 30): Promise<{ city: string; count: number }[]> {
  const rows = await prisma.article.groupBy({
    by: ["city"],
    where: publishedWhere({ city: { not: null } }),
    _count: { city: true },
    orderBy: { _count: { city: "desc" } },
    take,
  });
  return rows
    .map((r) => ({ city: r.city ?? "", count: r._count.city }))
    .filter((r) => r.city.length > 0);
}

// Belirli bir sehre etiketlenmis yayimlanmis haberler (buyuk/kucuk harf duyarsiz).
export async function getArticlesByCity(city: string, take = 12): Promise<ArticleCardData[]> {
  const normalized = normalizeCity(city);
  if (!normalized) return [];
  return prisma.article.findMany({
    where: publishedWhere({ city: { equals: normalized, mode: "insensitive" } }),
    orderBy: { publishedAt: "desc" },
    take,
    select: PUBLIC_ARTICLE_CARD_SELECT,
  });
}
