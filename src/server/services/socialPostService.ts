import { prisma } from "@/lib/db";
import { isModuleEnabled } from "@/server/services/moduleFlagsService";
import { currentIstanbulHour, getSocialRules, isSocialPostingAllowed } from "@/server/services/socialRulesService";
import type { Article } from "@prisma/client";

const REQUEST_TIMEOUT_MS = 8000;

function renderTemplate(template: string, article: Article, url: string): string {
  return template.replace("{{title}}", article.title).replace("{{url}}", url);
}

// X gonderileri 280 karakterle sinirli; asan metin son karakterlerinden kirpilir.
// Cok uzun basliklarda baglantiyi koruyamayabilir, bu yuzden sablon kisa tutulmali.
const X_MAX_CHARS = 280;
function fitForX(text: string): string {
  if (text.length <= X_MAX_CHARS) return text;
  return text.slice(0, X_MAX_CHARS - 1).trimEnd() + "…";
}

// Bir habere daha once basariyla gonderilen platformlar atlanir; boylece haber
// yeniden yayimlandiginda (arsiv -> tekrar yayin gibi) ayni platforma tekrar gonderilmez.
export function pendingPlatforms<T extends { platform: string }>(
  configs: T[],
  alreadyPosted: Iterable<string>
): T[] {
  const done = new Set(alreadyPosted);
  return configs.filter((c) => !done.has(c.platform));
}

export async function postToPlatform(
  platform: "X" | "FACEBOOK" | "TELEGRAM",
  message: string,
  config: { accessToken: string | null; accountRef: string | null }
): Promise<{ ok: boolean; externalId?: string; error?: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    if (platform === "TELEGRAM") {
      const res = await fetch(`https://api.telegram.org/bot${config.accessToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: config.accountRef, text: message }),
        signal: controller.signal,
      });
      const data = (await res.json()) as { ok: boolean; result?: { message_id: number }; description?: string };
      if (!data.ok) return { ok: false, error: data.description ?? "Telegram hatası" };
      return { ok: true, externalId: String(data.result?.message_id) };
    }
    if (platform === "X") {
      // accessToken = X (Twitter) API v2 icin OAuth2 kullanici erisim jetonu (Bearer).
      if (!config.accessToken) return { ok: false, error: "X erişim jetonu tanımlı değil" };
      const res = await fetch("https://api.twitter.com/2/tweets", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.accessToken}` },
        body: JSON.stringify({ text: fitForX(message) }),
        signal: controller.signal,
      });
      const data = (await res.json()) as { data?: { id: string }; title?: string; detail?: string; errors?: { message?: string }[] };
      if (!res.ok || !data.data?.id) {
        return { ok: false, error: data.detail ?? data.errors?.[0]?.message ?? data.title ?? "X hatası" };
      }
      return { ok: true, externalId: data.data.id };
    }
    if (platform === "FACEBOOK") {
      // accessToken = Facebook Sayfa erisim jetonu, accountRef = Sayfa ID.
      if (!config.accessToken) return { ok: false, error: "Facebook erişim jetonu tanımlı değil" };
      if (!config.accountRef) return { ok: false, error: "Facebook Sayfa ID tanımlı değil" };
      const body = new URLSearchParams({ message, access_token: config.accessToken });
      const res = await fetch(`https://graph.facebook.com/v21.0/${encodeURIComponent(config.accountRef)}/feed`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        signal: controller.signal,
      });
      const data = (await res.json()) as { id?: string; error?: { message?: string } };
      if (!res.ok || !data.id) return { ok: false, error: data.error?.message ?? "Facebook hatası" };
      return { ok: true, externalId: data.id };
    }
    return { ok: false, error: `${platform} entegrasyonu henüz desteklenmiyor` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Bilinmeyen hata" };
  } finally {
    clearTimeout(timeout);
  }
}

export async function postArticleToSocialPlatforms(article: Article): Promise<void> {
  if (!(await isModuleEnabled("socialAutoPost"))) return;

  // Sessiz saat ve kategori kurallari: uygun degilse hic paylasma.
  const rules = await getSocialRules();
  if (!isSocialPostingAllowed({ hour: currentIstanbulHour(), categoryId: article.categoryId, rules })) return;

  const configs = await prisma.socialAutoPostConfig.findMany({ where: { isActive: true } });
  if (configs.length === 0) return;

  // Daha once basariyla gonderilen platformlari atla (tekrar paylasimi onle).
  const posted = await prisma.socialPostLog.findMany({
    where: { articleId: article.id, status: "SUCCESS" },
    select: { platform: true },
  });
  const targets = pendingPlatforms(configs, posted.map((p) => p.platform));
  if (targets.length === 0) return;

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const url = `${appUrl}/haber/${article.slug}`;

  for (const config of targets) {
    const message = renderTemplate(config.messageTemplate, article, url);
    try {
      const result = await postToPlatform(config.platform, message, config);
      await prisma.socialPostLog.create({
        data: {
          articleId: article.id,
          platform: config.platform,
          status: result.ok ? "SUCCESS" : "FAILED",
          externalId: result.externalId,
          errorMessage: result.error,
        },
      });
    } catch (err) {
      // postArticleToSocialPlatforms yayinlama akisini asla bozmamali.
      await prisma.socialPostLog.create({
        data: {
          articleId: article.id,
          platform: config.platform,
          status: "FAILED",
          errorMessage: err instanceof Error ? err.message : "Bilinmeyen hata",
        },
      });
    }
  }
}

export async function pingGoogleSitemap(): Promise<void> {
  try {
    const appUrl = process.env.APP_URL ?? "http://localhost:3000";
    await fetch(`https://www.google.com/ping?sitemap=${appUrl}/news-sitemap.xml`, { method: "GET" });
  } catch {
    // sessizce yut, yayinlama akisini etkilemesin
  }
}
