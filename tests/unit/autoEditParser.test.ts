import { expect, it } from "vitest";
import { parseAutoEdit } from "@/lib/utils/autoEditParser";

it("parses the exact requested format", () => {
  const raw = "BAŞLIK: Test başlık\nİÇERİK: Test içerik metni burada.\nSEO_BASLIK: Kısa SEO başlık\nSEO_ACIKLAMA: SEO açıklaması burada.";
  const r = parseAutoEdit(raw);
  expect(r.title).toBe("Test başlık");
  expect(r.body).toBe("Test içerik metni burada.");
  expect(r.seoTitle).toBe("Kısa SEO başlık");
  expect(r.seoDesc).toBe("SEO açıklaması burada.");
});

it("tolerates markdown bold labels", () => {
  const raw = "**BAŞLIK:** Kalın başlık\n**İÇERİK:** Kalın içerik.\n**SEO_BASLIK:** SEO b\n**SEO_ACIKLAMA:** SEO a";
  const r = parseAutoEdit(raw);
  expect(r.title).toBe("Kalın başlık");
  expect(r.body).toBe("Kalın içerik.");
});

it("tolerates lowercase/ASCII label variants", () => {
  const raw = "Başlık: Karışık başlık\nİçerik: Karışık içerik.";
  const r = parseAutoEdit(raw);
  expect(r.title).toBe("Karışık başlık");
  expect(r.body).toBe("Karışık içerik.");
});

it("strips fenced code blocks around the response", () => {
  const raw = "```\nBAŞLIK: Kod içi başlık\nİÇERİK: Kod içi içerik.\n```";
  const r = parseAutoEdit(raw);
  expect(r.title).toBe("Kod içi başlık");
  expect(r.body).toBe("Kod içi içerik.");
});

it("returns undefined fields when the format is completely unrecognizable", () => {
  const r = parseAutoEdit("Üzgünüm, bu isteği yerine getiremem.");
  expect(r.title).toBeUndefined();
  expect(r.body).toBeUndefined();
});

it("stops content capture before the SEO fields even with preceding preamble text", () => {
  const raw = "Elbette, işte istediğiniz format:\n\nBAŞLIK: Başlık\nİÇERİK: İçerik birinci cümle. İkinci cümle.\nSEO_BASLIK: SB\nSEO_ACIKLAMA: SA";
  const r = parseAutoEdit(raw);
  expect(r.body).toBe("İçerik birinci cümle. İkinci cümle.");
  expect(r.seoTitle).toBe("SB");
});
