import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { writeFileSync } from "node:fs";

vi.stubGlobal("React", React);
const { fixtures } = vi.hoisted(() => ({ fixtures: {
  featured: [{ id: "demo", slug: "01-haberler-yayina-girdi-sitenin-ilk-test-haberi", title: "TEST HABERİ" }],
  latest: Array.from({ length: 6 }, (_, i) => ({
    id: `news-${i}`, slug: `haber-${i}`, title: ["Şehrin gündeminde bugün: ulaşım ve yaşam", "Ekonomide günün gelişmeleri", "Spor dünyasından son haberler", "Kültür ve sanat takvimi", "Teknolojide yeni adımlar", "Yerel gündemden notlar"][i],
    excerpt: "Bu içerik yalnızca yerel tasarım kontrolü için hazırlanmış bir örnektir.",
    coverMedia: null, category: { name: "Gündem", slug: "gundem" },
    publishedAt: new Date("2026-09-16T12:00:00Z"), readingTimeMinutes: 2,
  })),
} }));
vi.mock("@/server/services/articleService", () => ({
  getFeaturedArticles: async () => fixtures.featured,
  getLatestArticles: async () => fixtures.latest,
  getMostRead: async () => fixtures.latest,
  getArticlesByCategorySlugForHome: async (slug: string) => ["gundem", "ekonomi"].includes(slug) ? fixtures.latest : [],
}));
vi.mock("@/lib/db", () => ({ prisma: { category: { findUnique: async () => null } } }));
vi.mock("@/server/services/moduleFlagsService", () => ({ isModuleEnabled: async () => false }));
vi.mock("@/server/services/homeSettingsService", () => ({ getHomeSettings: async () => ({ headlineIds: [], campaignsEnabled: true }) }));
vi.mock("@/server/services/pollService", () => ({ getActivePoll: async () => null }));
vi.mock("@/components/ads/AdSlot", () => ({ AdSlot: () => null }));
vi.mock("@/components/widgets/PollWidget", () => ({ PollWidget: () => null }));
vi.mock("@/components/widgets/FixturesWidget", () => ({ FixturesWidget: () => React.createElement("section", null, "Haftalık Fikstür — önizleme") }));
vi.mock("@/components/layout/LatestNewsTicker", () => ({ LatestNewsTicker: () => React.createElement("a", { href: "/son-haberler" }, "Son Haberler → Tümü") }));

import HomePage from "@/app/(public)/page";

describe("home page with partial editorial data", () => {
  it("renders real fallback headlines and no empty placeholder hero", async () => {
    const html = renderToStaticMarkup(await HomePage());
    expect(html).not.toContain("TEST HABERİ");
    expect(html).toContain("Şehrin gündeminde bugün");
    expect(html).not.toContain("placeholder-news.svg");
    expect(html).toContain("Haftalık Fikstür");
    if (process.env.PREVIEW_HTML) writeFileSync(process.env.PREVIEW_HTML, `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/preview.css"><title>Yerel tasarım kontrolü</title></head><body><header class="container-page border-b py-5 font-serif text-headline-l">01 Haberler <small class="font-sans text-meta">Yerel önizleme · örnek içerik</small></header>${html}</body></html>`);
  });
});
