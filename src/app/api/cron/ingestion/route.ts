import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { runIngestionJob } from "@/server/ingestion/runIngestionJob";
import { isFeedDue } from "@/lib/utils/sourceDate";
import { publishDueArticles } from "@/server/services/scheduledPublicationService";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Bagimsiz bir kuyruk/worker sureci calistiramayan paylasimli hosting
 * ortamlari icin: harici bir cron (Hostinger cron job) bu endpoint'i
 * periyodik olarak tetikler. Yetkisiz cagrilari engellemek icin
 * CRON_SECRET ile korunur.
 */
export async function GET(request: Request) {
  if (!env.CRON_SECRET) {
    return NextResponse.json({ error: "CRON_SECRET yapilandirilmamis" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  const providedSecret = authHeader?.replace(/^Bearer\s+/i, "");
  if (providedSecret !== env.CRON_SECRET) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const startedAt = new Date().toISOString();
  await prisma.siteSetting.upsert({ where: { key: "newsroom.health.cron" }, create: { key: "newsroom.health.cron", value: { startedAt, status: "RUNNING" } }, update: { value: { startedAt, status: "RUNNING" } } });
  const publishedScheduled = await publishDueArticles();
  const activeFeeds = await prisma.feed.findMany({ where: { isActive: true } });

  const results = [];
  for (const feed of activeFeeds) {
    if (!isFeedDue(feed)) continue;
    try {
      const jobId = await runIngestionJob(feed.id, "SCHEDULE");
      results.push({ feedId: feed.id, url: feed.url, jobId, ok: true });
    } catch (err) {
      results.push({
        feedId: feed.id,
        url: feed.url,
        ok: false,
        error: err instanceof Error ? err.message : "Bilinmeyen hata",
      });
    }
  }

  await prisma.siteSetting.update({ where: { key: "newsroom.health.cron" }, data: { value: { startedAt, finishedAt: new Date().toISOString(), status: results.some(r => !r.ok) ? "PARTIAL" : "SUCCESS", publishedScheduled, processedFeeds: results.length, failedFeeds: results.filter(r => !r.ok).length } } });
  return NextResponse.json({ publishedScheduled, processedFeeds: results.length, results });
}
