import type { ArticleDetailData } from "@/server/services/articleService";

export function newsArticleJsonLd(article: ArticleDetailData, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.excerpt,
    image: article.coverMedia?.url ? [article.coverMedia.url] : undefined,
    datePublished: article.publishedAt?.toISOString(),
    dateModified: article.updatedAt.toISOString(),
    author: article.author
      ? { "@type": "Person", name: article.author.name }
      : { "@type": "Organization", name: article.sourceDisplayName ?? "01 Haberler" },
    publisher: {
      "@type": "Organization",
      name: "01 Haberler",
      logo: { "@type": "ImageObject", url: `${new URL(url).origin}/images/logo.svg` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    articleSection: article.category.name,
    isAccessibleForFree: true,
    keywords: article.tags.map(({ tag }) => tag.name).join(", ") || undefined,
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
