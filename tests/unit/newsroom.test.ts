import { describe, expect, it } from "vitest";
import { headlineWindow, activeHeadlineIds } from "@/lib/utils/headlineSchedule";
import { collectionSchema, liveEntrySchema, submissionSchema } from "@/lib/validation/newsroom";
import { parseFollowing } from "@/lib/utils/following";
import { mediaFocus } from "@/lib/utils/mediaFocus";
import { newsletterToken, validNewsletterToken } from "@/lib/utils/newsletterTokens";
const collection = { kind: "konu", slug: "ornek-konu", title: "Örnek konu", summary: "Doğrulanabilir bir haber dosyası özeti.", status: "DRAFT", articleIds: ["one", "one", "two"] };
describe("headline publication window", () => {
  it("uses Turkey time and excludes the exact end boundary", () => {
    const w = headlineWindow("2026-09-17T12:00", "2026-09-17T13:00");
    expect(w.startAt).toBe("2026-09-17T09:00:00.000Z");
    expect(activeHeadlineIds(["a", "b"], [w], Date.parse("2026-09-17T09:00:00Z"))).toEqual(["a", "b"]);
    expect(activeHeadlineIds(["a", "b"], [w], Date.parse("2026-09-17T10:00:00Z"))).toEqual(["", "b"]);
    expect(activeHeadlineIds(["a"], [w], Date.parse("2026-09-17T08:59:00Z"))).toEqual([""]);
  });
  it("rejects reversed dates and fails closed for corrupt stored dates", () => {
    expect(() => headlineWindow("2026-09-17T13:00", "2026-09-17T12:00")).toThrow();
    expect(activeHeadlineIds(["a"], [{ startAt: "bad", endAt: null }])).toEqual([""]);
  });
});
it("bounds collections, requires a city and deduplicates linked articles", () => {
  expect(collectionSchema.parse(collection).articleIds).toEqual(["one", "two"]);
  expect(collectionSchema.safeParse({ ...collection, kind: "yerel" }).success).toBe(false);
  expect(collectionSchema.safeParse({ ...collection, slug: "../../admin" }).success).toBe(false);
  expect(collectionSchema.safeParse({ ...collection, articleIds: Array(101).fill("a") }).success).toBe(false);
});
it("rejects executable live entry links", () => {
  const e = { collection: "ornek", title: "Gelişme", body: "Gelişme metni", pinned: false, publishedAt: new Date().toISOString(), sourceUrl: "javascript:alert(1)" };
  expect(liveEntrySchema.safeParse(e).success).toBe(false);
  expect(liveEntrySchema.safeParse({ ...e, sourceUrl: "https://example.com/source" }).success).toBe(true);
});
it("reader submissions require consent and bounded text", () => {
  const report = { kind: "CORRECTION", name: "Test Okuru", email: "test@example.com", title: "Düzeltme talebi", message: "Doğrulanabilir bilgi içeren bir düzeltme talebidir.", articleUrl: "", consent: true };
  expect(submissionSchema.safeParse(report).success).toBe(true);
  expect(submissionSchema.safeParse({ ...report, consent: false }).success).toBe(false);
  expect(submissionSchema.safeParse({ ...report, message: "a".repeat(5001) }).success).toBe(false);
});
it("following ignores corrupt entries, unsafe destinations and duplicates", () => {
  const item = { href: "/konu/ornek", title: "Dosya" };
  expect(parseFollowing(JSON.stringify([item, item, { href: "//evil.com", title: "X" }, { href: "/admin/a", title: "X" }]))).toEqual([item]);
  expect(parseFollowing("invalid")).toEqual([]);
});
it("focus coordinates cannot inject CSS or exceed image bounds", () => {
  expect(mediaFocus({ focusX: -3, focusY: 110 })).toEqual({ x: 0, y: 100 });
  expect(mediaFocus({ focusX: "0; background:url(x)", focusY: NaN })).toEqual({ x: 50, y: 50 });
});
it("newsletter tokens bind recipient, purpose, nonce and signing key", () => {
  const token = newsletterToken("a", "nonce", "confirm", "test-secret");
  expect(validNewsletterToken(token, token)).toBe(true);
  for (const other of [newsletterToken("b", "nonce", "confirm", "test-secret"), newsletterToken("a", "nonce", "unsubscribe", "test-secret"), newsletterToken("a", "new", "confirm", "test-secret"), newsletterToken("a", "nonce", "confirm", "other")]) expect(validNewsletterToken(other, token)).toBe(false);
  expect(validNewsletterToken(token + "00", token)).toBe(false);
});
