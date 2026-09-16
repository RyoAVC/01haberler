import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ authored: vi.fn(), created: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: { article: { count: mocks.authored }, auditLog: { count: mocks.created } } }));
import { canEditArticle } from "@/server/services/articleAccessService";
beforeEach(() => { vi.clearAllMocks(); mocks.authored.mockResolvedValue(0); mocks.created.mockResolvedValue(0); });
it("denies an author access to another author's article", async () => {
  expect(await canEditArticle({ id: "author", role: "AUTHOR" }, "other")).toBe(false);
  expect(mocks.authored).toHaveBeenCalledWith({ where: { id: "other", author: { userId: "author" } } });
});
it("allows the assigned author or original creator", async () => {
  mocks.authored.mockResolvedValue(1); expect(await canEditArticle({ id: "author", role: "AUTHOR" }, "own")).toBe(true);
  mocks.authored.mockResolvedValue(0); mocks.created.mockResolvedValue(1); expect(await canEditArticle({ id: "author", role: "AUTHOR" }, "own")).toBe(true);
});
it("allows editors to edit all articles", async () => {
  expect(await canEditArticle({ id: "editor", role: "EDITOR" }, "other")).toBe(true); expect(mocks.authored).not.toHaveBeenCalled();
});
