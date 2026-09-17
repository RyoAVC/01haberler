import { beforeEach, expect, it, vi } from "vitest";
import { mediaLibraryWhere } from "@/server/services/mediaLibraryService";
const mocks = vi.hoisted(() => ({ user: vi.fn(), find: vi.fn(), update: vi.fn(), upsert: vi.fn(), audit: vi.fn(), transaction: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: { media: { findFirst: mocks.find, update: mocks.update }, siteSetting: { upsert: mocks.upsert }, auditLog: { create: mocks.audit }, $transaction: mocks.transaction } }));
vi.mock("@/lib/auth/session", () => ({ getCurrentUser: mocks.user }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
import { saveMediaMetadata } from "@/server/actions/mediaActions";
beforeEach(() => { vi.clearAllMocks(); mocks.user.mockResolvedValue({ id: "author", role: "AUTHOR" }); mocks.find.mockResolvedValue({ id: "image" }); });
it("restricts authors to their own media while preserving search", () => {
  const where = mediaLibraryWhere({ id: "author", role: "AUTHOR" }, "  photo ");
  expect(where.uploadedById).toBe("author"); expect(where.OR?.[0]).toEqual({ originalFilename: { contains: "photo", mode: "insensitive" } });
  expect(mediaLibraryWhere({ id: "editor", role: "EDITOR" }, "")).toEqual({});
});
it("rejects metadata changes without authentication or ownership", async () => {
  mocks.user.mockResolvedValue(null); await expect(saveMediaMetadata("image", new FormData())).rejects.toThrow("Yetkiniz");
  mocks.user.mockResolvedValue({ id: "author", role: "AUTHOR" }); mocks.find.mockResolvedValue(null);
  await expect(saveMediaMetadata("image", new FormData())).rejects.toThrow("yetkiniz"); expect(mocks.update).not.toHaveBeenCalled();
});
it("saves bounded metadata with an audit in one transaction", async () => {
  const form = new FormData(); form.set("altText", "a".repeat(300)); form.set("credit", "Photographer"); form.set("rights", "Internal permission note");
  await saveMediaMetadata("image", form);
  expect(mocks.find).toHaveBeenCalledWith({ where: { uploadedById: "author", id: "image" }, select: { id: true } });
  expect(mocks.update).toHaveBeenCalledWith({ where: { id: "image" }, data: { altText: "a".repeat(200) } });
  expect(mocks.transaction).toHaveBeenCalledOnce(); expect(mocks.audit).toHaveBeenCalledOnce();
});

it("rejects invalid focal coordinates before any writes", async () => {
  for (const value of ["-1", "101", "NaN", "Infinity"]) {
    const form = new FormData(); form.set("focusX", value);
    await expect(saveMediaMetadata("image", form)).rejects.toThrow("0–100");
  }
  expect(mocks.transaction).not.toHaveBeenCalled();
});
it("persists a selected focal point without changing the original media URL", async () => {
  const form = new FormData(); form.set("focusX", "25"); form.set("focusY", "75");
  await saveMediaMetadata("image", form);
  expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({ update: expect.objectContaining({ value: expect.objectContaining({ focusX: 25, focusY: 75 }) }) }));
  expect(mocks.update).toHaveBeenCalledWith({ where: { id: "image" }, data: { altText: null } });
});
