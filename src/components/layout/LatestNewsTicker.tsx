import Link from "next/link";
import { getLatestArticles } from "@/server/services/articleService";
import { isEditorialArticle } from "@/lib/utils/headlines";

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" }).format(date);
}

export async function LatestNewsTicker() {
  const items = (await getLatestArticles(11)).filter(isEditorialArticle).slice(0, 10);
  if (items.length === 0) return null;

  return (
    <div className="flex items-stretch border border-line bg-surface-raised dark:border-line-dark dark:bg-surface-dark-raised">
      <span className="flex shrink-0 items-center bg-brand-red px-4 text-headline-s font-bold uppercase tracking-wide text-white">
        Son Haberler
      </span>
      <div className="group relative flex-1 overflow-hidden">
        <div className="flex w-max animate-marquee items-center gap-10 py-2.5 group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused] motion-reduce:animate-none">
          {[...items, ...items].map((item, i) => (
            <Link
              key={`${item.id}-${i}`}
              aria-hidden={i >= items.length ? true : undefined}
              tabIndex={i >= items.length ? -1 : undefined}
              href={`/haber/${item.slug}`}
              className="flex shrink-0 items-center gap-2 whitespace-nowrap px-2 text-headline-s text-ink hover:text-brand-red dark:text-ink-dark"
            >
              {item.publishedAt && <span className="font-mono text-caption text-brand-red">{formatTime(item.publishedAt)}</span>}
              {item.title}
            </Link>
          ))}
        </div>
      </div>
      <Link
        href="/son-haberler"
        className="flex shrink-0 items-center border-l border-line px-3 text-headline-s text-brand-red hover:underline dark:border-line-dark"
      >
        Tümü
      </Link>
    </div>
  );
}
