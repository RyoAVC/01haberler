import Link from "next/link";
import { prisma } from "@/lib/db";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { CategoryNav } from "@/components/layout/CategoryNav";
import { BreakingNewsBar } from "@/components/layout/BreakingNewsBar";
import { MarketWidget } from "@/components/widgets/MarketWidget";
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
    <header className="sticky top-0 z-30 bg-surface dark:bg-surface-dark">
      <div className="hidden rule-bottom bg-surface dark:bg-surface-dark sm:block">
        <div className="container-page flex h-8 items-center justify-between text-meta text-ink-secondary dark:text-ink-dark-secondary">
          <span className="flex items-center gap-4">
            <span className="capitalize">{todayLabel()}</span>
            <MarketWidget />
          </span>
          <nav aria-label="Kurumsal bağlantılar" className="flex items-center gap-4">
            <Link href="/hakkimizda" className="hover:text-brand-red">Hakkımızda</Link>
            <Link href="/iletisim" className="hover:text-brand-red">İletişim</Link>
            <Link href="/rss.xml" className="hover:text-brand-red">RSS</Link>
          </nav>
        </div>
      </div>

      <div className="rule-bottom">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center bg-brand-red text-base font-bold text-white">
              01
            </span>
            <span className="font-serif text-headline-l font-bold tracking-tight">Haberler</span>
          </Link>

          <div className="flex items-center gap-1">
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
