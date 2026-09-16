import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { runIngestionJob } from "../src/server/ingestion/runIngestionJob";

const prisma = new PrismaClient();

function arg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const found = process.argv.find((a) => a.startsWith(prefix));
  return found?.slice(prefix.length);
}

async function main() {
  const feedId = arg("feed");
  const feeds = feedId
    ? await prisma.feed.findMany({ where: { id: feedId } })
    : await prisma.feed.findMany({ where: { isActive: true } });

  if (feeds.length === 0) {
    console.log("Calistirilacak aktif feed bulunamadi.");
    return;
  }

  for (const feed of feeds) {
    console.log(`Calistiriliyor: ${feed.url}`);
    const jobId = await runIngestionJob(feed.id, "MANUAL");
    console.log(`Tamamlandi, job id: ${jobId}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
