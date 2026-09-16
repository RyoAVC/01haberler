import type { MetadataRoute } from "next";

// GEO (generative engine optimization): AI arama/asistan botlarinin siteyi
// tarayip alintilayabilmesi icin acikca izin veriyoruz (engelleme degil,
// gorunurluk amaci) - ayni /admin, /api istisnasiyla.
const AI_CRAWLER_USER_AGENTS = [
  "GPTBot",
  "ChatGPT-User",
  "Google-Extended",
  "PerplexityBot",
  "ClaudeBot",
  "anthropic-ai",
  "CCBot",
  "Bytespider",
];

export default function robots(): MetadataRoute.Robots {
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] },
      ...AI_CRAWLER_USER_AGENTS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: ["/admin", "/api"],
      })),
    ],
    sitemap: [`${appUrl}/sitemap.xml`, `${appUrl}/news-sitemap.xml`],
  };
}
