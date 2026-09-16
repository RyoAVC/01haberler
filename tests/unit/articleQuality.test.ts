import { expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { inspectArticle, qualityText, type ArticleQualityInput } from "@/lib/utils/articleQuality";
import { ArticleQualityPanel } from "@/components/admin/ArticleQualityPanel";

const complete: ArticleQualityInput = {
  title: "Kentte yeni ulaşım düzenlemesi", excerpt: "Yeni güzergâhlar pazartesi günü kullanılmaya başlanacak.",
  contentHtml: "<p>Belediye yeni ulaşım güzergâhlarını açıkladı. Sefer saatleri resmî duyuruda yer alıyor.</p>",
  categoryId: "local", coverMediaId: "cover", coverImageAlt: "Durakta bekleyen belediye otobüsü", metaTitle: "", metaDescription: "",
};
it("accepts complete copy without requiring optional SEO overrides", () => {
  expect(inspectArticle(complete).issues).toEqual([]);
  expect(inspectArticle(complete).wordCount).toBe(11);
});
it("flags empty essential fields and missing cover without a spurious alt warning", () => {
  const result = inspectArticle({ ...complete, title: "", excerpt: "", contentHtml: "<p>&nbsp;</p>", categoryId: "", coverMediaId: "", coverImageAlt: "" });
  expect(result.issues.map(i => i.field)).toEqual(["title", "excerpt", "contentHtml-editor", "categoryId", "coverFile"]);
});
it("detects equivalent entity-encoded summaries but preserves substantive extra text", () => {
  const value = { ...complete, excerpt: "Ulaşım & şehir haberleri", contentHtml: "<p>Ulaşım &amp; şehir&nbsp;haberleri</p>" };
  expect(inspectArticle(value).issues.some(i => i.field === "contentHtml-editor")).toBe(true);
  expect(inspectArticle({ ...value, contentHtml: value.contentHtml + "<p>Ek ayrıntılar açıklandı.</p>" }).issues).toEqual([]);
});
it("handles numeric entities and invalid codepoints without throwing", () => {
  expect(qualityText("<script>hidden()</script><p>&#304;stanbul &#x26; Ankara</p>")).toBe("İstanbul & Ankara");
  expect(() => qualityText("&#999999999999; &#xD800;")).not.toThrow();
});
it("flags field limits and only requests alt text when a cover exists", () => {
  const result = inspectArticle({ ...complete, title: "a".repeat(201), excerpt: "a".repeat(501), coverImageAlt: "", metaTitle: "a".repeat(71), metaDescription: "a".repeat(161) });
  expect(result.issues.map(i => i.field)).toEqual(["title", "excerpt", "coverImageAlt", "metaTitle", "metaDescription"]);
});
it("renders review guidance and non-submitting field links without claiming factual approval", () => {
  const html = renderToStaticMarkup(createElement(ArticleQualityPanel, { value: { ...complete, coverImageAlt: "" } }));
  expect(html).toContain('type="button"');
  expect(html).toContain('role="status"');
  expect(html).toContain("1 nokta gözden geçirilmeli");
  expect(html).toContain("bilgi doğruluğunu editör ayrıca kontrol etmelidir");
});
