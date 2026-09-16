import type { Metadata } from "next";
import Link from "next/link";
import { searchArticles } from "@/server/services/articleService";
import { prisma } from "@/lib/db";
import { ArticleCard } from "@/components/article/ArticleCard";
import { Pagination } from "@/components/ui/Pagination";
import { parseSearchFilters, searchBasePath, type SearchParams } from "@/lib/utils/searchFilters";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Arama", robots: { index: false, follow: true } };
const fieldClass = "min-w-0 w-full border border-line bg-transparent px-3 py-2 dark:border-line-dark";

export default async function SearchPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const filters = parseSearchFilters(await searchParams);
  const { query, page, category, from, to, sort, error } = filters;
  const hasSearch = Boolean(query || category || from || to);
  const [{ items, total }, categories] = await Promise.all([
    hasSearch && !error ? searchArticles(query, page, 12, filters) : Promise.resolve({ items: [], total: 0 }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { slug: true, name: true } }),
  ]);
  return (
    <div className="container-page py-8">
      <h1 className="font-serif text-display-sm sm:text-display">Haber Ara</h1>
      <p className="mt-2 text-caption text-ink-secondary dark:text-ink-dark-secondary">Haberleri konu, kategori ve yayın tarihine göre bulun.</p>
      <form action="/arama" method="get" className="mt-6 border-y border-line py-5 dark:border-line-dark">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <label className="block text-caption" htmlFor="q">Arama terimi
            <input id="q" name="q" type="search" maxLength={200} defaultValue={query} placeholder="Ör. ekonomi, basketbol, ulaşım" className={`${fieldClass} mt-1`} />
          </label>
          <button type="submit" className="self-end bg-brand-red px-6 py-2 text-headline-s text-white hover:bg-brand-red-dark">Ara</button>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label htmlFor="kategori" className="text-caption">Kategori
            <select id="kategori" name="kategori" defaultValue={category} className={`${fieldClass} mt-1`}>
              <option value="">Tüm kategoriler</option>
              {category && !categories.some(c => c.slug === category) && <option value={category}>Seçili kategori bulunamadı</option>}
              {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </label>
          <label htmlFor="baslangic" className="text-caption">Başlangıç tarihi
            <input id="baslangic" name="baslangic" type="date" defaultValue={from} className={`${fieldClass} mt-1`} />
          </label>
          <label htmlFor="bitis" className="text-caption">Bitiş tarihi
            <input id="bitis" name="bitis" type="date" defaultValue={to} className={`${fieldClass} mt-1`} />
          </label>
          <label htmlFor="sirala" className="text-caption">Sıralama
            <select id="sirala" name="sirala" defaultValue={sort} className={`${fieldClass} mt-1`}>
              <option value="newest">En yeni</option><option value="oldest">En eski</option><option value="popular">En çok okunan</option>
            </select>
          </label>
        </div>
        <div className="mt-3 flex flex-wrap justify-between gap-2 text-caption text-ink-secondary dark:text-ink-dark-secondary">
          <span>Tarihler Türkiye saatine göredir; bitiş günü dahildir.</span>
          <Link href="/arama" className="text-brand-red hover:underline">Filtreleri temizle</Link>
        </div>
      </form>
      {error ? <p role="alert" className="mt-6 text-brand-red">{error}</p> : hasSearch ? <>
        <p className="mt-5 text-caption text-ink-secondary dark:text-ink-dark-secondary">{query ? `“${query}” için ` : "Seçili filtrelerde "}{total} sonuç bulundu.</p>
        {items.length ? <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">{items.map(article => <ArticleCard key={article.id} article={article} />)}</div>
          : <div className="py-10"><h2 className="font-serif text-headline-m">Bu aramada haber bulunamadı.</h2><p className="mt-2 text-body">Daha kısa bir kelime deneyin veya tarih aralığını genişletin.</p><Link href="/son-haberler" className="mt-4 inline-block text-brand-red hover:underline">Son haberleri incele →</Link></div>}
        {items.length > 0 && <Pagination currentPage={page} totalPages={Math.max(1, Math.ceil(total / 12))} basePath={searchBasePath(filters)} />}
      </> : <p className="mt-6 text-ink-secondary dark:text-ink-dark-secondary">Bir arama terimi yazın veya kategori/tarih seçin.</p>}
    </div>
  );
}
