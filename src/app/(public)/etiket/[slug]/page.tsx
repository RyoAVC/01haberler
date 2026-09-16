import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getArticlesByTagSlug } from "@/server/services/articleService";
import { ArticleCard } from "@/components/article/ArticleCard";
import { Pagination } from "@/components/ui/Pagination";

const PAGE_SIZE = 12;

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sayfa?: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tag = await prisma.tag.findUnique({ where: { slug } });
  if (!tag) return {};
  return { title: `#${tag.name}`, alternates: { canonical: `/etiket/${tag.slug}` } };
}

export default async function TagPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { sayfa } = await searchParams;
  const tag = await prisma.tag.findUnique({ where: { slug } });
  if (!tag) notFound();

  const page = Math.max(1, Number(sayfa) || 1);
  const { items, total } = await getArticlesByTagSlug(slug, page, PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (items.length === 0 && page > 1) notFound();

  return (
    <div className="container-page py-8">
      <h1 className="mb-6 rule-bottom pb-3 font-serif text-headline-l">#{tag.name}</h1>
      {items.length === 0 ? (
        <p className="text-ink-secondary dark:text-ink-dark-secondary">Bu etikette henüz haber bulunmuyor.</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3">
          {items.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
      <Pagination currentPage={page} totalPages={totalPages} basePath={`/etiket/${slug}`} />
    </div>
  );
}
