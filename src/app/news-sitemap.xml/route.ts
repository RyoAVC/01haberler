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
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const articles = await prisma.article.findMany({
    where: { status: "PUBLISHED", publishedAt: { gte: since, lte: new Date() } },
    orderBy: { publishedAt: "desc" },
    take: 1000,
    select: {
      slug: true,
      title: true,
      publishedAt: true,
      category: { select: { name: true } },
      tags: { select: { tag: { select: { name: true } } } },
    },
  });

  const urls = articles
    .map((a) => {
      const keywords = a.tags.map(({ tag }) => tag.name).join(", ");
      return `  <url>
    <loc>${appUrl}/haber/${a.slug}</loc>
    <news:news>
      <news:publication>
        <news:name>01 Haberler</news:name>
        <news:language>tr</news:language>
      </news:publication>
      <news:publication_date>${a.publishedAt?.toISOString()}</news:publication_date>
      <news:title>${escapeXml(a.title)}</news:title>
      ${keywords ? `<news:keywords>${escapeXml(keywords)}</news:keywords>` : ""}
    </news:news>
  </url>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
