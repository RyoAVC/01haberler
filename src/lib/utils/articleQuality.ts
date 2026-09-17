export interface ArticleQualityInput {
  title: string;
  excerpt: string;
  contentHtml: string;
  categoryId: string;
  coverMediaId: string;
  coverImageAlt: string;
  metaTitle: string;
  metaDescription: string;
  sourceUrl?: string | null;
  sourceRequired?: boolean;
  sourcePublishedAt?: string | null;
}

export interface QualityIssue { field: string; message: string }

/** Plain-text comparison only; never use this function to sanitize rendered HTML. */
export function qualityText(html: string): string {
  const entities: Record<string, string> = { nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
  return html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&(#x[\da-f]+|#\d+|nbsp|amp|lt|gt|quot|apos);/gi, (match, entity: string) => {
      if (!entity.startsWith("#")) return entities[entity.toLowerCase()] ?? match;
      const value = entity.toLowerCase().startsWith("#x") ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
      return value > 0 && value <= 0x10ffff && !(value >= 0xd800 && value <= 0xdfff) ? String.fromCodePoint(value) : match;
    }).replace(/\s+/g, " ").trim();
}

export function inspectArticle(input: ArticleQualityInput) {
  const issues: QualityIssue[] = [];
  const add = (field: string, message: string) => issues.push({ field, message });
  const title = input.title.trim();
  const excerpt = input.excerpt.trim();
  const body = qualityText(input.contentHtml);
  if (title.length < 5 || title.length > 200) add("title", "Başlık 5–200 karakter olmalı.");
  if (excerpt.length < 10 || excerpt.length > 500) add("excerpt", "Spot 10–500 karakter olmalı.");
  if (!body) add("contentHtml-editor", "Haber gövdesi boş; içeriği kontrol edin.");
  else if (body === qualityText(excerpt)) add("contentHtml-editor", "Haber gövdesi spotla aynı. Kısa haber mi, eksik içerik mi olduğunu kontrol edin.");
  if (!input.categoryId) add("categoryId", "Bir haber kategorisi seçin.");
  if (input.sourceRequired && !input.sourceUrl) add("sourceInfo", "İçe aktarılan haberin kaynak bağlantısı eksik.");
  if (input.sourceUrl && (!URL.canParse(input.sourceUrl) || !/^https?:\/\//i.test(input.sourceUrl))) add("sourceInfo", "Kaynak bağlantısı geçerli bir http/https adresi olmalı.");
  if (input.sourceRequired && (!input.sourcePublishedAt || !Number.isFinite(Date.parse(input.sourcePublishedAt)))) add("sourceInfo", "Kaynak yayın tarihi doğrulanamadı; tarihi editör kontrol etmeli.");
  if (input.sourcePublishedAt && Date.parse(input.sourcePublishedAt) > Date.now() + 60000) add("sourceInfo", "Kaynak yayın tarihi gelecekte görünüyor.");
  if (!input.coverMediaId) add("coverFile", "Kapak görseli yok. Görselsiz yayın tercihini kontrol edin.");
  else if (!input.coverImageAlt.trim()) add("coverImageAlt", "Kapak görselini açıklayan bir alt metin ekleyin.");
  if (input.coverImageAlt.length > 200) add("coverImageAlt", "Görsel alt metni en fazla 200 karakter olmalı.");
  if (input.metaTitle.length > 70) add("metaTitle", "SEO başlığı en fazla 70 karakter olmalı.");
  if (input.metaDescription.length > 160) add("metaDescription", "SEO açıklaması en fazla 160 karakter olmalı.");
  const wordCount = body ? body.split(/\s+/).length : 0;
  return { issues, wordCount };
}
