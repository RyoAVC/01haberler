import type { Metadata } from "next";
import { searchArticles } from "@/server/services/articleService";
import { ArticleCard } from "@/components/article/ArticleCard";
import { Pagination } from "@/components/ui/Pagination";

const PAGE_SIZE = 12;

interface Props {
  searchParams: Promise<{ q?: string; sayfa?: string }>;
}

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Arama",
  robots: { index: false, follow: true },
};

export default async function SearchPage({ searchParams }: Props) {
  const { q, sayfa } = await searchParams;
  const query = (q ?? "").trim();
  const page = Math.max(1, Number(sayfa) || 1);

  const { items, total } = query
    ? await searchArticles(query, page, PAGE_SIZE)
    : { items: [], total: 0 };
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="container-page py-8">
      <h1 className="font-serif text-headline-l">Haber Ara</h1>
      <form action="/arama" method="get" className="mt-4 flex max-w-lg gap-2">
        <label htmlFor="q" className="sr-only">Arama terimi</label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Ör. deprem, seçim, enflasyon..."
          className="w-full border border-line bg-transparent px-3 py-2 dark:border-line-dark"
        />
        <button type="submit" className="bg-brand-red px-5 py-2 text-headline-s text-white hover:bg-brand-red-dark">
          Ara
        </button>
      </form>

      {query && (
        <p className="mt-4 text-caption text-ink-secondary dark:text-ink-dark-secondary">
          &ldquo;{query}&rdquo; için {total} sonuç bulundu.
        </p>
      )}

      {query && items.length === 0 && (
        <p className="mt-6 text-ink-secondary dark:text-ink-dark-secondary">Sonuç bulunamadı.</p>
      )}

      {items.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3">
          {items.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}

      <Pagination currentPage={page} totalPages={totalPages} basePath={`/arama?q=${encodeURIComponent(query)}`} />
    </div>
  );
}
