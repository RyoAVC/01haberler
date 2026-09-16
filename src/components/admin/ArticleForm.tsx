"use client";

import { useState } from "react";
import { saveArticle } from "@/server/actions/articleActions";
import { suggestExcerptAction, suggestSeoMetaAction } from "@/server/actions/aiEditorActions";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { ArticleQualityPanel } from "@/components/admin/ArticleQualityPanel";

interface Option {
  id: string;
  name: string;
}

interface ExistingArticle {
  id: string;
  title: string;
  excerpt: string;
  contentHtml: string;
  categoryId: string;
  authorId: string | null;
  coverMediaId: string | null;
  coverImageAlt: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  status: string;
  isBreaking: boolean;
  isFeatured: boolean;
  isEditorsPick: boolean;
  tagIds: string[];
}

interface Props {
  categories: Option[];
  tags: Option[];
  authors: Option[];
  canPublish: boolean;
  article?: ExistingArticle;
  aiEditorEnabled?: boolean;
}

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Taslak" },
  { value: "SCHEDULED", label: "Zamanlanmış" },
  { value: "PUBLISHED", label: "Yayınla" },
];

export function ArticleForm({ categories, tags, authors, canPublish, article, aiEditorEnabled = false }: Props) {
  const [coverMediaId, setCoverMediaId] = useState(article?.coverMediaId ?? "");
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBreaking, setIsBreaking] = useState(article?.isBreaking ?? false);
  const [title, setTitle] = useState(article?.title ?? "");
  const [contentHtml, setContentHtml] = useState(article?.contentHtml ?? "");
  const [categoryId, setCategoryId] = useState(article?.categoryId ?? "");
  const [coverImageAlt, setCoverImageAlt] = useState(article?.coverImageAlt ?? "");
  const [excerpt, setExcerpt] = useState(article?.excerpt ?? "");
  const [metaTitle, setMetaTitle] = useState(article?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(article?.metaDescription ?? "");
  const [aiExcerptLoading, setAiExcerptLoading] = useState(false);
  const [aiSeoLoading, setAiSeoLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  function getContentText(): string {
    const hidden = document.getElementById("contentHtml-hidden") as HTMLInputElement | null;
    return (hidden?.value ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }

  async function handleAiExcerpt() {
    setAiError(null);
    setAiExcerptLoading(true);
    const result = await suggestExcerptAction(title, getContentText());
    setAiExcerptLoading(false);
    if (result.error) setAiError(result.error);
    else if (result.excerpt) setExcerpt(result.excerpt);
  }

  async function handleAiSeoMeta() {
    setAiError(null);
    setAiSeoLoading(true);
    const result = await suggestSeoMetaAction(title, getContentText());
    setAiSeoLoading(false);
    if (result.error) setAiError(result.error);
    else {
      if (result.metaTitle) setMetaTitle(result.metaTitle);
      if (result.metaDescription) setMetaDescription(result.metaDescription);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/admin/media/upload", { method: "POST", body: formData });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) {
      setUploadError(data.error ?? "Yükleme başarısız");
      return;
    }
    setCoverMediaId(data.id);
    setCoverPreview(data.url);
  }

  async function handleSubmit(formData: FormData) {
    const result = await saveArticle(article?.id ?? null, formData);
    if (result?.error) setError(result.error);
  }

  return (
    <form action={handleSubmit} className="max-w-3xl space-y-6">
      {error && <p role="alert" className="border border-brand-red px-3 py-2 text-headline-s text-brand-red">{error}</p>}
      <ArticleQualityPanel value={{ title, excerpt, contentHtml, categoryId, coverMediaId, coverImageAlt, metaTitle, metaDescription }} />

      <div>
        <label htmlFor="title" className="block text-headline-s">Başlık</label>
        <input
          id="title"
          name="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full border border-line bg-transparent px-3 py-2 dark:border-line-dark"
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="excerpt" className="block text-headline-s">Spot / Özet</label>
          {aiEditorEnabled && (
            <button
              type="button"
              onClick={handleAiExcerpt}
              disabled={aiExcerptLoading || !title}
              className="text-caption text-brand-red hover:underline disabled:opacity-50"
            >
              {aiExcerptLoading ? "Öneri alınıyor..." : "AI Önerisi Al"}
            </button>
          )}
        </div>
        <textarea
          id="excerpt"
          name="excerpt"
          required
          rows={2}
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          className="mt-1 w-full border border-line bg-transparent px-3 py-2 dark:border-line-dark"
        />
        {aiError && <p className="mt-1 text-caption text-brand-red">{aiError}</p>}
      </div>

      <div>
        <label className="block text-headline-s">
          İçerik <span className="text-caption text-ink-secondary">— kaydedilirken otomatik olarak temizlenir</span>
        </label>
        <div className="mt-1">
          <RichTextEditor name="contentHtml" initialContent={article?.contentHtml} onContentChange={setContentHtml} />
        </div>
      </div>

      <div>
        <label htmlFor="coverFile" className="block text-headline-s">Kapak Görseli</label>
        <input id="coverFile" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFileChange} className="mt-1 text-headline-s" />
        {uploading && <p className="mt-1 text-caption text-ink-secondary">Yükleniyor...</p>}
        {uploadError && <p className="mt-1 text-caption text-brand-red">{uploadError}</p>}
        {(coverPreview || article?.coverMediaId) && (
          <p className="mt-1 text-caption text-ink-secondary dark:text-ink-dark-secondary">Görsel seçildi.</p>
        )}
        <input type="hidden" name="coverMediaId" value={coverMediaId} />
      </div>

      <div>
        <label htmlFor="coverImageAlt" className="block text-headline-s">Görsel Alt Metni</label>
        <input
          id="coverImageAlt"
          name="coverImageAlt"
          value={coverImageAlt}
          onChange={(e) => setCoverImageAlt(e.target.value)}
          className="mt-1 w-full border border-line bg-transparent px-3 py-2 dark:border-line-dark"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="categoryId" className="block text-headline-s">Kategori</label>
          <select
            id="categoryId"
            name="categoryId"
            required
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="mt-1 w-full border border-line bg-transparent px-3 py-2 dark:border-line-dark"
          >
            <option value="">Seçin</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="authorId" className="block text-headline-s">Yazar (opsiyonel)</label>
          <select
            id="authorId"
            name="authorId"
            defaultValue={article?.authorId ?? ""}
            className="mt-1 w-full border border-line bg-transparent px-3 py-2 dark:border-line-dark"
          >
            <option value="">Yok</option>
            {authors.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="tagIds" className="block text-headline-s">Etiketler (Ctrl/Cmd ile çoklu seçim)</label>
        <select
          id="tagIds"
          name="tagIds"
          multiple
          defaultValue={article?.tagIds ?? []}
          className="mt-1 h-32 w-full border border-line bg-transparent px-3 py-2 dark:border-line-dark"
        >
          {tags.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      <div>
        {aiEditorEnabled && (
          <button
            type="button"
            onClick={handleAiSeoMeta}
            disabled={aiSeoLoading || !title}
            className="text-caption text-brand-red hover:underline disabled:opacity-50"
          >
            {aiSeoLoading ? "Öneri alınıyor..." : "AI ile SEO Başlık/Açıklama Öner"}
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <label htmlFor="metaTitle" className="block text-headline-s">
          SEO Başlık
          <input id="metaTitle" name="metaTitle" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} className="mt-1 w-full border border-line bg-transparent px-3 py-2 dark:border-line-dark" />
        </label>
        <label htmlFor="canonicalUrl" className="block text-headline-s">
          Canonical URL (opsiyonel)
          <input id="canonicalUrl" name="canonicalUrl" defaultValue={article?.canonicalUrl ?? ""} className="mt-1 w-full border border-line bg-transparent px-3 py-2 dark:border-line-dark" />
        </label>
      </div>
      <label htmlFor="metaDescription" className="block text-headline-s">
        SEO Açıklama
        <textarea id="metaDescription" name="metaDescription" rows={2} value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} className="mt-1 w-full border border-line bg-transparent px-3 py-2 dark:border-line-dark" />
      </label>

      <fieldset className="flex flex-wrap gap-6 border-t border-line pt-4 text-headline-s dark:border-line-dark">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="isBreaking" defaultChecked={isBreaking} onChange={(e) => setIsBreaking(e.target.checked)} /> Son Dakika
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="isFeatured" defaultChecked={article?.isFeatured} /> Öne Çıkan
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="isEditorsPick" defaultChecked={article?.isEditorsPick} /> Editörün Seçtiği
        </label>
      </fieldset>

      <div>
        <label htmlFor="status" className="block text-headline-s">Durum</label>
        <select
          id="status"
          name="status"
          defaultValue={article?.status ?? "DRAFT"}
          disabled={!canPublish}
          className="mt-1 w-full border border-line bg-transparent px-3 py-2 disabled:opacity-60 dark:border-line-dark"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        {!canPublish && (
          <p className="mt-1 text-caption text-ink-secondary dark:text-ink-dark-secondary">
            Yazar rolü haberleri doğrudan yayınlayamaz; kaydettiğinizde inceleme kuyruğuna düşer.
          </p>
        )}
        <label htmlFor="scheduledAt" className="mt-2 block text-caption text-ink-secondary dark:text-ink-dark-secondary">
          Zamanlama (opsiyonel)
          <input id="scheduledAt" type="datetime-local" name="scheduledAt" className="mt-1 block border border-line bg-transparent px-3 py-2 dark:border-line-dark" />
        </label>
      </div>

      <button type="submit" className="bg-brand-red px-6 py-2.5 text-headline-s text-white hover:bg-brand-red-dark">
        Kaydet
      </button>
    </form>
  );
}
