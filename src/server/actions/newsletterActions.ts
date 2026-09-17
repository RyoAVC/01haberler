"use server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { hashIp } from "@/lib/utils/hash";
import { rateLimit } from "@/lib/security/rateLimit";
import { newsletterToken, validNewsletterToken } from "@/lib/utils/newsletterTokens";
import { subscriberSchema, subscriberKey, newsletterConfigured, newsletterLink, sendNewsletterMail, newsletterCampaignSchema, CAMPAIGN_PREFIX, SUBSCRIBER_PREFIX, NewsletterSendError } from "@/server/services/newsletterService";
import { saveNewsroomRecord } from "@/server/services/newsroomStore";
import { revalidatePath } from "next/cache";
import type { FormResult } from "@/components/admin/ActionForm";

export async function subscribeNewsletter(_: FormResult, form: FormData): Promise<FormResult> {
  if (!newsletterConfigured()) return { error: "Bülten aboneliği henüz açılmadı." };
  const parsed = z.string().email().max(254).safeParse(String(form.get("email") ?? "").trim().toLowerCase());
  if (!parsed.success || form.get("consent") !== "on" || form.get("website")) return { error: "Geçerli e-posta ve abonelik onayı gerekli." };
  try {
    const h = await headers(), ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
    const key = subscriberKey(parsed.data);
    const ipLimit = await rateLimit(`newsletter-ip:${hashIp(ip)}`, 5, 3600);
    const addressLimit = await rateLimit(`newsletter-address:${key}`, 1, 600);
    if (!ipLimit.allowed || !addressLimit.allowed) return { error: "Lütfen bir süre bekleyip yeniden deneyin." };
    const row = await prisma.siteSetting.findUnique({ where: { key } });
    const old = subscriberSchema.safeParse(row?.value);
    const success = { success: "Adresiniz uygunsa doğrulama iletisi gönderildi. Gelen kutunuzu kontrol edin." };
    if (old.success && old.data.status === "ACTIVE") return success;
    const data = { email: parsed.data, nonce: randomUUID(), status: "PENDING" as const, requestedAt: new Date().toISOString(), consentVersion: "2026-09" as const, confirmedAt: null };
    if (row) { const updated = await prisma.siteSetting.updateMany({ where: { key, updatedAt: row.updatedAt }, data: { value: data } }); if (!updated.count) return success; }
    else await prisma.siteSetting.create({ data: { key, value: data } });
    await sendNewsletterMail(data.email, "01 Haberler bülten aboneliğinizi doğrulayın", `Bülten aboneliğinizi 48 saat içinde doğrulayın:\n${newsletterLink(key, data.nonce, "confirm")}\n\nBu isteği siz yapmadıysanız mesajı yok sayabilirsiniz. Doğrulamadan bülten gönderilmez.`, `confirm-${data.nonce}`);
    return success;
  } catch { return { error: "Doğrulama iletisi gönderilemedi. Lütfen daha sonra yeniden deneyin." }; }
}
export async function updateNewsletterPreference(_: FormResult, form: FormData): Promise<FormResult> {
  const key = String(form.get("key")), token = String(form.get("token")), intent = String(form.get("intent"));
  if (!/^newsroom\.subscriber\.[a-f0-9]{64}$/.test(key) || (intent !== "confirm" && intent !== "unsubscribe")) return { error: "Geçersiz bağlantı." };
  const row = await prisma.siteSetting.findUnique({ where: { key } });
  const parsed = subscriberSchema.safeParse(row?.value);
  if (!row || !parsed.success || !validNewsletterToken(token, newsletterToken(key, parsed.data.nonce, intent, env.SESSION_SECRET))) return { error: "Bağlantı geçersiz veya yenilenmiş." };
  if (intent === "confirm" && (parsed.data.status !== "PENDING" || Date.now() - Date.parse(parsed.data.requestedAt) > 48 * 3600000)) return { error: "Onay bağlantısı kullanılmış veya süresi dolmuş. Yeniden abone olabilirsiniz." };
  const updated = await prisma.siteSetting.updateMany({ where: { key, updatedAt: row.updatedAt }, data: { value: { ...parsed.data, status: intent === "confirm" ? "ACTIVE" : "UNSUBSCRIBED", confirmedAt: intent === "confirm" ? new Date().toISOString() : parsed.data.confirmedAt } } });
  if (!updated.count) return { error: "Tercih değişti; sayfayı yeniden açın." };
  revalidatePath("/admin/bulten");
  return { success: intent === "confirm" ? "Aboneliğiniz doğrulandı." : "Abonelikten çıktınız. Yeni bülten gönderilmeyecek." };
}
export async function createNewsletterDraft(_: FormResult, form: FormData): Promise<FormResult> {
  const user = await getCurrentUser(); if (!user || !hasPermission(user.role, "push:manage")) return { error: "Yetkiniz yok." };
  const parsed = newsletterCampaignSchema.safeParse({ ...Object.fromEntries(form), createdAt: new Date().toISOString() });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Geçersiz bilgi." };
  await saveNewsroomRecord(CAMPAIGN_PREFIX + randomUUID(), parsed.data, user.id);
  revalidatePath("/admin/bulten"); return { success: "Bülten kaydedildi. İçeriği kontrol edip aşağıdaki gönderim düğmesini kullanın." };
}
export async function sendNewsletterBatch(_: FormResult, form: FormData): Promise<FormResult> {
  const user = await getCurrentUser(); if (!user || !hasPermission(user.role, "push:manage")) return { error: "Yetkiniz yok." };
  if (!newsletterConfigured()) return { error: "E-posta sağlayıcısı yapılandırılmamış." };
  if (form.get("approved") !== "on") return { error: "İçeriği ve gönderimi onaylayın." };
  const key = String(form.get("key")); if (!/^newsroom\.newsletter\.[a-f0-9-]{36}$/.test(key)) return { error: "Geçersiz bülten." };
  const campaign = await prisma.siteSetting.findUnique({ where: { key } });
  const p = newsletterCampaignSchema.safeParse(campaign?.value);
  if (!p.success) return { error: "Bülten bulunamadı." };
  // A persistent cursor bounds every batch; a unique delivery row prevents two
  // editors from sending the same campaign to the same address concurrently.
  const cursorKey = `newsroom.cursor.${key}`;
  const cursor = await prisma.siteSetting.findUnique({ where: { key: cursorKey } });
  const after = typeof cursor?.value === "string" ? cursor.value : "";
  const subscribers = await prisma.siteSetting.findMany({ where: { key: { startsWith: SUBSCRIBER_PREFIX, gt: after }, value: { path: ["status"], equals: "ACTIVE" } }, orderBy: { key: "asc" }, take: 5 });
  if (!subscribers.length) return { success: "Bu bültenin gönderim taraması tamamlandı. Belirsiz veya reddedilen gönderimleri sağlayıcı kayıtlarından inceleyin." };
  let sent = 0, uncertain = 0;
  for (const row of subscribers) {
    const latest = await prisma.siteSetting.findUnique({ where: { key: row.key } });
    const s = subscriberSchema.safeParse(latest?.value); if (!s.success || s.data.status !== "ACTIVE") continue;
    // Do not include subscriptions confirmed after this campaign was prepared.
    if (!s.data.confirmedAt || s.data.confirmedAt > p.data.createdAt) continue;
    const deliveryKey = `newsroom.delivery.${key.slice(CAMPAIGN_PREFIX.length)}.${row.key.slice(SUBSCRIBER_PREFIX.length)}`;
    try { await prisma.siteSetting.create({ data: { key: deliveryKey, value: { status: "SENDING", at: new Date().toISOString() } } }); }
    catch (error) { if (error && typeof error === "object" && "code" in error && error.code === "P2002") continue; return { error: "Gönderim kaydı oluşturulamadı; işlem durduruldu. Daha sonra yeniden deneyin." }; }
    try {
      const externalId = await sendNewsletterMail(s.data.email, p.data.title, `${p.data.body}\n\nAbonelikten çık: ${newsletterLink(row.key, s.data.nonce, "unsubscribe")}`, deliveryKey);
      await prisma.siteSetting.update({ where: { key: deliveryKey }, data: { value: { status: "SENT", externalId, at: new Date().toISOString() } } }); sent++;
    } catch (error) {
      const status = error instanceof NewsletterSendError && error.definitelyRejected ? "REJECTED" : "UNCERTAIN";
      await prisma.siteSetting.update({ where: { key: deliveryKey }, data: { value: { status, at: new Date().toISOString() } } }); uncertain++;
    }
  }
  const next = subscribers[subscribers.length - 1]!.key;
  // Never move the cursor backwards when two batches overlap.
  if (cursor) await prisma.siteSetting.updateMany({ where: { key: cursorKey, updatedAt: cursor.updatedAt }, data: { value: next } });
  else await prisma.siteSetting.upsert({ where: { key: cursorKey }, create: { key: cursorKey, value: next }, update: {} });
  await prisma.auditLog.create({ data: { userId: user.id, action: "NEWSLETTER_BATCH_SEND", entityType: "Newsletter", entityId: key, metadata: { sent, uncertain } } });
  revalidatePath("/admin/bulten"); return { success: `${sent} gönderim doğrulandı; ${uncertain} gönderim inceleme gerektiriyor. Kalan aboneler için sonraki grubu gönderin.` };
}
