import Link from "next/link";
import Image from "next/image";
import { formatRelativeTr } from "@/lib/utils/formatDate";
import type { ArticleCardData } from "@/server/services/articleService";

export function SideImageItem({ article }: { article: ArticleCardData }) {
  return (
    <article className="flex gap-4 border-b border-line py-4 last:border-0 dark:border-line-dark">
      <Link href={`/haber/${article.slug}`} className="relative block aspect-[4/3] w-28 shrink-0 overflow-hidden bg-line sm:w-36 dark:bg-line-dark">
        <Image
          src={article.coverMedia?.url || "/images/placeholder-news.svg"}
          alt={article.coverMedia?.altText || article.title}
          fill
          className="object-cover"
          sizes="144px"
        />
      </Link>
      <div className="min-w-0">
        <Link href={`/haber/${article.slug}`}>
          <h3 className="text-headline-m font-serif leading-snug hover:text-brand-red line-clamp-2">
            {article.title}
          </h3>
        </Link>
        <p className="mt-1 hidden text-caption text-ink-secondary sm:line-clamp-2 sm:block dark:text-ink-dark-secondary">
          {article.excerpt}
        </p>
        <span className="mt-1 block text-meta text-ink-secondary dark:text-ink-dark-secondary">
          {article.sourceDisplayName ?? ""} {article.publishedAt ? `· ${formatRelativeTr(article.publishedAt)}` : ""}
        </span>
      </div>
    </article>
  );
}
