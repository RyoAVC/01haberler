import Link from "next/link";
import Image from "next/image";
import type { ArticleCardData } from "@/server/services/articleService";
import { formatRelativeTr } from "@/lib/utils/formatDate";
export function HomeHeadline({ article, primary = false }: { article: ArticleCardData; primary?: boolean }) {
  return <article className={`home-headline ${primary ? "headline-primary" : "headline-secondary"} ${article.coverMedia?.url ? "headline-with-image" : "headline-text-only"}`}>
    {article.coverMedia?.url && <Image src={article.coverMedia.url} alt={article.coverMedia.altText || article.title} fill priority={primary} sizes={primary ? "(max-width: 768px) 100vw, 750px" : "(max-width: 768px) 100vw, 380px"} className="object-cover" />}
    <div className="headline-shade" />
    <div className="headline-copy">
      <Link href={`/kategori/${article.category.slug}`} className="headline-category">{article.category.name}</Link>
      <Link href={`/haber/${article.slug}`}><h2>{article.title}</h2></Link>
      {primary && <p>{article.excerpt}</p>}
      <span className="headline-time">{article.publishedAt ? formatRelativeTr(article.publishedAt) : ""} · {article.readingTimeMinutes} dk okuma</span>
    </div>
  </article>;
}
