import { notFound } from "next/navigation";
import Link from "next/link";
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

  const page = Number(sayfa ?? "1");
  if (!Number.isSafeInteger(page) || page < 1 || page > 100000) notFound();
  const { items, total } = await getArticlesByCategorySlug(slug, page, PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (items.length === 0 && page > 1) notFound();

  return (
    <div className="container-page py-8">
      <p className="kicker">01 Haberler · Kategori</p>
      <h1 className="mt-3 font-serif text-display-sm sm:text-display">{category.name}</h1>
      {category.description && <p className="mt-3 max-w-2xl text-body text-ink-secondary dark:text-ink-dark-secondary">{category.description}</p>}
      <div className="mb-8 mt-5 flex justify-between border-b border-line pb-4 text-caption dark:border-line-dark"><span>{total} haber</span><Link href={`/arama?kategori=${encodeURIComponent(category.slug)}`} className="underline">Bu kategoride ara →</Link></div>
      {items.length === 0 ? (
        <div className="rounded-2xl border border-line p-8 dark:border-line-dark"><h2 className="font-serif text-headline-m">Bu bölümde henüz haber yok.</h2><p className="mt-3 text-ink-secondary dark:text-ink-dark-secondary">Yeni içerikler yayımlandığında burada görebilirsiniz.</p><Link href="/son-haberler" className="mt-5 inline-block text-caption font-semibold text-brand-red">Son haberleri keşfet →</Link></div>
      ) : (
        <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
      <Pagination currentPage={page} totalPages={totalPages} basePath={`/kategori/${slug}`} />
    </div>
  );
}
