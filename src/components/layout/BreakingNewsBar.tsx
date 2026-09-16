import Link from "next/link";
import { prisma } from "@/lib/db";

export async function BreakingNewsBar() {
  const now = new Date();
  const items = await prisma.article.findMany({
    where: {
      status: "PUBLISHED",
      isBreaking: true,
      OR: [{ breakingEndAt: null }, { breakingEndAt: { gt: now } }],
    },
    orderBy: [{ breakingPriority: "desc" }, { publishedAt: "desc" }],
    take: 8,
    select: { slug: true, title: true },
  });

  if (items.length === 0) return null;

  return (
    <div className="rule-bottom bg-surface dark:bg-surface-dark">
      <div className="container-page flex items-center gap-3 py-2 text-headline-s">
        <span className="flex shrink-0 items-center gap-1.5 text-meta font-bold uppercase tracking-wide text-brand-red">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-red" aria-hidden />
          Son Dakika
        </span>
        <div className="hide-scrollbar flex gap-6 overflow-x-auto">
          {items.map((item) => (
            <Link
              key={item.slug}
              href={`/haber/${item.slug}`}
              className="whitespace-nowrap text-ink hover:text-brand-red dark:text-ink-dark"
            >
              {item.title}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
