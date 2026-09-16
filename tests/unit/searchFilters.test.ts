import { describe, expect, it, vi } from "vitest";
import { parseSearchFilters, searchBasePath, searchDateRange } from "@/lib/utils/searchFilters";
const db = vi.hoisted(() => ({ article: { findMany: vi.fn().mockResolvedValue([]), count: vi.fn().mockResolvedValue(0) } }));
vi.mock("@/lib/db", () => ({ prisma: db }));
import { searchArticles } from "@/server/services/articleService";

describe("search filters", () => {
  it("rejects impossible dates and reversed ranges", () => {
    expect(parseSearchFilters({ baslangic: "2026-02-30" }).error).toBeTruthy();
    expect(parseSearchFilters({ baslangic: "2026-09-17", bitis: "2026-09-16" }).error).toBeTruthy();
    expect(parseSearchFilters({ baslangic: "2024-02-29" }).error).toBeNull();
  });
  it("bounds malformed pages and repeated query parameters", () => {
    for (const sayfa of ["-1", "1.5", "Infinity", "100001"]) expect(parseSearchFilters({ sayfa }).page).toBe(1);
    expect(parseSearchFilters({ q: ["a", "b"] }).query).toBe("");
  });
  it("includes the complete Istanbul end day without the following midnight", () => {
    const { start, end } = searchDateRange("2026-09-16", "2026-09-16");
    expect(start?.toISOString()).toBe("2026-09-15T21:00:00.000Z");
    expect(end?.toISOString()).toBe("2026-09-16T21:00:00.000Z");
  });
  it("preserves filters and Unicode in pagination URLs", () => {
    const filters = parseSearchFilters({ q: "süt & yağ", kategori: "ekonomi", baslangic: "2026-09-16", bitis: "2026-09-17", sirala: "popular", sayfa: "2" });
    const url = new URL(searchBasePath(filters), "https://01haberler.com");
    expect(url.searchParams.get("q")).toBe("süt & yağ");
    expect(url.searchParams.get("kategori")).toBe("ekonomi");
    expect(url.searchParams.get("bitis")).toBe("2026-09-17");
    expect(url.searchParams.has("sayfa")).toBe(false);
  });
  it("combines category, text and dates while excluding future unpublished content", async () => {
    await searchArticles("basketbol", 2, 12, { category: "spor", from: "2026-09-16", to: "2026-09-17", sort: "popular" });
    const args = db.article.findMany.mock.lastCall?.[0];
    expect(args.where.status).toBe("PUBLISHED");
    expect(args.where.publishedAt.lte).toBeInstanceOf(Date);
    expect(args.where.category).toEqual({ slug: "spor" });
    expect(args.where.OR).toHaveLength(2);
    expect(args.skip).toBe(12);
    expect(args.orderBy[0]).toEqual({ viewCount: "desc" });
    expect(db.article.count.mock.lastCall?.[0].where).toEqual(args.where);
  });
  it("allows category-only search without an empty text clause", async () => {
    await searchArticles("", 1, 12, { category: "ekonomi", sort: "oldest" });
    const args = db.article.findMany.mock.lastCall?.[0];
    expect(args.where.OR).toBeUndefined();
    expect(args.orderBy[0]).toEqual({ publishedAt: "asc" });
  });
});
