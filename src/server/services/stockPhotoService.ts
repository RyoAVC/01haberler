import { env } from "@/lib/env";

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 6000;

const CATEGORY_QUERY_MAP: Record<string, string> = {
  Spor: "sports",
  Ekonomi: "finance economy",
  Teknoloji: "technology",
  Sağlık: "health medicine",
  Dünya: "world news",
  Politika: "politics government",
  "Kültür-Sanat": "art culture",
  Eğitim: "education school",
  Yaşam: "lifestyle",
  Gündem: "news",
  "Son Dakika": "breaking news",
  "Yerel Haberler": "city urban",
};

const cache = new Map<string, { fetchedAt: number; url: string | null }>();

/**
 * Pexels ucretsiz API'si (anahtar gerektirir, pexels.com/api). Anahtar
 * tanimli degilse veya cagri basarisiz olursa sessizce null doner -
 * ingestion akisini asla bloklamaz.
 */
export async function getStockPhotoForCategory(categoryName: string | null): Promise<string | null> {
  if (!env.PEXELS_API_KEY) return null;

  const query = (categoryName && CATEGORY_QUERY_MAP[categoryName]) || "news";
  const cached = cache.get(query);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.url;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      { headers: { Authorization: env.PEXELS_API_KEY }, signal: controller.signal }
    );
    if (!res.ok) throw new Error(`Pexels HTTP ${res.status}`);

    const data = (await res.json()) as { photos?: { src?: { large?: string } }[] };
    const url = data.photos?.[0]?.src?.large ?? null;

    cache.set(query, { fetchedAt: Date.now(), url });
    return url;
  } catch {
    return cached?.url ?? null;
  } finally {
    clearTimeout(timeout);
  }
}
