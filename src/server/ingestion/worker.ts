import "dotenv/config";
import { Worker } from "bullmq";
import { redis } from "@/lib/redis";
import { env } from "@/lib/env";
import { INGESTION_QUEUE_NAME, scheduleRepeatableFeeds } from "./queue";
import { runIngestionJob } from "./runIngestionJob";
import type { JobTrigger } from "@prisma/client";

interface IngestionJobData {
  feedId: string;
  triggeredBy: JobTrigger;
}

const worker = new Worker<IngestionJobData>(
  INGESTION_QUEUE_NAME,
  async (job) => {
    await runIngestionJob(job.data.feedId, job.data.triggeredBy);
  },
  {
    connection: redis,
    concurrency: env.INGESTION_CONCURRENCY,
  }
);

worker.on("completed", (job) => {
  console.log(`[ingestion] tamamlandi: feed=${job.data.feedId}`);
});

worker.on("failed", (job, err) => {
  console.error(`[ingestion] basarisiz: feed=${job?.data.feedId}`, err.message);
});

scheduleRepeatableFeeds()
  .then(() => console.log("[ingestion] zamanlanmis gorevler yuklendi"))
  .catch((err) => console.error("[ingestion] zamanlama hatasi", err));

console.log(`[ingestion] worker baslatildi (concurrency=${env.INGESTION_CONCURRENCY})`);
