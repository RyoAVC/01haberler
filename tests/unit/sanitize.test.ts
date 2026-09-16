import { describe, it, expect } from "vitest";
import { sanitizeArticleHtml } from "@/lib/utils/sanitize";

describe("sanitizeArticleHtml", () => {
  it("strips script tags", () => {
    const dirty = "<p>Merhaba</p><script>alert('xss')</script>";
    const clean = sanitizeArticleHtml(dirty);
    expect(clean).not.toContain("<script>");
    expect(clean).toContain("Merhaba");
  });

  it("removes inline event handler attributes", () => {
    const dirty = '<p onclick="alert(1)">Tıkla</p>';
    const clean = sanitizeArticleHtml(dirty);
    expect(clean).not.toContain("onclick");
  });

  it("keeps allowed tags like paragraphs and links", () => {
    const dirty = '<p>Bkz: <a href="https://example.com">kaynak</a></p>';
    const clean = sanitizeArticleHtml(dirty);
    expect(clean).toContain("<a");
    expect(clean).toContain('href="https://example.com"');
  });

  it("blocks javascript: URLs in links", () => {
    const dirty = '<a href="javascript:alert(1)">tikla</a>';
    const clean = sanitizeArticleHtml(dirty);
    expect(clean).not.toContain("javascript:");
  });
});
