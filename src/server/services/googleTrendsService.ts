import Parser from "rss-parser";

export interface TrendingTopic {
  title: string;
  approxTraffic: string | null;
  newsTitle: string | null;
  newsSource: string | null;
  newsUrl: string | null;
}

interface TrendRssItem {
  title?: string;
  approxTraffic?: string;
  newsItemTitle?: string;
  newsItemSource?: string;
  newsItemUrl?: string;
}

const TRENDS_FEED_URL = "https://trends.google.com/trends/trendingsearches/daily/rss?geo=TR";
const CACHE_TTL_MS = 30 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 8000;

let cache: { fetchedAt: number; topics: TrendingTopic[] } | null = null;

// Google Trends'in resmi bir API'si yoktur; bu uzun suredir yayinda olan
// gunluk trend RSS beslemesini kullaniyoruz. Resmi olmadigi icin herhangi bir
// anda formati degisebilir veya erisilemez hale gelebilir - bu durumda
// dashboard'u kirmadan sessizce bos liste donuyoruz.
export async function getTrendingTopics(): Promise<TrendingTopic[]> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.topics;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const parser = new Parser<Record<string, unknown>, TrendRssItem>({
      timeout: REQUEST_TIMEOUT_MS,
      customFields: {
        item: [
          ["ht:approx_traffic", "approxTraffic"],
          ["ht:news_item_title", "newsItemTitle"],
          ["ht:news_item_source", "newsItemSource"],
          ["ht:news_item_url", "newsItemUrl"],
        ],
      },
    });

    const response = await fetch(TRENDS_FEED_URL, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; 01HaberlerBot/1.0)" },
    });
    if (!response.ok) throw new Error(`Trends feed HTTP ${response.status}`);

    const xml = await response.text();
    const feed = await parser.parseString(xml);

    const topics: TrendingTopic[] = (feed.items ?? [])
      .slice(0, 10)
      .map((item) => ({
        title: (item.title ?? "").trim(),
        approxTraffic: item.approxTraffic ?? null,
        newsTitle: item.newsItemTitle ?? null,
        newsSource: item.newsItemSource ?? null,
        newsUrl: item.newsItemUrl ?? null,
      }))
      .filter((t) => t.title.length > 0);

    cache = { fetchedAt: Date.now(), topics };
    return topics;
  } catch {
    return cache?.topics ?? [];
  } finally {
    clearTimeout(timeout);
  }
}
