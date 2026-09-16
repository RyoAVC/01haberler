"use client";

import { useState } from "react";
import Link from "next/link";
import { MenuIcon, CloseIcon } from "@/components/ui/Icons";

interface NavCategory {
  slug: string;
  name: string;
}

export function MobileMenu({ categories }: { categories: NavCategory[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-11 items-center justify-center text-ink-secondary hover:text-brand-red dark:text-ink-dark-secondary"
      >
        {open ? <CloseIcon /> : <MenuIcon />}
      </button>
      {open && (
        <nav className="absolute inset-x-0 top-full z-40 rule-bottom border-t bg-surface p-2 shadow-sm dark:bg-surface-dark">
          <ul>
            {categories.map((c) => (
              <li key={c.slug} className="border-b border-line last:border-0 dark:border-line-dark">
                <Link
                  href={`/kategori/${c.slug}`}
                  className="flex min-h-[44px] items-center px-2 text-headline-s hover:text-brand-red"
                  onClick={() => setOpen(false)}
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
