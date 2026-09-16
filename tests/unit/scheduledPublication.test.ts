import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ find: vi.fn(), update: vi.fn(), audit: vi.fn(), invalidate: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: { article: { findMany: mocks.find }, $transaction: async (run: (tx: unknown) => unknown) => run({ article: { updateMany: mocks.update }, auditLog: { create: mocks.audit } }) } }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.invalidate }));
import { publishDueArticles } from "@/server/services/scheduledPublicationService";
const scheduledAt = new Date("2026-09-16T22:00:00Z");
const now = new Date("2026-09-16T22:15:00Z");
beforeEach(() => { vi.clearAllMocks(); mocks.find.mockResolvedValue([{ id: "news", scheduledAt }]); mocks.update.mockResolvedValue({ count: 1 }); });
it("publishes due articles with the intended date and audit record", async () => {
  expect(await publishDueArticles(now)).toBe(1);
  expect(mocks.find).toHaveBeenCalledWith(expect.objectContaining({ where: { status: "SCHEDULED", scheduledAt: { lte: now } } }));
  expect(mocks.update).toHaveBeenCalledWith({ where: { id: "news", status: "SCHEDULED", scheduledAt }, data: { status: "PUBLISHED", publishedAt: scheduledAt, scheduledAt: null } });
  expect(mocks.audit).toHaveBeenCalledOnce(); expect(mocks.invalidate).toHaveBeenCalled();
});
it("does not repeat publication when another job published or rescheduled it", async () => {
  mocks.update.mockResolvedValue({ count: 0 });
  expect(await publishDueArticles(now)).toBe(0);
  expect(mocks.audit).not.toHaveBeenCalled(); expect(mocks.invalidate).not.toHaveBeenCalled();
});
it("does not touch content when no articles are due", async () => {
  mocks.find.mockResolvedValue([]);
  expect(await publishDueArticles(now)).toBe(0); expect(mocks.update).not.toHaveBeenCalled();
});
