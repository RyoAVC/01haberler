import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PUBLIC_ARTICLE_CARD_SELECT, publishedWhere } from "@/server/services/articleService";
import { ArticleCard } from "@/components/article/ArticleCard";
import { Pagination } from "@/components/ui/Pagination";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Son Haberler",
  description: "Türkiye ve dünyadan haberler, en yeniden eskiye.",
  alternates: { canonical: "/son-haberler" },
};

export default async function LatestNewsPage({ searchParams }: { searchParams: Promise<{ sayfa?: string }> }) {
  const { sayfa } = await searchParams;
  const page = Number(sayfa ?? "1");
  if (!Number.isSafeInteger(page) || page < 1 || page > 100000) notFound();
  const pageSize = 12;
  const where = publishedWhere({ slug: { not: "01-haberler-yayina-girdi-sitenin-ilk-test-haberi" } });
  const [articles, total] = await Promise.all([
    prisma.article.findMany({ where, select: PUBLIC_ARTICLE_CARD_SELECT, orderBy: [{ publishedAt: "desc" }, { id: "desc" }], skip: (page - 1) * pageSize, take: pageSize }),
    prisma.article.count({ where }),
  ]);
  if (page > 1 && articles.length === 0) notFound();
  return (
    <div className="container-page py-8">
      <h1 className="font-serif text-display-sm sm:text-display">Son Haberler</h1>
      <p className="mb-8 mt-2 text-ink-secondary dark:text-ink-dark-secondary">Gündemi en yeni haberlerden başlayarak takip edin.</p>
      {articles.length ? <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => <ArticleCard key={article.id} article={article} />)}
      </div> : <p>Henüz yayımlanmış haber bulunmuyor.</p>}
      <Pagination currentPage={page} totalPages={Math.max(1, Math.ceil(total / pageSize))} basePath="/son-haberler" />
    </div>
  );
}
