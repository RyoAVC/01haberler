export const READING_LIST_KEY = "01h-reading-list-v1";
export interface SavedArticle { slug: string; title: string; savedAt: string }
export function parseReadingList(raw: string | null): SavedArticle[] {
  try {
    const list = JSON.parse(raw ?? "[]");
    if (!Array.isArray(list)) return [];
    const seen = new Set<string>();
    return list.filter((item): item is SavedArticle => {
      if (!item || typeof item.slug !== "string" || !/^[a-z0-9-]+$/.test(item.slug) || typeof item.title !== "string" || item.title.length > 300 || typeof item.savedAt !== "string" || !Number.isFinite(Date.parse(item.savedAt)) || seen.has(item.slug)) return false;
      seen.add(item.slug); return true;
    }).slice(0, 100);
  } catch { return []; }
}
