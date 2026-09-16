import type { Metadata } from "next";

export const metadata: Metadata = { title: "Bakımdayız" };

export default function MaintenancePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 text-center dark:bg-surface-dark">
      <span className="flex h-12 w-12 items-center justify-center bg-brand-red text-lg font-bold text-white">01</span>
      <h1 className="mt-4 font-serif text-headline-l">Kısa Bir Bakımdayız</h1>
      <p className="mt-2 max-w-measure text-body text-ink-secondary dark:text-ink-dark-secondary">
        01 Haberler şu anda planlı bir bakım çalışması nedeniyle erişime kapalıdır. Kısa süre içinde geri döneceğiz.
      </p>
    </div>
  );
}
