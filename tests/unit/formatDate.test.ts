import { expect, it } from "vitest";
import { formatDateTr } from "@/lib/utils/formatDate";

it("uses Istanbul's calendar day across UTC midnight boundaries", () => {
  const result = formatDateTr("2026-09-16T21:30:00Z");
  expect(result).toContain("17 Eylül 2026");
  expect(result).toContain("00:30");
});
