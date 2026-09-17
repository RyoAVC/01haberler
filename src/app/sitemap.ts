import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { collectionSchema, COLLECTION_PREFIX } from "@/lib/validation/newsroom";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";

  const [articles, categories, collections] = await Promise.all([
    prisma.article.findMany({
      where: { status: "PUBLISHED", publishedAt: { lte: new Date() } },
      orderBy: { publishedAt: "desc" },
      take: 5000,
      select: { slug: true, updatedAt: true },
    }),
    prisma.category.findMany({ where: { isActive: true }, select: { slug: true } }),
    prisma.siteSetting.findMany({ where: { key: { startsWith: COLLECTION_PREFIX }, OR: [{ value: { path: ["status"], equals: "PUBLISHED" } }, { value: { path: ["status"], equals: "CLOSED" } }] }, take: 5000, select: { value: true, updatedAt: true } }),
  ]);

  return [
    { url: appUrl, changeFrequency: "always", priority: 1 },
    { url: `${appUrl}/son-haberler`, changeFrequency: "hourly", priority: 0.8 },
    ...collections.flatMap(row => { const p = collectionSchema.safeParse(row.value); return p.success && p.data.status !== "DRAFT" ? [{ url: `${appUrl}/${p.data.kind}/${p.data.slug}`, lastModified: row.updatedAt, changeFrequency: "daily" as const, priority: 0.7 }] : []; }),
    ...categories.map((c) => ({
      url: `${appUrl}/kategori/${c.slug}`,
      changeFrequency: "hourly" as const,
      priority: 0.7,
    })),
    ...articles.map((a) => ({
      url: `${appUrl}/haber/${a.slug}`,
      lastModified: a.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.6,
    })),
  ];
}
