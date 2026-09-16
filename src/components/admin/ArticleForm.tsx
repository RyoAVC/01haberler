"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { EditorDraftRecovery } from "@/components/admin/EditorDraftRecovery";
import { qualityText } from "@/lib/utils/articleQuality";
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
  coverMediaUrl?: string | null;
  coverImageAlt: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  status: string;
  scheduledAt?: string;
  updatedAt?: string;
  isBreaking: boolean;
  isFeatured: boolean;
  isEditorsPick: boolean;
  tagIds: string[];
}

interface Props {
  userId?: string;
  categories: Option[];
  tags: Option[];
  authors: Option[];
  canPublish: boolean;
  article?: ExistingArticle;
  aiEditorEnabled?: boolean;
}

const STATUS_OPTIONS = [
  { value: "PENDING_REVIEW", label: "İncelemede" },
  { value: "DRAFT", label: "Taslak" },
  { value: "SCHEDULED", label: "Zamanlanmış" },
  { value: "PUBLISHED", label: "Yayınla" },
];

export function ArticleForm({ categories, tags, authors, canPublish, article, aiEditorEnabled = false, userId }: Props) {
  const router = useRouter();
  const [editorGeneration, setEditorGeneration] = useState(0);
  const [coverMediaId, setCoverMediaId] = useState(article?.coverMediaId ?? "");
  const [coverPreview, setCoverPreview] = useState<string | null>(article?.coverMediaUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
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
    try {
      const res = await fetch("/api/admin/media/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) { setUploadError(data.error ?? "Yükleme başarısız"); return; }
      setCoverMediaId(data.id); setCoverPreview(data.url);
    } catch { setUploadError("Görsel yüklenemedi. Bağlantınızı kontrol edip tekrar deneyin."); }
    finally { setUploading(false); }
  }

  async function handleSubmit(formData: FormData) {
    setSaving(true); setError(null);
    try {
      const result = await saveArticle(article?.id ?? null, formData);
      if (result?.error) setError(result.error);
      else if (result.savedId) {
        setDraftSaved(true);
        try { sessionStorage.removeItem(`01h-editor:${userId}:${article?.id ?? "new"}`); } catch { /* unavailable */ }
        router.push(`/admin/haberler/${result.savedId}/duzenle?kaydedildi=1`); router.refresh();
      }
    } catch {
      setError("Kayıt tamamlanamadı. Metniniz bu formda korunuyor; bağlantınızı kontrol edip tekrar deneyin.");
    } finally { setSaving(false); }
  }

  return (
    <form onInput={() => setDraftSaved(false)} onSubmit={event => { event.preventDefault(); if (!saving) void handleSubmit(new FormData(event.currentTarget)); }} className="max-w-3xl space-y-6">
      {article && <input type="hidden" name="expectedUpdatedAt" value={article.updatedAt ?? ""} />}
      {error && <p role="alert" className="border border-brand-red px-3 py-2 text-headline-s text-brand-red">{error}</p>}
      {userId && <EditorDraftRecovery paused={saving || draftSaved} storageKey={`01h-editor:${userId}:${article?.id ?? "new"}`} value={{ title, excerpt, contentHtml, metaTitle, metaDescription }} baseline={{ title: article?.title ?? "", excerpt: article?.excerpt ?? "", contentHtml: article?.contentHtml ?? "", metaTitle: article?.metaTitle ?? "", metaDescription: article?.metaDescription ?? "" }} onRestore={draft => { setDraftSaved(false); setTitle(draft.title); setExcerpt(draft.excerpt); setContentHtml(draft.contentHtml); setMetaTitle(draft.metaTitle); setMetaDescription(draft.metaDescription); setEditorGeneration(current => current + 1); }} />}
      <details className="rounded-lg border border-line-dark p-4"><summary className="cursor-pointer text-caption">Metin önizlemesi</summary><div className="mt-4 rounded-lg bg-white p-5 text-neutral-900"><h2 className="font-serif text-headline-l">{title || "Haber başlığı"}</h2><p className="mt-3 font-medium">{excerpt}</p><p className="mt-5 whitespace-pre-wrap text-body">{qualityText(contentHtml)}</p></div><p className="mt-2 text-caption text-ink-dark-secondary">Yayın öncesi metin kontrolü; sitenin tüm yerleşimini temsil etmez.</p></details>
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
          <RichTextEditor key={editorGeneration} name="contentHtml" initialContent={contentHtml} onContentChange={setContentHtml} />
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
        {coverPreview && <Image src={coverPreview} alt={coverImageAlt || "Seçilen kapak"} width={600} height={340} unoptimized className="mt-3 max-h-52 w-full rounded object-contain" />}
        <MediaPicker onSelect={media => { setCoverMediaId(media.id); setCoverPreview(media.url); setCoverImageAlt(media.altText ?? ""); }} />
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
          {article && !STATUS_OPTIONS.some(s => s.value === article.status) && <option value={article.status}>Mevcut durum: {article.status}</option>}
        </select>
        {!canPublish && (
          <p className="mt-1 text-caption text-ink-secondary dark:text-ink-dark-secondary">
            Yazar rolü haberleri doğrudan yayınlayamaz; kaydettiğinizde inceleme kuyruğuna düşer.
          </p>
        )}
        <label htmlFor="scheduledAt" className="mt-2 block text-caption text-ink-secondary dark:text-ink-dark-secondary">
          Yayın zamanı (Türkiye saati)
          <input id="scheduledAt" type="datetime-local" name="scheduledAt" defaultValue={article?.scheduledAt ?? ""} className="mt-1 block border border-line bg-transparent px-3 py-2 dark:border-line-dark" />
          <span className="mt-2 block">Zamanlı yayın için Durum alanında Zamanlanmış seçin. Yayın, zamanı geldikten sonraki ilk cron çalışmasında gerçekleşir.</span>
        </label>
      </div>

      <button type="submit" disabled={saving || uploading} className="bg-brand-red px-6 py-2.5 text-headline-s text-white hover:bg-brand-red-dark disabled:opacity-50">
        {saving ? "Kaydediliyor…" : "Kaydet"}
      </button>
    </form>
  );
}
