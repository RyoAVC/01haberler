import { expect, it } from "vitest";
import {
  isSocialPostingAllowed,
  isWithinQuietHours,
  parseSocialRules,
  type SocialRules,
} from "@/server/services/socialRulesService";

const rules = (over: Partial<SocialRules> = {}): SocialRules => ({
  quietStartHour: null,
  quietEndHour: null,
  allowedCategoryIds: [],
  ...over,
});

it("same-day quiet window excludes hours inside it", () => {
  expect(isWithinQuietHours(3, 1, 6)).toBe(true);
  expect(isWithinQuietHours(6, 1, 6)).toBe(false); // bitis haric
  expect(isWithinQuietHours(0, 1, 6)).toBe(false);
});

it("overnight quiet window wraps past midnight", () => {
  expect(isWithinQuietHours(23, 22, 6)).toBe(true);
  expect(isWithinQuietHours(2, 22, 6)).toBe(true);
  expect(isWithinQuietHours(12, 22, 6)).toBe(false);
});

it("no quiet window when hours are null or equal", () => {
  expect(isWithinQuietHours(3, null, 6)).toBe(false);
  expect(isWithinQuietHours(3, 5, 5)).toBe(false);
});

it("blocks posting during quiet hours", () => {
  expect(isSocialPostingAllowed({ hour: 2, categoryId: "c1", rules: rules({ quietStartHour: 22, quietEndHour: 6 }) })).toBe(false);
});

it("allows any category when the allowlist is empty", () => {
  expect(isSocialPostingAllowed({ hour: 12, categoryId: "c1", rules: rules() })).toBe(true);
});

it("restricts to allowed categories when the allowlist is set", () => {
  expect(isSocialPostingAllowed({ hour: 12, categoryId: "c1", rules: rules({ allowedCategoryIds: ["c1"] }) })).toBe(true);
  expect(isSocialPostingAllowed({ hour: 12, categoryId: "c2", rules: rules({ allowedCategoryIds: ["c1"] }) })).toBe(false);
});

it("parseSocialRules rejects out-of-range hours and non-string category ids", () => {
  const parsed = parseSocialRules({ quietStartHour: 25, quietEndHour: 6, allowedCategoryIds: ["a", 3, null] });
  expect(parsed.quietStartHour).toBeNull();
  expect(parsed.quietEndHour).toBe(6);
  expect(parsed.allowedCategoryIds).toEqual(["a"]);
});
