import Link from "next/link";
import { ArticleCard } from "@/components/article/ArticleCard";
import { getArticlesByCity, getLocalCities, normalizeCity } from "@/server/services/localNewsService";

// Sehre etiketlenmis yayimlanmis haberleri yuzeye cikaran yerel akis.
// Ayni ?sehir parametresini kullanir; bu yuzden dosya filtresiyle uyumludur.
export async function LocalCityArticles({ city = "" }: { city?: string }) {
  const selected = normalizeCity(city);
  const [cities, articles] = await Promise.all([
    getLocalCities(),
    selected ? getArticlesByCity(selected) : Promise.resolve([]),
  ]);

  if (cities.length === 0) return null;

  return (
    <section aria-label="Şehre göre haberler" className="mb-10">
      <nav className="mb-5 flex flex-wrap gap-2">
        {cities.map((c) => {
          const active = c.city.toLocaleLowerCase("tr") === selected.toLocaleLowerCase("tr");
          return (
            <Link
              key={c.city}
              href={`/yerel?sehir=${encodeURIComponent(c.city)}`}
              className={`border px-3 py-1 text-caption ${active ? "border-brand-red text-brand-red" : "border-line dark:border-line-dark"}`}
            >
              {c.city} ({c.count})
            </Link>
          );
        })}
      </nav>

      {selected && (
        articles.length > 0 ? (
          <>
            <h2 className="mb-5 font-serif text-headline-l">{selected} haberleri</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((a) => <ArticleCard key={a.id} article={a} />)}
            </div>
          </>
        ) : (
          <p className="text-ink-secondary dark:text-ink-dark-secondary">
            {selected} için henüz yayımlanmış haber bulunmuyor.
          </p>
        )
      )}
    </section>
  );
}
