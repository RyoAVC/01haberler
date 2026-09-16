import webpush from "web-push";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

let configured = false;
function ensureConfigured() {
  if (configured) return;
  if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
  }
  configured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

export async function savePushSubscription(sub: { endpoint: string; keys: { p256dh: string; auth: string } }, userAgent?: string) {
  await prisma.pushSubscription.upsert({
    where: { endpoint: sub.endpoint },
    update: { p256dh: sub.keys.p256dh, auth: sub.keys.auth, userAgent },
    create: { endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth, userAgent },
  });
}

export async function deletePushSubscription(endpoint: string) {
  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
}

export async function sendPushToAllSubscribers(payload: PushPayload): Promise<{ sent: number; failed: number }> {
  ensureConfigured();
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) {
    return { sent: 0, failed: 0 };
  }

  const subscriptions = await prisma.pushSubscription.findMany();
  let sent = 0;
  let failed = 0;

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      );
      sent += 1;
    } catch (err) {
      failed += 1;
      const statusCode = (err as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await deletePushSubscription(sub.endpoint);
      }
    }
  }

  return { sent, failed };
}
