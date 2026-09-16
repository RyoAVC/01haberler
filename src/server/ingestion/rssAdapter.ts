import Parser from "rss-parser";
import type { FeedAdapter, NormalizedFeedItem } from "./types";

type MediaTag = { $?: { url?: string } } | { $?: { url?: string } }[] | undefined;

type RssItem = {
  title?: string;
  link?: string;
  contentSnippet?: string;
  content?: string;
  "content:encoded"?: string;
  isoDate?: string;
  pubDate?: string;
  enclosure?: { url?: string };
  mediaContent?: MediaTag;
  mediaThumbnail?: MediaTag;
};

function firstUrlFromMediaTag(tag: MediaTag): string | null {
  if (!tag) return null;
  const entry = Array.isArray(tag) ? tag[0] : tag;
  return entry?.$?.url ?? null;
}

function firstImageFromHtml(html: string | undefined): string | null {
  if (!html) return null;
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1] ?? null;
}

function resolveImageUrl(item: RssItem): string | null {
  return (
    item.enclosure?.url ??
    firstUrlFromMediaTag(item.mediaContent) ??
    firstUrlFromMediaTag(item.mediaThumbnail) ??
    firstImageFromHtml(item["content:encoded"] ?? item.content) ??
    null
  );
}

export const rssAdapter: FeedAdapter = {
  async fetchItems(feedUrl, timeoutMs, userAgent): Promise<NormalizedFeedItem[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const parser = new Parser<Record<string, unknown>, RssItem>({
        timeout: timeoutMs,
        headers: { "User-Agent": userAgent },
        customFields: {
          item: [
            ["media:content", "mediaContent"],
            ["media:thumbnail", "mediaThumbnail"],
          ],
        },
      });

      const response = await fetch(feedUrl, {
        signal: controller.signal,
        headers: { "User-Agent": userAgent },
      });

      if (!response.ok) {
        throw new Error(`Feed getirilemedi: HTTP ${response.status}`);
      }

      const xml = await response.text();
      const feed = await parser.parseString(xml);

      return (feed.items ?? []).map((item): NormalizedFeedItem => {
        const rawDate = item.isoDate ?? item.pubDate;
        return {
          title: (item.title ?? "").trim(),
          excerpt: (item.contentSnippet ?? item.content ?? "").trim().slice(0, 500),
          link: (item.link ?? "").trim(),
          publishedAt: rawDate ? new Date(rawDate) : null,
          imageUrl: resolveImageUrl(item),
        };
      }).filter((item) => item.title.length > 0 && item.link.length > 0);
    } finally {
      clearTimeout(timeout);
    }
  },
};
