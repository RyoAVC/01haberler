import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  user: vi.fn(), category: vi.fn(), before: vi.fn(), update: vi.fn(), audit: vi.fn(), ingestion: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getCurrentUser: mocks.user }));
vi.mock("@/lib/auth/rbac", () => ({ hasPermission: (role: string) => role === "SUPER_ADMIN" }));
vi.mock("@/lib/security/ssrf", () => ({ assertPublicHttpUrl: vi.fn() }));
vi.mock("@/server/ingestion/runIngestionJob", () => ({ runIngestionJob: mocks.ingestion }));
vi.mock("@/server/services/imageAllowlistService", () => ({ addImageAllowlistDomainInternal: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: {
  category: { findFirst: mocks.category },
  $transaction: async (callback: (tx: unknown) => unknown) => callback({ feed: { findUniqueOrThrow: mocks.before, update: mocks.update }, auditLog: { create: mocks.audit } }),
} }));
import { saveFeedCategory } from "@/server/actions/sourceActions";
beforeEach(() => {
  vi.clearAllMocks();
  mocks.user.mockResolvedValue({ id: "editor", role: "SUPER_ADMIN" });
  mocks.category.mockResolvedValue({ id: "sport" });
  mocks.before.mockResolvedValue({ categoryId: "old" });
});
function form(category: string) { const data = new FormData(); data.set("feedId", "feed"); data.set("categoryId", category); return data; }
it("can clear the override and records an audit without fetching a feed", async () => {
  await saveFeedCategory(form(""));
  expect(mocks.update).toHaveBeenCalledWith({ where: { id: "feed" }, data: { categoryId: null } });
  expect(mocks.audit.mock.lastCall?.[0].data.metadata).toEqual({ previousCategoryId: "old", categoryId: null });
  expect(mocks.ingestion).not.toHaveBeenCalled();
});
it("rejects unauthorized changes", async () => {
  mocks.user.mockResolvedValue(null);
  await expect(saveFeedCategory(form("sport"))).rejects.toThrow("yetkiniz");
  expect(mocks.update).not.toHaveBeenCalled();
});
it("rejects inactive or missing categories", async () => {
  mocks.category.mockResolvedValue(null);
  await expect(saveFeedCategory(form("missing"))).rejects.toThrow("Aktif bir kategori");
  expect(mocks.update).not.toHaveBeenCalled();
});
