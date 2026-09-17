import { beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), updateMany: vi.fn(), audit: vi.fn(), transaction: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: { siteSetting: { findUnique: m.findUnique, findMany: m.findMany }, $transaction: m.transaction } }));
import { getCollection, listCollections, saveNewsroomRecord } from "@/server/services/newsroomStore";
const value = { kind: "konu", slug: "test", title: "Dosya", summary: "Editörün haber dosyası.", status: "DRAFT", articleIds: [] };
beforeEach(() => {
  vi.clearAllMocks(); m.transaction.mockImplementation(async cb => cb({ siteSetting: { create: m.create, updateMany: m.updateMany }, auditLog: { create: m.audit } }));
  m.findUnique.mockResolvedValue({ key: "newsroom.collection.test", value, updatedAt: new Date() });
  m.findMany.mockResolvedValue([]);
});
it("does not expose draft collections publicly", async () => { expect(await getCollection("test")).toBeNull(); expect(await getCollection("test", false)).toMatchObject({ status: "DRAFT" }); });
it("closed coverage remains accessible as an archive", async () => { m.findUnique.mockResolvedValue({ value: { ...value, status: "CLOSED" }, updatedAt: new Date() }); expect(await getCollection("test")).toMatchObject({ status: "CLOSED" }); });
it("rejects stale saves before writing an audit log", async () => { m.updateMany.mockResolvedValue({ count: 0 }); await expect(saveNewsroomRecord("k", value, "u", new Date().toISOString())).rejects.toThrow("başka bir oturumda"); expect(m.audit).not.toHaveBeenCalled(); });
it("updates and audit share the same transaction", async () => { m.updateMany.mockResolvedValue({ count: 1 }); await saveNewsroomRecord("k", value, "u", new Date().toISOString()); expect(m.transaction).toHaveBeenCalledOnce(); expect(m.audit).toHaveBeenCalledOnce(); });
it("filters locality before pagination", async () => { await listCollections("yerel", true, 2, "ADANA"); expect(m.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 25, take: 25, where: expect.objectContaining({ AND: expect.arrayContaining([{ value: { path: ["cityKey"], equals: "adana" } }]) }) })); });
