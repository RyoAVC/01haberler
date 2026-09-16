"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 text-center dark:bg-surface-dark">
      <p className="font-serif text-display text-brand-red">Hata</p>
      <h1 className="mt-2 font-serif text-headline-l">Bir şeyler ters gitti</h1>
      <p className="mt-2 max-w-measure text-body text-ink-secondary dark:text-ink-dark-secondary">
        Sayfa yüklenirken beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 bg-brand-red px-5 py-2.5 text-headline-s text-white hover:bg-brand-red-dark"
      >
        Tekrar Dene
      </button>
    </div>
  );
}
