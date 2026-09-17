import Link from "next/link";
import { prisma } from "@/lib/db";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { CategoryNav } from "@/components/layout/CategoryNav";
import { BreakingNewsBar } from "@/components/layout/BreakingNewsBar";

import { SearchIcon } from "@/components/ui/Icons";

function todayLabel(): string {
  return new Intl.DateTimeFormat("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Istanbul",
  }).format(new Date());
}

export async function Header() {
  const categories = await prisma.category.findMany({
    where: { isActive: true, parentId: null },
    orderBy: { sortOrder: "asc" },
    select: { slug: true, name: true },
    take: 12,
  });

  return (
    <header className="news-header relative z-30 bg-surface dark:bg-surface-dark">
      <div className="hidden rule-bottom bg-surface dark:bg-surface-dark sm:block">
        <div className="container-page flex h-8 items-center justify-between text-meta text-ink-secondary dark:text-ink-dark-secondary">
          <span className="flex items-center gap-4">
            <span className="capitalize">{todayLabel()}</span>
            <span className="edition-label">GÜNDEMİN İÇİNDEN</span>
          </span>
          <nav aria-label="Kurumsal bağlantılar" className="flex items-center gap-4">
            <Link href="/hakkimizda" className="hover:text-brand-red">Hakkımızda</Link>
            <Link href="/iletisim" className="hover:text-brand-red">İletişim</Link>
            <Link href="/rss.xml" className="hover:text-brand-red">RSS</Link>
          </nav>
        </div>
      </div>

      <div className="rule-bottom">
        <div className="container-page masthead flex items-center justify-between gap-4">
          <Link href="/" className="news-wordmark flex shrink-0 items-center gap-3">
            <span className="brand-monogram flex items-center justify-center bg-brand-red font-bold text-white">
              01
            </span>
            <span><span className="brand-name block font-serif font-bold tracking-tight">Haberler<span className="text-brand-red">.</span></span><span className="brand-caption">HABERİN MERKEZİNDE</span></span>
          </Link>

          <form action="/arama" role="search" className="header-search hidden lg:flex"><SearchIcon /><label className="sr-only" htmlFor="header-query">Haberlerde ara</label><input id="header-query" name="q" placeholder="Haber, konu veya yazar ara" maxLength={200} /><button type="submit">Ara ↗</button></form>
          <div className="flex shrink-0 items-center gap-1"><Link href="/son-haberler" className="latest-pill hidden sm:inline-flex"><span aria-hidden="true" />Son haberler</Link>
            <Link href="/okuma-listem" className="mr-2 hidden rounded-full border border-line px-4 py-2 text-caption dark:border-line-dark xl:block">Okuma listem</Link>
            <Link
              href="/arama"
              aria-label="Haber ara"
              className="flex h-11 w-11 items-center justify-center text-ink-secondary transition-colors hover:text-brand-red dark:text-ink-dark-secondary"
            >
              <SearchIcon />
            </Link>
            <ThemeToggle />
            <MobileMenu categories={categories} />
          </div>
        </div>
      </div>

      <div className="hidden rule-bottom md:block">
        <div className="container-page">
          <CategoryNav categories={categories} />
        </div>
      </div>

      <BreakingNewsBar />
    </header>
  );
}
