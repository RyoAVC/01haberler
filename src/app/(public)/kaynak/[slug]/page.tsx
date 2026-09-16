import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getArticlesBySourceSlug } from "@/server/services/articleService";
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
  const source = await prisma.source.findUnique({ where: { slug } });
  if (!source) return {};
  return { title: source.name, alternates: { canonical: `/kaynak/${source.slug}` } };
}

export default async function SourcePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { sayfa } = await searchParams;
  const source = await prisma.source.findUnique({ where: { slug } });
  if (!source) notFound();

  const page = Math.max(1, Number(sayfa) || 1);
  const { items, total } = await getArticlesBySourceSlug(slug, page, PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (items.length === 0 && page > 1) notFound();

  return (
    <div className="container-page py-8">
      <div className="mb-6 rule-bottom pb-4">
        <h1 className="font-serif text-headline-l">{source.name}</h1>
        <a href={source.homepageUrl} target="_blank" rel="noopener noreferrer nofollow" className="mt-1 inline-block text-headline-s text-brand-red hover:underline">
          Kaynak sitesini görüntüle →
        </a>
      </div>
      {items.length === 0 ? (
        <p className="text-ink-secondary dark:text-ink-dark-secondary">Bu kaynaktan henüz yayınlanmış haber yok.</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3">
          {items.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
      <Pagination currentPage={page} totalPages={totalPages} basePath={`/kaynak/${slug}`} />
    </div>
  );
}
