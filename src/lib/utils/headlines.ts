// Keep the launch smoke-test address accessible without promoting it as news.
const DEMO_SLUGS = new Set(["01-haberler-yayina-girdi-sitenin-ilk-test-haberi"]);

export function isEditorialArticle(article: { slug: string }): boolean {
  return !DEMO_SLUGS.has(article.slug);
}

export function selectHeadlines<T extends { id: string; slug: string }>(featured: T[], latest: T[], limit = 4): T[] {
  const seen = new Set<string>();
  return [...featured, ...latest].filter((article) => {
    if (!isEditorialArticle(article) || seen.has(article.id)) return false;
    seen.add(article.id);
    return true;
  }).slice(0, limit);
}
