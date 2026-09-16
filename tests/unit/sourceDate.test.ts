import { expect, it } from "vitest";
import { isFeedDue, validSourceDate } from "@/lib/utils/sourceDate";
it("retains the actual old source date instead of promoting it to now", () => {
  const old = new Date("2025-01-01T10:00:00Z");
  expect(validSourceDate(old, new Date("2026-01-01"))).toEqual(old);
});
it("requires review for missing invalid and future source dates", () => {
  const now = new Date("2026-01-01");
  for (const date of [null, new Date("bad"), new Date("2027-01-01"), new Date("1970-01-01")]) expect(validSourceDate(date, now)).toBeNull();
});
it("respects individual feed intervals", () => {
  const now = Date.parse("2026-09-17T10:00:00Z");
  expect(isFeedDue({ lastFetchedAt: null, fetchIntervalMinutes: 15 }, now)).toBe(true);
  expect(isFeedDue({ lastFetchedAt: new Date(now - 14 * 60000), fetchIntervalMinutes: 15 }, now)).toBe(false);
  expect(isFeedDue({ lastFetchedAt: new Date(now - 15 * 60000), fetchIntervalMinutes: 15 }, now)).toBe(true);
});
