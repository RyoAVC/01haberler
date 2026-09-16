"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavCategory {
  slug: string;
  name: string;
}

export function CategoryNav({ categories }: { categories: NavCategory[] }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Ana kategoriler"
      className="hide-scrollbar flex items-center gap-1 overflow-x-auto"
    >
      {categories.map((c) => {
        const isActive = pathname === `/kategori/${c.slug}`;
        return (
          <Link
            key={c.slug}
            href={`/kategori/${c.slug}`}
            aria-current={isActive ? "page" : undefined}
            className={`whitespace-nowrap border-b-2 px-3 py-3 text-headline-s transition-colors ${
              isActive
                ? "border-brand-red text-brand-red"
                : "border-transparent text-ink hover:text-brand-red dark:text-ink-dark"
            }`}
          >
            {c.name}
          </Link>
        );
      })}
    </nav>
  );
}
