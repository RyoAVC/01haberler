import { describe, it, expect } from "vitest";
import { canonicalizeUrl, contentHash } from "@/lib/utils/hash";

describe("canonicalizeUrl", () => {
  it("strips tracking parameters", () => {
    const result = canonicalizeUrl("https://example.com/haber/deprem?utm_source=twitter&utm_medium=social");
    expect(result).toBe("https://example.com/haber/deprem");
  });

  it("removes trailing slash except for root", () => {
    expect(canonicalizeUrl("https://example.com/haber/deprem/")).toBe("https://example.com/haber/deprem");
    expect(canonicalizeUrl("https://example.com/")).toBe("https://example.com/");
  });

  it("removes the hash fragment", () => {
    expect(canonicalizeUrl("https://example.com/haber#yorumlar")).toBe("https://example.com/haber");
  });

  it("sorts query parameters for stable comparison", () => {
    const a = canonicalizeUrl("https://example.com/haber?b=2&a=1");
    const b = canonicalizeUrl("https://example.com/haber?a=1&b=2");
    expect(a).toBe(b);
  });
});

describe("contentHash", () => {
  it("produces the same hash for equivalent content regardless of case/whitespace", () => {
    const a = contentHash("Deprem Oldu", "<p>Büyük bir deprem oldu.</p>");
    const b = contentHash("deprem   oldu", "<p>büyük   bir deprem   oldu.</p>");
    expect(a).toBe(b);
  });

  it("produces different hashes for different content", () => {
    const a = contentHash("Deprem Oldu", "İlk haber");
    const b = contentHash("Sel Oldu", "İkinci haber");
    expect(a).not.toBe(b);
  });
});
