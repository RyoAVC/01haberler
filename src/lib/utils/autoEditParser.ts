// Otomatik yayin oncesi AI yaniti icin duz metin ayristirici. Kod
// bloklarini/markdown kalin isaretlerini temizler, etiketleri buyuk/kucuk
// harf ve Turkce varyasyonlarina karsi tolere eder. AI'nin istenen formattan
// kucuk sapmalarinda (or. "**BAŞLIK:**" ya da "Başlık:") haberin sessizce
// incelemede kalmasini onlemek icin mumkun oldugunca esnek eslesme yapar.
export interface ParsedAutoEdit {
  title?: string;
  body?: string;
  seoTitle?: string;
  seoDesc?: string;
}

function stripLabel(value: string | undefined): string | undefined {
  return value?.trim().replace(/^\*+|\*+$/g, "").trim() || undefined;
}

export function parseAutoEdit(raw: string): ParsedAutoEdit {
  const clean = raw.replace(/```[a-zA-Z]*\n?/g, "").trim();
  const titleMatch = clean.match(/(?:BAŞLIK|Başlık|baslik)\s*:\s*\**\s*(.+)/i);
  const contentMatch = clean.match(
    /(?:İÇERİK|İçerik|icerik)\s*:\s*\**\s*([\s\S]+?)(?:\n\**\s*(?:SEO_BASLIK|SEO_A[CÇ]IKLAMA)\s*:|$)/i
  );
  const seoTitleMatch = clean.match(/SEO_BASLIK\s*:\s*\**\s*(.+)/i);
  const seoDescMatch = clean.match(/SEO_A[CÇ]IKLAMA\s*:\s*\**\s*(.+)/i);
  return {
    title: stripLabel(titleMatch?.[1]),
    body: stripLabel(contentMatch?.[1]),
    seoTitle: stripLabel(seoTitleMatch?.[1]),
    seoDesc: stripLabel(seoDescMatch?.[1]),
  };
}
