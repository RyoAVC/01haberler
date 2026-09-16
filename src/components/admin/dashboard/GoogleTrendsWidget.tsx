import { getTrendingTopics } from "@/server/services/googleTrendsService";

export async function GoogleTrendsWidget() {
  const topics = await getTrendingTopics();
  if (topics.length === 0) return null;

  return (
    <section className="border border-line p-4 dark:border-line-dark">
      <h2 className="font-serif text-headline-m">Google Trend Haberler</h2>
      <p className="text-caption text-ink-secondary dark:text-ink-dark-secondary">Türkiye&apos;de şu anda trend olan konular</p>
      <ol className="mt-3 space-y-3">
        {topics.map((topic, i) => (
          <li key={topic.title} className="flex gap-3">
            <span className="font-serif text-headline-m text-line dark:text-line-dark">{i + 1}</span>
            <div>
              <p className="text-headline-s font-semibold">{topic.title}</p>
              {topic.newsTitle && (
                <p className="line-clamp-1 text-caption text-ink-secondary dark:text-ink-dark-secondary">
                  {topic.newsTitle} {topic.newsSource && `· ${topic.newsSource}`}
                </p>
              )}
              {topic.approxTraffic && (
                <p className="text-caption text-ink-secondary dark:text-ink-dark-secondary">{topic.approxTraffic} arama</p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
