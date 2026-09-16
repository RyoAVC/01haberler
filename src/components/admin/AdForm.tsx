"use client";

import { useState } from "react";
import { createAd } from "@/server/actions/adActions";

interface Option {
  id: string;
  name: string;
  slug: string;
}

const PLACEMENT_LABEL: Record<string, string> = {
  HEADER_BELOW: "Header Altı (yatay)",
  HOME_BELOW_HERO: "Ana Sayfa — Manşet Altı",
  IN_FEED: "Haber Listesi İçi (native)",
  ARTICLE_AFTER_LEAD: "Haber Detayı — Spottan Sonra",
  ARTICLE_MID_BODY: "Haber Detayı — İçerik Ortası",
  ARTICLE_END: "Haber Detayı — Sonu",
  SIDEBAR: "Sağ Sidebar (masaüstü)",
  FOOTER_ABOVE: "Footer Üstü (yatay)",
  STICKY_BOTTOM: "Sticky Alt Banner",
};

export function AdForm({ categories }: { categories: Option[] }) {
  const [provider, setProvider] = useState("MANUAL");
  const [imageMediaId, setImageMediaId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/admin/media/upload", { method: "POST", body: formData });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) {
      setError(data.error ?? "Yükleme başarısız");
      return;
    }
    setImageMediaId(data.id);
  }

  return (
    <form action={createAd} className="grid gap-4 sm:grid-cols-2">
      {error && <p role="alert" className="border border-brand-red px-3 py-2 text-headline-s text-brand-red sm:col-span-2">{error}</p>}

      <label className="block text-headline-s">
        Reklam Alanı Adı
        <input name="name" required className="mt-1 w-full border border-line bg-transparent px-3 py-2 dark:border-line-dark" />
      </label>
      <label className="block text-headline-s">
        Benzersiz Slot Anahtarı
        <input name="slotKey" required pattern="[a-z0-9-]+" placeholder="ornek-anasayfa-sidebar" className="mt-1 w-full border border-line bg-transparent px-3 py-2 dark:border-line-dark" />
      </label>

      <label className="block text-headline-s">
        Sağlayıcı
        <select name="provider" value={provider} onChange={(e) => setProvider(e.target.value)} className="mt-1 w-full border border-line bg-transparent px-3 py-2 dark:border-line-dark">
          <option value="MANUAL">Manuel Görsel Kampanya</option>
          <option value="ADSENSE">Google AdSense</option>
          <option value="GOOGLE_AD_MANAGER">Google Ad Manager</option>
        </select>
      </label>
      <label className="block text-headline-s">
        Yerleşim
        <select name="placement" required className="mt-1 w-full border border-line bg-transparent px-3 py-2 dark:border-line-dark">
          {Object.entries(PLACEMENT_LABEL).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </label>

      {provider !== "MANUAL" ? (
        <>
          <label className="block text-headline-s">
            Publisher ID
            <input name="publisherId" placeholder="pub-XXXXXXXXXXXXXXXX" className="mt-1 w-full border border-line bg-transparent px-3 py-2 dark:border-line-dark" />
          </label>
          <label className="block text-headline-s">
            Reklam Birimi Slot ID
            <input name="adUnitSlotId" className="mt-1 w-full border border-line bg-transparent px-3 py-2 dark:border-line-dark" />
          </label>
        </>
      ) : (
        <>
          <label className="block text-headline-s">
            Hedef URL
            <input name="targetUrl" type="url" required placeholder="https://reklamveren.com" className="mt-1 w-full border border-line bg-transparent px-3 py-2 dark:border-line-dark" />
          </label>
          <label className="block text-headline-s">
            Başlık (opsiyonel)
            <input name="headline" className="mt-1 w-full border border-line bg-transparent px-3 py-2 dark:border-line-dark" />
          </label>
          <label className="block text-headline-s sm:col-span-2">
            Reklam Görseli
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFileChange} className="mt-1 block" />
            {uploading && <span className="text-caption text-ink-secondary">Yükleniyor...</span>}
            <input type="hidden" name="imageMediaId" value={imageMediaId} />
          </label>
        </>
      )}

      <label className="block text-headline-s">
        Genişlik (px, opsiyonel)
        <input name="width" type="number" className="mt-1 w-full border border-line bg-transparent px-3 py-2 dark:border-line-dark" />
      </label>
      <label className="block text-headline-s">
        Yükseklik (px, opsiyonel — CLS önlemi için önerilir)
        <input name="height" type="number" className="mt-1 w-full border border-line bg-transparent px-3 py-2 dark:border-line-dark" />
      </label>

      <label className="block text-headline-s">
        Hedef Kategori (opsiyonel)
        <select name="categoryScope" className="mt-1 w-full border border-line bg-transparent px-3 py-2 dark:border-line-dark">
          <option value="">Tüm sayfalar</option>
          {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>
      </label>
      <label className="block text-headline-s">
        Öncelik
        <input name="priority" type="number" defaultValue={0} className="mt-1 w-full border border-line bg-transparent px-3 py-2 dark:border-line-dark" />
      </label>

      <label className="block text-headline-s">
        Başlangıç (opsiyonel)
        <input name="startAt" type="datetime-local" className="mt-1 w-full border border-line bg-transparent px-3 py-2 dark:border-line-dark" />
      </label>
      <label className="block text-headline-s">
        Bitiş (opsiyonel)
        <input name="endAt" type="datetime-local" className="mt-1 w-full border border-line bg-transparent px-3 py-2 dark:border-line-dark" />
      </label>

      <fieldset className="flex flex-wrap gap-4 text-headline-s sm:col-span-2">
        <label className="flex items-center gap-2"><input type="checkbox" name="isResponsive" defaultChecked /> Responsive</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="showOnDesktop" defaultChecked /> Masaüstü</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="showOnTablet" defaultChecked /> Tablet</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="showOnMobile" defaultChecked /> Mobil</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="isActive" /> Yayında (aktif)</label>
      </fieldset>

      <button type="submit" className="bg-brand-red px-6 py-2.5 text-headline-s text-white hover:bg-brand-red-dark sm:col-span-2">
        Reklam Alanı Ekle
      </button>
    </form>
  );
}
