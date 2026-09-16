import { describe, expect, it } from "vitest";
import { selectHeadlines } from "@/lib/utils/headlines";
import { bodyWithoutDuplicateSummary } from "@/lib/utils/articleBody";

describe("homepage headline selection", () => {
  const a = { id: "a", slug: "editor-secimi" };
  const b = { id: "b", slug: "son-haber" };
  it("fills a partial editorial selection without duplicate stories", () => {
    expect(selectHeadlines([a], [a, b])).toEqual([a, b]);
  });
  it("excludes the known launch test without excluding real articles about tests", () => {
    const demo = { id: "demo", slug: "01-haberler-yayina-girdi-sitenin-ilk-test-haberi" };
    const real = { id: "real", slug: "yeni-test-sonuclari" };
    expect(selectHeadlines([demo], [demo, real])).toEqual([real]);
  });
  it("handles empty and single-story feeds", () => {
    expect(selectHeadlines([], [])).toEqual([]);
    expect(selectHeadlines([], [a])).toEqual([a]);
  });
});

describe("duplicate summary presentation", () => {
  it("omits an exact summary despite markup and whitespace", () => {
    expect(bodyWithoutDuplicateSummary("<p>Haber <strong>özeti</strong>.</p>", "Haber özeti.")).toBe("");
    expect(bodyWithoutDuplicateSummary("<p>A &amp; B</p>", "A & B")).toBe("");
  });
  it("preserves further paragraphs, source links and images", () => {
    for (const html of ["<p>Özet</p><p>Yeni ayrıntı</p>", '<p>Özet</p><img src="/x.jpg">', '<p><a href="/kaynak">Özet</a></p>']) {
      expect(bodyWithoutDuplicateSummary(html, "Özet")).toBe(html);
    }
  });
});
