import Link from "next/link";

export function Pagination({
  currentPage,
  totalPages,
  basePath,
}: {
  currentPage: number;
  totalPages: number;
  basePath: string;
}) {
  if (totalPages <= 1) return null;

  const pageHref = (page: number) => {
    if (page === 1) return basePath;
    const separator = basePath.includes("?") ? "&" : "?";
    return `${basePath}${separator}sayfa=${page}`;
  };

  return (
    <nav aria-label="Sayfalama" className="mt-10 flex items-center justify-center gap-4 rule-top pt-6 text-headline-s">
      <Link
        href={pageHref(Math.max(1, currentPage - 1))}
        aria-disabled={currentPage === 1}
        className={currentPage === 1 ? "pointer-events-none opacity-30" : "hover:text-brand-red"}
      >
        ← Önceki
      </Link>
      <span className="text-meta text-ink-secondary dark:text-ink-dark-secondary">
        Sayfa {currentPage} / {totalPages}
      </span>
      <Link
        href={pageHref(Math.min(totalPages, currentPage + 1))}
        aria-disabled={currentPage === totalPages}
        className={currentPage === totalPages ? "pointer-events-none opacity-30" : "hover:text-brand-red"}
      >
        Sonraki →
      </Link>
    </nav>
  );
}
