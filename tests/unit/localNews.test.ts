import { expect, it } from "vitest";
import { normalizeCity } from "@/server/services/localNewsService";

it("trims surrounding whitespace", () => {
  expect(normalizeCity("  Adana  ")).toBe("Adana");
});

it("caps the city name at 80 characters", () => {
  expect(normalizeCity("a".repeat(200))).toHaveLength(80);
});

it("returns an empty string for blank input", () => {
  expect(normalizeCity("   ")).toBe("");
});
