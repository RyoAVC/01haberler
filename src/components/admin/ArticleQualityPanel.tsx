"use client";

import { inspectArticle, type ArticleQualityInput } from "@/lib/utils/articleQuality";

export function ArticleQualityPanel({ value }: { value: ArticleQualityInput }) {
  const { issues, wordCount } = inspectArticle(value);
  function focusField(id: string) {
    const field = document.getElementById(id);
    field?.scrollIntoView({ block: "center", behavior: "auto" });
    field?.focus({ preventScroll: true });
  }
  return (
    <section aria-labelledby="quality-heading" className="border border-line bg-surface p-4 sm:p-5 dark:border-line-dark dark:bg-surface-dark">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="quality-heading" className="font-serif text-headline-m">Yayın kalite kontrolü</h2>
        <span className="text-caption text-ink-secondary dark:text-ink-dark-secondary">{wordCount} kelime · {value.title.trim().length}/200 başlık</span>
      </div>
      <p role="status" className="mt-2 text-headline-s">{issues.length ? `${issues.length} nokta gözden geçirilmeli` : "Otomatik kontrolde uyarı bulunmadı"}</p>
      {issues.length > 0 && <ul className="mt-3 divide-y divide-line dark:divide-line-dark">
        {issues.map(issue => <li key={`${issue.field}-${issue.message}`}>
          <button type="button" onClick={() => focusField(issue.field)} className="w-full py-3 text-left text-caption hover:text-brand-red focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-red">
            {issue.message} <span className="whitespace-nowrap text-brand-red">Alana git →</span>
          </button>
        </li>)}
      </ul>}
      <p className="mt-3 text-caption text-ink-secondary dark:text-ink-dark-secondary">Uyarılar yazdıkça güncellenir ve tek başına kaydı engellemez. İçe aktarılan haberlerde kaynak bağlantısı ve tarih biçimi denetlenir; bilgi doğruluğunu editör kontrol etmelidir.</p>
    </section>
  );
}
