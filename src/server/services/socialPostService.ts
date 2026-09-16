import { prisma } from "@/lib/db";
import { isModuleEnabled } from "@/server/services/moduleFlagsService";
import type { Article } from "@prisma/client";

const REQUEST_TIMEOUT_MS = 8000;

function renderTemplate(template: string, article: Article, url: string): string {
  return template.replace("{{title}}", article.title).replace("{{url}}", url);
}

async function postToPlatform(
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
    // X ve FACEBOOK icin gercek API entegrasyonu, o platformlarin OAuth/uygulama
    // onayi gerektiren akislari nedeniyle bu fazda uygulanmadi; sadece Telegram
    // (bot token ile basit) desteklenir. Diger platformlar icin kayit basarisiz doner.
    return { ok: false, error: `${platform} entegrasyonu henüz desteklenmiyor` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Bilinmeyen hata" };
  } finally {
    clearTimeout(timeout);
  }
}

export async function postArticleToSocialPlatforms(article: Article): Promise<void> {
  if (!(await isModuleEnabled("socialAutoPost"))) return;

  const configs = await prisma.socialAutoPostConfig.findMany({ where: { isActive: true } });
  if (configs.length === 0) return;

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const url = `${appUrl}/haber/${article.slug}`;

  for (const config of configs) {
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
