import { beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ user: vi.fn(), count: vi.fn(), save: vi.fn(), collection: vi.fn(), findUnique: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getCurrentUser: m.user }));
vi.mock("@/lib/db", () => ({ prisma: { article: { count: m.count }, siteSetting: { findUnique: m.findUnique } } }));
vi.mock("@/server/services/newsroomStore", () => ({ saveNewsroomRecord: m.save, getCollection: m.collection, entryKey: () => "newsroom.entry.test.1" }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { saveCollectionAction, saveLiveEntryAction } from "@/server/actions/newsroomActions";
beforeEach(() => { vi.clearAllMocks(); m.user.mockResolvedValue({ id: "u", role: "EDITOR" }); m.collection.mockResolvedValue(null); m.count.mockResolvedValue(0); });
function form() { const f = new FormData(); Object.entries({ kind: "konu", slug: "test", title: "Test dosyası", summary: "Dosyanın yeterli uzunlukta özeti.", status: "DRAFT", articleIds: "" }).forEach(([k, v]) => f.set(k, v)); return f; }
it("authors cannot publish collections", async () => { m.user.mockResolvedValue({ role: "AUTHOR" }); expect(await saveCollectionAction({}, form())).toHaveProperty("error"); expect(m.save).not.toHaveBeenCalled(); });
it("linked draft articles are rejected", async () => { const f = form(); f.set("articleIds", "draft"); expect(await saveCollectionAction({}, f)).toHaveProperty("error"); expect(m.save).not.toHaveBeenCalled(); });
it("cannot append entries to closed coverage", async () => { m.collection.mockResolvedValue({ slug: "test", kind: "canli", status: "CLOSED" }); expect(await saveLiveEntryAction({}, form())).toHaveProperty("error"); expect(m.save).not.toHaveBeenCalled(); });
it("cannot update an entry belonging to another collection", async () => { m.collection.mockResolvedValue({ slug: "test", kind: "canli", status: "PUBLISHED" }); const f = form(); f.set("id", "newsroom.entry.other.1"); expect(await saveLiveEntryAction({}, f)).toHaveProperty("error"); expect(m.findUnique).not.toHaveBeenCalled(); });
