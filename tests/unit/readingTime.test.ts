import { describe, it, expect } from "vitest";
import { estimateReadingTimeMinutes } from "@/lib/utils/readingTime";

describe("estimateReadingTimeMinutes", () => {
  it("returns at least 1 minute for short content", () => {
    expect(estimateReadingTimeMinutes("<p>Kısa bir haber.</p>")).toBe(1);
  });

  it("strips HTML tags before counting words", () => {
    const html = "<p>" + "kelime ".repeat(400) + "</p>";
    expect(estimateReadingTimeMinutes(html)).toBe(2);
  });
});
