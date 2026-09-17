import { createHash } from "node:crypto";
import { z } from "zod";
import { env } from "@/lib/env";
import { newsletterToken } from "@/lib/utils/newsletterTokens";
export const SUBSCRIBER_PREFIX = "newsroom.subscriber.";
export const CAMPAIGN_PREFIX = "newsroom.newsletter.";
export const subscriberSchema = z.object({ email: z.string().email(), nonce: z.string().uuid(), status: z.enum(["PENDING", "ACTIVE", "UNSUBSCRIBED"]), requestedAt: z.string().datetime(), consentVersion: z.literal("2026-09"), confirmedAt: z.string().nullable().default(null) });
export const newsletterCampaignSchema = z.object({ title: z.string().trim().min(5).max(160), body: z.string().trim().min(20).max(20000), createdAt: z.string().datetime() });
export function newsletterConfigured() {
  return !!process.env.RESEND_API_KEY && !!process.env.NEWSLETTER_FROM && (env.NODE_ENV !== "production" || env.APP_URL.startsWith("https://"));
}
export function subscriberKey(email: string) { return SUBSCRIBER_PREFIX + createHash("sha256").update(email.trim().toLowerCase()).digest("hex"); }
export function newsletterLink(key: string, nonce: string, intent: "confirm" | "unsubscribe") {
  const token = newsletterToken(key, nonce, intent, env.SESSION_SECRET);
  return `${env.APP_URL.replace(/\/$/, "")}/bulten/tercih?${new URLSearchParams({ key, token, intent })}`;
}
export class NewsletterSendError extends Error {
  constructor(public readonly definitelyRejected: boolean) { super("E-posta sağlayıcısı gönderimi doğrulayamadı."); }
}
export async function sendNewsletterMail(to: string, subject: string, text: string, idempotencyKey: string) {
  if (!newsletterConfigured()) throw new NewsletterSendError(true);
  let response: Response;
  try { response = await fetch("https://api.resend.com/emails", { method: "POST", signal: AbortSignal.timeout(10000), headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": idempotencyKey }, body: JSON.stringify({ from: process.env.NEWSLETTER_FROM, to: [to], subject, text }) }); }
  catch { throw new NewsletterSendError(false); }
  if (!response.ok) throw new NewsletterSendError(response.status >= 400 && response.status < 500 && response.status !== 409);
  const result = await response.json() as { id?: string };
  if (!result.id) throw new NewsletterSendError(false);
  return result.id;
}
