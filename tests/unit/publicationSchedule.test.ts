import { expect, it } from "vitest";
import { parsePublicationSchedule, formatPublicationSchedule } from "@/lib/utils/publicationSchedule";
it("interprets editor dates in Turkey time across UTC day boundaries", () => {
  const date = parsePublicationSchedule("2026-09-17T01:30");
  expect(date?.toISOString()).toBe("2026-09-16T22:30:00.000Z");
  expect(formatPublicationSchedule(date)).toBe("2026-09-17T01:30");
});
it("rejects rolled-over and malformed dates", () => {
  for (const value of ["2026-02-30T12:00", "2026-13-01T00:00", "2026-09-17T24:00", "tomorrow"]) expect(() => parsePublicationSchedule(value)).toThrow();
  expect(parsePublicationSchedule("")).toBeNull();
  expect(formatPublicationSchedule(null)).toBe("");
});
