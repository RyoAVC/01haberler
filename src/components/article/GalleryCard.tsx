import Link from "next/link";
import Image from "next/image";
import type { ArticleCardData } from "@/server/services/articleService";

export function GalleryCard({ article }: { article: ArticleCardData }) {
  return (
    <article>
      <Link href={`/haber/${article.slug}`} className="relative block aspect-[4/3] w-full overflow-hidden bg-line dark:bg-line-dark">
        <Image
          src={article.coverMedia?.url || "/images/placeholder-news.svg"}
          alt={article.coverMedia?.altText || article.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
      </Link>
      <Link href={`/haber/${article.slug}`}>
        <h3 className="mt-2 text-headline-s leading-snug hover:text-brand-red line-clamp-2">{article.title}</h3>
      </Link>
    </article>
  );
}
