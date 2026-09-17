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

it("rejects duplicate articles before writing settings or audit", async () => {
  const form = new FormData(); form.set("primary", "news"); form.set("secondary1", "news");
  await expect(saveHomeSettings(form)).rejects.toThrow("Aynı haber");
  expect(mocks.count).not.toHaveBeenCalled(); expect(mocks.transaction).not.toHaveBeenCalled();
});
it("rejects reversed windows and records schedule details on successful saves", async () => {
  const form = new FormData(); form.set("primary", "news"); form.set("start0", "2026-09-17T15:00"); form.set("end0", "2026-09-17T14:00");
  await expect(saveHomeSettings(form)).rejects.toThrow("Bitiş zamanı");
  expect(mocks.transaction).not.toHaveBeenCalled();
  form.set("end0", "2026-09-17T16:00"); await saveHomeSettings(form);
  expect(mocks.audit).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ userId: "admin", metadata: expect.objectContaining({ timezone: "Europe/Istanbul", settings: expect.objectContaining({ windows: expect.arrayContaining([{ startAt: "2026-09-17T12:00:00.000Z", endAt: "2026-09-17T13:00:00.000Z" }]) }) }) }) }));
});
it("replaces expired primary with newest unreserved article without repeating secondary", async () => {
  const { activeHeadlineIds } = await import("@/lib/utils/headlineSchedule");
  const old = { id: "old", slug: "old" }, newest = { id: "new", slug: "new" }, secondary = { id: "second", slug: "second" }, other = { id: "other", slug: "other" };
  const ids = activeHeadlineIds(["old", "second", ""], [{ startAt: null, endAt: "2026-09-17T12:00:00Z" }], Date.parse("2026-09-17T12:00:00Z"));
  expect(selectPinnedHeadlines(ids, [old, secondary], [newest, secondary, other, old])).toEqual([newest, secondary, other]);
});
