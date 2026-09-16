import Link from "next/link";
import Image from "next/image";
import { formatRelativeTr } from "@/lib/utils/formatDate";
import type { ArticleCardData } from "@/server/services/articleService";

export function HeroCard({ article }: { article: ArticleCardData }) {
  return (
    <article>
      {article.coverMedia?.url && <Link href={`/haber/${article.slug}`} className="relative block aspect-[16/9] w-full overflow-hidden bg-line dark:bg-line-dark">
        <Image
          src={article.coverMedia.url}
          alt={article.coverMedia?.altText || article.title}
          fill
          priority
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 66vw"
        />
      </Link>}
      <div className="pt-4">
        <Link href={`/kategori/${article.category.slug}`} className="kicker">
          {article.category.name}
        </Link>
        <Link href={`/haber/${article.slug}`}>
          <h2 className="mt-2 font-serif text-display-sm sm:text-display leading-tight hover:text-brand-red">
            {article.title}
          </h2>
        </Link>
        <p className="mt-2 max-w-measure text-body text-ink-secondary dark:text-ink-dark-secondary">
          {article.excerpt}
        </p>
        <div className="mt-3 flex items-center gap-4 text-meta text-ink-secondary dark:text-ink-dark-secondary">
          <span>{article.publishedAt ? formatRelativeTr(article.publishedAt) : ""}</span>
          <span>{article.readingTimeMinutes} dk okuma</span>
        </div>
      </div>
    </article>
  );
}
