"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { bulkCreateArticlesAction } from "@/server/actions/articleActions";

interface Category {
  id: string;
  name: string;
}

export function BulkAddForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ created: number; blocked: number } | null>(null);

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setResult(null);
    const res = await bulkCreateArticlesAction(formData);
    setSubmitting(false);
    setResult(res);
    if (res.created > 0) router.refresh();
  }

  return (
    <form action={handleSubmit} className="mt-6 space-y-4">
      <div>
        <label htmlFor="categoryId" className="block text-headline-s">Kategori (tümüne uygulanır)</label>
        <select
          id="categoryId"
          name="categoryId"
          required
          className="mt-1 w-full border border-line bg-transparent px-3 py-2 dark:border-line-dark"
        >
          <option value="">Seçin</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="bulkText" className="block text-headline-s">Haberler</label>
        <textarea
          id="bulkText"
          name="bulkText"
          rows={16}
          required
          placeholder={"İlk haberin başlığı\nİlk haberin içeriği burada devam eder...\n\n---\n\nİkinci haberin başlığı\nİkinci haberin içeriği..."}
          className="mt-1 w-full border border-line bg-transparent px-3 py-2 font-mono text-caption dark:border-line-dark"
        />
      </div>

      {result && (
        <p className="border border-line px-3 py-2 text-headline-s dark:border-line-dark">
          {result.created} haber oluşturuldu (İncelemede).
          {result.blocked > 0 && ` ${result.blocked} haber yasaklı kelime nedeniyle atlandı.`}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="bg-brand-red px-5 py-2.5 text-headline-s text-white hover:bg-brand-red-dark disabled:opacity-50"
      >
        {submitting ? "Oluşturuluyor..." : "Haberleri Oluştur"}
      </button>
    </form>
  );
}
