import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getArticlesByAuthorSlug } from "@/server/services/articleService";
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
  const author = await prisma.author.findUnique({ where: { slug } });
  if (!author) return {};
  return { title: author.name, alternates: { canonical: `/yazar/${author.slug}` } };
}

export default async function AuthorPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { sayfa } = await searchParams;
  const author = await prisma.author.findUnique({ where: { slug } });
  if (!author) notFound();

  const page = Math.max(1, Number(sayfa) || 1);
  const { items, total } = await getArticlesByAuthorSlug(slug, page, PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (items.length === 0 && page > 1) notFound();

  return (
    <div className="container-page py-8">
      <div className="mb-6 rule-bottom pb-4">
        <h1 className="font-serif text-headline-l">{author.name}</h1>
        {author.bio && <p className="mt-2 max-w-measure text-body text-ink-secondary dark:text-ink-dark-secondary">{author.bio}</p>}
      </div>
      {items.length === 0 ? (
        <p className="text-ink-secondary dark:text-ink-dark-secondary">Bu yazarın henüz haberi bulunmuyor.</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3">
          {items.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
      <Pagination currentPage={page} totalPages={totalPages} basePath={`/yazar/${slug}`} />
    </div>
  );
}
