import Link from "next/link";
import Image from "next/image";
import { formatRelativeTr } from "@/lib/utils/formatDate";
import type { ArticleCardData } from "@/server/services/articleService";

export function ArticleCard({ article, priority = false }: { article: ArticleCardData; priority?: boolean }) {
  return (
    <article className="group flex flex-col">
      <Link href={`/haber/${article.slug}`} className="relative block aspect-[4/3] w-full overflow-hidden bg-line dark:bg-line-dark">
        <Image
          src={article.coverMedia?.url || "/images/placeholder-news.svg"}
          alt={article.coverMedia?.altText || article.title}
          fill
          priority={priority}
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        {article.isBreaking && (
          <span className="absolute left-0 top-0 bg-brand-red px-2 py-1 text-meta font-bold uppercase tracking-wide text-white">
            Son Dakika
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col pt-3">
        <Link href={`/kategori/${article.category.slug}`} className="kicker">
          {article.category.name}
        </Link>
        <Link href={`/haber/${article.slug}`}>
          <h3 className="mt-1 line-clamp-2 font-serif text-headline-m leading-snug group-hover:text-brand-red">
            {article.title}
          </h3>
        </Link>
        <p className="mt-1 line-clamp-2 text-caption text-ink-secondary dark:text-ink-dark-secondary">
          {article.excerpt}
        </p>
        <div className="mt-auto flex items-center justify-between pt-3 text-meta text-ink-secondary dark:text-ink-dark-secondary">
          <span>{article.publishedAt ? formatRelativeTr(article.publishedAt) : ""}</span>
          <span>{article.readingTimeMinutes} dk okuma</span>
        </div>
      </div>
    </article>
  );
}
