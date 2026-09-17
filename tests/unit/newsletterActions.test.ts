import { beforeEach, expect, it, vi } from "vitest";
import { newsletterToken } from "@/lib/utils/newsletterTokens";
const m = vi.hoisted(() => ({ user: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn(), upsert: vi.fn(), audit: vi.fn(), rate: vi.fn(), fetch: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getCurrentUser: m.user }));
vi.mock("@/lib/env", () => ({ env: { SESSION_SECRET: "test-secret", APP_URL: "https://example.com", NODE_ENV: "test" } }));
vi.mock("@/lib/db", () => ({ prisma: { siteSetting: { findUnique: m.findUnique, findMany: m.findMany, create: m.create, update: m.update, updateMany: m.updateMany, upsert: m.upsert }, auditLog: { create: m.audit } } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-real-ip": "127.0.0.1" }) }));
vi.mock("@/lib/security/rateLimit", () => ({ rateLimit: m.rate }));
import { sendNewsletterBatch, updateNewsletterPreference, subscribeNewsletter } from "@/server/actions/newsletterActions";
const subscriber = { email: "test@example.com", nonce: "12345678-1234-4234-8234-123456789abc", status: "PENDING", requestedAt: new Date().toISOString(), consentVersion: "2026-09", confirmedAt: null };
const key = "newsroom.subscriber." + "a".repeat(64);
beforeEach(() => { vi.clearAllMocks(); vi.stubGlobal("fetch", m.fetch); vi.stubEnv("RESEND_API_KEY", "test-key"); vi.stubEnv("NEWSLETTER_FROM", "test@example.com"); m.user.mockResolvedValue({ id: "u", role: "SUPER_ADMIN" }); m.updateMany.mockResolvedValue({ count: 1 }); m.rate.mockResolvedValue({ allowed: true }); });
it("newsletter send requires privileged user and explicit approval", async () => { m.user.mockResolvedValue({ role: "EDITOR" }); expect(await sendNewsletterBatch({}, new FormData())).toHaveProperty("error"); m.user.mockResolvedValue({ id: "u", role: "SUPER_ADMIN" }); expect(await sendNewsletterBatch({}, new FormData())).toHaveProperty("error"); expect(m.fetch).not.toHaveBeenCalled(); });
it("does not accept forged or expired confirmations", async () => {
  m.findUnique.mockResolvedValue({ value: subscriber, updatedAt: new Date() }); const f = new FormData(); f.set("key", key); f.set("intent", "confirm"); f.set("token", "0".repeat(64));
  expect(await updateNewsletterPreference({}, f)).toHaveProperty("error"); expect(m.updateMany).not.toHaveBeenCalled();
  f.set("token", newsletterToken(key, subscriber.nonce, "confirm", "test-secret")); m.findUnique.mockResolvedValue({ value: { ...subscriber, requestedAt: "2020-01-01T00:00:00.000Z" }, updatedAt: new Date() });
  expect(await updateNewsletterPreference({}, f)).toHaveProperty("error"); expect(m.updateMany).not.toHaveBeenCalled();
});
it("valid opt-out stores an unsubscribed state", async () => {
  m.findUnique.mockResolvedValue({ value: { ...subscriber, status: "ACTIVE" }, updatedAt: new Date() }); const f = new FormData(); f.set("key", key); f.set("intent", "unsubscribe"); f.set("token", newsletterToken(key, subscriber.nonce, "unsubscribe", "test-secret"));
  expect(await updateNewsletterPreference({}, f)).toHaveProperty("success"); expect(m.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: { value: expect.objectContaining({ status: "UNSUBSCRIBED" }) } }));
});
it("subscription fails closed when email provider is absent", async () => { vi.stubEnv("RESEND_API_KEY", ""); expect(await subscribeNewsletter({}, new FormData())).toHaveProperty("error"); expect(m.create).not.toHaveBeenCalled(); });
it("a pre-existing delivery claim prevents duplicate mail", async () => {
  const campaignKey = "newsroom.newsletter.12345678-1234-4234-8234-123456789abc";
  const recipient = { key, value: { ...subscriber, status: "ACTIVE", confirmedAt: "2026-01-01T00:00:00.000Z" }, updatedAt: new Date() };
  m.findUnique.mockImplementation(async ({ where }: { where: { key: string } }) => where.key === campaignKey ? { value: { title: "Günün haberleri", body: "Doğrulanmış haberlerden oluşan bülten.", createdAt: new Date().toISOString() } } : where.key === key ? recipient : null);
  m.findMany.mockResolvedValue([recipient]); m.create.mockRejectedValue({ code: "P2002" });
  const f = new FormData(); f.set("key", campaignKey); f.set("approved", "on");
  await sendNewsletterBatch({}, f); expect(m.fetch).not.toHaveBeenCalled();
});
