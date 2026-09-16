import Link from "next/link";
import { formatRelativeTr } from "@/lib/utils/formatDate";
import type { ArticleCardData } from "@/server/services/articleService";

export function SecondaryHeadline({ article, showRule = true }: { article: ArticleCardData; showRule?: boolean }) {
  return (
    <article className={showRule ? "rule-top pt-3" : ""}>
      <Link href={`/kategori/${article.category.slug}`} className="kicker">
        {article.category.name}
      </Link>
      <Link href={`/haber/${article.slug}`}>
        <h3 className="mt-1 font-serif text-headline-m leading-snug hover:text-brand-red">{article.title}</h3>
      </Link>
      <span className="mt-1 block text-meta text-ink-secondary dark:text-ink-dark-secondary">
        {article.publishedAt ? formatRelativeTr(article.publishedAt) : ""}
      </span>
    </article>
  );
}
