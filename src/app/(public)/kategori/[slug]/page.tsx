import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getArticlesByCategorySlug } from "@/server/services/articleService";
import { ArticleCard } from "@/components/article/ArticleCard";
import { Pagination } from "@/components/ui/Pagination";

const PAGE_SIZE = 12;

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sayfa?: string }>;
}

async function getCategory(slug: string) {
  return prisma.category.findFirst({ where: { slug, isActive: true } });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return {};
  return {
    title: category.seoTitle || category.name,
    description: category.seoDescription || category.description || undefined,
    alternates: { canonical: `/kategori/${category.slug}` },
  };
}

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { sayfa } = await searchParams;
  const category = await getCategory(slug);
  if (!category) notFound();

  const page = Math.max(1, Number(sayfa) || 1);
  const { items, total } = await getArticlesByCategorySlug(slug, page, PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (items.length === 0 && page > 1) notFound();

  return (
    <div className="container-page py-8">
      <h1 className="mb-6 rule-bottom pb-3 font-serif text-headline-l">{category.name}</h1>
      {items.length === 0 ? (
        <p className="text-ink-secondary dark:text-ink-dark-secondary">Bu kategoride henüz haber bulunmuyor.</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3">
          {items.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
      <Pagination currentPage={page} totalPages={totalPages} basePath={`/kategori/${slug}`} />
    </div>
  );
}
