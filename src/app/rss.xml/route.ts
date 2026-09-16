import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";

  const articles = await prisma.article.findMany({
    where: { status: "PUBLISHED", publishedAt: { lte: new Date() } },
    orderBy: { publishedAt: "desc" },
    take: 50,
    select: { slug: true, title: true, excerpt: true, publishedAt: true, category: { select: { name: true } } },
  });

  const items = articles
    .map(
      (a) => `  <item>
    <title>${escapeXml(a.title)}</title>
    <link>${appUrl}/haber/${a.slug}</link>
    <guid isPermaLink="true">${appUrl}/haber/${a.slug}</guid>
    <description>${escapeXml(a.excerpt)}</description>
    <category>${escapeXml(a.category.name)}</category>
    <pubDate>${a.publishedAt?.toUTCString()}</pubDate>
  </item>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>01 Haberler</title>
  <link>${appUrl}</link>
  <description>01 Haberler; son dakika, gündem, ekonomi, spor ve daha fazlasında güncel haberler.</description>
  <language>tr</language>
${items}
</channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
