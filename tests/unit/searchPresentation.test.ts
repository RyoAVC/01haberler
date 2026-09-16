import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";
import { writeFileSync } from "node:fs";
const search = vi.hoisted(() => vi.fn().mockResolvedValue({ items: [], total: 0 }));
vi.mock("@/server/services/articleService", () => ({ searchArticles: search }));
vi.mock("@/lib/db", () => ({ prisma: { category: { findMany: async () => [{ slug: "spor", name: "Spor" }, { slug: "ekonomi", name: "Ekonomi" }] } } }));
import SearchPage from "@/app/(public)/arama/page";
beforeEach(() => vi.clearAllMocks());
it("does not query articles for invalid dates and displays a useful message", async () => {
  const html = renderToStaticMarkup(await SearchPage({ searchParams: Promise.resolve({ baslangic: "2026-02-30" }) }));
  expect(search).not.toHaveBeenCalled();
  expect(html).toContain('role="alert"');
  expect(html).toContain("Geçerli bir tarih girin");
});
it("supports category-only searches with accessible filter labels and empty guidance", async () => {
  const html = renderToStaticMarkup(await SearchPage({ searchParams: Promise.resolve({ kategori: "spor", sirala: "oldest" }) }));
  expect(search).toHaveBeenCalledWith("", 1, 12, expect.objectContaining({ category: "spor", sort: "oldest" }));
  for (const label of ['for="kategori"', 'for="baslangic"', 'for="bitis"', 'for="sirala"', "Filtreleri temizle", "tarih aralığını genişletin"]) expect(html).toContain(label);
  if (process.env.SEARCH_PREVIEW_HTML) writeFileSync(process.env.SEARCH_PREVIEW_HTML, `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/preview.css"><title>Arama önizlemesi</title></head><body>${html}</body></html>`);
});
