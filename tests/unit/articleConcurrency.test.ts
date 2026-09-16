import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ user: vi.fn(), access: vi.fn(), update: vi.fn(), find: vi.fn(), revision: vi.fn(), audit: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: { article: { update: mocks.update, findUnique: mocks.find }, articleRevision: { create: mocks.revision }, auditLog: { create: mocks.audit } } }));
vi.mock("@/lib/auth/session", () => ({ getCurrentUser: mocks.user }));
vi.mock("@/server/services/articleAccessService", () => ({ canEditArticle: mocks.access }));
vi.mock("@/server/services/bannedWordService", () => ({ findBannedWordMatches: async () => ({ blocking: [] }) }));
vi.mock("@/server/services/socialPostService", () => ({ postArticleToSocialPlatforms: vi.fn(), pingGoogleSitemap: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
import { saveArticle } from "@/server/actions/articleActions";
function form() { const value = new FormData(); Object.entries({ title: "Test article title", excerpt: "A sufficiently long excerpt", contentHtml: "<p>A sufficiently long article body for saving.</p>", categoryId: "category", status: "DRAFT", expectedUpdatedAt: "2026-09-16T22:00:00.000Z" }).forEach(([k, v]) => value.set(k, v)); return value; }
beforeEach(() => { vi.clearAllMocks(); mocks.user.mockResolvedValue({ id: "editor", role: "EDITOR" }); mocks.access.mockResolvedValue(true); mocks.update.mockResolvedValue({ id: "news" }); });
it("uses the version read by the editor as an atomic update condition", async () => {
  await saveArticle("news", form());
  expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "news", updatedAt: new Date("2026-09-16T22:00:00Z") } }));
});
it("retains the editor's input on conflict and avoids writing a misleading revision", async () => {
  mocks.update.mockRejectedValue({ code: "P2025" });
  expect((await saveArticle("news", form())).error).toContain("siz düzenlerken değiştirildi");
  expect(mocks.revision).not.toHaveBeenCalled(); expect(mocks.audit).not.toHaveBeenCalled();
});
it("rejects missing versions and unauthorized edits before mutation", async () => {
  const value = form(); value.delete("expectedUpdatedAt");
  expect((await saveArticle("news", value)).error).toContain("güncel değil");
  mocks.access.mockResolvedValue(false);
  expect((await saveArticle("news", form())).error).toContain("yetkiniz yok");
  expect(mocks.update).not.toHaveBeenCalled();
});
it("rejects scheduling in the past", async () => {
  const value = form(); value.set("status", "SCHEDULED"); value.set("scheduledAt", "2020-01-01T12:00");
  expect((await saveArticle("news", value)).error).toContain("gelecekte"); expect(mocks.update).not.toHaveBeenCalled();
});
