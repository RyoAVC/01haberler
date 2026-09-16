import { describe, it, expect } from "vitest";
import { slugify } from "@/lib/utils/slug";

describe("slugify", () => {
  it("converts Turkish characters to ASCII equivalents", () => {
    expect(slugify("İstanbul'da Öğrenci Şaşkın")).toBe("istanbulda-ogrenci-saskin");
  });

  it("lowercases and hyphenates", () => {
    expect(slugify("Merhaba Dünya")).toBe("merhaba-dunya");
  });

  it("collapses multiple spaces and trims dashes", () => {
    expect(slugify("  Ekonomi   Haberleri  ")).toBe("ekonomi-haberleri");
  });

  it("strips punctuation", () => {
    expect(slugify("Deprem: 6.2 büyüklüğünde!")).toBe("deprem-62-buyuklugunde");
  });
});
