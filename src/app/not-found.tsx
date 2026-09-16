import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 text-center dark:bg-surface-dark">
      <p className="font-serif text-display text-brand-red">404</p>
      <h1 className="mt-2 font-serif text-headline-l">Sayfa bulunamadı</h1>
      <p className="mt-2 max-w-measure text-body text-ink-secondary dark:text-ink-dark-secondary">
        Aradığınız haber veya sayfa kaldırılmış ya da hiç var olmamış olabilir.
      </p>
      <Link href="/" className="mt-6 bg-brand-red px-5 py-2.5 text-headline-s text-white hover:bg-brand-red-dark">
        Ana Sayfaya Dön
      </Link>
    </div>
  );
}
