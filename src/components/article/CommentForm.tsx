"use client";

import { useState } from "react";
import { submitCommentAction } from "@/server/actions/commentActions";

export function CommentForm({ articleId, articleSlug }: { articleId: string; articleSlug: string }) {
  const [state, setState] = useState<{ error?: string; success?: boolean }>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    const result = await submitCommentAction(articleId, articleSlug, formData);
    setSubmitting(false);
    setState(result);
  }

  if (state.success) {
    return <p className="text-headline-s text-ink-secondary dark:text-ink-dark-secondary">Yorumunuz alındı, onaylandıktan sonra yayınlanacaktır.</p>;
  }

  return (
    <form action={handleSubmit} className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="authorName" placeholder="Adınız" required className="border border-line bg-transparent px-3 py-2 dark:border-line-dark" />
        <input name="authorEmail" type="email" placeholder="E-posta (yayınlanmaz)" required className="border border-line bg-transparent px-3 py-2 dark:border-line-dark" />
      </div>
      <textarea name="body" rows={4} placeholder="Yorumunuz" required className="border border-line bg-transparent px-3 py-2 dark:border-line-dark" />
      {state.error && <p className="text-caption text-brand-red">{state.error}</p>}
      <button type="submit" disabled={submitting} className="bg-brand-red px-4 py-2 text-headline-s text-white hover:bg-brand-red-dark disabled:opacity-50 sm:w-fit">
        {submitting ? "Gönderiliyor..." : "Yorum Gönder"}
      </button>
    </form>
  );
}
