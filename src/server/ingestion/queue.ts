import { Queue } from "bullmq";
import { redis } from "@/lib/redis";

export const INGESTION_QUEUE_NAME = "feed-ingestion";

export const ingestionQueue = new Queue(INGESTION_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 500,
    attempts: 1,
  },
});

export async function enqueueManualRun(feedId: string): Promise<void> {
  await ingestionQueue.add(
    "manual",
    { feedId, triggeredBy: "MANUAL" },
    { jobId: `manual-${feedId}-${Date.now()}` }
  );
}

export async function scheduleRepeatableFeeds(): Promise<void> {
  const { prisma } = await import("@/lib/db");
  const activeFeeds = await prisma.feed.findMany({ where: { isActive: true } });

  const existingRepeatable = await ingestionQueue.getRepeatableJobs();
  for (const job of existingRepeatable) {
    await ingestionQueue.removeRepeatableByKey(job.key);
  }

  for (const feed of activeFeeds) {
    await ingestionQueue.add(
      "scheduled",
      { feedId: feed.id, triggeredBy: "SCHEDULE" },
      { repeat: { every: feed.fetchIntervalMinutes * 60 * 1000 }, jobId: `schedule-${feed.id}` }
    );
  }
}
