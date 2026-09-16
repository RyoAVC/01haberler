import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ user: vi.fn(), count: vi.fn(), upsert: vi.fn(), audit: vi.fn(), transaction: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: { article: { count: mocks.count }, siteSetting: { upsert: mocks.upsert }, auditLog: { create: mocks.audit }, $transaction: mocks.transaction } }));
vi.mock("@/lib/auth/session", () => ({ getCurrentUser: mocks.user }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
import { saveHomeSettings } from "@/server/actions/homeSettingsActions";
import { selectPinnedHeadlines } from "@/lib/utils/headlines";
beforeEach(() => { vi.clearAllMocks(); mocks.user.mockResolvedValue({ id: "admin", role: "SUPER_ADMIN" }); mocks.count.mockResolvedValue(1); });
it("rejects unauthorized homepage changes", async () => {
  mocks.user.mockResolvedValue({ role: "AUTHOR" });
  await expect(saveHomeSettings(new FormData())).rejects.toThrow("yetkiniz");
  expect(mocks.transaction).not.toHaveBeenCalled();
});
it("rejects unavailable headline selections", async () => {
  mocks.count.mockResolvedValue(0); const form = new FormData(); form.set("primary", "draft");
  await expect(saveHomeSettings(form)).rejects.toThrow("yayındaki"); expect(mocks.upsert).not.toHaveBeenCalled();
});
it("preserves empty slots with an atomic audit", async () => {
  const form = new FormData(); form.set("secondary1", "news"); form.set("campaignsEnabled", "on"); await saveHomeSettings(form);
  expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({ update: expect.objectContaining({ value: { headlineIds: ["", "news", ""], campaignsEnabled: true } }) }));
  expect(mocks.transaction).toHaveBeenCalledOnce(); expect(mocks.audit).toHaveBeenCalledOnce();
});
it("reserves second headline while automatically filling the first", () => {
  const a = { id: "a", slug: "a" }; const b = { id: "b", slug: "b" }; const c = { id: "c", slug: "c" };
  expect(selectPinnedHeadlines(["", "a", ""], [a], [a, b, c])).toEqual([b, a, c]);
  expect(selectPinnedHeadlines(["a", "a", ""], [a], [a, b, c])).toEqual([a, b, c]);
});
