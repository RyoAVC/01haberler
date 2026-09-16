import { expect, it, vi } from "vitest";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { writeFileSync } from "node:fs";
vi.mock("@/lib/db", () => ({ prisma: {} }));
import { parseGoldQuote } from "@/server/services/marketService";
import { parseHomeSettings } from "@/server/services/homeSettingsService";
import { parseReadingList } from "@/lib/utils/readingList";
import { MarketBoard } from "@/components/widgets/MarketBoard";
import { BrandCampaign } from "@/components/ads/BrandCampaign";
import { HomeHeadline } from "@/components/home/HomeHeadline";
import type { ArticleCardData } from "@/server/services/articleService";

it("rejects invalid gold values and marks old quotes stale", () => {
  const now = Date.parse("2026-09-17T10:00:00Z");
  const quote = { symbol: "XAU", currency: "USD", price: 4200, updatedAt: "2026-09-17T09:59:00Z" };
  expect(parseGoldQuote(quote, now)?.stale).toBe(false);
  expect(parseGoldQuote({ ...quote, updatedAt: "2026-09-16T10:00:00Z" }, now)?.stale).toBe(true);
  for (const bad of [{ price: -1 }, { price: Infinity }, { symbol: "BTC" }, { currency: "TRY" }, { updatedAt: "bad" }, { updatedAt: "2026-09-18T10:00:00Z" }]) expect(parseGoldQuote({ ...quote, ...bad }, now)).toBeNull();
});
it("bounds saved headline configuration and preserves campaign opt-out", () => {
  expect(parseHomeSettings({ headlineIds: ["", "b", "c", "d"], campaignsEnabled: false })).toEqual({ headlineIds: ["", "b", "c"], campaignsEnabled: false });
  expect(parseHomeSettings(null)).toEqual({ headlineIds: [], campaignsEnabled: true });
});
it("reading list ignores corrupt records, unsafe paths and duplicates", () => {
  const good = { title: "Haber", slug: "haber-1", savedAt: "2026-09-17T10:00:00Z" };
  expect(parseReadingList(JSON.stringify([good, good, { ...good, slug: "//evil.test" }, { ...good, slug: "other", savedAt: "invalid" }]))).toEqual([good]);
  expect(parseReadingList("invalid")).toEqual([]);
});
it("keeps banner destinations and explicit ad disclosures", () => {
  for (const brand of ["avci", "adana"] as const) {
    const html = renderToStaticMarkup(h(BrandCampaign, { brand }));
    expect(html).toContain(brand === "avci" ? 'href="https://avcieticaret.com"' : 'href="https://adana360.com"');
    expect(html).toContain("REKLAM"); expect(html).toContain("sponsored");
  }
});
it("does not invent prices when the provider is unavailable", () => {
  const html = renderToStaticMarkup(h(MarketBoard, { initial: { rates: null, gold: null, checkedAt: "2026-09-17T10:00:00Z" } }));
  expect(html.match(/Veri alınamadı/g)).toHaveLength(4);
  expect(html).toContain("anlık alış/satış fiyatı değildir");
});
it("renders the editorial homepage components responsively", () => {
  const article: ArticleCardData = { id: "sample", slug: "ornek-haber", title: "Günün gelişmeleri, tek bir bakışta", excerpt: "Tasarım önizlemesi için örnek içerik. Bu metin canlı sitede yayımlanmaz.", publishedAt: new Date(), readingTimeMinutes: 2, isBreaking: false, coverMedia: null, category: { name: "Gündem", slug: "gundem" }, author: null, sourceDisplayName: null };
  const html = renderToStaticMarkup(h("div", { className: "home-stage" },
    h("div", { className: "home-rail home-rail-left" }, h(BrandCampaign, { brand: "avci" })), h("div", { className: "home-rail home-rail-right" }, h(BrandCampaign, { brand: "adana" })),
    h("main", { className: "container-page home-canvas py-6" }, h("div", { className: "home-edition" }, h("h1", null, "01 Haberler — Tasarım önizlemesi")),
      h(MarketBoard, { initial: { rates: null, gold: null, checkedAt: "2026-09-17T10:00:00Z" } }),
      h("div", { className: "home-headlines has-secondary" }, h(HomeHeadline, { article, primary: true }), h("div", { className: "secondary-headlines" }, h(HomeHeadline, { article }), h(HomeHeadline, { article }))),
      h("div", { className: "home-campaign-strip" }, h(BrandCampaign, { brand: "avci", compact: true }), h(BrandCampaign, { brand: "adana", compact: true })))));
  expect(html).toContain("PİYASA RADARI");
  if (process.env.HOME_PREVIEW_HTML) writeFileSync(process.env.HOME_PREVIEW_HTML, `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/preview.css"><title>Ana sayfa önizlemesi</title></head><body>${html}</body></html>`);
});
