export interface NormalizedFeedItem {
  title: string;
  excerpt: string;
  link: string;
  publishedAt: Date | null;
  imageUrl: string | null;
}

export interface FeedAdapter {
  fetchItems(feedUrl: string, timeoutMs: number, userAgent: string): Promise<NormalizedFeedItem[]>;
}
