import { expect, it } from "vitest";
import { parseEditorDraft } from "@/lib/utils/editorDraft";
const now = Date.parse("2026-09-16T22:00:00Z");
const value = { title: "Başlık", excerpt: "Spot", contentHtml: "<p>Metin</p>", metaTitle: "", metaDescription: "" };
it("recovers a recent complete text draft", () => {
  const draft = { value, savedAt: new Date(now - 60000).toISOString() };
  expect(parseEditorDraft(JSON.stringify(draft), now)).toEqual(draft);
});
it("rejects expired, future, incomplete, oversized and corrupt copies", () => {
  for (const raw of [null, "broken", "{}", "a".repeat(600001), JSON.stringify({ value: { title: "only" }, savedAt: new Date(now).toISOString() }), ...[now - 86400001, now + 120000].map(time => JSON.stringify({ value, savedAt: new Date(time).toISOString() }))]) expect(parseEditorDraft(raw, now)).toBeNull();
});
