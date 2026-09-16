import Link from "next/link";
import type { ArticleCardData } from "@/server/services/articleService";

export function CompactListItem({ article }: { article: ArticleCardData }) {
  return (
    <li className="border-b border-line py-3 last:border-0 dark:border-line-dark">
      <Link href={`/haber/${article.slug}`} className="block text-headline-s hover:text-brand-red">
        {article.title}
      </Link>
    </li>
  );
}
